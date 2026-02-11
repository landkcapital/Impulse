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
    <header className="header">
      <div className="header-left">
        <h1 className="logo" onClick={() => navigate("/")}>
          ZeroLine
        </h1>
      </div>
      <nav className="header-nav">
        <button
          className={`nav-btn ${location.pathname === "/" ? "active" : ""}`}
          onClick={() => navigate("/")}
        >
          Home
        </button>
        <button
          className={`nav-btn ${location.pathname === "/budgets" ? "active" : ""}`}
          onClick={() => navigate("/budgets")}
        >
          Budgets
        </button>
        <button
          className={`nav-btn ${location.pathname === "/history" ? "active" : ""}`}
          onClick={() => navigate("/history")}
        >
          History
        </button>
        <a href="http://localhost:5174" className="nav-btn app-link">
          WorthMeter
        </a>
        <button className="nav-btn sign-out" onClick={handleSignOut}>
          Sign Out
        </button>
      </nav>
    </header>
  );
}
