export default function Slide03Solution() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0d1117" }}>
      <div
        className="absolute"
        style={{
          top: 0,
          left: 0,
          right: 0,
          height: "100vh",
          background: "linear-gradient(135deg, #141b27 0%, #0d1117 55%)",
        }}
      />

      <div
        className="absolute"
        style={{
          top: "10vh",
          right: "8vw",
          width: "38vw",
          height: "80vh",
          border: "1px solid rgba(201,162,39,0.15)",
          borderRadius: "1vw",
          background: "rgba(20,27,39,0.6)",
        }}
      />

      <div className="absolute inset-0 flex" style={{ paddingLeft: "8vw", paddingRight: "8vw", paddingTop: "9vh", paddingBottom: "8vh" }}>
        <div className="flex flex-col justify-center" style={{ width: "46vw", paddingRight: "4vw" }}>
          <div
            style={{
              fontFamily: "var(--font-body-family)",
              fontSize: "1.4vw",
              fontWeight: 500,
              color: "#C9A227",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "2.5vh",
            }}
          >
            The Solution
          </div>

          <div
            style={{
              width: "5vw",
              height: "2px",
              background: "#C9A227",
              marginBottom: "3vh",
            }}
          />

          <div
            style={{
              fontFamily: "var(--font-display-family)",
              fontSize: "5.8vw",
              fontWeight: 700,
              color: "#E8EAF0",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: "4vh",
              textWrap: "balance",
            }}
          >
            One sovereign platform for your entire wealth
          </div>

          <div
            style={{
              fontFamily: "var(--font-body-family)",
              fontSize: "2vw",
              fontWeight: 300,
              color: "#7A8499",
              lineHeight: 1.6,
              maxWidth: "38vw",
            }}
          >
            Family Office is a local-first Wealth OS that consolidates every asset, entity, transaction, and document&mdash;with AI intelligence and zero data exposure.
          </div>
        </div>

        <div className="flex flex-col justify-center" style={{ flex: 1, gap: "2vh" }}>
          <div className="flex items-start" style={{ gap: "1.5vw" }}>
            <div
              style={{
                width: "2.5vw",
                height: "2.5vw",
                minWidth: "2.5vw",
                borderRadius: "50%",
                background: "rgba(201,162,39,0.15)",
                border: "1px solid rgba(201,162,39,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "0.3vh",
              }}
            >
              <div style={{ width: "0.8vw", height: "0.8vw", background: "#C9A227", borderRadius: "50%" }} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.9vw", fontWeight: 600, color: "#E8EAF0", marginBottom: "0.4vh" }}>
                Total asset visibility
              </div>
              <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.5vw", fontWeight: 300, color: "#7A8499", lineHeight: 1.5 }}>
                Every holding across all entities, consolidated in real time
              </div>
            </div>
          </div>

          <div className="flex items-start" style={{ gap: "1.5vw" }}>
            <div
              style={{
                width: "2.5vw",
                height: "2.5vw",
                minWidth: "2.5vw",
                borderRadius: "50%",
                background: "rgba(201,162,39,0.15)",
                border: "1px solid rgba(201,162,39,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "0.3vh",
              }}
            >
              <div style={{ width: "0.8vw", height: "0.8vw", background: "#C9A227", borderRadius: "50%" }} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.9vw", fontWeight: 600, color: "#E8EAF0", marginBottom: "0.4vh" }}>
                Local-first architecture
              </div>
              <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.5vw", fontWeight: 300, color: "#7A8499", lineHeight: 1.5 }}>
                Your data runs on your infrastructure, not ours
              </div>
            </div>
          </div>

          <div className="flex items-start" style={{ gap: "1.5vw" }}>
            <div
              style={{
                width: "2.5vw",
                height: "2.5vw",
                minWidth: "2.5vw",
                borderRadius: "50%",
                background: "rgba(201,162,39,0.15)",
                border: "1px solid rgba(201,162,39,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "0.3vh",
              }}
            >
              <div style={{ width: "0.8vw", height: "0.8vw", background: "#C9A227", borderRadius: "50%" }} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.9vw", fontWeight: 600, color: "#E8EAF0", marginBottom: "0.4vh" }}>
                AI-powered insights
              </div>
              <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.5vw", fontWeight: 300, color: "#7A8499", lineHeight: 1.5 }}>
                Patterns, risks, and opportunities surfaced automatically
              </div>
            </div>
          </div>

          <div className="flex items-start" style={{ gap: "1.5vw" }}>
            <div
              style={{
                width: "2.5vw",
                height: "2.5vw",
                minWidth: "2.5vw",
                borderRadius: "50%",
                background: "rgba(201,162,39,0.15)",
                border: "1px solid rgba(201,162,39,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "0.3vh",
              }}
            >
              <div style={{ width: "0.8vw", height: "0.8vw", background: "#C9A227", borderRadius: "50%" }} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.9vw", fontWeight: 600, color: "#E8EAF0", marginBottom: "0.4vh" }}>
                Multi-entity management
              </div>
              <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.5vw", fontWeight: 300, color: "#7A8499", lineHeight: 1.5 }}>
                Trusts, holding companies, individuals&mdash;all in one view
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
