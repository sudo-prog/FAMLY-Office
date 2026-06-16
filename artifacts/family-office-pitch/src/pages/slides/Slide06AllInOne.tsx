export default function Slide06AllInOne() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0d1117" }}>
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(201,162,39,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="absolute inset-0 flex flex-col" style={{ paddingLeft: "8vw", paddingRight: "8vw", paddingTop: "8vh", paddingBottom: "7vh" }}>
        <div style={{ marginBottom: "4.5vh" }}>
          <div
            style={{
              fontFamily: "var(--font-body-family)",
              fontSize: "1.4vw",
              fontWeight: 500,
              color: "#C9A227",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "2vh",
            }}
          >
            Complete Platform
          </div>
          <div
            style={{
              width: "5vw",
              height: "2px",
              background: "#C9A227",
              marginBottom: "2vh",
            }}
          />
          <div
            style={{
              fontFamily: "var(--font-display-family)",
              fontSize: "5vw",
              fontWeight: 700,
              color: "#E8EAF0",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            Everything. In one place.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2vw", flex: 1 }}>
          <div
            style={{
              background: "#141b27",
              border: "1px solid rgba(201,162,39,0.2)",
              borderRadius: "0.8vw",
              padding: "3vh 2.5vw",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                width: "3vw",
                height: "3px",
                background: "#C9A227",
                marginBottom: "2vh",
              }}
            />
            <div style={{ fontFamily: "var(--font-display-family)", fontSize: "2.4vw", fontWeight: 600, color: "#E8EAF0", marginBottom: "1.5vh" }}>
              Assets
            </div>
            <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.5vw", fontWeight: 300, color: "#7A8499", lineHeight: 1.6 }}>
              Equities, real estate, private holdings, and alternative investments tracked in a single ledger with real-time valuation.
            </div>
          </div>

          <div
            style={{
              background: "#141b27",
              border: "1px solid rgba(201,162,39,0.2)",
              borderRadius: "0.8vw",
              padding: "3vh 2.5vw",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                width: "3vw",
                height: "3px",
                background: "#C9A227",
                marginBottom: "2vh",
              }}
            />
            <div style={{ fontFamily: "var(--font-display-family)", fontSize: "2.4vw", fontWeight: 600, color: "#E8EAF0", marginBottom: "1.5vh" }}>
              Ledger
            </div>
            <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.5vw", fontWeight: 300, color: "#7A8499", lineHeight: 1.6 }}>
              Complete transaction history with categorization, tax tagging, and cash flow analysis across all accounts.
            </div>
          </div>

          <div
            style={{
              background: "#141b27",
              border: "1px solid rgba(201,162,39,0.2)",
              borderRadius: "0.8vw",
              padding: "3vh 2.5vw",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                width: "3vw",
                height: "3px",
                background: "#C9A227",
                marginBottom: "2vh",
              }}
            />
            <div style={{ fontFamily: "var(--font-display-family)", fontSize: "2.4vw", fontWeight: 600, color: "#E8EAF0", marginBottom: "1.5vh" }}>
              Vault
            </div>
            <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.5vw", fontWeight: 300, color: "#7A8499", lineHeight: 1.6 }}>
              Encrypted document storage for wills, trusts, legal agreements, and sensitive financial records.
            </div>
          </div>

          <div
            style={{
              background: "#141b27",
              border: "1px solid rgba(201,162,39,0.2)",
              borderRadius: "0.8vw",
              padding: "3vh 2.5vw",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                width: "3vw",
                height: "3px",
                background: "#C9A227",
                marginBottom: "2vh",
              }}
            />
            <div style={{ fontFamily: "var(--font-display-family)", fontSize: "2.4vw", fontWeight: 600, color: "#E8EAF0", marginBottom: "1.5vh" }}>
              Entities
            </div>
            <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.5vw", fontWeight: 300, color: "#7A8499", lineHeight: 1.6 }}>
              Trusts, LLCs, holding companies, and individuals managed together with consolidated reporting.
            </div>
          </div>

          <div
            style={{
              background: "#141b27",
              border: "1px solid rgba(201,162,39,0.2)",
              borderRadius: "0.8vw",
              padding: "3vh 2.5vw",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                width: "3vw",
                height: "3px",
                background: "#C9A227",
                marginBottom: "2vh",
              }}
            />
            <div style={{ fontFamily: "var(--font-display-family)", fontSize: "2.4vw", fontWeight: 600, color: "#E8EAF0", marginBottom: "1.5vh" }}>
              Dashboard
            </div>
            <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.5vw", fontWeight: 300, color: "#7A8499", lineHeight: 1.6 }}>
              Net worth, allocation, cash flow, and performance at a glance. Updated every session.
            </div>
          </div>

          <div
            style={{
              background: "rgba(201,162,39,0.08)",
              border: "1px solid rgba(201,162,39,0.35)",
              borderRadius: "0.8vw",
              padding: "3vh 2.5vw",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display-family)",
                fontSize: "2.8vw",
                fontWeight: 700,
                color: "#C9A227",
                lineHeight: 1.2,
              }}
            >
              Built for the modern family office
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
