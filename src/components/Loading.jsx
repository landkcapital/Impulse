export default function Loading() {
  return (
    <div
      className="penta-loader-screen"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
      }}
    >
      <div className="penta-loader-ring">
        <svg viewBox="0 0 100 100" className="penta-loader-svg">
          <polygon
            className="penta-loader-shape"
            points="50,8 91.5,38.2 75.7,85.8 24.3,85.8 8.5,38.2"
            fill="none"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="50" cy="8" r="4" fill="#6366f1" />
          <circle cx="91.5" cy="38.2" r="4" fill="#14b8a6" />
          <circle cx="75.7" cy="85.8" r="4" fill="#f59e0b" />
          <circle cx="24.3" cy="85.8" r="4" fill="#ec4899" />
          <circle cx="8.5" cy="38.2" r="4" fill="#8b5cf6" />
        </svg>
      </div>
      <span className="penta-loader-text">Penta</span>
    </div>
  );
}
