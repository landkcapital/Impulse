export default function Loading() {
  return (
    <div className="penta-loader-screen">
      <div className="penta-loader-ring">
        <svg viewBox="0 0 100 100" className="penta-loader-svg">
          <polygon
            className="penta-loader-shape"
            points="50,8 91.5,38.2 75.7,85.8 24.3,85.8 8.5,38.2"
            fill="none"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="50" cy="8" r="4" fill="#6366f1" className="penta-loader-dot" />
          <circle cx="91.5" cy="38.2" r="4" fill="#14b8a6" className="penta-loader-dot" />
          <circle cx="75.7" cy="85.8" r="4" fill="#f59e0b" className="penta-loader-dot" />
          <circle cx="24.3" cy="85.8" r="4" fill="#ec4899" className="penta-loader-dot" />
          <circle cx="8.5" cy="38.2" r="4" fill="#8b5cf6" className="penta-loader-dot" />
        </svg>
      </div>
      <span className="penta-loader-text">Penta</span>
    </div>
  );
}
