import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  Building2,
  Download,
  Users,
  LogOut,
  LockKeyhole,
  Plus,
  Search,
  Save,
  Trash2,
  X
} from "lucide-react";
import {
  createAsset,
  createBuilding,
  createCustomer,
  deleteAssetFile,
  downloadAssetFile,
  getAssetSummary,
  getBuildingSummary,
  getCustomerSummary,
  getMe,
  listAssetFiles,
  listAssets,
  listBuildings,
  listCustomers,
  login,
  updateAsset,
  uploadAssetFile,
  updateBuilding,
  updateCustomer
} from "./api";
import "./styles/main.css";

function safeGetStorageItem(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (err) {
    return null;
  }
}

function safeSetStorageItem(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (err) {
    // The app can still run for this page load if persistent storage is blocked.
  }
}

function safeRemoveStorageItem(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    // Ignore storage cleanup failures from private or restricted browser modes.
  }
}

const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard:view",
  CUSTOMERS_VIEW: "customers:view",
  CUSTOMERS_CREATE: "customers:create",
  CUSTOMERS_EDIT: "customers:edit",
  BUILDINGS_VIEW: "buildings:view",
  BUILDINGS_CREATE: "buildings:create",
  BUILDINGS_EDIT: "buildings:edit",
  ASSETS_VIEW: "assets:view",
  ASSETS_CREATE: "assets:create",
  ASSETS_EDIT: "assets:edit"
};

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW },
  { label: "Customers", icon: Users, permission: PERMISSIONS.CUSTOMERS_VIEW },
  { label: "Buildings", icon: Building2, permission: PERMISSIONS.BUILDINGS_VIEW },
  { label: "Assets", icon: Building2, permission: PERMISSIONS.ASSETS_VIEW }
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

const emptyBuilding = {
  customer_id: "",
  name: "",
  building_type: "Commercial",
  status: "Active",
  address_line_1: "",
  address_line_2: "",
  city: "",
  county: "",
  postcode: "",
  country: "Romania",
  access_notes: "",
  compliance_notes: "",
  site_contact_name: "",
  site_contact_email: "",
  site_contact_phone: ""
};

const emptyAsset = {
  building_id: "",
  asset_reference: "",
  asset_name: "",
  asset_tag: "",
  asset_category: "General",
  asset_type: "General",
  status: "Active",
  condition: "Unknown",
  ownership_type: "Customer Owned",
  manufacturer: "",
  model: "",
  serial_number: "",
  location_description: "",
  install_date: "",
  last_service_date: "",
  next_service_date: "",
  warranty_provider: "",
  warranty_reference: "",
  warranty_expiry: "",
  notes: ""
};

function hasPermission(user, permission) {
  return Array.isArray(user?.permissions) && user.permissions.includes(permission);
}

function statusClassName(status) {
  return String(status || "").toLowerCase().split(" ").join("-");
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      error
    };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-fallback">
          <div className="brand-mark">D</div>
          <h1>DCAM could not start</h1>
          <p>{this.state.error.message || "The browser blocked part of the application startup."}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const token = safeGetStorageItem("dcam_token");

    if (!token) {
      setCheckingSession(false);
      return;
    }

    getMe()
      .then((data) => setUser(data.user))
      .catch(() => {
        safeRemoveStorageItem("dcam_token");
        setUser(null);
      })
      .finally(() => setCheckingSession(false));
  }, []);

  function handleLoginSuccess(data) {
    safeSetStorageItem("dcam_token", data.token);
    setUser(data.user);
  }

  function handleLogout() {
    safeRemoveStorageItem("dcam_token");
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

        <p className="eyebrow">v7 Permissions Foundation</p>
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
  const visibleNavItems = useMemo(
    () => navItems.filter((item) => hasPermission(user, item.permission)),
    [user]
  );

  useEffect(() => {
    if (!visibleNavItems.some((item) => item.label === activePage)) {
      setActivePage(visibleNavItems[0]?.label || "Dashboard");
    }
  }, [activePage, visibleNavItems]);

  const pageTitle = activePage === "Customers" || activePage === "Buildings" || activePage === "Assets"
    ? activePage
    : "DCAM Operating System";

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
          {visibleNavItems.map((item) => {
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
            <p className="eyebrow">v7 Permissions Foundation</p>
            <h1>{pageTitle}</h1>
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

        {activePage === "Customers" ? <CustomersPage user={user} /> : null}
        {activePage === "Buildings" ? <BuildingsPage user={user} /> : null}
        {activePage === "Assets" ? <AssetsPage user={user} /> : null}
        {activePage !== "Customers" && activePage !== "Buildings" && activePage !== "Assets" ? <DashboardPage /> : null}
      </main>
    </div>
  );
}

function DashboardPage() {
  const cards = [
    {
      title: "Compliance Status",
      value: "Buildings Ready",
      text: "Customers and buildings/sites are now connected."
    },
    {
      title: "Open Work Orders",
      value: "0",
      text: "Work order tracking starts after assets."
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
          <h2>Customers now have buildings/sites ready for assets, QR codes, jobs and compliance history.</h2>
          <p>
            DCAM now tracks both customer companies and the physical buildings or sites where compliance work happens.
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
        <Module title="Buildings / Sites" text="Customer buildings, access notes, site contacts and compliance notes." />
        <Module title="Asset Management" text="QR-coded assets with locations, photos, history and certificates." />
        <Module title="CMMS" text="Preventive maintenance, reactive jobs, scheduling and work orders." />
        <Module title="Technician App" text="Daily jobs, QR scanning, checklists, photos, signatures and offline sync." />
        <Module title="Automation & AI" text="Renewal reminders, report writing, quotation support and intelligent search." />
      </section>
    </>
  );
}

function CustomersPage({ user }) {
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
  const canCreateCustomer = hasPermission(user, PERMISSIONS.CUSTOMERS_CREATE);
  const canEditCustomer = hasPermission(user, PERMISSIONS.CUSTOMERS_EDIT);

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

        {canCreateCustomer ? (
          <button className="primary-action" onClick={openCreateForm}>
            <Plus size={18} />
            Add Customer
          </button>
        ) : null}
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
                onClick={() => {
                  if (canEditCustomer) {
                    openEditForm(customer);
                  }
                }}
                disabled={!canEditCustomer}
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
                  <span className={`status-badge ${statusClassName(customer.status)}`}>
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

function BuildingsPage({ user }) {
  const [buildings, setBuildings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    survey_required: 0,
    on_hold: 0,
    inactive: 0
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [form, setForm] = useState(emptyBuilding);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canViewCustomers = hasPermission(user, PERMISSIONS.CUSTOMERS_VIEW);
  const canCreateBuilding = hasPermission(user, PERMISSIONS.BUILDINGS_CREATE);
  const canEditBuilding = hasPermission(user, PERMISSIONS.BUILDINGS_EDIT);

  async function loadBuildings() {
    const requests = [
      getBuildingSummary(),
      listBuildings({ search, status, customer_id: canViewCustomers ? customerId : "" })
    ];

    if (canViewCustomers) {
      requests.push(listCustomers());
    }

    const [summaryData, buildingsData, customersData] = await Promise.all(requests);

    setSummary(summaryData.summary);
    setBuildings(buildingsData.buildings);
    setCustomers(customersData?.customers || []);
  }

  useEffect(() => {
    loadBuildings().catch((err) => setError(err.message));
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    setError("");

    try {
      await loadBuildings();
    } catch (err) {
      setError(err.message);
    }
  }

  function openCreateForm() {
    setEditingBuilding(null);
    setForm({
      ...emptyBuilding,
      customer_id: customerId || customers[0]?.id || ""
    });
    setFormOpen(true);
    setError("");
  }

  function openEditForm(building) {
    setEditingBuilding(building);
    setForm({
      ...emptyBuilding,
      ...building,
      customer_id: building.customer_id || ""
    });
    setFormOpen(true);
    setError("");
  }

  function closeForm() {
    setFormOpen(false);
    setEditingBuilding(null);
    setForm(emptyBuilding);
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function saveBuilding(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload = {
        ...form,
        customer_id: Number(form.customer_id)
      };

      if (editingBuilding) {
        await updateBuilding(editingBuilding.id, payload);
      } else {
        await createBuilding(payload);
      }

      closeForm();
      await loadBuildings();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const summaryCards = useMemo(
    () => [
      { label: "Total Buildings", value: summary.total || 0 },
      { label: "Active", value: summary.active || 0 },
      { label: "Survey Required", value: summary.survey_required || 0 },
      { label: "On Hold", value: summary.on_hold || 0 },
      { label: "Inactive", value: summary.inactive || 0 }
    ],
    [summary]
  );

  return (
    <div className="buildings-page">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Buildings / Sites</p>
          <h2>Customer buildings and service locations</h2>
          <p>
            Link every customer to the buildings where assets, compliance checks and jobs will happen.
          </p>
        </div>

        {canCreateBuilding ? (
          <button className="primary-action" onClick={openCreateForm} disabled={!customers.length}>
            <Plus size={18} />
            Add Building
          </button>
        ) : null}
      </section>

      {canCreateBuilding && !customers.length ? (
        <div className="login-error">
          Add a customer first before creating buildings.
        </div>
      ) : null}

      <section className="mini-card-grid">
        {summaryCards.map((card) => (
          <article className="mini-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <form className="filter-bar buildings-filter" onSubmit={handleSearch}>
        <div className="search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search buildings, customer, city or postcode..."
          />
        </div>

        {canViewCustomers ? (
          <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">All customers</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.company_name}
              </option>
            ))}
          </select>
        ) : null}

        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Survey Required">Survey Required</option>
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
          <strong>Buildings</strong>
          <span>{buildings.length} shown</span>
        </div>

        {buildings.length ? (
          <div className="customer-list">
            {buildings.map((building) => (
              <button
                className="customer-row building-row"
                key={building.id}
                onClick={() => {
                  if (canEditBuilding) {
                    openEditForm(building);
                  }
                }}
                disabled={!canEditBuilding}
              >
                <div>
                  <strong>{building.name}</strong>
                  <span>{building.customer_name || "No customer"}</span>
                </div>
                <div>
                  <span>{building.building_type}</span>
                  <span>{building.site_contact_name || "No site contact"}</span>
                </div>
                <div>
                  <span>{building.city || "No city"}</span>
                  <span>{building.postcode || "No postcode"}</span>
                </div>
                <div>
                  <span className={`status-badge ${statusClassName(building.status)}`}>
                    {building.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            No buildings yet. Add a building/site for one of your customers.
          </div>
        )}
      </section>

      {formOpen ? (
        <div className="modal-backdrop">
          <form className="customer-form" onSubmit={saveBuilding}>
            <div className="form-header">
              <div>
                <p className="eyebrow">{editingBuilding ? "Edit Building" : "New Building"}</p>
                <h2>{editingBuilding ? editingBuilding.name : "Add building/site"}</h2>
              </div>

              <button className="icon-button" type="button" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <label>
                Customer
                <select
                  value={form.customer_id}
                  onChange={(event) => updateField("customer_id", event.target.value)}
                  required
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.company_name}
                    </option>
                  ))}
                </select>
              </label>

              <Field label="Building / site name" value={form.name} onChange={(value) => updateField("name", value)} required />

              <label>
                Building type
                <select value={form.building_type} onChange={(event) => updateField("building_type", event.target.value)}>
                  <option>Commercial</option>
                  <option>Office</option>
                  <option>Retail</option>
                  <option>Industrial</option>
                  <option>Residential Block</option>
                  <option>Hotel / Hospitality</option>
                  <option>Healthcare</option>
                  <option>Education</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                Status
                <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option>Active</option>
                  <option>Survey Required</option>
                  <option>On Hold</option>
                  <option>Inactive</option>
                </select>
              </label>

              <Field label="Address line 1" value={form.address_line_1} onChange={(value) => updateField("address_line_1", value)} />
              <Field label="Address line 2" value={form.address_line_2} onChange={(value) => updateField("address_line_2", value)} />
              <Field label="City" value={form.city} onChange={(value) => updateField("city", value)} />
              <Field label="County / Region" value={form.county} onChange={(value) => updateField("county", value)} />
              <Field label="Postcode" value={form.postcode} onChange={(value) => updateField("postcode", value)} />
              <Field label="Country" value={form.country} onChange={(value) => updateField("country", value)} />
              <Field label="Site contact name" value={form.site_contact_name} onChange={(value) => updateField("site_contact_name", value)} />
              <Field label="Site contact email" value={form.site_contact_email} onChange={(value) => updateField("site_contact_email", value)} />
              <Field label="Site contact phone" value={form.site_contact_phone} onChange={(value) => updateField("site_contact_phone", value)} />

              <label className="wide-field">
                Access notes
                <textarea
                  value={form.access_notes || ""}
                  onChange={(event) => updateField("access_notes", event.target.value)}
                  rows={3}
                  placeholder="Keys, parking, security, reception, entry times..."
                />
              </label>

              <label className="wide-field">
                Compliance notes
                <textarea
                  value={form.compliance_notes || ""}
                  onChange={(event) => updateField("compliance_notes", event.target.value)}
                  rows={3}
                  placeholder="Known risks, inspection requirements, service notes..."
                />
              </label>
            </div>

            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={closeForm}>
                Cancel
              </button>
              <button className="primary-action" type="submit" disabled={busy}>
                <Save size={18} />
                {busy ? "Saving..." : "Save Building"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function AssetsPage({ user }) {
  const [assets, setAssets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    service_due: 0,
    out_of_service: 0,
    retired: 0
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [assetCategory, setAssetCategory] = useState("");
  const [assetType, setAssetType] = useState("");
  const [condition, setCondition] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [form, setForm] = useState(emptyAsset);
  const [assetFiles, setAssetFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileKind, setFileKind] = useState("document");
  const [fileNotes, setFileNotes] = useState("");
  const [fileBusy, setFileBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canViewCustomers = hasPermission(user, PERMISSIONS.CUSTOMERS_VIEW);
  const canViewBuildings = hasPermission(user, PERMISSIONS.BUILDINGS_VIEW);
  const canCreateAsset = hasPermission(user, PERMISSIONS.ASSETS_CREATE);
  const canEditAsset = hasPermission(user, PERMISSIONS.ASSETS_EDIT);

  async function loadAssets() {
    const summaryRequest = getAssetSummary();
    const assetsRequest = listAssets({
      search,
      status,
      asset_category: assetCategory,
      asset_type: assetType,
      condition,
      customer_id: canViewCustomers ? customerId : "",
      building_id: canViewBuildings ? buildingId : ""
    });
    const customersRequest = canViewCustomers ? listCustomers() : Promise.resolve({ customers: [] });
    const buildingsRequest = canViewBuildings
      ? listBuildings({ customer_id: canViewCustomers ? customerId : "" })
      : Promise.resolve({ buildings: [] });

    const [summaryData, assetsData, customersData, buildingsData] = await Promise.all([
      summaryRequest,
      assetsRequest,
      customersRequest,
      buildingsRequest
    ]);

    setSummary(summaryData.summary);
    setAssets(assetsData.assets);
    setCustomers(customersData.customers);
    setBuildings(buildingsData.buildings);
  }

  useEffect(() => {
    loadAssets().catch((err) => setError(err.message));
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    setError("");

    try {
      await loadAssets();
    } catch (err) {
      setError(err.message);
    }
  }

  function openCreateForm() {
    setEditingAsset(null);
    setForm({
      ...emptyAsset,
      building_id: buildingId || buildings[0]?.id || ""
    });
    setAssetFiles([]);
    setSelectedFile(null);
    setFileNotes("");
    setFileKind("document");
    setFormOpen(true);
    setError("");
  }

  function openEditForm(asset) {
    setEditingAsset(asset);
    setForm({
      ...emptyAsset,
      ...asset,
      building_id: asset.building_id || "",
      install_date: formatDateForInput(asset.install_date),
      last_service_date: formatDateForInput(asset.last_service_date),
      next_service_date: formatDateForInput(asset.next_service_date),
      warranty_expiry: formatDateForInput(asset.warranty_expiry)
    });
    setAssetFiles([]);
    setSelectedFile(null);
    setFileNotes("");
    setFileKind("document");
    setFormOpen(true);
    setError("");
    loadAssetFiles(asset.id).catch((err) => setError(err.message));
  }

  function closeForm() {
    setFormOpen(false);
    setEditingAsset(null);
    setForm(emptyAsset);
    setAssetFiles([]);
    setSelectedFile(null);
    setFileNotes("");
    setFileKind("document");
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function saveAsset(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload = {
        ...form,
        building_id: Number(form.building_id)
      };

      if (editingAsset) {
        await updateAsset(editingAsset.id, payload);
      } else {
        await createAsset(payload);
      }

      closeForm();
      await loadAssets();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function loadAssetFiles(assetId) {
    const data = await listAssetFiles(assetId);
    setAssetFiles(data.files || []);
  }

  async function saveAssetFile(event) {
    event.preventDefault();

    if (!editingAsset || !selectedFile) {
      return;
    }

    setFileBusy(true);
    setError("");

    try {
      const contentBase64 = await fileToBase64(selectedFile);
      await uploadAssetFile(editingAsset.id, {
        file_kind: fileKind,
        original_filename: selectedFile.name,
        content_type: selectedFile.type || "application/octet-stream",
        content_base64: contentBase64,
        notes: fileNotes
      });
      setSelectedFile(null);
      setFileNotes("");
      setFileKind("document");
      await loadAssetFiles(editingAsset.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setFileBusy(false);
    }
  }

  async function downloadFile(file) {
    try {
      const blob = await downloadAssetFile(editingAsset.id, file.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.original_filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeFile(file) {
    if (!editingAsset || !window.confirm(`Delete ${file.original_filename}?`)) {
      return;
    }

    setFileBusy(true);
    setError("");

    try {
      await deleteAssetFile(editingAsset.id, file.id);
      await loadAssetFiles(editingAsset.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setFileBusy(false);
    }
  }

  const summaryCards = useMemo(
    () => [
      { label: "Total Assets", value: summary.total || 0 },
      { label: "Active", value: summary.active || 0 },
      { label: "Service Due", value: summary.service_due || 0 },
      { label: "Out of Service", value: summary.out_of_service || 0 },
      { label: "Retired", value: summary.retired || 0 }
    ],
    [summary]
  );

  return (
    <div className="assets-page">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Asset Register</p>
          <h2>Building assets and service items</h2>
          <p>
            Track assets by customer building, tag, status, service dates and location notes.
          </p>
        </div>

        {canCreateAsset ? (
          <button className="primary-action" onClick={openCreateForm} disabled={!buildings.length}>
            <Plus size={18} />
            Add Asset
          </button>
        ) : null}
      </section>

      {canCreateAsset && !buildings.length ? (
        <div className="login-error">
          Add a building first before creating assets.
        </div>
      ) : null}

      <section className="mini-card-grid">
        {summaryCards.map((card) => (
          <article className="mini-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <form className="filter-bar assets-filter" onSubmit={handleSearch}>
        <div className="search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search assets, tags, serials, buildings or customers..."
          />
        </div>

        {canViewCustomers ? (
          <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">All customers</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.company_name}
              </option>
            ))}
          </select>
        ) : null}

        {canViewBuildings ? (
          <select value={buildingId} onChange={(event) => setBuildingId(event.target.value)}>
            <option value="">All buildings</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>
        ) : null}

        <select value={assetCategory} onChange={(event) => setAssetCategory(event.target.value)}>
          <option value="">All categories</option>
          <option value="General">General</option>
          <option value="Compliance">Compliance</option>
          <option value="Plant">Plant</option>
          <option value="Safety">Safety</option>
          <option value="Security">Security</option>
          <option value="Fabric">Fabric</option>
          <option value="IT">IT</option>
          <option value="Other">Other</option>
        </select>

        <select value={assetType} onChange={(event) => setAssetType(event.target.value)}>
          <option value="">All types</option>
          <option value="General">General</option>
          <option value="Fire Safety">Fire Safety</option>
          <option value="Electrical">Electrical</option>
          <option value="Mechanical">Mechanical</option>
          <option value="HVAC">HVAC</option>
          <option value="Security">Security</option>
          <option value="Water Hygiene">Water Hygiene</option>
          <option value="Other">Other</option>
        </select>

        <select value={condition} onChange={(event) => setCondition(event.target.value)}>
          <option value="">All conditions</option>
          <option value="Unknown">Unknown</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
          <option value="Poor">Poor</option>
          <option value="Critical">Critical</option>
        </select>

        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Service Due">Service Due</option>
          <option value="Out of Service">Out of Service</option>
          <option value="Retired">Retired</option>
        </select>

        <button className="secondary-button" type="submit">
          Search
        </button>
      </form>

      {error ? <div className="login-error">{error}</div> : null}

      <section className="table-card">
        <div className="table-header">
          <strong>Assets</strong>
          <span>{assets.length} shown</span>
        </div>

        {assets.length ? (
          <div className="customer-list">
            {assets.map((asset) => (
              <button
                className="customer-row asset-row"
                key={asset.id}
                onClick={() => {
                  if (canEditAsset) {
                    openEditForm(asset);
                  }
                }}
                disabled={!canEditAsset}
              >
                <div>
                  <strong>{asset.asset_name}</strong>
                  <span>{asset.asset_reference || asset.asset_tag || asset.serial_number || "No reference"}</span>
                </div>
                <div>
                  <span>{asset.asset_category} / {asset.asset_type}</span>
                  <span>{asset.condition} / {asset.ownership_type}</span>
                </div>
                <div>
                  <span>{asset.building_name || "No building"}</span>
                  <span>{asset.customer_name || "No customer"}</span>
                </div>
                <div>
                  <span className={`status-badge ${statusClassName(asset.status)}`}>
                    {asset.status}
                  </span>
                  <span>{asset.warranty_expiry ? `Warranty: ${formatDateForDisplay(asset.warranty_expiry)}` : asset.next_service_date ? `Next: ${formatDateForDisplay(asset.next_service_date)}` : "No date"}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            No assets yet. Add assets against a building to start the register.
          </div>
        )}
      </section>

      {formOpen ? (
        <div className="modal-backdrop">
          <form className="customer-form" onSubmit={saveAsset}>
            <div className="form-header">
              <div>
                <p className="eyebrow">{editingAsset ? "Edit Asset" : "New Asset"}</p>
                <h2>{editingAsset ? editingAsset.asset_name : "Add asset"}</h2>
              </div>

              <button className="icon-button" type="button" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <label>
                Building
                <select
                  value={form.building_id}
                  onChange={(event) => updateField("building_id", event.target.value)}
                  required
                >
                  <option value="">Select building</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.name} - {building.customer_name}
                    </option>
                  ))}
                </select>
              </label>

              <Field
                label="Asset reference"
                value={form.asset_reference}
                onChange={(value) => updateField("asset_reference", value)}
                required={Boolean(editingAsset)}
                placeholder={editingAsset ? "" : "Auto-generated if blank"}
              />
              <Field label="Asset name" value={form.asset_name} onChange={(value) => updateField("asset_name", value)} required />
              <Field label="Asset tag" value={form.asset_tag} onChange={(value) => updateField("asset_tag", value)} />

              <label>
                Category
                <select value={form.asset_category} onChange={(event) => updateField("asset_category", event.target.value)}>
                  <option>General</option>
                  <option>Compliance</option>
                  <option>Plant</option>
                  <option>Safety</option>
                  <option>Security</option>
                  <option>Fabric</option>
                  <option>IT</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                Asset type
                <select value={form.asset_type} onChange={(event) => updateField("asset_type", event.target.value)}>
                  <option>General</option>
                  <option>Fire Safety</option>
                  <option>Electrical</option>
                  <option>Mechanical</option>
                  <option>HVAC</option>
                  <option>Security</option>
                  <option>Water Hygiene</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                Status
                <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option>Active</option>
                  <option>Service Due</option>
                  <option>Out of Service</option>
                  <option>Retired</option>
                </select>
              </label>

              <label>
                Condition
                <select value={form.condition} onChange={(event) => updateField("condition", event.target.value)}>
                  <option>Unknown</option>
                  <option>Good</option>
                  <option>Fair</option>
                  <option>Poor</option>
                  <option>Critical</option>
                </select>
              </label>

              <label>
                Ownership
                <select value={form.ownership_type} onChange={(event) => updateField("ownership_type", event.target.value)}>
                  <option>Customer Owned</option>
                  <option>Company Owned</option>
                  <option>Leased</option>
                  <option>Managed Only</option>
                  <option>Unknown</option>
                </select>
              </label>

              <Field label="Manufacturer" value={form.manufacturer} onChange={(value) => updateField("manufacturer", value)} />
              <Field label="Model" value={form.model} onChange={(value) => updateField("model", value)} />
              <Field label="Serial number" value={form.serial_number} onChange={(value) => updateField("serial_number", value)} />
              <Field label="Location" value={form.location_description} onChange={(value) => updateField("location_description", value)} />
              <Field label="Install date" value={form.install_date} onChange={(value) => updateField("install_date", value)} type="date" />
              <Field label="Last service date" value={form.last_service_date} onChange={(value) => updateField("last_service_date", value)} type="date" />
              <Field label="Next service date" value={form.next_service_date} onChange={(value) => updateField("next_service_date", value)} type="date" />
              <Field label="Warranty provider" value={form.warranty_provider} onChange={(value) => updateField("warranty_provider", value)} />
              <Field label="Warranty reference" value={form.warranty_reference} onChange={(value) => updateField("warranty_reference", value)} />
              <Field label="Warranty expiry" value={form.warranty_expiry} onChange={(value) => updateField("warranty_expiry", value)} type="date" />

              <label className="wide-field">
                Notes
                <textarea
                  value={form.notes || ""}
                  onChange={(event) => updateField("notes", event.target.value)}
                  rows={3}
                  placeholder="Asset condition, known issues, warranty, compliance notes..."
                />
              </label>
            </div>

            {editingAsset ? (
              <section className="asset-files-panel">
                <div className="table-header">
                  <strong>Documents and Photos</strong>
                  <span>{assetFiles.length} files</span>
                </div>

                <div className="asset-upload-grid">
                  <label>
                    Type
                    <select value={fileKind} onChange={(event) => setFileKind(event.target.value)}>
                      <option value="document">Document</option>
                      <option value="photo">Photo</option>
                    </select>
                  </label>

                  <label>
                    File
                    <input
                      type="file"
                      accept={fileKind === "photo" ? "image/*" : undefined}
                      onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                    />
                  </label>

                  <label className="wide-field">
                    File notes
                    <textarea
                      value={fileNotes}
                      onChange={(event) => setFileNotes(event.target.value)}
                      rows={2}
                      placeholder="Certificate, inspection photo, warranty PDF..."
                    />
                  </label>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={saveAssetFile}
                    disabled={!selectedFile || fileBusy}
                  >
                    <Plus size={16} />
                    {fileBusy ? "Uploading..." : "Upload"}
                  </button>
                </div>

                {assetFiles.length ? (
                  <div className="asset-file-list">
                    {assetFiles.map((file) => (
                      <div className="asset-file-row" key={file.id}>
                        <div>
                          <strong>{file.original_filename}</strong>
                          <span>{file.file_kind} / {formatFileSize(file.file_size)}</span>
                          {file.notes ? <span>{file.notes}</span> : null}
                        </div>
                        <div className="file-actions">
                          <button className="icon-button" type="button" onClick={() => downloadFile(file)}>
                            <Download size={16} />
                          </button>
                          {canEditAsset ? (
                            <button className="icon-button danger-button" type="button" onClick={() => removeFile(file)} disabled={fileBusy}>
                              <Trash2 size={16} />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    No documents or photos uploaded for this asset yet.
                  </div>
                )}
              </section>
            ) : null}

            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={closeForm}>
                Cancel
              </button>
              <button className="primary-action" type="submit" disabled={busy}>
                <Save size={18} />
                {busy ? "Saving..." : "Save Asset"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function formatDateForInput(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
}

function formatDateForDisplay(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
}

function formatFileSize(value) {
  const size = Number(value || 0);

  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${size} bytes`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function Field({ label, value, onChange, required, type = "text", placeholder = "" }) {
  return (
    <label>
      {label}
      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
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

createRoot(document.getElementById("root")).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
