export default function Slide07NetWorth() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0a0e16" }}>
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 30% 50%, rgba(201,162,39,0.09) 0%, transparent 60%)",
        }}
      />

      <div
        className="absolute"
        style={{
          top: "15vh",
          left: "7vw",
          right: "7vw",
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(201,162,39,0.3), transparent)",
        }}
      />
      <div
        className="absolute"
        style={{
          bottom: "15vh",
          left: "7vw",
          right: "7vw",
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(201,162,39,0.3), transparent)",
        }}
      />

      <div className="absolute inset-0 flex" style={{ paddingLeft: "8vw", paddingRight: "8vw" }}>
        <div className="flex flex-col justify-center" style={{ width: "50vw" }}>
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
            Live Data
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
              fontSize: "14vw",
              fontWeight: 900,
              color: "#E8EAF0",
              lineHeight: 0.9,
              letterSpacing: "-0.03em",
              marginBottom: "2vh",
            }}
          >
            $4.7M
          </div>

          <div
            style={{
              fontFamily: "var(--font-body-family)",
              fontSize: "2.2vw",
              fontWeight: 300,
              color: "#7A8499",
              lineHeight: 1.5,
              maxWidth: "38vw",
            }}
          >
            Total net worth tracked across three entities, ten asset classes, and fifteen active accounts
          </div>
        </div>

        <div className="flex flex-col justify-center" style={{ flex: 1, gap: "2.5vh", paddingLeft: "4vw" }}>
          <div
            style={{
              background: "#141b27",
              border: "1px solid rgba(201,162,39,0.2)",
              borderRadius: "0.8vw",
              padding: "2.5vh 2.5vw",
            }}
          >
            <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.3vw", fontWeight: 500, color: "#7A8499", marginBottom: "0.8vh", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Real Estate
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "1vw", marginBottom: "1vh" }}>
              <div style={{ fontFamily: "var(--font-display-family)", fontSize: "3.5vw", fontWeight: 700, color: "#E8EAF0" }}>$2.45M</div>
              <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.5vw", color: "#C9A227" }}>52%</div>
            </div>
            <div style={{ height: "4px", background: "rgba(201,162,39,0.1)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: "52%", height: "100%", background: "#C9A227", borderRadius: "2px" }} />
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
            <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.3vw", fontWeight: 500, color: "#7A8499", marginBottom: "0.8vh", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Equities
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "1vw", marginBottom: "1vh" }}>
              <div style={{ fontFamily: "var(--font-display-family)", fontSize: "3.5vw", fontWeight: 700, color: "#E8EAF0" }}>$1.13M</div>
              <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.5vw", color: "#C9A227" }}>24%</div>
            </div>
            <div style={{ height: "4px", background: "rgba(201,162,39,0.1)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: "24%", height: "100%", background: "#C9A227", borderRadius: "2px" }} />
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
            <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.3vw", fontWeight: 500, color: "#7A8499", marginBottom: "0.8vh", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Cash &amp; Fixed Income
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "1vw", marginBottom: "1vh" }}>
              <div style={{ fontFamily: "var(--font-display-family)", fontSize: "3.5vw", fontWeight: 700, color: "#E8EAF0" }}>$1.12M</div>
              <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.5vw", color: "#C9A227" }}>24%</div>
            </div>
            <div style={{ height: "4px", background: "rgba(201,162,39,0.1)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: "24%", height: "100%", background: "#C9A227", borderRadius: "2px" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
