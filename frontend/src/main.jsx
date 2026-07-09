import React from "react";
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
  CalendarDays
} from "lucide-react";
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
    value: "Foundation",
    text: "Live compliance dashboards will appear here."
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
            <p className="eyebrow">v1 Foundation</p>
            <h1>DCAM Operating System</h1>
          </div>
          <div className="status-pill">API-first • Mobile-first • Compliance-ready</div>
        </header>

        <section className="hero">
          <div>
            <p className="eyebrow">Technical Compliance Platform</p>
            <h2>One system for customers, buildings, assets, engineers, work orders, reports and renewals.</h2>
            <p>
              DCAM is being built as the digital operating system for a technical compliance and building maintenance company.
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
