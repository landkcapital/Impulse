import { useNavigate } from "react-router-dom";

/**
 * Reusable header for all Penta screens.
 *
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} [props.subtitle] - Optional subtitle below title
 * @param {boolean} [props.showBack] - Show back arrow (navigates to /penta)
 * @param {string} [props.backTo] - Override back destination
 * @param {React.ReactNode} [props.right] - Optional right-side content
 */
export default function PentaHeader({
  title,
  subtitle,
  showBack = false,
  backTo = "/",
  right,
}) {
  const navigate = useNavigate();

  return (
    <div className="penta-header">
      <div className="penta-header-left">
        {showBack && (
          <button
            className="penta-header-back"
            onClick={() => navigate(backTo)}
            aria-label="Back"
          >
            &larr;
          </button>
        )}
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <div className="penta-date">{subtitle}</div>}
        </div>
      </div>
      {right && <div className="penta-header-right">{right}</div>}
    </div>
  );
}
