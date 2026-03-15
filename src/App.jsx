import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getSession, onAuthStateChange } from "./lib/auth";
import Header from "./components/Header";
import ErrorBoundary from "./components/ErrorBoundary";
import Loading from "./components/Loading";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Goals from "./pages/Goals";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Account from "./pages/Account";
import {
  PentaHomeScreen,
  PentaLogBlockScreen,
  PentaTodosScreen,
  PentaReviewScreen,
  PentaInsightsScreen,
  PentaSettingsScreen,
} from "./features/penta/screens";
import "./styles.css";

function ProtectedRoute({ session, ready, children }) {
  if (!ready) return <Loading />;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function ImpulseRoute({ session, ready, children }) {
  if (!ready) return <Loading />;
  if (!session) return <Navigate to="/login" replace />;
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}

function PublicRoute({ session, ready, children }) {
  if (!ready) return <Loading />;
  if (session) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let ignore = false;

    getSession().then((s) => {
      if (!ignore) {
        setSession(s);
        setReady(true);
      }
    });

    const subscription = onAuthStateChange((s) => {
      if (!ignore) {
        setSession(s);
        setReady(true);
      }
    });

    return () => {
      ignore = true;
      subscription?.unsubscribe();
    };
  }, []);

  // Impulse theme settings only apply on Impulse routes
  // Penta uses its own reef turquoise theme from CSS defaults

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute session={session} ready={ready}>
                <Login onAuth={setSession} />
              </PublicRoute>
            }
          />
          {/* Penta routes (primary app) */}
          <Route
            path="/"
            element={
              <ProtectedRoute session={session} ready={ready}>
                <PentaHomeScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/log"
            element={
              <ProtectedRoute session={session} ready={ready}>
                <PentaLogBlockScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/todos"
            element={
              <ProtectedRoute session={session} ready={ready}>
                <PentaTodosScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/review"
            element={
              <ProtectedRoute session={session} ready={ready}>
                <PentaReviewScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/insights"
            element={
              <ProtectedRoute session={session} ready={ready}>
                <PentaInsightsScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute session={session} ready={ready}>
                <PentaSettingsScreen />
              </ProtectedRoute>
            }
          />
          {/* Legacy /penta/* redirects */}
          <Route path="/penta" element={<Navigate to="/" replace />} />
          <Route path="/penta/log" element={<Navigate to="/log" replace />} />
          <Route path="/penta/review" element={<Navigate to="/review" replace />} />
          <Route path="/penta/insights" element={<Navigate to="/insights" replace />} />
          <Route path="/penta/settings" element={<Navigate to="/settings" replace />} />
          {/* Impulse routes (moved to /impulse/*) */}
          <Route
            path="/impulse"
            element={
              <ImpulseRoute session={session} ready={ready}>
                <Home />
              </ImpulseRoute>
            }
          />
          <Route
            path="/impulse/goals"
            element={
              <ImpulseRoute session={session} ready={ready}>
                <Goals />
              </ImpulseRoute>
            }
          />
          <Route
            path="/impulse/history"
            element={
              <ImpulseRoute session={session} ready={ready}>
                <History />
              </ImpulseRoute>
            }
          />
          <Route
            path="/impulse/settings"
            element={
              <ImpulseRoute session={session} ready={ready}>
                <Settings />
              </ImpulseRoute>
            }
          />
          <Route
            path="/impulse/account"
            element={
              <ImpulseRoute session={session} ready={ready}>
                <Account />
              </ImpulseRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
