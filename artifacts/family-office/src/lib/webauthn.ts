// Local-device passkey gate. No server round-trip: the credential is created and
// verified entirely client-side against navigator.credentials, using a random
// challenge and RP ID scoped to this origin. This provides "unlock with Face ID /
// Touch ID" convenience backed by the platform authenticator, but — because this
// app has no backend auth — it is NOT a substitute for a server-verified login.
// The PIN remains the source of truth for encryption-relevant flows; the passkey
// only gates the same client-side "unlocked" boolean the PIN does.

const CRED_ID_KEY = "fo-passkey-cred-id";
const RP_NAME = "Family Office";

function bufToBase64Url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64UrlToBuf(b64url: string): ArrayBuffer {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    b64url.length + (4 - (b64url.length % 4)) % 4, "="
  );
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0)).buffer;
}

export function isPasskeySupported(): boolean {
  return typeof window !== "undefined"
    && !!window.PublicKeyCredential
    && !!navigator.credentials;
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isPasskeySupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch { return false; }
}

export function hasEnrolledPasskey(): boolean {
  return !!localStorage.getItem(CRED_ID_KEY);
}

export async function enrollPasskey(userLabel = "Family Office User"): Promise<boolean> {
  if (!isPasskeySupported()) return false;
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: RP_NAME, id: window.location.hostname },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: userLabel,
          displayName: userLabel,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },   // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60_000,
        attestation: "none",
      },
    }) as PublicKeyCredential | null;

    if (!cred) return false;
    localStorage.setItem(CRED_ID_KEY, bufToBase64Url(cred.rawId));
    return true;
  } catch (err) {
    console.warn("Passkey enrollment failed or was cancelled", err);
    return false;
  }
}

export async function unlockWithPasskey(): Promise<boolean> {
  if (!isPasskeySupported() || !hasEnrolledPasskey()) return false;
  const credId = localStorage.getItem(CRED_ID_KEY);
  if (!credId) return false;

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ id: base64UrlToBuf(credId), type: "public-key" }],
        userVerification: "required",
        timeout: 60_000,
      },
    });
    return !!assertion;
  } catch (err) {
    console.warn("Passkey unlock failed or was cancelled", err);
    return false;
  }
}

export function removePasskey(): void {
  localStorage.removeItem(CRED_ID_KEY);
}
