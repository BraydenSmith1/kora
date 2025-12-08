import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = localStorage.getItem("API_URL") || "http://localhost:4000";

export default function LandingPage({ onPilotLogin }) {
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [operatorPassword, setOperatorPassword] = useState("");
  const [anchorPassword, setAnchorPassword] = useState("");
  const [submittingRole, setSubmittingRole] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await axios.get(`${API_URL}/analytics/overview`);
        if (active) {
          setStats(data);
        }
      } catch (err) {
        setStatsError(true);
      } finally {
        if (active) setLoadingStats(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(role) {
    setLoginError("");
    setSubmittingRole(role);
    try {
      const password = role === "operator" ? operatorPassword : anchorPassword;
      if (!password) {
        setLoginError("Enter the password provided for this pilot.");
        return;
      }
      await onPilotLogin(role, password);
    } catch (err) {
      const message = err?.response?.data?.error || err.message || "Login failed.";
      setLoginError(message);
    } finally {
      setSubmittingRole("");
    }
  }

  const metrics = [
    {
      label: "kWh traded",
      value: stats ? stats.kwh.toFixed(2) : "—",
      highlight: "Energy flowing peer-to-peer.",
    },
    {
      label: "Volume (USD)",
      value: stats ? `$${stats.usd.toFixed(2)}` : "—",
      highlight: "Dollars saved across the community.",
    },
    {
      label: "CO₂ offset (t)",
      value: stats ? stats.co2Tons.toFixed(3) : "—",
      highlight: "Cleaner grids with every kWh traded.",
    },
  ];

  return (
    <main>
      <section className="hero">
        <div className="hero__brand hero__brand--solo">KORA</div>
        <h1>Power your neighbors with clean, community energy.</h1>
        <p>
          Kora is a warm marketplace for solar-rich communities—list surplus kWh, match against real-time demand,
          settle instantly, and keep an immutable receipt on-chain.
        </p>
        <div className="login-grid">
          <LoginCard
            title="Operator Login"
            subtitle="Post surplus from the microgrid."
            password={operatorPassword}
            onPasswordChange={setOperatorPassword}
            onSubmit={() => handleSubmit("operator")}
            submitting={submittingRole === "operator"}
          />
          <LoginCard
            title="Anchor Login"
            subtitle="Record demand for critical load."
            password={anchorPassword}
            onPasswordChange={setAnchorPassword}
            onSubmit={() => handleSubmit("anchor")}
            submitting={submittingRole === "anchor"}
          />
        </div>
        {loginError && (
          <div className="alert" style={{ marginTop: 12 }}>{loginError}</div>
        )}
        <small style={{ opacity: 0.8, marginTop: 12, display: "block" }}>
          This pilot issues one operator and one anchor credential. Password defaults to “1”.
        </small>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>What traction looks like today</h2>
        {statsError && (
          <div className="empty-state">
            Couldn’t load live analytics. Try refreshing once the API is online.
          </div>
        )}
        {!statsError && (
          <div className="stats-grid">
            {metrics.map((metric) => (
              <StatCard key={metric.label} {...metric} loading={loadingStats} />
            ))}
          </div>
        )}
      </section>

      <section className="info-grid">
        <div className="info-card">
          <h3>Why this matters</h3>
          <p>
            600M+ people still lack reliable electricity. Rural communities overpay for scarce supply while
            affordable solar sits underutilized. We unlock idle generation and route it to nearby demand.
          </p>
          <p>
            Every trade channels more dollars to local producers, reducing diesel usage and building resilience.
          </p>
        </div>
        <div className="info-card">
          <h3>How the marketplace works</h3>
          <ol>
            <li>Residents list surplus kWh at a price they choose.</li>
            <li>Neighbors post buy intents with max budgets.</li>
            <li>A matching engine pairs compatible offers within the same microgrid.</li>
            <li>Wallets settle instantly and a receipt is written to an auditable ledger.</li>
          </ol>
        </div>
      </section>

    </main>
  );
}

function LoginCard({ title, subtitle, password, onPasswordChange, onSubmit, submitting }) {
  return (
    <div className="info-card login-card">
      <h3>{title}</h3>
      <p>{subtitle}</p>
      <label className="input-stack">
        <span>Password</span>
        <input
          type="password"
          placeholder="•••••"
          value={password}
          onChange={(event)=>onPasswordChange(event.target.value)}
          disabled={submitting}
        />
      </label>
      <button type="button" onClick={onSubmit} disabled={submitting}>
        {submitting ? "Checking…" : "Enter dashboard"}
      </button>
    </div>
  );
}

function StatCard({ label, value, highlight, loading }) {
  return (
    <div className="info-card" style={{ padding: "20px" }}>
      <div style={{ opacity: 0.6, fontSize: "0.8rem", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: 8 }}>
        {loading ? "…" : value}
      </div>
      <div style={{ marginTop: 8, color: "#475467" }}>{highlight}</div>
    </div>
  );
}
