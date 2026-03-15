/**
 * Pentagon loading animation.
 * Use fullScreen for route-level loading, inline for within-page loading.
 */
export default function PentaLoader({ label = "Loading..." }) {
  return (
    <div className="penta-loader">
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
      {label && <span className="penta-loader-text">{label}</span>}
    </div>
  );
}
