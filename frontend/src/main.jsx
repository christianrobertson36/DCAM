import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import QRCode from "qrcode";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Download,
  Users,
  LogOut,
  LockKeyhole,
  Plus,
  Search,
  Save,
  SlidersHorizontal,
  Trash2,
  X
} from "lucide-react";
import {
  createAsset,
  createAssetOption,
  createBuilding,
  createCustomer,
  createTechnicianJobSignature,
  createTechnicianJobChecklistItem,
  createStaffProfile,
  createStaffQualification,
  createScheduleAssignment,
  createWorkOrder,
  deleteAssetFile,
  deleteSampleData,
  downloadAssetFile,
  downloadTechnicianJobFile,
  getAssetSummary,
  getBuildingSummary,
  getCustomerSummary,
  getMe,
  getSampleDataStatus,
  getScheduleSummary,
  getStaffSummary,
  getTechnicianJobSummary,
  getWorkOrderSummary,
  installSampleData,
  listAssetFiles,
  listAssetHistory,
  listAssetOptions,
  listAssets,
  listBuildings,
  listCustomers,
  listScheduleAssignments,
  listStaffProfiles,
  listStaffQualifications,
  listStaffUsers,
  listTechnicianJobChecklist,
  listTechnicianJobFiles,
  listTechnicianJobSignatures,
  listTechnicianJobs,
  listWorkOrders,
  login,
  updateAsset,
  updateAssetOption,
  uploadAssetFile,
  updateBuilding,
  updateCustomer,
  updateTechnicianJobChecklistItem,
  updateScheduleAssignment,
  updateStaffProfile,
  updateTechnicianJob,
  updateWorkOrder,
  uploadTechnicianJobFile
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

const LANGUAGES = {
  en: "English",
  ro: "Romana"
};

const TRANSLATIONS = {
  ro: {
    "DCAM could not start": "DCAM nu a putut porni",
    "The browser blocked part of the application startup.": "Browserul a blocat o parte din pornirea aplicatiei.",
    "Checking DCAM session...": "Se verifica sesiunea DCAM...",
    "v22 Job Sign-Off Foundation": "v23 Setari si limba",
    "v23 Settings and Language": "v23 Setari si limba",
    "v24 Sample Data Controls": "v24 Control date exemplu",
    "Sign in to DCAM": "Autentificare in DCAM",
    "Digital Compliance & Asset Management for technical compliance operations.": "Digital Compliance & Asset Management pentru operatiuni tehnice de conformitate.",
    "Email": "Email",
    "Password": "Parola",
    "Signing in...": "Autentificare...",
    "Sign in": "Autentificare",
    "Login failed": "Autentificarea a esuat",
    "Dev admin: admin@dcam.local / ChangeMe123!": "Admin dezvoltare: admin@dcam.local / ChangeMe123!",
    "Dashboard": "Panou",
    "Customers": "Clienti",
    "Buildings": "Cladiri",
    "Assets": "Active",
    "Work Orders": "Comenzi de lucru",
    "Schedule": "Programare",
    "My Jobs": "Joburile mele",
    "People": "Personal",
    "Asset Settings": "Setari active",
    "Settings": "Setari",
    "DCAM Operating System": "Sistem operational DCAM",
    "Logout": "Iesire",
    "Technical Compliance Platform": "Platforma de conformitate tehnica",
    "Customers now have buildings/sites ready for assets, QR codes, jobs and compliance history.": "Clientii au acum cladiri/site-uri pregatite pentru active, coduri QR, joburi si istoric de conformitate.",
    "DCAM now tracks both customer companies and the physical buildings or sites where compliance work happens.": "DCAM urmareste acum atat companiile client, cat si cladirile sau site-urile fizice unde se desfasoara activitatea de conformitate.",
    "Compliance Status": "Stare conformitate",
    "Buildings Ready": "Cladiri pregatite",
    "Customers and buildings/sites are now connected.": "Clientii si cladirile/site-urile sunt acum conectate.",
    "Open Work Orders": "Comenzi deschise",
    "Work order tracking starts after assets.": "Urmarirea comenzilor incepe dupa active.",
    "Assets Registered": "Active inregistrate",
    "Asset register and QR codes are planned next.": "Registrul de active si codurile QR sunt planificate in continuare.",
    "Renewals Due": "Reinnoiri scadente",
    "Renewal automation will be added after core records.": "Automatizarea reinnoirilor va fi adaugata dupa inregistrarile principale.",
    "CRM": "CRM",
    "Companies, contacts, pipeline, quotes, contracts and renewals.": "Companii, contacte, pipeline, oferte, contracte si reinnoiri.",
    "Buildings / Sites": "Cladiri / Site-uri",
    "Customer buildings, access notes, site contacts and compliance notes.": "Cladiri client, note de acces, contacte site si note de conformitate.",
    "Asset Management": "Management active",
    "QR-coded assets with locations, photos, history and certificates.": "Active cu cod QR, locatii, fotografii, istoric si certificate.",
    "CMMS": "CMMS",
    "Preventive maintenance, reactive jobs, scheduling and work orders.": "Mentenanta preventiva, joburi reactive, programare si comenzi de lucru.",
    "Technician App": "Aplicatie tehnician",
    "Daily jobs, QR scanning, checklists, photos, signatures and offline sync.": "Joburi zilnice, scanare QR, liste de verificare, fotografii, semnaturi si sincronizare offline.",
    "Automation & AI": "Automatizare si AI",
    "Renewal reminders, report writing, quotation support and intelligent search.": "Memento-uri pentru reinnoiri, redactare rapoarte, suport oferte si cautare inteligenta.",
    "CRM Module": "Modul CRM",
    "Customer company records": "Inregistrari companii client",
    "Manage the organisations DCAM will support with compliance, assets, buildings and maintenance.": "Gestionati organizatiile pe care DCAM le sustine cu conformitate, active, cladiri si mentenanta.",
    "Add Customer": "Adauga client",
    "Total Customers": "Total clienti",
    "Prospects": "Prospecti",
    "Active": "Activ",
    "On Hold": "In asteptare",
    "Inactive": "Inactiv",
    "All statuses": "Toate starile",
    "Search": "Cauta",
    "shown": "afisate",
    "No customers yet. Add your first customer to start building the CRM.": "Nu exista clienti inca. Adaugati primul client pentru a incepe CRM-ul.",
    "Edit Customer": "Editare client",
    "New Customer": "Client nou",
    "Add customer": "Adauga client",
    "Company name": "Nume companie",
    "Trading name": "Nume comercial",
    "Customer type": "Tip client",
    "Status": "Stare",
    "Phone": "Telefon",
    "Website": "Website",
    "Address line 1": "Adresa linia 1",
    "Address line 2": "Adresa linia 2",
    "City": "Oras",
    "County": "Judet",
    "Postcode": "Cod postal",
    "Country": "Tara",
    "Primary contact name": "Nume contact principal",
    "Primary contact email": "Email contact principal",
    "Primary contact phone": "Telefon contact principal",
    "Notes": "Note",
    "Cancel": "Anuleaza",
    "Saving...": "Se salveaza...",
    "Save Customer": "Salveaza client",
    "Buildings and Sites": "Cladiri si site-uri",
    "Customer buildings and site records": "Inregistrari cladiri si site-uri client",
    "Manage sites, access notes, contacts and compliance notes for each customer.": "Gestionati site-uri, note de acces, contacte si note de conformitate pentru fiecare client.",
    "Add Building": "Adauga cladire",
    "Total Buildings": "Total cladiri",
    "No buildings yet. Add your first building or site to continue.": "Nu exista cladiri inca. Adaugati prima cladire sau primul site pentru a continua.",
    "Edit Building": "Editare cladire",
    "New Building": "Cladire noua",
    "Add building": "Adauga cladire",
    "Building name": "Nume cladire",
    "Building type": "Tip cladire",
    "Access notes": "Note acces",
    "Compliance notes": "Note conformitate",
    "Site contact name": "Nume contact site",
    "Site contact email": "Email contact site",
    "Site contact phone": "Telefon contact site",
    "Save Building": "Salveaza cladire",
    "Asset Register": "Registru active",
    "Assets, QR codes and lifecycle records": "Active, coduri QR si inregistrari ciclu de viata",
    "Track customer assets by building, category, condition, status, service dates and history.": "Urmariti activele clientilor dupa cladire, categorie, conditie, stare, date service si istoric.",
    "Add Asset": "Adauga activ",
    "Total Assets": "Total active",
    "Service Due": "Service scadent",
    "Out of Service": "Scos din uz",
    "Retired": "Retras",
    "All categories": "Toate categoriile",
    "All types": "Toate tipurile",
    "All conditions": "Toate conditiile",
    "All customers": "Toti clientii",
    "All buildings": "Toate cladirile",
    "No assets yet. Add the first asset to begin the register.": "Nu exista active inca. Adaugati primul activ pentru a incepe registrul.",
    "Edit Asset": "Editare activ",
    "New Asset": "Activ nou",
    "Add asset": "Adauga activ",
    "Asset reference": "Referinta activ",
    "Asset name": "Nume activ",
    "Asset tag": "Eticheta activ",
    "Category": "Categorie",
    "Type": "Tip",
    "Condition": "Conditie",
    "Ownership": "Proprietate",
    "Manufacturer": "Producator",
    "Model": "Model",
    "Serial number": "Numar serie",
    "Location description": "Descriere locatie",
    "Install date": "Data instalarii",
    "Last service date": "Ultimul service",
    "Next service date": "Urmatorul service",
    "Warranty provider": "Furnizor garantie",
    "Warranty reference": "Referinta garantie",
    "Warranty expiry": "Expirare garantie",
    "Save Asset": "Salveaza activ",
    "Asset QR Code": "Cod QR activ",
    "Download QR": "Descarca QR",
    "Asset History": "Istoric activ",
    "Asset Files": "Fisiere activ",
    "Upload": "Incarca",
    "Download": "Descarca",
    "No files uploaded yet.": "Nu exista fisiere incarcate.",
    "No asset history yet.": "Nu exista istoric pentru activ.",
    "CMMS Foundation": "Fundatie CMMS",
    "Reactive and planned work orders": "Comenzi reactive si planificate",
    "Track work by customer, building, asset, priority, status and due date.": "Urmariti lucrarile dupa client, cladire, activ, prioritate, stare si data scadenta.",
    "Add Work Order": "Adauga comanda",
    "Total": "Total",
    "Open": "Deschis",
    "In Progress": "In lucru",
    "Completed": "Finalizat",
    "Overdue": "Intarziat",
    "All priorities": "Toate prioritatile",
    "No work orders yet.": "Nu exista comenzi de lucru.",
    "Edit Work Order": "Editare comanda",
    "New Work Order": "Comanda noua",
    "Add work order": "Adauga comanda",
    "Reference": "Referinta",
    "Title": "Titlu",
    "Priority": "Prioritate",
    "Due date": "Data scadenta",
    "Customer": "Client",
    "Building": "Cladire",
    "Asset": "Activ",
    "Assigned user ID": "ID utilizator alocat",
    "Description": "Descriere",
    "Completion notes": "Note finalizare",
    "Save Work Order": "Salveaza comanda",
    "Scheduling Foundation": "Fundatie programare",
    "Job allocation calendar": "Calendar alocare joburi",
    "Schedule work orders to engineers, technicians and subcontractors.": "Programati comenzile catre ingineri, tehnicieni si subcontractori.",
    "Add Assignment": "Adauga alocare",
    "Today": "Azi",
    "Scheduled": "Programat",
    "From": "De la",
    "To": "Pana la",
    "Schedule Assignments": "Alocari programare",
    "No scheduled assignments yet.": "Nu exista alocari programate.",
    "Edit Assignment": "Editare alocare",
    "New Assignment": "Alocare noua",
    "Add schedule assignment": "Adauga alocare programare",
    "Work order": "Comanda de lucru",
    "Assigned user": "Utilizator alocat",
    "Schedule date": "Data programarii",
    "Start time": "Ora inceput",
    "End time": "Ora final",
    "Save Assignment": "Salveaza alocare",
    "Technician App Foundation": "Fundatie aplicatie tehnician",
    "Assigned jobs": "Joburi alocate",
    "View allocated work and update job status from the assigned-user job queue.": "Vizualizati lucrarile alocate si actualizati starea jobului din coada utilizatorului alocat.",
    "Assigned": "Alocat",
    "No assigned jobs yet.": "Nu exista joburi alocate.",
    "Update Job": "Actualizeaza job",
    "Job Checklist": "Lista verificare job",
    "New item": "Element nou",
    "Add": "Adauga",
    "No checklist items yet.": "Nu exista elemente in lista.",
    "Job Evidence": "Dovezi job",
    "Kind": "Tip",
    "File": "Fisier",
    "Photo": "Fotografie",
    "Document": "Document",
    "No evidence uploaded yet.": "Nu exista dovezi incarcate.",
    "Job Sign-Off": "Semnare job",
    "Signer name": "Nume semnatar",
    "Signer role": "Rol semnatar",
    "Signature": "Semnatura",
    "Add Sign-Off": "Adauga semnare",
    "No sign-off captured yet.": "Nu exista semnare capturata.",
    "Save Job": "Salveaza job",
    "Technician and Engineer Management": "Management tehnicieni si ingineri",
    "Profiles, skills and qualifications": "Profiluri, competente si calificari",
    "Track competencies, service areas, availability and expiring qualifications.": "Urmariti competentele, zonele de service, disponibilitatea si calificarile care expira.",
    "Add Profile": "Adauga profil",
    "Engineers": "Ingineri",
    "Technicians": "Tehnicieni",
    "Available": "Disponibil",
    "Unavailable": "Indisponibil",
    "All roles": "Toate rolurile",
    "No profiles yet.": "Nu exista profiluri.",
    "Edit Profile": "Editare profil",
    "New Profile": "Profil nou",
    "Job title": "Functie",
    "Employment type": "Tip angajare",
    "Skills": "Competente",
    "Service areas": "Zone service",
    "Working hours": "Program de lucru",
    "Availability": "Disponibilitate",
    "Competency notes": "Note competente",
    "Save Profile": "Salveaza profil",
    "Qualifications": "Calificari",
    "Qualification": "Calificare",
    "Issuing body": "Emitent",
    "Certificate number": "Numar certificat",
    "Issue date": "Data emiterii",
    "Expiry date": "Data expirarii",
    "Add Qualification": "Adauga calificare",
    "Asset Administration": "Administrare active",
    "Asset categories, types, statuses and conditions": "Categorii, tipuri, stari si conditii active",
    "Manage the option lists used by the Asset Register.": "Gestionati listele de optiuni folosite de Registrul de active.",
    "Categories": "Categorii",
    "Types": "Tipuri",
    "Statuses": "Stari",
    "Conditions": "Conditii",
    "New option": "Optiune noua",
    "Sort order": "Ordine sortare",
    "Add Option": "Adauga optiune",
    "Application Settings": "Setari aplicatie",
    "Language and local display preferences": "Limba si preferinte locale de afisare",
    "Choose the language used for menus, pages, buttons and forms.": "Alegeti limba folosita pentru meniuri, pagini, butoane si formulare.",
    "Language": "Limba",
    "English": "Engleza",
    "Romanian": "Romana",
    "Save Settings": "Salveaza setarile",
    "Settings saved on this device.": "Setarile au fost salvate pe acest dispozitiv.",
    "Sample Data": "Date exemplu",
    "Install demo records across customers, buildings, assets, work orders, schedule, people and technician jobs.": "Instalati inregistrari demo pentru clienti, cladiri, active, comenzi de lucru, programare, personal si joburi tehnicieni.",
    "Installed": "Instalat",
    "Not installed": "Neinstalat",
    "Checklists": "Liste verificare",
    "Sign-Offs": "Semnari",
    "Working...": "Se lucreaza...",
    "Install Sample Data": "Instaleaza date exemplu",
    "I understand this deletes only installed sample data.": "Inteleg ca se sterg doar datele exemplu instalate.",
    "Delete Sample Data": "Sterge datele exemplu"
  }
};

function translateText(value, language) {
  if (language === "en") {
    const reverse = Object.entries(TRANSLATIONS.ro).find((entry) => entry[1] === value);
    return reverse ? reverse[0] : value;
  }

  return TRANSLATIONS[language]?.[value] || value;
}

function translateDocument(language) {
  const translateNodeText = (node) => {
    const value = node.nodeValue;
    const trimmed = value.trim();

    if (!trimmed) {
      return;
    }

    const translated = translateText(trimmed, language);

    if (translated !== trimmed) {
      node.nodeValue = value.replace(trimmed, translated);
    }
  };

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];

  while (walker.nextNode()) {
    const parentName = walker.currentNode.parentElement?.tagName;

    if (parentName !== "OPTION" && parentName !== "SCRIPT" && parentName !== "STYLE") {
      nodes.push(walker.currentNode);
    }
  }

  nodes.forEach(translateNodeText);

  document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach((element) => {
    const placeholder = element.getAttribute("placeholder");
    element.setAttribute("placeholder", translateText(placeholder, language));
  });
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
  ASSETS_EDIT: "assets:edit",
  ASSETS_ADMIN: "assets:admin",
  WORK_ORDERS_VIEW: "work_orders:view",
  WORK_ORDERS_CREATE: "work_orders:create",
  WORK_ORDERS_EDIT: "work_orders:edit",
  WORK_ORDERS_ASSIGN: "work_orders:assign",
  STAFF_VIEW: "staff:view",
  STAFF_EDIT: "staff:edit",
  STAFF_ADMIN: "staff:admin",
  SCHEDULE_VIEW: "schedule:view",
  SCHEDULE_CREATE: "schedule:create",
  SCHEDULE_EDIT: "schedule:edit",
  TECHNICIAN_JOBS_VIEW: "technician_jobs:view",
  TECHNICIAN_JOBS_UPDATE: "technician_jobs:update",
  TECHNICIAN_JOBS_MANAGE: "technician_jobs:manage",
  SETTINGS_ADMIN: "settings:admin"
};

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW },
  { label: "Customers", icon: Users, permission: PERMISSIONS.CUSTOMERS_VIEW },
  { label: "Buildings", icon: Building2, permission: PERMISSIONS.BUILDINGS_VIEW },
  { label: "Assets", icon: Building2, permission: PERMISSIONS.ASSETS_VIEW },
  { label: "Work Orders", icon: Save, permission: PERMISSIONS.WORK_ORDERS_VIEW },
  { label: "Schedule", icon: CalendarDays, permission: PERMISSIONS.SCHEDULE_VIEW },
  { label: "My Jobs", icon: ClipboardCheck, permission: PERMISSIONS.TECHNICIAN_JOBS_VIEW },
  { label: "People", icon: Users, permission: PERMISSIONS.STAFF_VIEW },
  { label: "Asset Settings", icon: SlidersHorizontal, permission: PERMISSIONS.ASSETS_ADMIN },
  { label: "Settings", icon: SlidersHorizontal, permission: PERMISSIONS.DASHBOARD_VIEW }
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

const fallbackAssetOptions = {
  category: ["General", "Compliance", "Plant", "Safety", "Security", "Fabric", "IT", "Other"],
  type: ["General", "Fire Safety", "Electrical", "Mechanical", "HVAC", "Security", "Water Hygiene", "Other"],
  status: ["Active", "Service Due", "Out of Service", "Retired"],
  condition: ["Unknown", "Good", "Fair", "Poor", "Critical"],
  ownership: ["Customer Owned", "Company Owned", "Leased", "Managed Only", "Unknown"]
};

const assetOptionTypes = [
  { value: "category", label: "Categories" },
  { value: "type", label: "Types" },
  { value: "status", label: "Statuses" },
  { value: "condition", label: "Conditions" },
  { value: "ownership", label: "Ownership" }
];

const emptyWorkOrder = {
  work_order_reference: "",
  work_order_type: "Reactive",
  title: "",
  description: "",
  priority: "Normal",
  status: "Open",
  customer_id: "",
  building_id: "",
  asset_id: "",
  assigned_user_id: "",
  due_date: "",
  completion_notes: ""
};

const emptyScheduleAssignment = {
  work_order_id: "",
  assigned_user_id: "",
  schedule_date: "",
  start_time: "",
  end_time: "",
  status: "Scheduled",
  notes: ""
};

const emptyStaffProfile = {
  user_id: "",
  job_title: "",
  employment_type: "Employee",
  phone: "",
  skills: "",
  service_areas: "",
  working_hours: "",
  availability_status: "Available",
  competency_notes: ""
};

const emptyQualification = {
  qualification_name: "",
  issuing_body: "",
  certificate_number: "",
  issue_date: "",
  expiry_date: "",
  status: "Valid",
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
  const [language, setLanguage] = useState(() => safeGetStorageItem("dcam_language") || "en");

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

  useEffect(() => {
    safeSetStorageItem("dcam_language", language);
    document.documentElement.lang = language;
    translateDocument(language);

    const observer = new MutationObserver(() => {
      translateDocument(language);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [language]);

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
    return <LoginScreen language={language} onLanguageChange={setLanguage} onLoginSuccess={handleLoginSuccess} />;
  }

  return <AdminShell language={language} onLanguageChange={setLanguage} user={user} onLogout={handleLogout} />;
}

function LoginScreen({ language, onLanguageChange, onLoginSuccess }) {
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

        <p className="eyebrow">v24 Sample Data Controls</p>
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

        <label>
          Language
          <select value={language} onChange={(event) => onLanguageChange(event.target.value)}>
            <option value="en">English</option>
            <option value="ro">Romanian</option>
          </select>
        </label>
      </form>
    </div>
  );
}

function AdminShell({ language, onLanguageChange, user, onLogout }) {
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

  const pageTitle = activePage === "Customers" || activePage === "Buildings" || activePage === "Assets" || activePage === "Work Orders" || activePage === "Schedule" || activePage === "My Jobs" || activePage === "People" || activePage === "Asset Settings" || activePage === "Settings"
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
            <p className="eyebrow">v24 Sample Data Controls</p>
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
        {activePage === "Work Orders" ? <WorkOrdersPage user={user} /> : null}
        {activePage === "Schedule" ? <SchedulePage user={user} /> : null}
        {activePage === "My Jobs" ? <TechnicianJobsPage user={user} /> : null}
        {activePage === "People" ? <PeoplePage user={user} /> : null}
        {activePage === "Asset Settings" ? <AssetSettingsPage /> : null}
        {activePage === "Settings" ? (
          <SettingsPage
            language={language}
            onLanguageChange={onLanguageChange}
            user={user}
          />
        ) : null}
        {activePage !== "Customers" && activePage !== "Buildings" && activePage !== "Assets" && activePage !== "Work Orders" && activePage !== "Schedule" && activePage !== "My Jobs" && activePage !== "People" && activePage !== "Asset Settings" && activePage !== "Settings" ? <DashboardPage /> : null}
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
  const [assetHistory, setAssetHistory] = useState([]);
  const [assetOptions, setAssetOptions] = useState(fallbackAssetOptions);
  const [qrDataUrl, setQrDataUrl] = useState("");
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
    const optionsRequest = listAssetOptions().catch(() => ({ grouped: {} }));

    const [summaryData, assetsData, customersData, buildingsData, optionsData] = await Promise.all([
      summaryRequest,
      assetsRequest,
      customersRequest,
      buildingsRequest,
      optionsRequest
    ]);

    setSummary(summaryData.summary);
    setAssets(assetsData.assets);
    setCustomers(customersData.customers);
    setBuildings(buildingsData.buildings);
    setAssetOptions(mergeAssetOptions(optionsData.grouped || {}));
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
    setAssetHistory([]);
    setQrDataUrl("");
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
    setAssetHistory([]);
    setQrDataUrl("");
    setSelectedFile(null);
    setFileNotes("");
    setFileKind("document");
    setFormOpen(true);
    setError("");
    loadAssetFiles(asset.id).catch((err) => setError(err.message));
    loadAssetHistory(asset.id).catch((err) => setError(err.message));
    generateQr(asset).catch((err) => setError(err.message));
  }

  function closeForm() {
    setFormOpen(false);
    setEditingAsset(null);
    setForm(emptyAsset);
    setAssetFiles([]);
    setAssetHistory([]);
    setQrDataUrl("");
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

  async function loadAssetHistory(assetId) {
    const data = await listAssetHistory(assetId);
    setAssetHistory(data.history || []);
  }

  async function generateQr(asset) {
    if (!asset.qr_token) {
      setQrDataUrl("");
      return;
    }

    const url = `${window.location.origin}/asset-scan/${asset.qr_token}`;
    const dataUrl = await QRCode.toDataURL(url, {
      margin: 1,
      width: 220
    });
    setQrDataUrl(dataUrl);
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
      await loadAssetHistory(editingAsset.id);
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
      await loadAssetHistory(editingAsset.id);
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
          {assetOptions.category.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        <select value={assetType} onChange={(event) => setAssetType(event.target.value)}>
          <option value="">All types</option>
          {assetOptions.type.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        <select value={condition} onChange={(event) => setCondition(event.target.value)}>
          <option value="">All conditions</option>
          {assetOptions.condition.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {assetOptions.status.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
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
                  {assetOptions.category.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label>
                Asset type
                <select value={form.asset_type} onChange={(event) => updateField("asset_type", event.target.value)}>
                  {assetOptions.type.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label>
                Status
                <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  {assetOptions.status.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label>
                Condition
                <select value={form.condition} onChange={(event) => updateField("condition", event.target.value)}>
                  {assetOptions.condition.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label>
                Ownership
                <select value={form.ownership_type} onChange={(event) => updateField("ownership_type", event.target.value)}>
                  {assetOptions.ownership.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
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
              <section className="asset-qr-panel">
                <div>
                  <p className="eyebrow">Asset QR</p>
                  <h3>{editingAsset.asset_reference}</h3>
                  <span>{editingAsset.qr_token || "QR token pending"}</span>
                </div>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt={`QR code for ${editingAsset.asset_reference}`} />
                ) : null}
              </section>
            ) : null}

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

            {editingAsset ? (
              <section className="asset-history-panel">
                <div className="table-header">
                  <strong>Asset Timeline</strong>
                  <span>{assetHistory.length} events</span>
                </div>

                {assetHistory.length ? (
                  <div className="asset-history-list">
                    {assetHistory.map((event) => (
                      <div className="asset-history-row" key={event.id}>
                        <div>
                          <strong>{event.event_title}</strong>
                          <span>{event.actor_name || "System"} / {formatDateForDisplay(event.created_at)}</span>
                        </div>
                        <span>{event.event_type}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    No asset history has been recorded yet.
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

function PeoplePage({ user }) {
  const [profiles, setProfiles] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    engineers: 0,
    technicians: 0,
    available: 0,
    unavailable: 0
  });
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [availability, setAvailability] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [form, setForm] = useState(emptyStaffProfile);
  const [qualificationForm, setQualificationForm] = useState(emptyQualification);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canEdit = hasPermission(user, PERMISSIONS.STAFF_EDIT);

  async function loadPeople() {
    const [summaryData, profilesData, usersData] = await Promise.all([
      getStaffSummary(),
      listStaffProfiles({ search, role, availability_status: availability }),
      listStaffUsers()
    ]);

    setSummary(summaryData.summary);
    setProfiles(profilesData.staff_profiles || []);
    setStaffUsers(usersData.users || []);
  }

  useEffect(() => {
    loadPeople().catch((err) => setError(err.message));
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    setError("");

    try {
      await loadPeople();
    } catch (err) {
      setError(err.message);
    }
  }

  function openCreateForm() {
    setEditingProfile(null);
    setForm(emptyStaffProfile);
    setQualifications([]);
    setQualificationForm(emptyQualification);
    setFormOpen(true);
    setError("");
  }

  async function openEditForm(profile) {
    setEditingProfile(profile);
    setForm({
      ...emptyStaffProfile,
      ...profile,
      user_id: profile.user_id || ""
    });
    setQualificationForm(emptyQualification);
    setFormOpen(true);
    setError("");

    try {
      const data = await listStaffQualifications(profile.id);
      setQualifications(data.qualifications || []);
    } catch (err) {
      setError(err.message);
    }
  }

  function closeForm() {
    setFormOpen(false);
    setEditingProfile(null);
    setForm(emptyStaffProfile);
    setQualifications([]);
    setQualificationForm(emptyQualification);
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateQualificationField(field, value) {
    setQualificationForm((current) => ({ ...current, [field]: value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload = {
        ...form,
        user_id: Number(form.user_id)
      };

      if (editingProfile) {
        await updateStaffProfile(editingProfile.id, payload);
      } else {
        await createStaffProfile(payload);
      }

      closeForm();
      await loadPeople();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveQualification(event) {
    event.preventDefault();

    if (!editingProfile) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await createStaffQualification(editingProfile.id, qualificationForm);
      setQualificationForm(emptyQualification);
      const data = await listStaffQualifications(editingProfile.id);
      setQualifications(data.qualifications || []);
      await loadPeople();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const summaryCards = [
    { label: "Total", value: summary.total || 0 },
    { label: "Engineers", value: summary.engineers || 0 },
    { label: "Technicians", value: summary.technicians || 0 },
    { label: "Available", value: summary.available || 0 },
    { label: "Unavailable", value: summary.unavailable || 0 }
  ];

  return (
    <div className="people-page">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Technician and Engineer Management</p>
          <h2>Profiles, skills and qualifications</h2>
          <p>Track competencies, service areas, availability and expiring qualifications.</p>
        </div>

        {canEdit ? (
          <button className="primary-action" onClick={openCreateForm}>
            <Plus size={18} />
            Add Profile
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

      <form className="filter-bar people-filter" onSubmit={handleSearch}>
        <div className="search-box">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search names, skills or service areas..." />
        </div>

        <select value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="">All roles</option>
          <option>Engineer</option>
          <option>Technician</option>
          <option>Subcontractor</option>
        </select>

        <select value={availability} onChange={(event) => setAvailability(event.target.value)}>
          <option value="">All availability</option>
          <option>Available</option>
          <option>Unavailable</option>
          <option>On Leave</option>
          <option>Training</option>
        </select>

        <button className="secondary-button" type="submit">Search</button>
      </form>

      {error ? <div className="login-error">{error}</div> : null}

      <section className="table-card">
        <div className="table-header">
          <strong>People</strong>
          <span>{profiles.length} shown</span>
        </div>

        {profiles.length ? (
          <div className="customer-list">
            {profiles.map((profile) => (
              <button
                className="customer-row people-row"
                disabled={!canEdit}
                key={profile.id}
                onClick={() => {
                  if (canEdit) {
                    openEditForm(profile);
                  }
                }}
              >
                <div>
                  <strong>{profile.user_name}</strong>
                  <span>{profile.role} / {profile.job_title || "No job title"}</span>
                </div>
                <div>
                  <span>{profile.availability_status}</span>
                  <span>{profile.service_areas || "No service areas"}</span>
                </div>
                <div>
                  <span>{profile.skills || "No skills recorded"}</span>
                  <span>{profile.phone || profile.email}</span>
                </div>
                <div>
                  <span className={`status-badge ${profile.expiring_qualifications ? "service-due" : "active"}`}>
                    {profile.expiring_qualifications || 0} expiring
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">No staff profiles yet.</div>
        )}
      </section>

      {formOpen ? (
        <div className="modal-backdrop">
          <form className="customer-form" onSubmit={saveProfile}>
            <div className="form-header">
              <div>
                <p className="eyebrow">{editingProfile ? "Edit Profile" : "New Profile"}</p>
                <h2>{editingProfile ? editingProfile.user_name : "Add profile"}</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <label>
                User
                <select value={form.user_id} onChange={(event) => updateField("user_id", event.target.value)} required disabled={Boolean(editingProfile)}>
                  <option value="">Select user</option>
                  {staffUsers.map((staffUser) => (
                    <option key={staffUser.id} value={staffUser.id}>{staffUser.name} - {staffUser.role}</option>
                  ))}
                </select>
              </label>

              <Field label="Job title" value={form.job_title} onChange={(value) => updateField("job_title", value)} />

              <label>
                Employment type
                <select value={form.employment_type} onChange={(event) => updateField("employment_type", event.target.value)}>
                  <option>Employee</option>
                  <option>Contractor</option>
                  <option>Subcontractor</option>
                  <option>Temporary</option>
                </select>
              </label>

              <label>
                Availability
                <select value={form.availability_status} onChange={(event) => updateField("availability_status", event.target.value)}>
                  <option>Available</option>
                  <option>Unavailable</option>
                  <option>On Leave</option>
                  <option>Training</option>
                </select>
              </label>

              <Field label="Phone" value={form.phone} onChange={(value) => updateField("phone", value)} />
              <Field label="Working hours" value={form.working_hours} onChange={(value) => updateField("working_hours", value)} />
              <Field label="Service areas" value={form.service_areas} onChange={(value) => updateField("service_areas", value)} />
              <Field label="Skills" value={form.skills} onChange={(value) => updateField("skills", value)} />

              <label className="wide-field">
                Competency notes
                <textarea value={form.competency_notes || ""} onChange={(event) => updateField("competency_notes", event.target.value)} rows={3} />
              </label>
            </div>

            {editingProfile ? (
              <section className="asset-history-panel">
                <div className="table-header">
                  <strong>Qualifications</strong>
                  <span>{qualifications.length} records</span>
                </div>

                <div className="qualification-list">
                  {qualifications.map((qualification) => (
                    <div className="asset-history-row" key={qualification.id}>
                      <div>
                        <strong>{qualification.qualification_name}</strong>
                        <span>{qualification.issuing_body || "No issuing body"} / {qualification.status}</span>
                      </div>
                      <span>{qualification.expiry_date ? `Expires ${formatDateForDisplay(qualification.expiry_date)}` : "No expiry"}</span>
                    </div>
                  ))}
                </div>

                <div className="form-grid qualification-form">
                  <Field label="Qualification" value={qualificationForm.qualification_name} onChange={(value) => updateQualificationField("qualification_name", value)} required />
                  <Field label="Issuing body" value={qualificationForm.issuing_body} onChange={(value) => updateQualificationField("issuing_body", value)} />
                  <Field label="Certificate number" value={qualificationForm.certificate_number} onChange={(value) => updateQualificationField("certificate_number", value)} />
                  <Field label="Issue date" value={qualificationForm.issue_date} onChange={(value) => updateQualificationField("issue_date", value)} type="date" />
                  <Field label="Expiry date" value={qualificationForm.expiry_date} onChange={(value) => updateQualificationField("expiry_date", value)} type="date" />
                  <label>
                    Status
                    <select value={qualificationForm.status} onChange={(event) => updateQualificationField("status", event.target.value)}>
                      <option>Valid</option>
                      <option>Expiring Soon</option>
                      <option>Expired</option>
                      <option>Suspended</option>
                    </select>
                  </label>
                  <button className="secondary-button" type="button" onClick={saveQualification} disabled={busy || !qualificationForm.qualification_name}>
                    <Plus size={16} />
                    Add Qualification
                  </button>
                </div>
              </section>
            ) : null}

            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={closeForm}>Cancel</button>
              <button className="primary-action" type="submit" disabled={busy}>
                <Save size={18} />
                {busy ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function WorkOrdersPage({ user }) {
  const [workOrders, setWorkOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [assets, setAssets] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    on_hold: 0,
    completed: 0,
    overdue: 0
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState(null);
  const [form, setForm] = useState(emptyWorkOrder);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canCreate = hasPermission(user, PERMISSIONS.WORK_ORDERS_CREATE);
  const canEdit = hasPermission(user, PERMISSIONS.WORK_ORDERS_EDIT);
  const canAssign = hasPermission(user, PERMISSIONS.WORK_ORDERS_ASSIGN);
  const canViewCustomers = hasPermission(user, PERMISSIONS.CUSTOMERS_VIEW);
  const canViewBuildings = hasPermission(user, PERMISSIONS.BUILDINGS_VIEW);
  const canViewAssets = hasPermission(user, PERMISSIONS.ASSETS_VIEW);

  async function loadWorkOrders() {
    const [summaryData, ordersData, customersData, buildingsData, assetsData] = await Promise.all([
      getWorkOrderSummary(),
      listWorkOrders({ search, status, priority }),
      canViewCustomers ? listCustomers() : Promise.resolve({ customers: [] }),
      canViewBuildings ? listBuildings() : Promise.resolve({ buildings: [] }),
      canViewAssets ? listAssets() : Promise.resolve({ assets: [] })
    ]);

    setSummary(summaryData.summary);
    setWorkOrders(ordersData.work_orders || []);
    setCustomers(customersData.customers || []);
    setBuildings(buildingsData.buildings || []);
    setAssets(assetsData.assets || []);
  }

  useEffect(() => {
    loadWorkOrders().catch((err) => setError(err.message));
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    setError("");

    try {
      await loadWorkOrders();
    } catch (err) {
      setError(err.message);
    }
  }

  function openCreateForm() {
    setEditingWorkOrder(null);
    setForm(emptyWorkOrder);
    setFormOpen(true);
    setError("");
  }

  function openEditForm(workOrder) {
    setEditingWorkOrder(workOrder);
    setForm({
      ...emptyWorkOrder,
      ...workOrder,
      customer_id: workOrder.customer_id || "",
      building_id: workOrder.building_id || "",
      asset_id: workOrder.asset_id || "",
      assigned_user_id: workOrder.assigned_user_id || "",
      due_date: formatDateForInput(workOrder.due_date)
    });
    setFormOpen(true);
    setError("");
  }

  function closeForm() {
    setFormOpen(false);
    setEditingWorkOrder(null);
    setForm(emptyWorkOrder);
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveWorkOrder(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload = {
        ...form,
        customer_id: form.customer_id ? Number(form.customer_id) : null,
        building_id: form.building_id ? Number(form.building_id) : null,
        asset_id: form.asset_id ? Number(form.asset_id) : null,
        assigned_user_id: canAssign
          ? form.assigned_user_id ? Number(form.assigned_user_id) : null
          : editingWorkOrder?.assigned_user_id || null
      };

      if (editingWorkOrder) {
        await updateWorkOrder(editingWorkOrder.id, payload);
      } else {
        await createWorkOrder(payload);
      }

      closeForm();
      await loadWorkOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const summaryCards = [
    { label: "Total", value: summary.total || 0 },
    { label: "Open", value: summary.open || 0 },
    { label: "In Progress", value: summary.in_progress || 0 },
    { label: "On Hold", value: summary.on_hold || 0 },
    { label: "Completed", value: summary.completed || 0 },
    { label: "Overdue", value: summary.overdue || 0 }
  ];

  return (
    <div className="work-orders-page">
      <section className="page-intro">
        <div>
          <p className="eyebrow">CMMS Foundation</p>
          <h2>Reactive and planned work orders</h2>
          <p>Track work by customer, building, asset, priority, status and due date.</p>
        </div>

        {canCreate ? (
          <button className="primary-action" onClick={openCreateForm}>
            <Plus size={18} />
            Add Work Order
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

      <form className="filter-bar work-orders-filter" onSubmit={handleSearch}>
        <div className="search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search work orders, customers, buildings or assets..."
          />
        </div>

        <select value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option value="">All priorities</option>
          <option>Low</option>
          <option>Normal</option>
          <option>High</option>
          <option>Urgent</option>
        </select>

        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>On Hold</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </select>

        <button className="secondary-button" type="submit">Search</button>
      </form>

      {error ? <div className="login-error">{error}</div> : null}

      <section className="table-card">
        <div className="table-header">
          <strong>Work Orders</strong>
          <span>{workOrders.length} shown</span>
        </div>

        {workOrders.length ? (
          <div className="customer-list">
            {workOrders.map((workOrder) => (
              <button
                className="customer-row work-order-row"
                disabled={!canEdit}
                key={workOrder.id}
                onClick={() => {
                  if (canEdit) {
                    openEditForm(workOrder);
                  }
                }}
              >
                <div>
                  <strong>{workOrder.title}</strong>
                  <span>{workOrder.work_order_reference}</span>
                </div>
                <div>
                  <span>{workOrder.priority} / {workOrder.work_order_type}</span>
                  <span>{workOrder.asset_reference || workOrder.asset_name || "No asset"}</span>
                </div>
                <div>
                  <span>{workOrder.customer_name || "No customer"}</span>
                  <span>{workOrder.building_name || "No building"}</span>
                </div>
                <div>
                  <span className={`status-badge ${statusClassName(workOrder.status)}`}>{workOrder.status}</span>
                  <span>{workOrder.due_date ? `Due: ${formatDateForDisplay(workOrder.due_date)}` : "No due date"}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">No work orders yet.</div>
        )}
      </section>

      {formOpen ? (
        <div className="modal-backdrop">
          <form className="customer-form" onSubmit={saveWorkOrder}>
            <div className="form-header">
              <div>
                <p className="eyebrow">{editingWorkOrder ? "Edit Work Order" : "New Work Order"}</p>
                <h2>{editingWorkOrder ? editingWorkOrder.work_order_reference : "Add work order"}</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <Field label="Reference" value={form.work_order_reference} onChange={(value) => updateField("work_order_reference", value)} placeholder={editingWorkOrder ? "" : "Auto-generated if blank"} />
              <Field label="Title" value={form.title} onChange={(value) => updateField("title", value)} required />

              <label>
                Type
                <select value={form.work_order_type} onChange={(event) => updateField("work_order_type", event.target.value)}>
                  <option>Reactive</option>
                  <option>Planned</option>
                  <option>Inspection</option>
                  <option>Repair</option>
                </select>
              </label>

              <label>
                Priority
                <select value={form.priority} onChange={(event) => updateField("priority", event.target.value)}>
                  <option>Low</option>
                  <option>Normal</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </label>

              <label>
                Status
                <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>On Hold</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </label>

              <Field label="Due date" value={form.due_date} onChange={(value) => updateField("due_date", value)} type="date" />

              <label>
                Customer
                <select value={form.customer_id} onChange={(event) => updateField("customer_id", event.target.value)}>
                  <option value="">No customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.company_name}</option>
                  ))}
                </select>
              </label>

              <label>
                Building
                <select value={form.building_id} onChange={(event) => updateField("building_id", event.target.value)}>
                  <option value="">No building</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>{building.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Asset
                <select value={form.asset_id} onChange={(event) => updateField("asset_id", event.target.value)}>
                  <option value="">No asset</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>{asset.asset_reference} - {asset.asset_name}</option>
                  ))}
                </select>
              </label>

              {canAssign ? (
                <Field label="Assigned user ID" value={form.assigned_user_id} onChange={(value) => updateField("assigned_user_id", value)} type="number" />
              ) : null}

              <label className="wide-field">
                Description
                <textarea value={form.description || ""} onChange={(event) => updateField("description", event.target.value)} rows={3} />
              </label>

              <label className="wide-field">
                Completion notes
                <textarea value={form.completion_notes || ""} onChange={(event) => updateField("completion_notes", event.target.value)} rows={3} />
              </label>
            </div>

            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={closeForm}>Cancel</button>
              <button className="primary-action" type="submit" disabled={busy}>
                <Save size={18} />
                {busy ? "Saving..." : "Save Work Order"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function SchedulePage({ user }) {
  const [assignments, setAssignments] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    today: 0,
    overdue: 0,
    scheduled: 0,
    completed: 0
  });
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [form, setForm] = useState(emptyScheduleAssignment);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canCreate = hasPermission(user, PERMISSIONS.SCHEDULE_CREATE);
  const canEdit = hasPermission(user, PERMISSIONS.SCHEDULE_EDIT);

  async function loadSchedule() {
    const [summaryData, assignmentsData, workOrdersData, staffData] = await Promise.all([
      getScheduleSummary(),
      listScheduleAssignments({
        date_from: dateFrom,
        date_to: dateTo,
        assigned_user_id: assignedUserId,
        status
      }),
      listWorkOrders(),
      listStaffUsers()
    ]);

    setSummary(summaryData.summary || {});
    setAssignments(assignmentsData.assignments || []);
    setWorkOrders(workOrdersData.work_orders || []);
    setStaffUsers(staffData.users || []);
  }

  useEffect(() => {
    loadSchedule().catch((err) => setError(err.message));
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    setError("");

    try {
      await loadSchedule();
    } catch (err) {
      setError(err.message);
    }
  }

  function openCreateForm() {
    setEditingAssignment(null);
    setForm(emptyScheduleAssignment);
    setFormOpen(true);
    setError("");
  }

  function openEditForm(assignment) {
    setEditingAssignment(assignment);
    setForm({
      ...emptyScheduleAssignment,
      ...assignment,
      work_order_id: assignment.work_order_id || "",
      assigned_user_id: assignment.assigned_user_id || "",
      schedule_date: formatDateForInput(assignment.schedule_date),
      start_time: assignment.start_time ? String(assignment.start_time).slice(0, 5) : "",
      end_time: assignment.end_time ? String(assignment.end_time).slice(0, 5) : ""
    });
    setFormOpen(true);
    setError("");
  }

  function closeForm() {
    setFormOpen(false);
    setEditingAssignment(null);
    setForm(emptyScheduleAssignment);
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveAssignment(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload = {
        ...form,
        work_order_id: Number(form.work_order_id),
        assigned_user_id: Number(form.assigned_user_id)
      };

      if (editingAssignment) {
        await updateScheduleAssignment(editingAssignment.id, payload);
      } else {
        await createScheduleAssignment(payload);
      }

      closeForm();
      await loadSchedule();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const summaryCards = [
    { label: "Total", value: summary.total || 0 },
    { label: "Today", value: summary.today || 0 },
    { label: "Overdue", value: summary.overdue || 0 },
    { label: "Scheduled", value: summary.scheduled || 0 },
    { label: "Completed", value: summary.completed || 0 }
  ];

  return (
    <div className="schedule-page">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Scheduling Foundation</p>
          <h2>Job allocation calendar</h2>
          <p>Schedule work orders to engineers, technicians and subcontractors.</p>
        </div>

        {canCreate ? (
          <button className="primary-action" onClick={openCreateForm}>
            <Plus size={18} />
            Add Assignment
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

      <form className="filter-bar schedule-filter" onSubmit={handleSearch}>
        <Field label="From" value={dateFrom} onChange={setDateFrom} type="date" />
        <Field label="To" value={dateTo} onChange={setDateTo} type="date" />

        <select value={assignedUserId} onChange={(event) => setAssignedUserId(event.target.value)}>
          <option value="">All assigned users</option>
          {staffUsers.map((staffUser) => (
            <option key={staffUser.id} value={staffUser.id}>{staffUser.name} - {staffUser.role}</option>
          ))}
        </select>

        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option>Scheduled</option>
          <option>In Progress</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </select>

        <button className="secondary-button" type="submit">Search</button>
      </form>

      {error ? <div className="login-error">{error}</div> : null}

      <section className="table-card">
        <div className="table-header">
          <strong>Schedule Assignments</strong>
          <span>{assignments.length} shown</span>
        </div>

        {assignments.length ? (
          <div className="customer-list">
            {assignments.map((assignment) => (
              <button
                className="customer-row schedule-row"
                disabled={!canEdit}
                key={assignment.id}
                onClick={() => {
                  if (canEdit) {
                    openEditForm(assignment);
                  }
                }}
              >
                <div>
                  <strong>{assignment.work_order_title}</strong>
                  <span>{assignment.work_order_reference}</span>
                </div>
                <div>
                  <span>{assignment.assigned_user_name}</span>
                  <span>{assignment.assigned_user_role}</span>
                </div>
                <div>
                  <span>{assignment.customer_name || "No customer"}</span>
                  <span>{assignment.building_name || "No building"}</span>
                </div>
                <div>
                  <span className={`status-badge ${statusClassName(assignment.status)}`}>{assignment.status}</span>
                  <span>
                    {formatDateForDisplay(assignment.schedule_date)}
                    {assignment.start_time ? ` ${String(assignment.start_time).slice(0, 5)}` : ""}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">No scheduled assignments yet.</div>
        )}
      </section>

      {formOpen ? (
        <div className="modal-backdrop">
          <form className="customer-form" onSubmit={saveAssignment}>
            <div className="form-header">
              <div>
                <p className="eyebrow">{editingAssignment ? "Edit Assignment" : "New Assignment"}</p>
                <h2>{editingAssignment ? editingAssignment.work_order_reference : "Add schedule assignment"}</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <label>
                Work order
                <select value={form.work_order_id} onChange={(event) => updateField("work_order_id", event.target.value)} required>
                  <option value="">Select work order</option>
                  {workOrders.map((workOrder) => (
                    <option key={workOrder.id} value={workOrder.id}>{workOrder.work_order_reference} - {workOrder.title}</option>
                  ))}
                </select>
              </label>

              <label>
                Assigned user
                <select value={form.assigned_user_id} onChange={(event) => updateField("assigned_user_id", event.target.value)} required>
                  <option value="">Select user</option>
                  {staffUsers.map((staffUser) => (
                    <option key={staffUser.id} value={staffUser.id}>{staffUser.name} - {staffUser.role}</option>
                  ))}
                </select>
              </label>

              <Field label="Schedule date" value={form.schedule_date} onChange={(value) => updateField("schedule_date", value)} type="date" required />
              <Field label="Start time" value={form.start_time} onChange={(value) => updateField("start_time", value)} type="time" />
              <Field label="End time" value={form.end_time} onChange={(value) => updateField("end_time", value)} type="time" />

              <label>
                Status
                <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option>Scheduled</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </label>

              <label className="wide-field">
                Notes
                <textarea value={form.notes || ""} onChange={(event) => updateField("notes", event.target.value)} rows={3} />
              </label>
            </div>

            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={closeForm}>Cancel</button>
              <button className="primary-action" type="submit" disabled={busy}>
                <Save size={18} />
                {busy ? "Saving..." : "Save Assignment"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function TechnicianJobsPage({ user }) {
  const [jobs, setJobs] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    on_hold: 0,
    completed: 0,
    overdue: 0
  });
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [form, setForm] = useState({
    status: "In Progress",
    completion_notes: ""
  });
  const [jobFiles, setJobFiles] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [signatures, setSignatures] = useState([]);
  const [signatureForm, setSignatureForm] = useState({
    signer_name: "",
    signer_role: "",
    signature_text: "",
    notes: ""
  });
  const [evidenceForm, setEvidenceForm] = useState({
    file_kind: "photo",
    file: null,
    notes: ""
  });
  const [busy, setBusy] = useState(false);
  const [fileBusy, setFileBusy] = useState(false);
  const [error, setError] = useState("");
  const canUpdate = hasPermission(user, PERMISSIONS.TECHNICIAN_JOBS_UPDATE);

  async function loadJobs() {
    const [summaryData, jobsData] = await Promise.all([
      getTechnicianJobSummary(),
      listTechnicianJobs({ status })
    ]);

    setSummary(summaryData.summary || {});
    setJobs(jobsData.jobs || []);
  }

  useEffect(() => {
    loadJobs().catch((err) => setError(err.message));
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    setError("");

    try {
      await loadJobs();
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadJobFiles(jobId) {
    const data = await listTechnicianJobFiles(jobId);
    setJobFiles(data.files || []);
  }

  async function loadJobChecklist(jobId) {
    const data = await listTechnicianJobChecklist(jobId);
    setChecklist(data.checklist || []);
  }

  async function loadJobSignatures(jobId) {
    const data = await listTechnicianJobSignatures(jobId);
    setSignatures(data.signatures || []);
  }

  function openUpdateForm(job) {
    setEditingJob(job);
    setForm({
      status: job.status || "In Progress",
      completion_notes: job.completion_notes || ""
    });
    setEvidenceForm({
      file_kind: "photo",
      file: null,
      notes: ""
    });
    setJobFiles([]);
    setChecklist([]);
    setNewChecklistItem("");
    setSignatures([]);
    setSignatureForm({
      signer_name: "",
      signer_role: "",
      signature_text: "",
      notes: ""
    });
    setFormOpen(true);
    setError("");
    Promise.all([
      loadJobFiles(job.id),
      loadJobChecklist(job.id),
      loadJobSignatures(job.id)
    ]).catch((err) => setError(err.message));
  }

  function closeForm() {
    setFormOpen(false);
    setEditingJob(null);
    setForm({
      status: "In Progress",
      completion_notes: ""
    });
    setEvidenceForm({
      file_kind: "photo",
      file: null,
      notes: ""
    });
    setJobFiles([]);
    setChecklist([]);
    setNewChecklistItem("");
    setSignatures([]);
    setSignatureForm({
      signer_name: "",
      signer_role: "",
      signature_text: "",
      notes: ""
    });
  }

  async function saveJob(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await updateTechnicianJob(editingJob.id, form);
      closeForm();
      await loadJobs();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadEvidence() {
    if (!editingJob || !evidenceForm.file) {
      return;
    }

    setFileBusy(true);
    setError("");

    try {
      const content = await fileToBase64(evidenceForm.file);
      await uploadTechnicianJobFile(editingJob.id, {
        file_kind: evidenceForm.file_kind,
        original_filename: evidenceForm.file.name,
        content_type: evidenceForm.file.type || "application/octet-stream",
        content_base64: content,
        notes: evidenceForm.notes
      });
      setEvidenceForm({
        file_kind: "photo",
        file: null,
        notes: ""
      });
      await loadJobFiles(editingJob.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setFileBusy(false);
    }
  }

  async function addChecklistItem() {
    if (!editingJob || !newChecklistItem.trim()) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await createTechnicianJobChecklistItem(editingJob.id, {
        item_text: newChecklistItem
      });
      setNewChecklistItem("");
      await loadJobChecklist(editingJob.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleChecklistItem(item) {
    if (!editingJob) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await updateTechnicianJobChecklistItem(editingJob.id, item.id, {
        item_text: item.item_text,
        is_completed: !item.is_completed
      });
      await loadJobChecklist(editingJob.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveSignature() {
    if (!editingJob || !signatureForm.signer_name.trim() || !signatureForm.signature_text.trim()) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await createTechnicianJobSignature(editingJob.id, signatureForm);
      setSignatureForm({
        signer_name: "",
        signer_role: "",
        signature_text: "",
        notes: ""
      });
      await loadJobSignatures(editingJob.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function downloadEvidence(file) {
    setError("");

    try {
      const blob = await downloadTechnicianJobFile(editingJob.id, file.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.original_filename || "job-file";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  const summaryCards = [
    { label: "Assigned", value: summary.total || 0 },
    { label: "Open", value: summary.open || 0 },
    { label: "In Progress", value: summary.in_progress || 0 },
    { label: "On Hold", value: summary.on_hold || 0 },
    { label: "Completed", value: summary.completed || 0 },
    { label: "Overdue", value: summary.overdue || 0 }
  ];

  return (
    <div className="technician-jobs-page">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Technician App Foundation</p>
          <h2>Assigned jobs</h2>
          <p>View allocated work and update job status from the assigned-user job queue.</p>
        </div>
      </section>

      <section className="mini-card-grid">
        {summaryCards.map((card) => (
          <article className="mini-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <form className="filter-bar technician-jobs-filter" onSubmit={handleSearch}>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>On Hold</option>
          <option>Completed</option>
        </select>

        <button className="secondary-button" type="submit">Search</button>
      </form>

      {error ? <div className="login-error">{error}</div> : null}

      <section className="table-card">
        <div className="table-header">
          <strong>My Jobs</strong>
          <span>{jobs.length} shown</span>
        </div>

        {jobs.length ? (
          <div className="customer-list">
            {jobs.map((job) => (
              <button
                className="customer-row technician-job-row"
                disabled={!canUpdate}
                key={job.id}
                onClick={() => {
                  if (canUpdate) {
                    openUpdateForm(job);
                  }
                }}
              >
                <div>
                  <strong>{job.title}</strong>
                  <span>{job.work_order_reference}</span>
                </div>
                <div>
                  <span>{job.priority} / {job.work_order_type}</span>
                  <span>{job.asset_reference || job.asset_name || "No asset"}</span>
                </div>
                <div>
                  <span>{job.customer_name || "No customer"}</span>
                  <span>{job.building_name || "No building"}</span>
                </div>
                <div>
                  <span className={`status-badge ${statusClassName(job.status)}`}>{job.status}</span>
                  <span>
                    {job.next_schedule_date ? `Scheduled: ${formatDateForDisplay(job.next_schedule_date)}` : job.due_date ? `Due: ${formatDateForDisplay(job.due_date)}` : "No date"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">No assigned jobs yet.</div>
        )}
      </section>

      {formOpen ? (
        <div className="modal-backdrop">
          <form className="customer-form" onSubmit={saveJob}>
            <div className="form-header">
              <div>
                <p className="eyebrow">Update Job</p>
                <h2>{editingJob?.work_order_reference}</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <label>
                Status
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>On Hold</option>
                  <option>Completed</option>
                </select>
              </label>

              <label className="wide-field">
                Completion notes
                <textarea
                  value={form.completion_notes || ""}
                  onChange={(event) => setForm((current) => ({ ...current, completion_notes: event.target.value }))}
                  rows={4}
                />
              </label>
            </div>

            <div className="job-checklist-panel">
              <div className="table-header">
                <strong>Job Checklist</strong>
                <span>{checklist.filter((item) => item.is_completed).length} / {checklist.length} done</span>
              </div>

              <div className="checklist-add-row">
                <Field
                  label="New item"
                  value={newChecklistItem}
                  onChange={setNewChecklistItem}
                  placeholder="Add a task to complete on site"
                />
                <button className="secondary-button" type="button" onClick={addChecklistItem} disabled={busy || !newChecklistItem.trim()}>
                  <Plus size={16} />
                  Add
                </button>
              </div>

              {checklist.length ? (
                <div className="checklist-list">
                  {checklist.map((item) => (
                    <label className="checklist-row" key={item.id}>
                      <input
                        checked={item.is_completed}
                        onChange={() => toggleChecklistItem(item)}
                        type="checkbox"
                        disabled={busy}
                      />
                      <span>{item.item_text}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No checklist items yet.</div>
              )}
            </div>

            <div className="job-evidence-panel">
              <div className="table-header">
                <strong>Job Evidence</strong>
                <span>{jobFiles.length} files</span>
              </div>

              <div className="asset-upload-grid">
                <label>
                  Kind
                  <select
                    value={evidenceForm.file_kind}
                    onChange={(event) => setEvidenceForm((current) => ({ ...current, file_kind: event.target.value }))}
                  >
                    <option value="photo">Photo</option>
                    <option value="document">Document</option>
                  </select>
                </label>

                <label>
                  File
                  <input
                    type="file"
                    onChange={(event) => setEvidenceForm((current) => ({ ...current, file: event.target.files?.[0] || null }))}
                  />
                </label>

                <Field
                  label="Notes"
                  value={evidenceForm.notes}
                  onChange={(value) => setEvidenceForm((current) => ({ ...current, notes: value }))}
                />

                <button className="secondary-button" type="button" onClick={uploadEvidence} disabled={fileBusy || !evidenceForm.file}>
                  <Plus size={16} />
                  Upload
                </button>
              </div>

              {jobFiles.length ? (
                <div className="asset-file-list">
                  {jobFiles.map((file) => (
                    <div className="asset-file-row" key={file.id}>
                      <div>
                        <strong>{file.original_filename}</strong>
                        <span>{file.file_kind} / {formatFileSize(file.file_size)} / {formatDateForDisplay(file.created_at)}</span>
                      </div>
                      <button className="secondary-button" type="button" onClick={() => downloadEvidence(file)}>
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No evidence uploaded yet.</div>
              )}
            </div>

            <div className="job-signoff-panel">
              <div className="table-header">
                <strong>Job Sign-Off</strong>
                <span>{signatures.length} signatures</span>
              </div>

              <div className="form-grid signoff-form-grid">
                <Field
                  label="Signer name"
                  value={signatureForm.signer_name}
                  onChange={(value) => setSignatureForm((current) => ({ ...current, signer_name: value }))}
                  required
                />
                <Field
                  label="Signer role"
                  value={signatureForm.signer_role}
                  onChange={(value) => setSignatureForm((current) => ({ ...current, signer_role: value }))}
                />
                <Field
                  label="Signature"
                  value={signatureForm.signature_text}
                  onChange={(value) => setSignatureForm((current) => ({ ...current, signature_text: value }))}
                  required
                />
                <Field
                  label="Notes"
                  value={signatureForm.notes}
                  onChange={(value) => setSignatureForm((current) => ({ ...current, notes: value }))}
                />
              </div>

              <button
                className="secondary-button"
                type="button"
                onClick={saveSignature}
                disabled={busy || !signatureForm.signer_name.trim() || !signatureForm.signature_text.trim()}
              >
                <Save size={16} />
                Add Sign-Off
              </button>

              {signatures.length ? (
                <div className="signature-list">
                  {signatures.map((signature) => (
                    <div className="signature-row" key={signature.id}>
                      <div>
                        <strong>{signature.signer_name}</strong>
                        <span>{signature.signer_role || "No role"} / {formatDateForDisplay(signature.signed_at)}</span>
                      </div>
                      <span>{signature.signature_text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No sign-off captured yet.</div>
              )}
            </div>

            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={closeForm}>Cancel</button>
              <button className="primary-action" type="submit" disabled={busy}>
                <Save size={18} />
                {busy ? "Saving..." : "Save Job"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function SettingsPage({ language, onLanguageChange, user }) {
  const [saved, setSaved] = useState(false);
  const [sampleStatus, setSampleStatus] = useState(null);
  const [sampleBusy, setSampleBusy] = useState(false);
  const [sampleError, setSampleError] = useState("");
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const canAdminSettings = hasPermission(user, PERMISSIONS.SETTINGS_ADMIN);

  async function loadSampleStatus() {
    if (!canAdminSettings) {
      return;
    }

    const data = await getSampleDataStatus();
    setSampleStatus(data.sample_data);
  }

  useEffect(() => {
    loadSampleStatus().catch((err) => setSampleError(err.message));
  }, [canAdminSettings]);

  function saveSettings(event) {
    event.preventDefault();
    safeSetStorageItem("dcam_language", language);
    setSaved(true);
  }

  async function handleInstallSampleData() {
    setSampleBusy(true);
    setSampleError("");

    try {
      const data = await installSampleData();
      setSampleStatus(data.sample_data);
      setDeleteConfirmed(false);
    } catch (err) {
      setSampleError(err.message);
    } finally {
      setSampleBusy(false);
    }
  }

  async function handleDeleteSampleData() {
    if (!deleteConfirmed) {
      return;
    }

    setSampleBusy(true);
    setSampleError("");

    try {
      const data = await deleteSampleData();
      setSampleStatus(data.sample_data);
      setDeleteConfirmed(false);
    } catch (err) {
      setSampleError(err.message);
    } finally {
      setSampleBusy(false);
    }
  }

  return (
    <div className="settings-page">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Application Settings</p>
          <h2>Language and local display preferences</h2>
          <p>Choose the language used for menus, pages, buttons and forms.</p>
        </div>
      </section>

      <section className="table-card settings-card">
        <form className="customer-form settings-form" onSubmit={saveSettings}>
          <div className="form-grid">
            <label>
              Language
              <select value={language} onChange={(event) => {
                onLanguageChange(event.target.value);
                setSaved(false);
              }}>
                <option value="en">English</option>
                <option value="ro">Romanian</option>
              </select>
            </label>
          </div>

          {saved ? <div className="settings-success">Settings saved on this device.</div> : null}

          <div className="form-actions">
            <button className="primary-action" type="submit">
              <Save size={18} />
              Save Settings
            </button>
          </div>
        </form>
      </section>

      {canAdminSettings ? (
        <section className="table-card settings-card">
          <div className="settings-tool-header">
            <div>
              <h3>Sample Data</h3>
              <p>Install demo records across customers, buildings, assets, work orders, schedule, people and technician jobs.</p>
            </div>
            <span className={sampleStatus?.installed ? "status-pill active" : "status-pill"}>
              {sampleStatus?.installed ? "Installed" : "Not installed"}
            </span>
          </div>

          <div className="settings-summary-grid">
            {[
              { label: "Customers", value: sampleStatus?.counts?.customers || 0 },
              { label: "Buildings", value: sampleStatus?.counts?.buildings || 0 },
              { label: "Assets", value: sampleStatus?.counts?.assets || 0 },
              { label: "Work Orders", value: sampleStatus?.counts?.work_orders || 0 },
              { label: "Schedule", value: sampleStatus?.counts?.schedule_assignments || 0 },
              { label: "People", value: sampleStatus?.counts?.staff_profiles || 0 },
              { label: "Checklists", value: sampleStatus?.counts?.checklist_items || 0 },
              { label: "Sign-Offs", value: sampleStatus?.counts?.signatures || 0 }
            ].map((card) => (
              <article className="mini-card" key={card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </article>
            ))}
          </div>

          {sampleError ? <div className="form-error">{sampleError}</div> : null}

          <div className="settings-actions">
            <button
              className="primary-action"
              type="button"
              onClick={handleInstallSampleData}
              disabled={sampleBusy || sampleStatus?.installed}
            >
              <Plus size={18} />
              {sampleBusy ? "Working..." : "Install Sample Data"}
            </button>
          </div>

          <div className="danger-zone">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={deleteConfirmed}
                onChange={(event) => setDeleteConfirmed(event.target.checked)}
                disabled={!sampleStatus?.installed || sampleBusy}
              />
              I understand this deletes only installed sample data.
            </label>
            <button
              className="danger-button"
              type="button"
              onClick={handleDeleteSampleData}
              disabled={!sampleStatus?.installed || !deleteConfirmed || sampleBusy}
            >
              <Trash2 size={18} />
              {sampleBusy ? "Working..." : "Delete Sample Data"}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function AssetSettingsPage() {
  const [selectedType, setSelectedType] = useState("category");
  const [groupedOptions, setGroupedOptions] = useState({});
  const [form, setForm] = useState({
    label: "",
    sort_order: 100
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadOptions() {
    const data = await listAssetOptions({ include_inactive: true });
    setGroupedOptions(data.grouped || {});
  }

  useEffect(() => {
    loadOptions().catch((err) => setError(err.message));
  }, []);

  async function createOption(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await createAssetOption({
        option_type: selectedType,
        label: form.label,
        sort_order: Number(form.sort_order),
        is_active: true
      });
      setForm({ label: "", sort_order: 100 });
      await loadOptions();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveOption(option, changes) {
    setBusy(true);
    setError("");

    try {
      await updateAssetOption(option.id, {
        label: changes.label ?? option.label,
        sort_order: Number(changes.sort_order ?? option.sort_order),
        is_active: changes.is_active ?? option.is_active
      });
      await loadOptions();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const visibleOptions = groupedOptions[selectedType] || [];
  const selectedTypeLabel = assetOptionTypes.find((type) => type.value === selectedType)?.label || "Options";

  return (
    <div className="asset-settings-page">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Asset Administration</p>
          <h2>Asset categories, types, statuses and conditions</h2>
          <p>
            Manage the option lists used by the Asset Register.
          </p>
        </div>
      </section>

      <section className="settings-layout">
        <div className="settings-tabs">
          {assetOptionTypes.map((type) => (
            <button
              className={`secondary-button ${selectedType === type.value ? "active-tab" : ""}`}
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              type="button"
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="table-card">
          <div className="table-header">
            <strong>{selectedTypeLabel}</strong>
            <span>{visibleOptions.length} options</span>
          </div>

          <form className="option-form" onSubmit={createOption}>
            <Field label="New option" value={form.label} onChange={(value) => setForm((current) => ({ ...current, label: value }))} required />
            <Field label="Sort order" value={form.sort_order} onChange={(value) => setForm((current) => ({ ...current, sort_order: value }))} type="number" />
            <button className="primary-action" type="submit" disabled={busy}>
              <Plus size={18} />
              Add Option
            </button>
          </form>

          {error ? <div className="login-error">{error}</div> : null}

          <div className="option-list">
            {visibleOptions.map((option) => (
              <div className="option-row" key={option.id}>
                <input
                  defaultValue={option.label}
                  onBlur={(event) => {
                    if (event.target.value !== option.label) {
                      saveOption(option, { label: event.target.value });
                    }
                  }}
                  disabled={busy}
                />
                <input
                  type="number"
                  defaultValue={option.sort_order}
                  onBlur={(event) => {
                    if (Number(event.target.value) !== Number(option.sort_order)) {
                      saveOption(option, { sort_order: event.target.value });
                    }
                  }}
                  disabled={busy}
                />
                <label className="inline-toggle">
                  <input
                    checked={option.is_active}
                    onChange={(event) => saveOption(option, { is_active: event.target.checked })}
                    type="checkbox"
                    disabled={busy}
                  />
                  Active
                </label>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function mergeAssetOptions(grouped) {
  const merged = { ...fallbackAssetOptions };

  Object.keys(fallbackAssetOptions).forEach((key) => {
    const options = Array.isArray(grouped[key]) ? grouped[key] : [];
    const labels = options
      .filter((option) => option.is_active !== false)
      .map((option) => option.label)
      .filter(Boolean);

    if (labels.length) {
      merged[key] = labels;
    }
  });

  return merged;
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
