import { useNavigate, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: "home" },
  { path: "/log", label: "Log", icon: "log" },
  { path: "/review", label: "History", icon: "review" },
  { path: "/insights", label: "Insights", icon: "insights" },
  { path: "/settings", label: "Settings", icon: "settings" },
];

function NavIcon({ icon }) {
  switch (icon) {
    case "home":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7.5L10 2l7 5.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V7.5z" />
          <path d="M7.5 18V11h5v7" />
        </svg>
      );
    case "log":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="7.5" />
          <path d="M10 5.5V10l3 2" />
        </svg>
      );
    case "review":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3h14v14H3z" />
          <path d="M3 7h14M7 3v14" />
        </svg>
      );
    case "insights":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2L12.5 7.5L18 8.5L14 12.5L15 18L10 15.5L5 18L6 12.5L2 8.5L7.5 7.5L10 2z" />
        </svg>
      );
    case "settings":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="2.5" />
          <path d="M16.2 12.2a1.2 1.2 0 00.24 1.32l.04.04a1.46 1.46 0 11-2.06 2.06l-.04-.04a1.2 1.2 0 00-1.32-.24 1.2 1.2 0 00-.73 1.1v.12a1.46 1.46 0 11-2.92 0v-.06a1.2 1.2 0 00-.78-1.1 1.2 1.2 0 00-1.32.24l-.04.04a1.46 1.46 0 11-2.06-2.06l.04-.04a1.2 1.2 0 00.24-1.32 1.2 1.2 0 00-1.1-.73h-.12a1.46 1.46 0 110-2.92h.06a1.2 1.2 0 001.1-.78 1.2 1.2 0 00-.24-1.32l-.04-.04A1.46 1.46 0 117.17 4.3l.04.04a1.2 1.2 0 001.32.24h.06a1.2 1.2 0 00.73-1.1v-.12a1.46 1.46 0 012.92 0v.06a1.2 1.2 0 00.73 1.1 1.2 1.2 0 001.32-.24l.04-.04a1.46 1.46 0 112.06 2.06l-.04.04a1.2 1.2 0 00-.24 1.32v.06a1.2 1.2 0 001.1.73h.12a1.46 1.46 0 010 2.92h-.06a1.2 1.2 0 00-1.1.73z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function PentaNavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="penta-navbar">
      {NAV_ITEMS.map((item) => {
        const active = location.pathname === item.path;
        return (
          <button
            key={item.path}
            className={`penta-navbar-item ${active ? "active" : ""}`}
            onClick={() => {
              if (!active) navigate(item.path);
            }}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
          >
            <NavIcon icon={item.icon} />
            <span className="penta-navbar-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
