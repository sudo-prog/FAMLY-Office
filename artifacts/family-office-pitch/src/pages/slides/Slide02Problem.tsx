export default function Slide02Problem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0d1117" }}>
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 0% 100%, rgba(201,162,39,0.05) 0%, transparent 55%)",
        }}
      />

      <div className="absolute inset-0 flex" style={{ paddingLeft: "8vw", paddingRight: "8vw", paddingTop: "9vh", paddingBottom: "8vh" }}>
        <div className="flex flex-col justify-between" style={{ width: "44vw", paddingRight: "4vw" }}>
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
              The Problem
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
              }}
            >
              Wealth without order is wealth at risk
            </div>
          </div>

          <div
            style={{
              fontFamily: "var(--font-body-family)",
              fontSize: "2vw",
              fontWeight: 300,
              color: "#7A8499",
              lineHeight: 1.6,
              maxWidth: "36vw",
            }}
          >
            The modern family office spans institutions, advisors, entities, and jurisdictions&mdash;with no single source of truth.
          </div>
        </div>

        <div className="flex flex-col justify-center" style={{ flex: 1, gap: "2.5vh" }}>
          <div
            style={{
              background: "#141b27",
              border: "1px solid rgba(201,162,39,0.2)",
              borderRadius: "0.5vw",
              padding: "3vh 2.5vw",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display-family)",
                fontSize: "5vw",
                fontWeight: 900,
                color: "#C9A227",
                lineHeight: 1,
                marginBottom: "1vh",
              }}
            >
              8+
            </div>
            <div
              style={{
                fontFamily: "var(--font-body-family)",
                fontSize: "1.8vw",
                fontWeight: 400,
                color: "#E8EAF0",
                marginBottom: "0.5vh",
              }}
            >
              Financial institutions
            </div>
            <div
              style={{
                fontFamily: "var(--font-body-family)",
                fontSize: "1.5vw",
                fontWeight: 300,
                color: "#7A8499",
              }}
            >
              The average UHNW family manages accounts across a dozen custodians
            </div>
          </div>

          <div
            style={{
              background: "#141b27",
              border: "1px solid rgba(201,162,39,0.2)",
              borderRadius: "0.5vw",
              padding: "3vh 2.5vw",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display-family)",
                fontSize: "5vw",
                fontWeight: 900,
                color: "#C9A227",
                lineHeight: 1,
                marginBottom: "1vh",
              }}
            >
              0
            </div>
            <div
              style={{
                fontFamily: "var(--font-body-family)",
                fontSize: "1.8vw",
                fontWeight: 400,
                color: "#E8EAF0",
                marginBottom: "0.5vh",
              }}
            >
              Unified view
            </div>
            <div
              style={{
                fontFamily: "var(--font-body-family)",
                fontSize: "1.5vw",
                fontWeight: 300,
                color: "#7A8499",
              }}
            >
              No single dashboard across portfolios, entities, and cash flows
            </div>
          </div>

          <div
            style={{
              background: "#141b27",
              border: "1px solid rgba(201,162,39,0.2)",
              borderRadius: "0.5vw",
              padding: "3vh 2.5vw",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display-family)",
                fontSize: "5vw",
                fontWeight: 900,
                color: "#C9A227",
                lineHeight: 1,
                marginBottom: "1vh",
              }}
            >
              $0
            </div>
            <div
              style={{
                fontFamily: "var(--font-body-family)",
                fontSize: "1.8vw",
                fontWeight: 400,
                color: "#E8EAF0",
                marginBottom: "0.5vh",
              }}
            >
              Privacy guarantee
            </div>
            <div
              style={{
                fontFamily: "var(--font-body-family)",
                fontSize: "1.5vw",
                fontWeight: 300,
                color: "#7A8499",
              }}
            >
              Existing tools store your data on third-party servers outside your control
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
