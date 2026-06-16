export default function Slide04Privacy() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0a0e16" }}>
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, rgba(201,162,39,0.07) 0%, transparent 65%)",
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingLeft: "8vw", paddingRight: "8vw" }}>
        <div
          style={{
            fontFamily: "var(--font-body-family)",
            fontSize: "1.4vw",
            fontWeight: 500,
            color: "#C9A227",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: "2.5vh",
            textAlign: "center",
          }}
        >
          Privacy &amp; Security
        </div>

        <div
          style={{
            width: "5vw",
            height: "2px",
            background: "#C9A227",
            marginBottom: "3.5vh",
          }}
        />

        <div
          style={{
            fontFamily: "var(--font-display-family)",
            fontSize: "6.5vw",
            fontWeight: 700,
            color: "#E8EAF0",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            textAlign: "center",
            marginBottom: "2vh",
            textWrap: "balance",
          }}
        >
          Your data never leaves your control
        </div>

        <div
          style={{
            fontFamily: "var(--font-body-family)",
            fontSize: "2vw",
            fontWeight: 300,
            color: "#7A8499",
            textAlign: "center",
            maxWidth: "55vw",
            marginBottom: "6vh",
            lineHeight: 1.6,
          }}
        >
          Family Office is built on a local-first foundation. No cloud sync. No third-party storage. No exposure.
        </div>

        <div className="flex" style={{ gap: "2.5vw", width: "100%" }}>
          <div
            style={{
              flex: 1,
              background: "#141b27",
              border: "1px solid rgba(201,162,39,0.25)",
              borderRadius: "0.8vw",
              padding: "3.5vh 2.5vw",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display-family)",
                fontSize: "3vw",
                fontWeight: 700,
                color: "#C9A227",
                marginBottom: "1.5vh",
              }}
            >
              Local-First
            </div>
            <div
              style={{
                width: "3vw",
                height: "1px",
                background: "rgba(201,162,39,0.4)",
                margin: "0 auto 1.5vh",
              }}
            />
            <div
              style={{
                fontFamily: "var(--font-body-family)",
                fontSize: "1.6vw",
                fontWeight: 300,
                color: "#7A8499",
                lineHeight: 1.6,
              }}
            >
              Runs entirely on your infrastructure. Zero dependency on external servers.
            </div>
          </div>

          <div
            style={{
              flex: 1,
              background: "#141b27",
              border: "1px solid rgba(201,162,39,0.25)",
              borderRadius: "0.8vw",
              padding: "3.5vh 2.5vw",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display-family)",
                fontSize: "3vw",
                fontWeight: 700,
                color: "#C9A227",
                marginBottom: "1.5vh",
              }}
            >
              Zero Knowledge
            </div>
            <div
              style={{
                width: "3vw",
                height: "1px",
                background: "rgba(201,162,39,0.4)",
                margin: "0 auto 1.5vh",
              }}
            />
            <div
              style={{
                fontFamily: "var(--font-body-family)",
                fontSize: "1.6vw",
                fontWeight: 300,
                color: "#7A8499",
                lineHeight: 1.6,
              }}
            >
              We never see your data. Not your holdings, not your transactions, not your entities.
            </div>
          </div>

          <div
            style={{
              flex: 1,
              background: "#141b27",
              border: "1px solid rgba(201,162,39,0.25)",
              borderRadius: "0.8vw",
              padding: "3.5vh 2.5vw",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display-family)",
                fontSize: "3vw",
                fontWeight: 700,
                color: "#C9A227",
                marginBottom: "1.5vh",
              }}
            >
              End-to-End
            </div>
            <div
              style={{
                width: "3vw",
                height: "1px",
                background: "rgba(201,162,39,0.4)",
                margin: "0 auto 1.5vh",
              }}
            />
            <div
              style={{
                fontFamily: "var(--font-body-family)",
                fontSize: "1.6vw",
                fontWeight: 300,
                color: "#7A8499",
                lineHeight: 1.6,
              }}
            >
              Encrypted at rest and in transit. Your vault is yours alone.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
