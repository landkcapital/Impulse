import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { signOut } from "../../../lib/auth";
import PentaHeader from "../components/PentaHeader";
import PentaNavBar from "../components/PentaNavBar";
import PentaLoader from "../components/PentaLoader";

export default function PentaAccountScreen() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/login");
    } catch {
      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <div className="page penta-page penta-page-with-nav">
        <PentaLoader label="Loading account..." />
        <PentaNavBar />
      </div>
    );
  }

  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div className="page penta-page penta-page-with-nav">
      <PentaHeader title="Account" />

      {/* Profile info */}
      <div className="card penta-acct-card">
        <div className="penta-acct-row">
          <span className="penta-acct-label">Email</span>
          <span className="penta-acct-value">{user?.email || "—"}</span>
        </div>
        <div className="penta-acct-row">
          <span className="penta-acct-label">Member since</span>
          <span className="penta-acct-value">{createdAt}</span>
        </div>
        <div className="penta-acct-row">
          <span className="penta-acct-label">User ID</span>
          <span className="penta-acct-value penta-acct-uid">
            {user?.id?.slice(0, 8)}...
          </span>
        </div>
      </div>

      {/* App info */}
      <div className="penta-acct-section-label">App</div>
      <div className="card penta-acct-card">
        <div className="penta-acct-row">
          <span className="penta-acct-label">Version</span>
          <span className="penta-acct-value">1.0.0</span>
        </div>
        <div className="penta-acct-row">
          <span className="penta-acct-label">Platform</span>
          <span className="penta-acct-value">Web</span>
        </div>
      </div>

      {/* Actions */}
      <div className="penta-acct-section-label">Actions</div>
      <div className="card penta-acct-card">
        <button
          className="penta-acct-action"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>

      {/* Danger zone */}
      <div className="penta-acct-section-label penta-acct-danger-label">
        Danger Zone
      </div>
      <div className="card penta-acct-card penta-acct-danger">
        {!showDeleteConfirm ? (
          <button
            className="penta-acct-action penta-acct-action-danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Account
          </button>
        ) : (
          <div className="penta-acct-confirm">
            <p className="penta-acct-confirm-text">
              This will permanently delete your account and all data. This
              action cannot be undone.
            </p>
            <div className="penta-acct-confirm-actions">
              <button
                className="btn small"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn small penta-acct-btn-danger"
                onClick={() => {
                  // Account deletion would need a server-side function
                  alert(
                    "Please contact support to delete your account."
                  );
                  setShowDeleteConfirm(false);
                }}
              >
                Yes, Delete Everything
              </button>
            </div>
          </div>
        )}
      </div>

      <PentaNavBar />
    </div>
  );
}
