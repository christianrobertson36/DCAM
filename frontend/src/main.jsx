import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardList,
  QrCode,
  FileText,
  ShieldCheck,
  Smartphone,
  Settings,
  CalendarDays,
  LogOut,
  LockKeyhole
} from "lucide-react";
import { getMe, login } from "./api";
import "./styles/main.css";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "CRM", icon: Users },
  { label: "Customers", icon: Users },
  { label: "Buildings", icon: Building2 },
  { label: "Assets", icon: QrCode },
  { label: "Work Orders", icon: ClipboardList },
  { label: "Schedule", icon: CalendarDays },
  { label: "Reports", icon: FileText },
  { label: "Certificates", icon: ShieldCheck },
  { label: "Technician App", icon: Smartphone },
  { label: "Customer Portal", icon: Building2 },
  { label: "Settings", icon: Settings }
];

const cards = [
  {
    title: "Compliance Status",
    value: "Auth Ready",
    text: "Login and role foundation is now in place."
  },
  {
    title: "Open Work Orders",
    value: "0",
    text: "Work order tracking starts in a future sprint."
  },
  {
    title: "Assets Registered",
    value: "0",
    text: "Asset register and QR codes are planned next."
  },
  {
    title: "Renewals Due",
    value: "0",
    text: "Renewal automation will be added after core records."
  }
];

function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("dcam_token");

    if (!token) {
      setCheckingSession(false);
      return;
    }

    getMe()
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem("dcam_token");
        setUser(null);
      })
      .finally(() => setCheckingSession(false));
  }, []);

  function handleLoginSuccess(data) {
    localStorage.setItem("dcam_token", data.token);
    setUser(data.user);
  }

  function handleLogout() {
    localStorage.removeItem("dcam_token");
    setUser(null);
  }

  if (checkingSession) {
    return (
      <div className="loading-screen">
        <div className="brand-mark">D</div>
        <p>Checking DCAM session...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return <AdminShell user={user} onLogout={handleLogout} />;
}

function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState("admin@dcam.local");
  const [password, setPassword] = useState("ChangeMe123!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const data = await login(email, password);
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-icon">
          <LockKeyhole size={30} />
        </div>

        <p className="eyebrow">v2 Login Foundation</p>
        <h1>Sign in to DCAM</h1>
        <p className="login-intro">
          Digital Compliance & Asset Management for technical compliance operations.
        </p>

        <label>
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
          />
        </label>

        <label>
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
          />
        </label>

        {error ? <div className="login-error">{error}</div> : null}

        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>

        <div className="dev-note">
          Dev admin: admin@dcam.local / ChangeMe123!
        </div>
      </form>
    </div>
  );
}

function AdminShell({ user, onLogout }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">D</div>
          <div>
            <div className="brand-title">DCAM</div>
            <div className="brand-subtitle">Digital Compliance & Asset Management</div>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button className="nav-item" key={item.label}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">v2 Login + Roles</p>
            <h1>DCAM Operating System</h1>
          </div>

          <div className="user-panel">
            <div>
              <strong>{user.name}</strong>
              <span>{user.role}</span>
            </div>
            <button className="logout-button" onClick={onLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        <section className="hero">
          <div>
            <p className="eyebrow">Technical Compliance Platform</p>
            <h2>One system for customers, buildings, assets, engineers, work orders, reports and renewals.</h2>
            <p>
              DCAM now has a working login and role foundation. Next we can add real CRM records and customer management.
            </p>
          </div>
        </section>

        <section className="card-grid">
          {cards.map((card) => (
            <article className="card" key={card.title}>
              <p>{card.title}</p>
              <strong>{card.value}</strong>
              <span>{card.text}</span>
            </article>
          ))}
        </section>

        <section className="module-grid">
          <Module title="CRM" text="Companies, contacts, pipeline, quotes, contracts and renewals." />
          <Module title="CMMS" text="Preventive maintenance, reactive jobs, scheduling and work orders." />
          <Module title="Asset Management" text="QR-coded assets with locations, photos, history and certificates." />
          <Module title="Technician App" text="Daily jobs, QR scanning, checklists, photos, signatures and offline sync." />
          <Module title="Customer Portal" text="Customer access to buildings, assets, reports, certificates and requests." />
          <Module title="Automation & AI" text="Renewal reminders, report writing, quotation support and intelligent search." />
        </section>
      </main>
    </div>
  );
}

function Module({ title, text }) {
  return (
    <div className="module-card">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
