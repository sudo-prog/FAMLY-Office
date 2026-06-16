export default function Slide05Intelligence() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0d1117" }}>
      <div
        className="absolute"
        style={{
          top: 0,
          right: 0,
          width: "55vw",
          height: "100vh",
          background: "linear-gradient(135deg, transparent 0%, #141b27 60%)",
        }}
      />

      <div
        className="absolute"
        style={{
          bottom: "10vh",
          right: "8vw",
          width: "35vw",
          height: "55vh",
          border: "1px solid rgba(201,162,39,0.15)",
          borderRadius: "1vw",
          background: "rgba(10,14,22,0.8)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "5vh",
            background: "#141b27",
            borderBottom: "1px solid rgba(201,162,39,0.15)",
            display: "flex",
            alignItems: "center",
            paddingLeft: "1.5vw",
            gap: "0.6vw",
          }}
        >
          <div style={{ width: "0.8vw", height: "0.8vw", borderRadius: "50%", background: "rgba(201,162,39,0.3)" }} />
          <div style={{ width: "0.8vw", height: "0.8vw", borderRadius: "50%", background: "rgba(201,162,39,0.2)" }} />
          <div style={{ width: "0.8vw", height: "0.8vw", borderRadius: "50%", background: "rgba(201,162,39,0.1)" }} />
          <div style={{ marginLeft: "1vw", fontFamily: "var(--font-body-family)", fontSize: "1.2vw", color: "#7A8499" }}>
            AI Insight Engine
          </div>
        </div>

        <div style={{ padding: "2vh 1.5vw", display: "flex", flexDirection: "column", gap: "2vh" }}>
          <div
            style={{
              background: "rgba(201,162,39,0.08)",
              border: "1px solid rgba(201,162,39,0.2)",
              borderRadius: "0.5vw",
              padding: "1.5vh 1.5vw",
            }}
          >
            <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.3vw", fontWeight: 500, color: "#C9A227", marginBottom: "0.5vh" }}>
              Net Worth Alert
            </div>
            <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.2vw", fontWeight: 300, color: "#7A8499" }}>
              Real estate allocation exceeds 52% &mdash; consider rebalancing toward liquid assets
            </div>
          </div>

          <div
            style={{
              background: "rgba(20,27,39,0.8)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "0.5vw",
              padding: "1.5vh 1.5vw",
            }}
          >
            <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.3vw", fontWeight: 500, color: "#E8EAF0", marginBottom: "0.5vh" }}>
              Cash Flow Forecast
            </div>
            <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.2vw", fontWeight: 300, color: "#7A8499" }}>
              Projected Q3 income: $142,000 based on dividend and interest schedules
            </div>
          </div>

          <div
            style={{
              background: "rgba(20,27,39,0.8)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "0.5vw",
              padding: "1.5vh 1.5vw",
            }}
          >
            <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.3vw", fontWeight: 500, color: "#E8EAF0", marginBottom: "0.5vh" }}>
              Entity Optimization
            </div>
            <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.2vw", fontWeight: 300, color: "#7A8499" }}>
              Smith Family Trust holds idle cash above threshold &mdash; 3 deployment options identified
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute"
        style={{
          top: "9vh",
          left: "8vw",
          bottom: "8vh",
          width: "46vw",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
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
          AI Intelligence
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
            marginBottom: "3vh",
            textWrap: "balance",
          }}
        >
          Insights that anticipate, not just report
        </div>

        <div
          style={{
            fontFamily: "var(--font-body-family)",
            fontSize: "2vw",
            fontWeight: 300,
            color: "#7A8499",
            lineHeight: 1.6,
            maxWidth: "40vw",
          }}
        >
          Our AI engine continuously analyzes your portfolio, flags concentration risk, forecasts cash flows, and surfaces opportunities across your entire wealth structure.
        </div>
      </div>
    </div>
  );
}
