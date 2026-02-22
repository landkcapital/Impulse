import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "../lib/auth";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <>
      <header className="header">
        <div className="header-left">
          <h1 className="logo" onClick={() => navigate("/")}>
            Impulse
          </h1>
        </div>
        <nav className="header-nav desktop-nav">
          <button
            className={`nav-btn ${location.pathname === "/" ? "active" : ""}`}
            onClick={() => navigate("/")}
          >
            Home
          </button>
          <button
            className={`nav-btn ${location.pathname === "/goals" ? "active" : ""}`}
            onClick={() => navigate("/goals")}
          >
            Goals
          </button>
          <button
            className={`nav-btn ${location.pathname === "/history" ? "active" : ""}`}
            onClick={() => navigate("/history")}
          >
            History
          </button>
          <button
            className={`nav-btn ${location.pathname === "/settings" ? "active" : ""}`}
            onClick={() => navigate("/settings")}
          >
            Settings
          </button>
          <button
            className={`nav-btn ${location.pathname === "/account" ? "active" : ""}`}
            onClick={() => navigate("/account")}
          >
            Account
          </button>
          <button className="nav-btn sign-out" onClick={handleSignOut}>
            Sign Out
          </button>
        </nav>
      </header>

      <nav className="bottom-nav">
        <button
          className={`bottom-nav-btn ${location.pathname === "/" ? "active" : ""}`}
          onClick={() => navigate("/")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>Home</span>
        </button>
        <button
          className={`bottom-nav-btn ${location.pathname === "/goals" ? "active" : ""}`}
          onClick={() => navigate("/goals")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
          <span>Goals</span>
        </button>
        <button
          className={`bottom-nav-btn ${location.pathname === "/history" ? "active" : ""}`}
          onClick={() => navigate("/history")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>History</span>
        </button>
        <button
          className={`bottom-nav-btn ${location.pathname === "/settings" ? "active" : ""}`}
          onClick={() => navigate("/settings")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          <span>Settings</span>
        </button>
        <button
          className={`bottom-nav-btn ${location.pathname === "/account" ? "active" : ""}`}
          onClick={() => navigate("/account")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>Account</span>
        </button>
      </nav>
    </>
  );
}
