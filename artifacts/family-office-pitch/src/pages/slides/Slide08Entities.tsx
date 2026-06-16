export default function Slide08Entities() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0d1117" }}>
      <div
        className="absolute"
        style={{
          top: 0,
          left: 0,
          width: "45vw",
          height: "100vh",
          background: "linear-gradient(135deg, #141b27 0%, transparent 80%)",
        }}
      />

      <div className="absolute inset-0 flex" style={{ paddingLeft: "8vw", paddingRight: "8vw", paddingTop: "9vh", paddingBottom: "8vh" }}>
        <div className="flex flex-col justify-between" style={{ width: "40vw", paddingRight: "4vw" }}>
          <div>
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
              Entities &amp; Legacy
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
                fontSize: "5.5vw",
                fontWeight: 700,
                color: "#E8EAF0",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                textWrap: "balance",
                marginBottom: "3vh",
              }}
            >
              Structure built for generations
            </div>

            <div
              style={{
                fontFamily: "var(--font-body-family)",
                fontSize: "1.8vw",
                fontWeight: 300,
                color: "#7A8499",
                lineHeight: 1.6,
              }}
            >
              Manage trusts, holding companies, and individuals as unified entities&mdash;with consolidated net worth, consolidated documents, and shared reporting.
            </div>
          </div>

          <div
            style={{
              fontFamily: "var(--font-body-family)",
              fontSize: "1.5vw",
              fontWeight: 300,
              color: "rgba(122,132,153,0.6)",
              fontStyle: "italic",
              lineHeight: 1.6,
            }}
          >
            &ldquo;A true family office doesn't silo wealth by account&mdash;it structures it by purpose.&rdquo;
          </div>
        </div>

        <div className="flex flex-col justify-center" style={{ flex: 1, gap: "2vh" }}>
          <div
            style={{
              background: "rgba(201,162,39,0.08)",
              border: "1px solid rgba(201,162,39,0.35)",
              borderRadius: "0.8vw",
              padding: "2.5vh 2.5vw",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1vh" }}>
              <div style={{ fontFamily: "var(--font-display-family)", fontSize: "2.2vw", fontWeight: 600, color: "#C9A227" }}>
                Smith Family Trust
              </div>
              <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.3vw", fontWeight: 400, color: "#7A8499", background: "rgba(201,162,39,0.1)", padding: "0.3vh 0.8vw", borderRadius: "0.3vw" }}>
                Trust
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.5vw", fontWeight: 300, color: "#7A8499" }}>
              Primary wealth vehicle &mdash; consolidates real estate and long-term holdings
            </div>
          </div>

          <div
            style={{
              background: "#141b27",
              border: "1px solid rgba(201,162,39,0.2)",
              borderRadius: "0.8vw",
              padding: "2.5vh 2.5vw",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1vh" }}>
              <div style={{ fontFamily: "var(--font-display-family)", fontSize: "2.2vw", fontWeight: 600, color: "#E8EAF0" }}>
                Meridian Holdings LLC
              </div>
              <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.3vw", fontWeight: 400, color: "#7A8499", background: "rgba(255,255,255,0.05)", padding: "0.3vh 0.8vw", borderRadius: "0.3vw" }}>
                LLC
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.5vw", fontWeight: 300, color: "#7A8499" }}>
              Operating entity for private equity and business interests
            </div>
          </div>

          <div
            style={{
              background: "#141b27",
              border: "1px solid rgba(201,162,39,0.2)",
              borderRadius: "0.8vw",
              padding: "2.5vh 2.5vw",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1vh" }}>
              <div style={{ fontFamily: "var(--font-display-family)", fontSize: "2.2vw", fontWeight: 600, color: "#E8EAF0" }}>
                John Smith
              </div>
              <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.3vw", fontWeight: 400, color: "#7A8499", background: "rgba(255,255,255,0.05)", padding: "0.3vh 0.8vw", borderRadius: "0.3vw" }}>
                Individual
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.5vw", fontWeight: 300, color: "#7A8499" }}>
              Personal accounts, brokerage, and retirement assets
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(201,162,39,0.15)",
              paddingTop: "2vh",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display-family)", fontSize: "3vw", fontWeight: 700, color: "#C9A227" }}>3</div>
              <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.3vw", fontWeight: 300, color: "#7A8499" }}>Entities</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display-family)", fontSize: "3vw", fontWeight: 700, color: "#C9A227" }}>10</div>
              <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.3vw", fontWeight: 300, color: "#7A8499" }}>Assets</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display-family)", fontSize: "3vw", fontWeight: 700, color: "#C9A227" }}>8</div>
              <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.3vw", fontWeight: 300, color: "#7A8499" }}>Documents</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
