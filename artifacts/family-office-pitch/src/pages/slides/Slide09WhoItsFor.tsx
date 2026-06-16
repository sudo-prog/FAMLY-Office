export default function Slide09WhoItsFor() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0d1117" }}>
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 100%, rgba(201,162,39,0.05) 0%, transparent 55%)",
        }}
      />

      <div className="absolute inset-0 flex flex-col" style={{ paddingLeft: "8vw", paddingRight: "8vw", paddingTop: "8vh", paddingBottom: "8vh" }}>
        <div style={{ marginBottom: "5vh" }}>
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
            Who It&rsquo;s For
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
            Designed for principals who demand both clarity and control
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2.5vw", flex: 1 }}>
          <div
            style={{
              background: "rgba(201,162,39,0.06)",
              border: "1px solid rgba(201,162,39,0.3)",
              borderRadius: "0.8vw",
              padding: "4vh 2.5vw",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-body-family)",
                fontSize: "1.2vw",
                fontWeight: 500,
                color: "#C9A227",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: "1.5vh",
              }}
            >
              UHNW Individuals
            </div>
            <div
              style={{
                fontFamily: "var(--font-display-family)",
                fontSize: "2.6vw",
                fontWeight: 600,
                color: "#E8EAF0",
                lineHeight: 1.2,
                marginBottom: "2vh",
              }}
            >
              $5M&ndash;$500M in net worth
            </div>
            <div
              style={{
                fontFamily: "var(--font-body-family)",
                fontSize: "1.6vw",
                fontWeight: 300,
                color: "#7A8499",
                lineHeight: 1.6,
                flex: 1,
              }}
            >
              Principals managing complex multi-asset portfolios who want a private, consolidated view without relying on a custodian&rsquo;s reporting portal.
            </div>
          </div>

          <div
            style={{
              background: "#141b27",
              border: "1px solid rgba(201,162,39,0.2)",
              borderRadius: "0.8vw",
              padding: "4vh 2.5vw",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-body-family)",
                fontSize: "1.2vw",
                fontWeight: 500,
                color: "#C9A227",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: "1.5vh",
              }}
            >
              Family Offices
            </div>
            <div
              style={{
                fontFamily: "var(--font-display-family)",
                fontSize: "2.6vw",
                fontWeight: 600,
                color: "#E8EAF0",
                lineHeight: 1.2,
                marginBottom: "2vh",
              }}
            >
              Single-family operations
            </div>
            <div
              style={{
                fontFamily: "var(--font-body-family)",
                fontSize: "1.6vw",
                fontWeight: 300,
                color: "#7A8499",
                lineHeight: 1.6,
                flex: 1,
              }}
            >
              Small family office teams who need institutional-grade software without enterprise pricing or data sharing requirements.
            </div>
          </div>

          <div
            style={{
              background: "#141b27",
              border: "1px solid rgba(201,162,39,0.2)",
              borderRadius: "0.8vw",
              padding: "4vh 2.5vw",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-body-family)",
                fontSize: "1.2vw",
                fontWeight: 500,
                color: "#C9A227",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: "1.5vh",
              }}
            >
              Founders &amp; Operators
            </div>
            <div
              style={{
                fontFamily: "var(--font-display-family)",
                fontSize: "2.6vw",
                fontWeight: 600,
                color: "#E8EAF0",
                lineHeight: 1.2,
                marginBottom: "2vh",
              }}
            >
              Post-liquidity wealth
            </div>
            <div
              style={{
                fontFamily: "var(--font-body-family)",
                fontSize: "1.6vw",
                fontWeight: 300,
                color: "#7A8499",
                lineHeight: 1.6,
                flex: 1,
              }}
            >
              Recently liquid founders building a structured wealth infrastructure for the first time across multiple entities and asset classes.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
