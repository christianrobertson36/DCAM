import React, { useEffect, useMemo, useState } from "react";
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
  LockKeyhole,
  Plus,
  Search,
  Save,
  X
} from "lucide-react";
import {
  createCustomer,
  getCustomerSummary,
  getMe,
  listCustomers,
  login,
  updateCustomer
} from "./api";
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

const emptyCustomer = {
  company_name: "",
  trading_name: "",
  customer_type: "Commercial",
  status: "Prospect",
  email: "",
  phone: "",
  website: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  county: "",
  postcode: "",
  country: "Romania",
  primary_contact_name: "",
  primary_contact_email: "",
  primary_contact_phone: "",
  notes: ""
};

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

        <p className="eyebrow">v3 CRM Foundation</p>
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
  const [activePage, setActivePage] = useState("Dashboard");

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
            const active = item.label === activePage;

            return (
              <button
                className={`nav-item ${active ? "active" : ""}`}
                key={item.label}
                onClick={() => setActivePage(item.label)}
              >
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
            <p className="eyebrow">v3 CRM Customers</p>
            <h1>{activePage === "Customers" ? "Customers" : "DCAM Operating System"}</h1>
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

        {activePage === "Customers" ? <CustomersPage /> : <DashboardPage />}
      </main>
    </div>
  );
}

function DashboardPage() {
  const cards = [
    {
      title: "Compliance Status",
      value: "CRM Ready",
      text: "Customer records are now connected to the backend."
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

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Technical Compliance Platform</p>
          <h2>One system for customers, buildings, assets, engineers, work orders, reports and renewals.</h2>
          <p>
            DCAM now has the first working CRM foundation. Customers can be created, listed, searched and updated.
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
    </>
  );
}

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    prospects: 0,
    active: 0,
    on_hold: 0,
    inactive: 0
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState(emptyCustomer);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadCustomers() {
    const [summaryData, customersData] = await Promise.all([
      getCustomerSummary(),
      listCustomers({ search, status })
    ]);

    setSummary(summaryData.summary);
    setCustomers(customersData.customers);
  }

  useEffect(() => {
    loadCustomers().catch((err) => setError(err.message));
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    setError("");

    try {
      await loadCustomers();
    } catch (err) {
      setError(err.message);
    }
  }

  function openCreateForm() {
    setEditingCustomer(null);
    setForm(emptyCustomer);
    setFormOpen(true);
    setError("");
  }

  function openEditForm(customer) {
    setEditingCustomer(customer);
    setForm({
      ...emptyCustomer,
      ...customer
    });
    setFormOpen(true);
    setError("");
  }

  function closeForm() {
    setFormOpen(false);
    setEditingCustomer(null);
    setForm(emptyCustomer);
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function saveCustomer(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, form);
      } else {
        await createCustomer(form);
      }

      closeForm();
      await loadCustomers();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const summaryCards = useMemo(
    () => [
      { label: "Total Customers", value: summary.total || 0 },
      { label: "Prospects", value: summary.prospects || 0 },
      { label: "Active", value: summary.active || 0 },
      { label: "On Hold", value: summary.on_hold || 0 },
      { label: "Inactive", value: summary.inactive || 0 }
    ],
    [summary]
  );

  return (
    <div className="customers-page">
      <section className="page-intro">
        <div>
          <p className="eyebrow">CRM Module</p>
          <h2>Customer company records</h2>
          <p>
            Manage the organisations DCAM will support with compliance, assets, buildings and maintenance.
          </p>
        </div>

        <button className="primary-action" onClick={openCreateForm}>
          <Plus size={18} />
          Add Customer
        </button>
      </section>

      <section className="mini-card-grid">
        {summaryCards.map((card) => (
          <article className="mini-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <form className="filter-bar" onSubmit={handleSearch}>
        <div className="search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customers, contacts, email or postcode..."
          />
        </div>

        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="Prospect">Prospect</option>
          <option value="Active">Active</option>
          <option value="On Hold">On Hold</option>
          <option value="Inactive">Inactive</option>
        </select>

        <button className="secondary-button" type="submit">
          Search
        </button>
      </form>

      {error ? <div className="login-error">{error}</div> : null}

      <section className="table-card">
        <div className="table-header">
          <strong>Customers</strong>
          <span>{customers.length} shown</span>
        </div>

        {customers.length ? (
          <div className="customer-list">
            {customers.map((customer) => (
              <button
                className="customer-row"
                key={customer.id}
                onClick={() => openEditForm(customer)}
              >
                <div>
                  <strong>{customer.company_name}</strong>
                  <span>{customer.trading_name || customer.primary_contact_name || "No contact added"}</span>
                </div>
                <div>
                  <span>{customer.email || "No email"}</span>
                  <span>{customer.phone || "No phone"}</span>
                </div>
                <div>
                  <span>{customer.city || "No city"}</span>
                  <span>{customer.postcode || "No postcode"}</span>
                </div>
                <div>
                  <span className={`status-badge ${customer.status.toLowerCase().replaceAll(" ", "-")}`}>
                    {customer.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            No customers yet. Add your first customer to start building the CRM.
          </div>
        )}
      </section>

      {formOpen ? (
        <div className="modal-backdrop">
          <form className="customer-form" onSubmit={saveCustomer}>
            <div className="form-header">
              <div>
                <p className="eyebrow">{editingCustomer ? "Edit Customer" : "New Customer"}</p>
                <h2>{editingCustomer ? editingCustomer.company_name : "Add customer"}</h2>
              </div>

              <button className="icon-button" type="button" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <Field label="Company name" value={form.company_name} onChange={(value) => updateField("company_name", value)} required />
              <Field label="Trading name" value={form.trading_name} onChange={(value) => updateField("trading_name", value)} />

              <label>
                Customer type
                <select value={form.customer_type} onChange={(event) => updateField("customer_type", event.target.value)}>
                  <option>Commercial</option>
                  <option>Property Manager</option>
                  <option>Facilities Management</option>
                  <option>Public Sector</option>
                  <option>Residential Block</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                Status
                <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option>Prospect</option>
                  <option>Active</option>
                  <option>On Hold</option>
                  <option>Inactive</option>
                </select>
              </label>

              <Field label="Email" value={form.email} onChange={(value) => updateField("email", value)} />
              <Field label="Phone" value={form.phone} onChange={(value) => updateField("phone", value)} />
              <Field label="Website" value={form.website} onChange={(value) => updateField("website", value)} />
              <Field label="Address line 1" value={form.address_line_1} onChange={(value) => updateField("address_line_1", value)} />
              <Field label="Address line 2" value={form.address_line_2} onChange={(value) => updateField("address_line_2", value)} />
              <Field label="City" value={form.city} onChange={(value) => updateField("city", value)} />
              <Field label="County / Region" value={form.county} onChange={(value) => updateField("county", value)} />
              <Field label="Postcode" value={form.postcode} onChange={(value) => updateField("postcode", value)} />
              <Field label="Country" value={form.country} onChange={(value) => updateField("country", value)} />
              <Field label="Primary contact name" value={form.primary_contact_name} onChange={(value) => updateField("primary_contact_name", value)} />
              <Field label="Primary contact email" value={form.primary_contact_email} onChange={(value) => updateField("primary_contact_email", value)} />
              <Field label="Primary contact phone" value={form.primary_contact_phone} onChange={(value) => updateField("primary_contact_phone", value)} />

              <label className="wide-field">
                Notes
                <textarea
                  value={form.notes || ""}
                  onChange={(event) => updateField("notes", event.target.value)}
                  rows={4}
                />
              </label>
            </div>

            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={closeForm}>
                Cancel
              </button>
              <button className="primary-action" type="submit" disabled={busy}>
                <Save size={18} />
                {busy ? "Saving..." : "Save Customer"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange, required }) {
  return (
    <label>
      {label}
      <input
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
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
