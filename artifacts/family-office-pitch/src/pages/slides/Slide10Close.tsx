export default function Slide10Close() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0a0e16" }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 50% 60%, rgba(201,162,39,0.12) 0%, transparent 55%),
            linear-gradient(180deg, #0d1117 0%, #0a0e16 100%)
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
          background: "linear-gradient(180deg, transparent, rgba(201,162,39,0.35), transparent)",
        }}
      />
      <div
        className="absolute"
        style={{
          top: "8vh",
          right: "6vw",
          width: "1px",
          height: "84vh",
          background: "linear-gradient(180deg, transparent, rgba(201,162,39,0.35), transparent)",
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingLeft: "10vw", paddingRight: "10vw" }}>
        <div
          style={{
            fontFamily: "var(--font-body-family)",
            fontSize: "1.4vw",
            fontWeight: 500,
            color: "#C9A227",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            marginBottom: "3.5vh",
            textAlign: "center",
          }}
        >
          Family Office
        </div>

        <div
          style={{
            width: "6vw",
            height: "2px",
            background: "#C9A227",
            marginBottom: "4vh",
          }}
        />

        <div
          style={{
            fontFamily: "var(--font-display-family)",
            fontSize: "7.5vw",
            fontWeight: 700,
            color: "#E8EAF0",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            textAlign: "center",
            marginBottom: "2vh",
            textWrap: "balance",
          }}
        >
          Take control of your wealth
        </div>

        <div
          style={{
            fontFamily: "var(--font-display-family)",
            fontSize: "7.5vw",
            fontWeight: 400,
            fontStyle: "italic",
            color: "#C9A227",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            textAlign: "center",
            marginBottom: "5vh",
          }}
        >
          on your terms
        </div>

        <div
          style={{
            width: "12vw",
            height: "1px",
            background: "linear-gradient(90deg, transparent, #C9A227, transparent)",
            marginBottom: "4.5vh",
          }}
        />

        <div
          style={{
            fontFamily: "var(--font-body-family)",
            fontSize: "2vw",
            fontWeight: 300,
            color: "#7A8499",
            textAlign: "center",
            maxWidth: "50vw",
            lineHeight: 1.7,
          }}
        >
          Sovereign. Private. Intelligent.
        </div>
      </div>

      <div
        className="absolute"
        style={{
          bottom: "5vh",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "3vw",
          alignItems: "center",
        }}
      >
        <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.5vw", fontWeight: 300, color: "rgba(122,132,153,0.5)", letterSpacing: "0.1em" }}>
          Private &amp; Confidential
        </div>
        <div style={{ width: "1px", height: "2vh", background: "rgba(201,162,39,0.3)" }} />
        <div style={{ fontFamily: "var(--font-body-family)", fontSize: "1.5vw", fontWeight: 300, color: "rgba(122,132,153,0.5)", letterSpacing: "0.1em" }}>
          familyoffice.app
        </div>
      </div>
    </div>
  );
}
