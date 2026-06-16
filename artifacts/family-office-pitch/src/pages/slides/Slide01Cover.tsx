export default function Slide01Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0d1117" }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(135deg, rgba(201,162,39,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 50%, rgba(201,162,39,0.08) 0%, transparent 60%)
          `,
        }}
      />

      <div
        className="absolute"
        style={{
          top: "8vh",
          left: "6vw",
          width: "1px",
          height: "84vh",
          background: "linear-gradient(180deg, transparent, rgba(201,162,39,0.4), transparent)",
        }}
      />

      <div
        className="absolute"
        style={{
          top: "8vh",
          right: "6vw",
          width: "1px",
          height: "84vh",
          background: "linear-gradient(180deg, transparent, rgba(201,162,39,0.4), transparent)",
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingLeft: "10vw", paddingRight: "10vw" }}>
        <div style={{ marginBottom: "3vh" }}>
          <div
            style={{
              width: "6vw",
              height: "2px",
              background: "#C9A227",
              margin: "0 auto",
            }}
          />
        </div>

        <div
          style={{
            fontFamily: "var(--font-display-family)",
            fontSize: "10vw",
            fontWeight: 700,
            color: "#E8EAF0",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            textAlign: "center",
            marginBottom: "1.5vh",
          }}
        >
          Family Office
        </div>

        <div
          style={{
            fontFamily: "var(--font-display-family)",
            fontSize: "10vw",
            fontWeight: 400,
            fontStyle: "italic",
            color: "#C9A227",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            textAlign: "center",
            marginBottom: "4vh",
          }}
        >
          Wealth OS
        </div>

        <div
          style={{
            width: "12vw",
            height: "1px",
            background: "linear-gradient(90deg, transparent, #C9A227, transparent)",
            marginBottom: "3.5vh",
          }}
        />

        <div
          style={{
            fontFamily: "var(--font-body-family)",
            fontSize: "2.2vw",
            fontWeight: 300,
            color: "#7A8499",
            letterSpacing: "0.25em",
            textAlign: "center",
            textTransform: "uppercase",
          }}
        >
          Sovereign Wealth &nbsp;&middot;&nbsp; Private by Design
        </div>
      </div>

      <div
        className="absolute"
        style={{
          bottom: "5vh",
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "var(--font-body-family)",
          fontSize: "1.6vw",
          fontWeight: 400,
          color: "rgba(122,132,153,0.6)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        Confidential
      </div>
    </div>
  );
}
