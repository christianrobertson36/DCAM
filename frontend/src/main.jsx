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
  createCertificate,
  createComplianceService,
  createContact,
  createCustomer,
  createFormTemplate,
  createMaintenancePlan,
  createPipelineOpportunity,
  createReport,
  createTechnicianJobSignature,
  createTechnicianJobChecklistItem,
  createStaffProfile,
  createStaffQualification,
  createScheduleAssignment,
  createWorkOrder,
  deleteAssetFile,
  deleteSampleData,
  downloadAssetFile,
  exportReport,
  exportCertificate,
  downloadTechnicianJobFile,
  getAssetSummary,
  getBuildingSummary,
  getCertificateSummary,
  getComplianceServiceSummary,
  getContactSummary,
  getCustomerPortalDashboard,
  getCustomerSummary,
  getFormTemplateSummary,
  getMaintenancePlanSummary,
  getMe,
  getPipelineSummary,
  getReportSummary,
  getSampleDataStatus,
  getScheduleSummary,
  getStaffSummary,
  getTechnicianJobSummary,
  getWorkOrderSummary,
  installSampleData,
  listRecordHistory,
  listMaintenancePlans,
  listPipelineOpportunities,
  listAssetFiles,
  listAssetHistory,
  listAssetOptions,
  listAssets,
  listBuildings,
  listCertificates,
  listComplianceServices,
  listContacts,
  listCustomers,
  listFormTemplates,
  listScheduleAssignments,
  listReports,
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
  updateCertificate,
  updateComplianceService,
  updateContact,
  updateFormTemplate,
  updateReport,
  uploadAssetFile,
  updateBuilding,
  updateCustomer,
  updateMaintenancePlan,
  updatePipelineOpportunity,
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
    "v25 Sample Data Hotfix": "v25 Remediere date exemplu",
    "v26 Record Edit History": "v26 Istoric editare inregistrari",
    "v27 Planned Maintenance": "v27 Mentenanta planificata",
    "v28 Compliance Services": "v28 Servicii conformitate",
    "v29 Forms Builder": "v29 Constructor formulare",
    "v30 Reports": "v30 Rapoarte",
    "v31 Certificates": "v31 Certificate",
    "v32 Customer Portal": "v32 Portal client",
    "v33 Contacts": "v33 Contacte",
    "v34 Pipeline": "v34 Pipeline",
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
    "Contacts": "Contacte",
    "Pipeline": "Pipeline",
    "Buildings": "Cladiri",
    "Assets": "Active",
    "Work Orders": "Comenzi de lucru",
    "Schedule": "Programare",
    "Maintenance Plans": "Planuri de mentenanta",
    "Compliance Services": "Servicii conformitate",
    "Forms Builder": "Constructor formulare",
    "Reports": "Rapoarte",
    "Certificates": "Certificate",
    "Customer Portal": "Portal client",
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
    "Edit": "Editeaza",
    "Saving...": "Se salveaza...",
    "Save Customer": "Salveaza client",
    "Contacts Foundation": "Fundatie contacte",
    "Customer contact records": "Inregistrari contacte client",
    "Manage named contacts for each customer with role, email, phone and primary contact status.": "Gestionati contactele nominale pentru fiecare client cu rol, email, telefon si stare contact principal.",
    "Add Contact": "Adauga contact",
    "Total Contacts": "Total contacte",
    "Primary Contacts": "Contacte principale",
    "All contacts": "Toate contactele",
    "No contacts yet.": "Nu exista contacte.",
    "Edit Contact": "Editare contact",
    "New Contact": "Contact nou",
    "Add contact": "Adauga contact",
    "Contact reference": "Referinta contact",
    "First name": "Prenume",
    "Last name": "Nume",
    "Mobile": "Mobil",
    "Contact type": "Tip contact",
    "Primary contact": "Contact principal",
    "Save Contact": "Salveaza contactul",
    "CRM Pipeline Foundation": "Fundatie pipeline CRM",
    "Sales opportunities and pipeline tracking": "Oportunitati de vanzare si urmarire pipeline",
    "Track customer opportunities by stage, value, probability, owner and next action.": "Urmariti oportunitatile clientilor dupa etapa, valoare, probabilitate, responsabil si urmatoarea actiune.",
    "Add Opportunity": "Adauga oportunitate",
    "Total Opportunities": "Total oportunitati",
    "Open Value": "Valoare deschisa",
    "Won": "Castigat",
    "Lost": "Pierdut",
    "All opportunities": "Toate oportunitatile",
    "All stages": "Toate etapele",
    "Lead": "Lead",
    "Qualified": "Calificat",
    "Proposal": "Propunere",
    "Negotiation": "Negociere",
    "Closed": "Inchis",
    "No opportunities yet.": "Nu exista oportunitati.",
    "Edit Opportunity": "Editare oportunitate",
    "New Opportunity": "Oportunitate noua",
    "Add opportunity": "Adauga oportunitate",
    "Opportunity reference": "Referinta oportunitate",
    "Opportunity name": "Nume oportunitate",
    "Stage": "Etapa",
    "Estimated value": "Valoare estimata",
    "Probability": "Probabilitate",
    "Expected close date": "Data estimata inchidere",
    "Owner": "Responsabil",
    "Source": "Sursa",
    "Next action": "Urmatoarea actiune",
    "Save Opportunity": "Salveaza oportunitatea",
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
    "Planned Preventive Maintenance": "Mentenanta preventiva planificata",
    "Recurring maintenance plans": "Planuri recurente de mentenanta",
    "Manage planned maintenance by customer, site, asset, frequency and next due date.": "Gestionati mentenanta planificata dupa client, site, activ, frecventa si urmatoarea data scadenta.",
    "Add Plan": "Adauga plan",
    "Due Soon": "Scadent curand",
    "Paused": "Pauzat",
    "All frequencies": "Toate frecventele",
    "Weekly": "Saptamanal",
    "Monthly": "Lunar",
    "Quarterly": "Trimestrial",
    "Six Monthly": "La sase luni",
    "Annual": "Anual",
    "No maintenance plans yet.": "Nu exista planuri de mentenanta.",
    "Edit Plan": "Editare plan",
    "New Plan": "Plan nou",
    "Add maintenance plan": "Adauga plan de mentenanta",
    "Plan reference": "Referinta plan",
    "Plan type": "Tip plan",
    "Frequency": "Frecventa",
    "Start date": "Data inceput",
    "Next due date": "Urmatoarea data scadenta",
    "Last generated date": "Ultima data generata",
    "Estimated duration minutes": "Durata estimata minute",
    "Instructions": "Instructiuni",
    "Save Plan": "Salveaza planul",
    "Compliance Service Modules": "Module servicii conformitate",
    "Inspection, testing and audit services": "Servicii inspectie, testare si audit",
    "Track PAT testing, fire inspections, electrical compliance and technical audits.": "Urmariti testarea PAT, inspectii incendiu, conformitate electrica si audituri tehnice.",
    "Add Service": "Adauga serviciu",
    "Passed": "Trecut",
    "Failed": "Esuat",
    "Defects": "Defecte",
    "Approved": "Aprobat",
    "All service types": "Toate tipurile de servicii",
    "All results": "Toate rezultatele",
    "PAT Testing": "Testare PAT",
    "Fire Door Inspection": "Inspectie usi antifoc",
    "Fire Damper Testing": "Testare clapete antifoc",
    "Electrical Compliance": "Conformitate electrica",
    "Technical Compliance Audit": "Audit conformitate tehnica",
    "General Building Maintenance": "Mentenanta generala cladire",
    "No compliance services yet.": "Nu exista servicii de conformitate.",
    "Edit Service": "Editare serviciu",
    "New Service": "Serviciu nou",
    "Add compliance service": "Adauga serviciu conformitate",
    "Service reference": "Referinta serviciu",
    "Service name": "Nume serviciu",
    "Service type": "Tip serviciu",
    "Result": "Rezultat",
    "Risk rating": "Rating risc",
    "Scheduled date": "Data programata",
    "Completed date": "Data finalizarii",
    "Certificate required": "Certificat necesar",
    "Certificate status": "Stare certificat",
    "Report status": "Stare raport",
    "Findings": "Constatari",
    "Corrective actions": "Actiuni corective",
    "Defects found": "Defecte gasite",
    "Save Service": "Salveaza serviciul",
    "Forms and Inspection Builder": "Constructor formulare si inspectii",
    "Reusable inspection templates": "Sabloane reutilizabile de inspectie",
    "Build form templates with sections, questions, answer types and scoring rules.": "Creati sabloane de formulare cu sectiuni, intrebari, tipuri de raspuns si reguli de scor.",
    "Add Template": "Adauga sablon",
    "Draft": "Ciorna",
    "Archived": "Arhivat",
    "Approval Required": "Aprobare necesara",
    "All templates": "Toate sabloanele",
    "No form templates yet.": "Nu exista sabloane de formulare.",
    "Edit Template": "Editare sablon",
    "New Template": "Sablon nou",
    "Add form template": "Adauga sablon formular",
    "Template reference": "Referinta sablon",
    "Template name": "Nume sablon",
    "Version": "Versiune",
    "Scoring enabled": "Scor activat",
    "Approval required": "Aprobare necesara",
    "Sections JSON": "JSON sectiuni",
    "Save Template": "Salveaza sablonul",
    "Reports Foundation": "Fundatie rapoarte",
    "Operational and compliance reports": "Rapoarte operationale si de conformitate",
    "Create controlled reports for customers, buildings, assets, work orders and compliance services.": "Creati rapoarte controlate pentru clienti, cladiri, active, comenzi de lucru si servicii de conformitate.",
    "Add Report": "Adauga raport",
    "Ready for Review": "Gata de revizuire",
    "Issued": "Emis",
    "All report types": "Toate tipurile de raport",
    "All reports": "Toate rapoartele",
    "Compliance Summary": "Rezumat conformitate",
    "Asset Condition": "Stare active",
    "Work Order Summary": "Rezumat comenzi de lucru",
    "Service Report": "Raport serviciu",
    "Customer Review": "Revizuire client",
    "No reports yet.": "Nu exista rapoarte.",
    "Edit Report": "Editare raport",
    "New Report": "Raport nou",
    "Add report": "Adauga raport",
    "Report reference": "Referinta raport",
    "Report title": "Titlu raport",
    "Report type": "Tip raport",
    "Date from": "Data de la",
    "Date to": "Data pana la",
    "Summary": "Rezumat",
    "Recommendations": "Recomandari",
    "Save Report": "Salveaza raportul",
    "Export": "Exporta",
    "Certificates Foundation": "Fundatie certificate",
    "Controlled compliance certificates": "Certificate de conformitate controlate",
    "Create, issue, revoke and export certificates linked to services, reports, assets and customers.": "Creati, emiteti, revocati si exportati certificate legate de servicii, rapoarte, active si clienti.",
    "Add Certificate": "Adauga certificat",
    "Revoked": "Revocat",
    "Expired": "Expirat",
    "Expiring Soon": "Expira curand",
    "All certificate types": "Toate tipurile de certificat",
    "All certificates": "Toate certificatele",
    "Compliance Certificate": "Certificat conformitate",
    "Inspection Certificate": "Certificat inspectie",
    "Test Certificate": "Certificat test",
    "Completion Certificate": "Certificat finalizare",
    "Safety Certificate": "Certificat siguranta",
    "No certificates yet.": "Nu exista certificate.",
    "Edit Certificate": "Editare certificat",
    "New Certificate": "Certificat nou",
    "Add certificate": "Adauga certificat",
    "Certificate reference": "Referinta certificat",
    "Certificate title": "Titlu certificat",
    "Certificate type": "Tip certificat",
    "Certificate body": "Continut certificat",
    "Revocation reason": "Motiv revocare",
    "Save Certificate": "Salveaza certificatul",
    "Customer Portal Foundation": "Fundatie portal client",
    "Your compliance workspace": "Spatiul dvs. de conformitate",
    "View your sites, assets, open work, reports and certificates in one controlled portal.": "Vedeti site-urile, activele, lucrarile deschise, rapoartele si certificatele intr-un portal controlat.",
    "Linked Customers": "Clienti asociati",
    "Open Work": "Lucrari deschise",
    "Portal access is not linked to a customer record yet.": "Accesul portalului nu este asociat inca unui client.",
    "Contact your DCAM administrator to link this login to your company.": "Contactati administratorul DCAM pentru a asocia acest login cu compania dvs.",
    "Your Sites": "Site-urile dvs.",
    "Your Assets": "Activele dvs.",
    "Your Work Orders": "Comenzile dvs.",
    "Your Reports": "Rapoartele dvs.",
    "Your Certificates": "Certificatele dvs.",
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
    ,
    "Update History": "Istoric actualizari",
    "events": "evenimente",
    "Loading history...": "Se incarca istoricul...",
    "No update history has been recorded yet.": "Nu exista istoric de actualizari inca.",
    "System": "Sistem"
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
  CONTACTS_VIEW: "contacts:view",
  CONTACTS_CREATE: "contacts:create",
  CONTACTS_EDIT: "contacts:edit",
  PIPELINE_VIEW: "pipeline:view",
  PIPELINE_CREATE: "pipeline:create",
  PIPELINE_EDIT: "pipeline:edit",
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
  MAINTENANCE_PLANS_VIEW: "maintenance_plans:view",
  MAINTENANCE_PLANS_CREATE: "maintenance_plans:create",
  MAINTENANCE_PLANS_EDIT: "maintenance_plans:edit",
  COMPLIANCE_SERVICES_VIEW: "compliance_services:view",
  COMPLIANCE_SERVICES_CREATE: "compliance_services:create",
  COMPLIANCE_SERVICES_EDIT: "compliance_services:edit",
  COMPLIANCE_SERVICES_APPROVE: "compliance_services:approve",
  FORM_TEMPLATES_VIEW: "form_templates:view",
  FORM_TEMPLATES_CREATE: "form_templates:create",
  FORM_TEMPLATES_EDIT: "form_templates:edit",
  FORM_TEMPLATES_APPROVE: "form_templates:approve",
  REPORTS_VIEW: "reports:view",
  REPORTS_CREATE: "reports:create",
  REPORTS_EDIT: "reports:edit",
  REPORTS_APPROVE: "reports:approve",
  REPORTS_EXPORT: "reports:export",
  CERTIFICATES_VIEW: "certificates:view",
  CERTIFICATES_CREATE: "certificates:create",
  CERTIFICATES_EDIT: "certificates:edit",
  CERTIFICATES_ISSUE: "certificates:issue",
  CERTIFICATES_REVOKE: "certificates:revoke",
  CERTIFICATES_EXPORT: "certificates:export",
  CUSTOMER_PORTAL_VIEW: "customer_portal:view",
  TECHNICIAN_JOBS_VIEW: "technician_jobs:view",
  TECHNICIAN_JOBS_UPDATE: "technician_jobs:update",
  TECHNICIAN_JOBS_MANAGE: "technician_jobs:manage",
  SETTINGS_ADMIN: "settings:admin"
};

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW },
  { label: "Customers", icon: Users, permission: PERMISSIONS.CUSTOMERS_VIEW },
  { label: "Contacts", icon: Users, permission: PERMISSIONS.CONTACTS_VIEW },
  { label: "Pipeline", icon: SlidersHorizontal, permission: PERMISSIONS.PIPELINE_VIEW },
  { label: "Buildings", icon: Building2, permission: PERMISSIONS.BUILDINGS_VIEW },
  { label: "Assets", icon: Building2, permission: PERMISSIONS.ASSETS_VIEW },
  { label: "Work Orders", icon: Save, permission: PERMISSIONS.WORK_ORDERS_VIEW },
  { label: "Schedule", icon: CalendarDays, permission: PERMISSIONS.SCHEDULE_VIEW },
  { label: "Maintenance Plans", icon: CalendarDays, permission: PERMISSIONS.MAINTENANCE_PLANS_VIEW },
  { label: "Compliance Services", icon: ClipboardCheck, permission: PERMISSIONS.COMPLIANCE_SERVICES_VIEW },
  { label: "Forms Builder", icon: ClipboardCheck, permission: PERMISSIONS.FORM_TEMPLATES_VIEW },
  { label: "Reports", icon: Download, permission: PERMISSIONS.REPORTS_VIEW },
  { label: "Certificates", icon: Download, permission: PERMISSIONS.CERTIFICATES_VIEW },
  { label: "Customer Portal", icon: LayoutDashboard, permission: PERMISSIONS.CUSTOMER_PORTAL_VIEW },
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

const emptyContact = {
  customer_id: "",
  contact_reference: "",
  first_name: "",
  last_name: "",
  job_title: "",
  email: "",
  phone: "",
  mobile: "",
  contact_type: "Primary",
  status: "Active",
  is_primary: false,
  notes: ""
};

const emptyOpportunity = {
  customer_id: "",
  contact_id: "",
  opportunity_reference: "",
  opportunity_name: "",
  stage: "Lead",
  status: "Open",
  estimated_value: "",
  probability: 0,
  expected_close_date: "",
  owner_user_id: "",
  source: "",
  next_action: "",
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

const emptyMaintenancePlan = {
  plan_reference: "",
  title: "",
  plan_type: "Planned Maintenance",
  status: "Active",
  frequency: "Monthly",
  priority: "Normal",
  customer_id: "",
  building_id: "",
  asset_id: "",
  assigned_user_id: "",
  start_date: "",
  next_due_date: "",
  last_generated_date: "",
  estimated_duration_minutes: "",
  instructions: "",
  notes: ""
};

const emptyComplianceService = {
  service_reference: "",
  service_name: "",
  service_type: "Technical Compliance Audit",
  status: "Planned",
  priority: "Normal",
  result_status: "Not Started",
  risk_rating: "Unrated",
  customer_id: "",
  building_id: "",
  asset_id: "",
  work_order_id: "",
  assigned_user_id: "",
  scheduled_date: "",
  completed_date: "",
  defects_found: false,
  certificate_required: true,
  certificate_status: "Not Required",
  report_status: "Draft",
  findings: "",
  corrective_actions: "",
  notes: ""
};

const emptyFormTemplate = {
  template_reference: "",
  template_name: "",
  service_type: "Technical Compliance Audit",
  status: "Draft",
  version_number: 1,
  scoring_enabled: false,
  approval_required: true,
  description: "",
  sections_text: JSON.stringify([
    {
      title: "Inspection",
      description: "Core inspection checks",
      questions: [
        {
          prompt: "Is the item safe and accessible?",
          answer_type: "Pass/Fail",
          is_required: true,
          scoring_weight: 1,
          options: []
        }
      ]
    }
  ], null, 2)
};

const emptyReport = {
  report_reference: "",
  report_title: "",
  report_type: "Compliance Summary",
  status: "Draft",
  customer_id: "",
  building_id: "",
  asset_id: "",
  work_order_id: "",
  compliance_service_id: "",
  date_from: "",
  date_to: "",
  summary: "",
  findings: "",
  recommendations: ""
};

const emptyCertificate = {
  certificate_reference: "",
  certificate_title: "",
  certificate_type: "Compliance Certificate",
  status: "Draft",
  customer_id: "",
  building_id: "",
  asset_id: "",
  compliance_service_id: "",
  report_id: "",
  issue_date: "",
  expiry_date: "",
  certificate_body: "",
  revocation_reason: ""
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

        <p className="eyebrow">v26 Record Edit History</p>
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

  const pageTitle = activePage === "Customers" || activePage === "Contacts" || activePage === "Pipeline" || activePage === "Buildings" || activePage === "Assets" || activePage === "Work Orders" || activePage === "Schedule" || activePage === "Maintenance Plans" || activePage === "Compliance Services" || activePage === "Forms Builder" || activePage === "Reports" || activePage === "Certificates" || activePage === "Customer Portal" || activePage === "My Jobs" || activePage === "People" || activePage === "Asset Settings" || activePage === "Settings"
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
            <p className="eyebrow">v34 Pipeline</p>
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
        {activePage === "Contacts" ? <ContactsPage user={user} /> : null}
        {activePage === "Pipeline" ? <PipelinePage user={user} /> : null}
        {activePage === "Buildings" ? <BuildingsPage user={user} /> : null}
        {activePage === "Assets" ? <AssetsPage user={user} /> : null}
        {activePage === "Work Orders" ? <WorkOrdersPage user={user} /> : null}
        {activePage === "Schedule" ? <SchedulePage user={user} /> : null}
        {activePage === "Maintenance Plans" ? <MaintenancePlansPage user={user} /> : null}
        {activePage === "Compliance Services" ? <ComplianceServicesPage user={user} /> : null}
        {activePage === "Forms Builder" ? <FormTemplatesPage user={user} /> : null}
        {activePage === "Reports" ? <ReportsPage user={user} /> : null}
        {activePage === "Certificates" ? <CertificatesPage user={user} /> : null}
        {activePage === "Customer Portal" ? <CustomerPortalPage user={user} /> : null}
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
        {activePage !== "Customers" && activePage !== "Contacts" && activePage !== "Pipeline" && activePage !== "Buildings" && activePage !== "Assets" && activePage !== "Work Orders" && activePage !== "Schedule" && activePage !== "Maintenance Plans" && activePage !== "Compliance Services" && activePage !== "Forms Builder" && activePage !== "Reports" && activePage !== "Certificates" && activePage !== "Customer Portal" && activePage !== "My Jobs" && activePage !== "People" && activePage !== "Asset Settings" && activePage !== "Settings" ? <DashboardPage /> : null}
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

function CustomerPortalPage({ user }) {
  const [portal, setPortal] = useState({
    customers: [],
    summary: {},
    buildings: [],
    assets: [],
    work_orders: [],
    reports: [],
    certificates: []
  });
  const [customerId, setCustomerId] = useState("");
  const [error, setError] = useState("");

  async function loadPortal(nextCustomerId = customerId) {
    const data = await getCustomerPortalDashboard({ customer_id: nextCustomerId });
    setPortal(data);
  }

  useEffect(() => {
    loadPortal().catch((err) => setError(err.message));
  }, []);

  async function handleCustomerChange(value) {
    setCustomerId(value);
    setError("");

    try {
      await loadPortal(value);
    } catch (err) {
      setError(err.message);
    }
  }

  const summary = portal.summary || {};
  const summaryCards = [
    { label: "Linked Customers", value: summary.customers || 0 },
    { label: "Buildings", value: summary.buildings || 0 },
    { label: "Assets", value: summary.assets || 0 },
    { label: "Open Work", value: summary.open_work_orders || 0 },
    { label: "Reports", value: summary.reports || 0 },
    { label: "Certificates", value: summary.certificates || 0 }
  ];
  const canChooseCustomer = user.role !== "Customer" && portal.customers.length > 1;

  return (
    <div className="customer-portal-page">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Customer Portal Foundation</p>
          <h2>Your compliance workspace</h2>
          <p>View your sites, assets, open work, reports and certificates in one controlled portal.</p>
        </div>

        {canChooseCustomer ? (
          <select value={customerId} onChange={(event) => handleCustomerChange(event.target.value)}>
            <option value="">All customers</option>
            {portal.customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.company_name}</option>
            ))}
          </select>
        ) : null}
      </section>

      {error ? <div className="login-error">{error}</div> : null}

      {!portal.customers.length ? (
        <section className="table-card">
          <div className="empty-state">
            <strong>Portal access is not linked to a customer record yet.</strong>
            <span>Contact your DCAM administrator to link this login to your company.</span>
          </div>
        </section>
      ) : (
        <>
          <section className="mini-card-grid">
            {summaryCards.map((card) => (
              <article className="mini-card" key={card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </article>
            ))}
          </section>

          <PortalList
            title="Your Sites"
            rows={portal.buildings}
            emptyText="No buildings yet."
            renderRow={(building) => (
              <>
                <div>
                  <strong>{building.name}</strong>
                  <span>{building.building_type}</span>
                </div>
                <div>
                  <span className={`status-badge ${statusClassName(building.status)}`}>{building.status}</span>
                  <span>{building.city || building.postcode || "No location"}</span>
                </div>
                <div>
                  <span>{building.site_contact_name || "No site contact"}</span>
                </div>
              </>
            )}
          />

          <PortalList
            title="Your Assets"
            rows={portal.assets}
            emptyText="No assets yet."
            renderRow={(asset) => (
              <>
                <div>
                  <strong>{asset.asset_name}</strong>
                  <span>{asset.asset_reference}</span>
                </div>
                <div>
                  <span>{asset.asset_category} / {asset.asset_type}</span>
                  <span>{asset.building_name || "No building"}</span>
                </div>
                <div>
                  <span className={`status-badge ${statusClassName(asset.status)}`}>{asset.status}</span>
                  <span>{asset.next_service_date ? `Next: ${formatDateForDisplay(asset.next_service_date)}` : "No service date"}</span>
                </div>
              </>
            )}
          />

          <PortalList
            title="Your Work Orders"
            rows={portal.work_orders}
            emptyText="No work orders yet."
            renderRow={(workOrder) => (
              <>
                <div>
                  <strong>{workOrder.title}</strong>
                  <span>{workOrder.work_order_reference}</span>
                </div>
                <div>
                  <span>{workOrder.priority}</span>
                  <span>{workOrder.building_name || "No building"}</span>
                </div>
                <div>
                  <span className={`status-badge ${statusClassName(workOrder.status)}`}>{workOrder.status}</span>
                  <span>{workOrder.due_date ? `Due: ${formatDateForDisplay(workOrder.due_date)}` : "No due date"}</span>
                </div>
              </>
            )}
          />

          <PortalList
            title="Your Reports"
            rows={portal.reports}
            emptyText="No reports yet."
            renderRow={(report) => (
              <>
                <div>
                  <strong>{report.report_title}</strong>
                  <span>{report.report_reference}</span>
                </div>
                <div>
                  <span>{report.report_type}</span>
                </div>
                <div>
                  <span className={`status-badge ${statusClassName(report.status)}`}>{report.status}</span>
                  <span>{report.updated_at ? formatDateForDisplay(report.updated_at) : "No date"}</span>
                </div>
              </>
            )}
          />

          <PortalList
            title="Your Certificates"
            rows={portal.certificates}
            emptyText="No certificates yet."
            renderRow={(certificate) => (
              <>
                <div>
                  <strong>{certificate.certificate_title}</strong>
                  <span>{certificate.certificate_reference}</span>
                </div>
                <div>
                  <span>{certificate.certificate_type}</span>
                  <span>{certificate.issue_date ? `Issued: ${formatDateForDisplay(certificate.issue_date)}` : "Not issued"}</span>
                </div>
                <div>
                  <span className={`status-badge ${statusClassName(certificate.status)}`}>{certificate.status}</span>
                  <span>{certificate.expiry_date ? `Expires: ${formatDateForDisplay(certificate.expiry_date)}` : "No expiry date"}</span>
                </div>
              </>
            )}
          />
        </>
      )}
    </div>
  );
}

function PortalList({ title, rows, emptyText, renderRow }) {
  return (
    <section className="table-card">
      <div className="table-header">
        <strong>{title}</strong>
        <span>{rows.length} shown</span>
      </div>

      {rows.length ? (
        <div className="customer-list">
          {rows.map((row) => (
            <div className="customer-row portal-row" key={row.id}>
              {renderRow(row)}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">{emptyText}</div>
      )}
    </section>
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
              <div
                className="customer-row"
                key={customer.id}
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
                <div className="row-actions">
                  {canEditCustomer ? (
                    <button className="secondary-button" type="button" onClick={() => openEditForm(customer)}>
                      Edit
                    </button>
                  ) : null}
                </div>
              </div>
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

            {editingCustomer ? (
              <RecordHistoryPanel entityType="customer" entityId={editingCustomer.id} />
            ) : null}

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

function ContactsPage({ user }) {
  const [contacts, setContacts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    primary_contacts: 0
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [form, setForm] = useState(emptyContact);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canCreate = hasPermission(user, PERMISSIONS.CONTACTS_CREATE);
  const canEdit = hasPermission(user, PERMISSIONS.CONTACTS_EDIT);
  const canViewCustomers = hasPermission(user, PERMISSIONS.CUSTOMERS_VIEW);

  async function loadContacts() {
    const [summaryData, contactsData, customersData] = await Promise.all([
      getContactSummary(),
      listContacts({ search, status, customer_id: customerId }),
      canViewCustomers ? listCustomers() : Promise.resolve({ customers: [] })
    ]);

    setSummary(summaryData.summary || {});
    setContacts(contactsData.contacts || []);
    setCustomers(customersData.customers || []);
  }

  useEffect(() => {
    loadContacts().catch((err) => setError(err.message));
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    setError("");

    try {
      await loadContacts();
    } catch (err) {
      setError(err.message);
    }
  }

  function openCreateForm() {
    setEditingContact(null);
    setForm({
      ...emptyContact,
      customer_id: customerId || customers[0]?.id || ""
    });
    setFormOpen(true);
    setError("");
  }

  function openEditForm(contact) {
    setEditingContact(contact);
    setForm({
      ...emptyContact,
      ...contact,
      customer_id: contact.customer_id || "",
      is_primary: Boolean(contact.is_primary)
    });
    setFormOpen(true);
    setError("");
  }

  function closeForm() {
    setFormOpen(false);
    setEditingContact(null);
    setForm(emptyContact);
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function saveContact(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload = {
        ...form,
        customer_id: Number(form.customer_id)
      };

      if (editingContact) {
        await updateContact(editingContact.id, payload);
      } else {
        await createContact(payload);
      }

      closeForm();
      await loadContacts();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const summaryCards = [
    { label: "Total Contacts", value: summary.total || 0 },
    { label: "Active", value: summary.active || 0 },
    { label: "Inactive", value: summary.inactive || 0 },
    { label: "Primary Contacts", value: summary.primary_contacts || 0 }
  ];

  return (
    <div className="contacts-page">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Contacts Foundation</p>
          <h2>Customer contact records</h2>
          <p>Manage named contacts for each customer with role, email, phone and primary contact status.</p>
        </div>

        {canCreate ? (
          <button className="primary-action" onClick={openCreateForm}>
            <Plus size={18} />
            Add Contact
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

      <form className="filter-bar assets-filter" onSubmit={handleSearch}>
        <div className="search-box">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search contacts, customers or email..." />
        </div>

        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All contacts</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>

        <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
          <option value="">All customers</option>
          {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.company_name}</option>)}
        </select>

        <button className="secondary-button" type="submit">Search</button>
      </form>

      {error ? <div className="login-error">{error}</div> : null}

      <section className="table-card">
        <div className="table-header">
          <strong>Contacts</strong>
          <span>{contacts.length} shown</span>
        </div>

        {contacts.length ? (
          <div className="customer-list">
            {contacts.map((contact) => (
              <div className="customer-row contact-row" key={contact.id}>
                <div>
                  <strong>{contact.first_name} {contact.last_name || ""}</strong>
                  <span>{contact.contact_reference}</span>
                </div>
                <div>
                  <span>{contact.customer_name}</span>
                  <span>{contact.job_title || contact.contact_type}</span>
                </div>
                <div>
                  <span>{contact.email || "No email"}</span>
                  <span>{contact.mobile || contact.phone || "No phone"}</span>
                </div>
                <div>
                  <span className={`status-badge ${statusClassName(contact.status)}`}>{contact.status}</span>
                  <span>{contact.is_primary ? "Primary contact" : "Secondary contact"}</span>
                </div>
                <div className="row-actions">
                  {canEdit ? (
                    <button className="secondary-button" type="button" onClick={() => openEditForm(contact)}>
                      Edit
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No contacts yet.</div>
        )}
      </section>

      {formOpen ? (
        <div className="modal-backdrop">
          <form className="customer-form" onSubmit={saveContact}>
            <div className="form-header">
              <div>
                <p className="eyebrow">{editingContact ? "Edit Contact" : "New Contact"}</p>
                <h2>{editingContact ? editingContact.contact_reference : "Add contact"}</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <label>
                Customer
                <select value={form.customer_id} onChange={(event) => updateField("customer_id", event.target.value)} required>
                  <option value="">Select customer</option>
                  {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.company_name}</option>)}
                </select>
              </label>

              <Field label="Contact reference" value={form.contact_reference} onChange={(value) => updateField("contact_reference", value)} placeholder={editingContact ? "" : "Auto-generated if blank"} />
              <Field label="First name" value={form.first_name} onChange={(value) => updateField("first_name", value)} required />
              <Field label="Last name" value={form.last_name} onChange={(value) => updateField("last_name", value)} />
              <Field label="Job title" value={form.job_title} onChange={(value) => updateField("job_title", value)} />
              <Field label="Email" value={form.email} onChange={(value) => updateField("email", value)} type="email" />
              <Field label="Phone" value={form.phone} onChange={(value) => updateField("phone", value)} />
              <Field label="Mobile" value={form.mobile} onChange={(value) => updateField("mobile", value)} />

              <label>
                Contact type
                <select value={form.contact_type} onChange={(event) => updateField("contact_type", event.target.value)}>
                  <option>Primary</option>
                  <option>Site</option>
                  <option>Finance</option>
                  <option>Compliance</option>
                  <option>Emergency</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                Status
                <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </label>

              <label className="inline-toggle">
                <input type="checkbox" checked={form.is_primary} onChange={(event) => updateField("is_primary", event.target.checked)} />
                Primary contact
              </label>

              <label className="wide-field">
                Notes
                <textarea value={form.notes || ""} onChange={(event) => updateField("notes", event.target.value)} rows={3} />
              </label>
            </div>

            {editingContact ? (
              <RecordHistoryPanel entityType="contact" entityId={editingContact.id} />
            ) : null}

            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={closeForm}>Cancel</button>
              <button className="primary-action" type="submit" disabled={busy}>
                <Save size={18} />
                {busy ? "Saving..." : "Save Contact"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function PipelinePage({ user }) {
  const [opportunities, setOpportunities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    open: 0,
    won: 0,
    lost: 0,
    open_value: 0
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [stage, setStage] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [form, setForm] = useState(emptyOpportunity);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canCreate = hasPermission(user, PERMISSIONS.PIPELINE_CREATE);
  const canEdit = hasPermission(user, PERMISSIONS.PIPELINE_EDIT);
  const canViewCustomers = hasPermission(user, PERMISSIONS.CUSTOMERS_VIEW);
  const canViewContacts = hasPermission(user, PERMISSIONS.CONTACTS_VIEW);
  const canViewStaff = hasPermission(user, PERMISSIONS.STAFF_VIEW);

  async function loadPipeline() {
    const [summaryData, pipelineData, customersData, contactsData, staffData] = await Promise.all([
      getPipelineSummary(),
      listPipelineOpportunities({ search, status, stage, customer_id: customerId }),
      canViewCustomers ? listCustomers() : Promise.resolve({ customers: [] }),
      canViewContacts ? listContacts({ customer_id: customerId }) : Promise.resolve({ contacts: [] }),
      canViewStaff ? listStaffUsers() : Promise.resolve({ users: [] })
    ]);

    setSummary(summaryData.summary || {});
    setOpportunities(pipelineData.opportunities || []);
    setCustomers(customersData.customers || []);
    setContacts(contactsData.contacts || []);
    setStaffUsers(staffData.users || []);
  }

  useEffect(() => {
    loadPipeline().catch((err) => setError(err.message));
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    setError("");

    try {
      await loadPipeline();
    } catch (err) {
      setError(err.message);
    }
  }

  function openCreateForm() {
    setEditingOpportunity(null);
    setForm({
      ...emptyOpportunity,
      customer_id: customerId || customers[0]?.id || "",
      owner_user_id: ""
    });
    setFormOpen(true);
    setError("");
  }

  function openEditForm(opportunity) {
    setEditingOpportunity(opportunity);
    setForm({
      ...emptyOpportunity,
      ...opportunity,
      customer_id: opportunity.customer_id || "",
      contact_id: opportunity.contact_id || "",
      owner_user_id: opportunity.owner_user_id || "",
      estimated_value: opportunity.estimated_value || "",
      probability: opportunity.probability || 0,
      expected_close_date: formatDateForInput(opportunity.expected_close_date)
    });
    setFormOpen(true);
    setError("");
  }

  function closeForm() {
    setFormOpen(false);
    setEditingOpportunity(null);
    setForm(emptyOpportunity);
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function saveOpportunity(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload = {
        ...form,
        customer_id: Number(form.customer_id),
        contact_id: form.contact_id ? Number(form.contact_id) : null,
        owner_user_id: form.owner_user_id ? Number(form.owner_user_id) : null,
        estimated_value: Number(form.estimated_value || 0),
        probability: Number(form.probability || 0)
      };

      if (editingOpportunity) {
        await updatePipelineOpportunity(editingOpportunity.id, payload);
      } else {
        await createPipelineOpportunity(payload);
      }

      closeForm();
      await loadPipeline();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const visibleContacts = contacts.filter((contact) => !form.customer_id || String(contact.customer_id) === String(form.customer_id));
  const summaryCards = [
    { label: "Total Opportunities", value: summary.total || 0 },
    { label: "Open", value: summary.open || 0 },
    { label: "Open Value", value: Number(summary.open_value || 0).toLocaleString() },
    { label: "Won", value: summary.won || 0 },
    { label: "Lost", value: summary.lost || 0 }
  ];

  return (
    <div className="pipeline-page">
      <section className="page-intro">
        <div>
          <p className="eyebrow">CRM Pipeline Foundation</p>
          <h2>Sales opportunities and pipeline tracking</h2>
          <p>Track customer opportunities by stage, value, probability, owner and next action.</p>
        </div>

        {canCreate ? (
          <button className="primary-action" onClick={openCreateForm} disabled={!customers.length}>
            <Plus size={18} />
            Add Opportunity
          </button>
        ) : null}
      </section>

      {canCreate && !customers.length ? (
        <div className="login-error">Add a customer first before creating opportunities.</div>
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
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search opportunities or customers..." />
        </div>

        <select value={stage} onChange={(event) => setStage(event.target.value)}>
          <option value="">All stages</option>
          <option>Lead</option>
          <option>Qualified</option>
          <option>Proposal</option>
          <option>Negotiation</option>
          <option>Closed</option>
        </select>

        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All opportunities</option>
          <option>Open</option>
          <option>Won</option>
          <option>Lost</option>
          <option>On Hold</option>
        </select>

        <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
          <option value="">All customers</option>
          {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.company_name}</option>)}
        </select>

        <button className="secondary-button" type="submit">Search</button>
      </form>

      {error ? <div className="login-error">{error}</div> : null}

      <section className="table-card">
        <div className="table-header">
          <strong>Pipeline</strong>
          <span>{opportunities.length} shown</span>
        </div>

        {opportunities.length ? (
          <div className="customer-list">
            {opportunities.map((opportunity) => (
              <div className="customer-row pipeline-row" key={opportunity.id}>
                <div>
                  <strong>{opportunity.opportunity_name}</strong>
                  <span>{opportunity.opportunity_reference}</span>
                </div>
                <div>
                  <span>{opportunity.customer_name}</span>
                  <span>{opportunity.contact_name || "No contact"}</span>
                </div>
                <div>
                  <span>{opportunity.stage} / {opportunity.probability}%</span>
                  <span>{Number(opportunity.estimated_value || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className={`status-badge ${statusClassName(opportunity.status)}`}>{opportunity.status}</span>
                  <span>{opportunity.expected_close_date ? `Close: ${formatDateForDisplay(opportunity.expected_close_date)}` : "No close date"}</span>
                </div>
                <div className="row-actions">
                  {canEdit ? (
                    <button className="secondary-button" type="button" onClick={() => openEditForm(opportunity)}>
                      Edit
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No opportunities yet.</div>
        )}
      </section>

      {formOpen ? (
        <div className="modal-backdrop">
          <form className="customer-form" onSubmit={saveOpportunity}>
            <div className="form-header">
              <div>
                <p className="eyebrow">{editingOpportunity ? "Edit Opportunity" : "New Opportunity"}</p>
                <h2>{editingOpportunity ? editingOpportunity.opportunity_reference : "Add opportunity"}</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <label>
                Customer
                <select value={form.customer_id} onChange={(event) => updateField("customer_id", event.target.value)} required>
                  <option value="">Select customer</option>
                  {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.company_name}</option>)}
                </select>
              </label>

              <label>
                Contact
                <select value={form.contact_id} onChange={(event) => updateField("contact_id", event.target.value)}>
                  <option value="">No contact</option>
                  {visibleContacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.first_name} {contact.last_name || ""}</option>)}
                </select>
              </label>

              <Field label="Opportunity reference" value={form.opportunity_reference} onChange={(value) => updateField("opportunity_reference", value)} placeholder={editingOpportunity ? "" : "Auto-generated if blank"} />
              <Field label="Opportunity name" value={form.opportunity_name} onChange={(value) => updateField("opportunity_name", value)} required />

              <label>
                Stage
                <select value={form.stage} onChange={(event) => updateField("stage", event.target.value)}>
                  <option>Lead</option>
                  <option>Qualified</option>
                  <option>Proposal</option>
                  <option>Negotiation</option>
                  <option>Closed</option>
                </select>
              </label>

              <label>
                Status
                <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option>Open</option>
                  <option>Won</option>
                  <option>Lost</option>
                  <option>On Hold</option>
                </select>
              </label>

              <Field label="Estimated value" value={form.estimated_value} onChange={(value) => updateField("estimated_value", value)} type="number" />
              <Field label="Probability" value={form.probability} onChange={(value) => updateField("probability", value)} type="number" />
              <Field label="Expected close date" value={form.expected_close_date} onChange={(value) => updateField("expected_close_date", value)} type="date" />

              <label>
                Owner
                <select value={form.owner_user_id} onChange={(event) => updateField("owner_user_id", event.target.value)}>
                  <option value="">No owner</option>
                  {staffUsers.map((staffUser) => <option key={staffUser.id} value={staffUser.id}>{staffUser.name} - {staffUser.role}</option>)}
                </select>
              </label>

              <Field label="Source" value={form.source} onChange={(value) => updateField("source", value)} />

              <label className="wide-field">
                Next action
                <textarea value={form.next_action || ""} onChange={(event) => updateField("next_action", event.target.value)} rows={3} />
              </label>

              <label className="wide-field">
                Notes
                <textarea value={form.notes || ""} onChange={(event) => updateField("notes", event.target.value)} rows={3} />
              </label>
            </div>

            {editingOpportunity ? (
              <RecordHistoryPanel entityType="pipeline_opportunity" entityId={editingOpportunity.id} />
            ) : null}

            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={closeForm}>Cancel</button>
              <button className="primary-action" type="submit" disabled={busy}>
                <Save size={18} />
                {busy ? "Saving..." : "Save Opportunity"}
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
              <div
                className="customer-row building-row"
                key={building.id}
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
                <div className="row-actions">
                  {canEditBuilding ? (
                    <button className="secondary-button" type="button" onClick={() => openEditForm(building)}>
                      Edit
                    </button>
                  ) : null}
                </div>
              </div>
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

            {editingBuilding ? (
              <RecordHistoryPanel entityType="building" entityId={editingBuilding.id} />
            ) : null}

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
              <div
                className="customer-row asset-row"
                key={asset.id}
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
                <div className="row-actions">
                  {canEditAsset ? (
                    <button className="secondary-button" type="button" onClick={() => openEditForm(asset)}>
                      Edit
                    </button>
                  ) : null}
                </div>
              </div>
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
              <RecordHistoryPanel entityType="asset" entityId={editingAsset.id} />
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
              <div
                className="customer-row people-row"
                key={profile.id}
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
                <div className="row-actions">
                  {canEdit ? (
                    <button className="secondary-button" type="button" onClick={() => openEditForm(profile)}>
                      Edit
                    </button>
                  ) : null}
                </div>
              </div>
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
              <RecordHistoryPanel entityType="staff_profile" entityId={editingProfile.id} />
            ) : null}

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
              <div
                className="customer-row work-order-row"
                key={workOrder.id}
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
                <div className="row-actions">
                  {canEdit ? (
                    <button className="secondary-button" type="button" onClick={() => openEditForm(workOrder)}>
                      Edit
                    </button>
                  ) : null}
                </div>
              </div>
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

            {editingWorkOrder ? (
              <RecordHistoryPanel entityType="work_order" entityId={editingWorkOrder.id} />
            ) : null}

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
              <div
                className="customer-row schedule-row"
                key={assignment.id}
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
                <div className="row-actions">
                  {canEdit ? (
                    <button className="secondary-button" type="button" onClick={() => openEditForm(assignment)}>
                      Edit
                    </button>
                  ) : null}
                </div>
              </div>
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

            {editingAssignment ? (
              <RecordHistoryPanel entityType="schedule_assignment" entityId={editingAssignment.id} />
            ) : null}

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

function MaintenancePlansPage({ user }) {
  const [plans, setPlans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [assets, setAssets] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    overdue: 0,
    due_soon: 0,
    paused: 0,
    retired: 0
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [frequency, setFrequency] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState(emptyMaintenancePlan);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canCreate = hasPermission(user, PERMISSIONS.MAINTENANCE_PLANS_CREATE);
  const canEdit = hasPermission(user, PERMISSIONS.MAINTENANCE_PLANS_EDIT);
  const canViewCustomers = hasPermission(user, PERMISSIONS.CUSTOMERS_VIEW);
  const canViewBuildings = hasPermission(user, PERMISSIONS.BUILDINGS_VIEW);
  const canViewAssets = hasPermission(user, PERMISSIONS.ASSETS_VIEW);
  const canViewStaff = hasPermission(user, PERMISSIONS.STAFF_VIEW);

  async function loadPlans() {
    const [summaryData, plansData, customersData, buildingsData, assetsData, staffData] = await Promise.all([
      getMaintenancePlanSummary(),
      listMaintenancePlans({ search, status, frequency }),
      canViewCustomers ? listCustomers() : Promise.resolve({ customers: [] }),
      canViewBuildings ? listBuildings() : Promise.resolve({ buildings: [] }),
      canViewAssets ? listAssets() : Promise.resolve({ assets: [] }),
      canViewStaff ? listStaffUsers() : Promise.resolve({ users: [] })
    ]);

    setSummary(summaryData.summary || {});
    setPlans(plansData.maintenance_plans || []);
    setCustomers(customersData.customers || []);
    setBuildings(buildingsData.buildings || []);
    setAssets(assetsData.assets || []);
    setStaffUsers(staffData.users || []);
  }

  useEffect(() => {
    loadPlans().catch((err) => setError(err.message));
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    setError("");

    try {
      await loadPlans();
    } catch (err) {
      setError(err.message);
    }
  }

  function openCreateForm() {
    setEditingPlan(null);
    setForm({
      ...emptyMaintenancePlan,
      customer_id: customers[0]?.id || "",
      building_id: buildings[0]?.id || "",
      asset_id: "",
      assigned_user_id: ""
    });
    setFormOpen(true);
    setError("");
  }

  function openEditForm(plan) {
    setEditingPlan(plan);
    setForm({
      ...emptyMaintenancePlan,
      ...plan,
      customer_id: plan.customer_id || "",
      building_id: plan.building_id || "",
      asset_id: plan.asset_id || "",
      assigned_user_id: plan.assigned_user_id || "",
      start_date: formatDateForInput(plan.start_date),
      next_due_date: formatDateForInput(plan.next_due_date),
      last_generated_date: formatDateForInput(plan.last_generated_date),
      estimated_duration_minutes: plan.estimated_duration_minutes || ""
    });
    setFormOpen(true);
    setError("");
  }

  function closeForm() {
    setFormOpen(false);
    setEditingPlan(null);
    setForm(emptyMaintenancePlan);
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function savePlan(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload = {
        ...form,
        customer_id: form.customer_id ? Number(form.customer_id) : null,
        building_id: form.building_id ? Number(form.building_id) : null,
        asset_id: form.asset_id ? Number(form.asset_id) : null,
        assigned_user_id: form.assigned_user_id ? Number(form.assigned_user_id) : null,
        estimated_duration_minutes: form.estimated_duration_minutes ? Number(form.estimated_duration_minutes) : null
      };

      if (editingPlan) {
        await updateMaintenancePlan(editingPlan.id, payload);
      } else {
        await createMaintenancePlan(payload);
      }

      closeForm();
      await loadPlans();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const summaryCards = [
    { label: "Total", value: summary.total || 0 },
    { label: "Active", value: summary.active || 0 },
    { label: "Overdue", value: summary.overdue || 0 },
    { label: "Due Soon", value: summary.due_soon || 0 },
    { label: "Paused", value: summary.paused || 0 },
    { label: "Retired", value: summary.retired || 0 }
  ];

  return (
    <div className="maintenance-plans-page">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Planned Preventive Maintenance</p>
          <h2>Recurring maintenance plans</h2>
          <p>Manage planned maintenance by customer, site, asset, frequency and next due date.</p>
        </div>

        {canCreate ? (
          <button className="primary-action" onClick={openCreateForm}>
            <Plus size={18} />
            Add Plan
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
            placeholder="Search maintenance plans, customers, buildings or assets..."
          />
        </div>

        <select value={frequency} onChange={(event) => setFrequency(event.target.value)}>
          <option value="">All frequencies</option>
          <option>Weekly</option>
          <option>Monthly</option>
          <option>Quarterly</option>
          <option>Six Monthly</option>
          <option>Annual</option>
        </select>

        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option>Active</option>
          <option>Paused</option>
          <option>Retired</option>
        </select>

        <button className="secondary-button" type="submit">Search</button>
      </form>

      {error ? <div className="login-error">{error}</div> : null}

      <section className="table-card">
        <div className="table-header">
          <strong>Maintenance Plans</strong>
          <span>{plans.length} shown</span>
        </div>

        {plans.length ? (
          <div className="customer-list">
            {plans.map((plan) => (
              <div className="customer-row maintenance-plan-row" key={plan.id}>
                <div>
                  <strong>{plan.title}</strong>
                  <span>{plan.plan_reference}</span>
                </div>
                <div>
                  <span>{plan.frequency} / {plan.priority}</span>
                  <span>{plan.asset_reference || plan.asset_name || "No asset"}</span>
                </div>
                <div>
                  <span>{plan.customer_name || "No customer"}</span>
                  <span>{plan.building_name || "No building"}</span>
                </div>
                <div>
                  <span className={`status-badge ${statusClassName(plan.status)}`}>{plan.status}</span>
                  <span>{plan.next_due_date ? `Next: ${formatDateForDisplay(plan.next_due_date)}` : "No due date"}</span>
                </div>
                <div className="row-actions">
                  {canEdit ? (
                    <button className="secondary-button" type="button" onClick={() => openEditForm(plan)}>
                      Edit
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No maintenance plans yet.</div>
        )}
      </section>

      {formOpen ? (
        <div className="modal-backdrop">
          <form className="customer-form" onSubmit={savePlan}>
            <div className="form-header">
              <div>
                <p className="eyebrow">{editingPlan ? "Edit Plan" : "New Plan"}</p>
                <h2>{editingPlan ? editingPlan.plan_reference : "Add maintenance plan"}</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <Field label="Plan reference" value={form.plan_reference} onChange={(value) => updateField("plan_reference", value)} placeholder={editingPlan ? "" : "Auto-generated if blank"} />
              <Field label="Title" value={form.title} onChange={(value) => updateField("title", value)} required />

              <label>
                Plan type
                <select value={form.plan_type} onChange={(event) => updateField("plan_type", event.target.value)}>
                  <option>Planned Maintenance</option>
                  <option>Inspection</option>
                  <option>Service</option>
                  <option>Compliance Check</option>
                </select>
              </label>

              <label>
                Frequency
                <select value={form.frequency} onChange={(event) => updateField("frequency", event.target.value)}>
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Quarterly</option>
                  <option>Six Monthly</option>
                  <option>Annual</option>
                </select>
              </label>

              <label>
                Status
                <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option>Active</option>
                  <option>Paused</option>
                  <option>Retired</option>
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
                    <option key={building.id} value={building.id}>{building.name} - {building.customer_name}</option>
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

              <label>
                Assigned user
                <select value={form.assigned_user_id} onChange={(event) => updateField("assigned_user_id", event.target.value)}>
                  <option value="">Unassigned</option>
                  {staffUsers.map((staffUser) => (
                    <option key={staffUser.id} value={staffUser.id}>{staffUser.name} - {staffUser.role}</option>
                  ))}
                </select>
              </label>

              <Field label="Start date" value={form.start_date} onChange={(value) => updateField("start_date", value)} type="date" />
              <Field label="Next due date" value={form.next_due_date} onChange={(value) => updateField("next_due_date", value)} type="date" />
              <Field label="Last generated date" value={form.last_generated_date} onChange={(value) => updateField("last_generated_date", value)} type="date" />
              <Field label="Estimated duration minutes" value={form.estimated_duration_minutes} onChange={(value) => updateField("estimated_duration_minutes", value)} type="number" />

              <label className="wide-field">
                Instructions
                <textarea value={form.instructions || ""} onChange={(event) => updateField("instructions", event.target.value)} rows={4} />
              </label>

              <label className="wide-field">
                Notes
                <textarea value={form.notes || ""} onChange={(event) => updateField("notes", event.target.value)} rows={3} />
              </label>
            </div>

            {editingPlan ? (
              <RecordHistoryPanel entityType="maintenance_plan" entityId={editingPlan.id} />
            ) : null}

            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={closeForm}>Cancel</button>
              <button className="primary-action" type="submit" disabled={busy}>
                <Save size={18} />
                {busy ? "Saving..." : "Save Plan"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function ComplianceServicesPage({ user }) {
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [assets, setAssets] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    planned: 0,
    in_progress: 0,
    passed: 0,
    failed: 0,
    defects: 0,
    approved: 0
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [resultStatus, setResultStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [form, setForm] = useState(emptyComplianceService);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canCreate = hasPermission(user, PERMISSIONS.COMPLIANCE_SERVICES_CREATE);
  const canEdit = hasPermission(user, PERMISSIONS.COMPLIANCE_SERVICES_EDIT);
  const canApprove = hasPermission(user, PERMISSIONS.COMPLIANCE_SERVICES_APPROVE);
  const canViewCustomers = hasPermission(user, PERMISSIONS.CUSTOMERS_VIEW);
  const canViewBuildings = hasPermission(user, PERMISSIONS.BUILDINGS_VIEW);
  const canViewAssets = hasPermission(user, PERMISSIONS.ASSETS_VIEW);
  const canViewWorkOrders = hasPermission(user, PERMISSIONS.WORK_ORDERS_VIEW);
  const canViewStaff = hasPermission(user, PERMISSIONS.STAFF_VIEW);

  async function loadServices() {
    const [summaryData, servicesData, customersData, buildingsData, assetsData, workOrdersData, staffData] = await Promise.all([
      getComplianceServiceSummary(),
      listComplianceServices({ search, status, service_type: serviceType, result_status: resultStatus }),
      canViewCustomers ? listCustomers() : Promise.resolve({ customers: [] }),
      canViewBuildings ? listBuildings() : Promise.resolve({ buildings: [] }),
      canViewAssets ? listAssets() : Promise.resolve({ assets: [] }),
      canViewWorkOrders ? listWorkOrders() : Promise.resolve({ work_orders: [] }),
      canViewStaff ? listStaffUsers() : Promise.resolve({ users: [] })
    ]);

    setSummary(summaryData.summary || {});
    setServices(servicesData.compliance_services || []);
    setCustomers(customersData.customers || []);
    setBuildings(buildingsData.buildings || []);
    setAssets(assetsData.assets || []);
    setWorkOrders(workOrdersData.work_orders || []);
    setStaffUsers(staffData.users || []);
  }

  useEffect(() => {
    loadServices().catch((err) => setError(err.message));
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    setError("");

    try {
      await loadServices();
    } catch (err) {
      setError(err.message);
    }
  }

  function openCreateForm() {
    setEditingService(null);
    setForm({
      ...emptyComplianceService,
      customer_id: customers[0]?.id || "",
      building_id: buildings[0]?.id || "",
      asset_id: "",
      work_order_id: "",
      assigned_user_id: ""
    });
    setFormOpen(true);
    setError("");
  }

  function openEditForm(service) {
    setEditingService(service);
    setForm({
      ...emptyComplianceService,
      ...service,
      customer_id: service.customer_id || "",
      building_id: service.building_id || "",
      asset_id: service.asset_id || "",
      work_order_id: service.work_order_id || "",
      assigned_user_id: service.assigned_user_id || "",
      scheduled_date: formatDateForInput(service.scheduled_date),
      completed_date: formatDateForInput(service.completed_date)
    });
    setFormOpen(true);
    setError("");
  }

  function closeForm() {
    setFormOpen(false);
    setEditingService(null);
    setForm(emptyComplianceService);
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function saveService(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload = {
        ...form,
        customer_id: form.customer_id ? Number(form.customer_id) : null,
        building_id: form.building_id ? Number(form.building_id) : null,
        asset_id: form.asset_id ? Number(form.asset_id) : null,
        work_order_id: form.work_order_id ? Number(form.work_order_id) : null,
        assigned_user_id: form.assigned_user_id ? Number(form.assigned_user_id) : null
      };

      if (editingService) {
        await updateComplianceService(editingService.id, payload);
      } else {
        await createComplianceService(payload);
      }

      closeForm();
      await loadServices();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const summaryCards = [
    { label: "Total", value: summary.total || 0 },
    { label: "Planned", value: summary.planned || 0 },
    { label: "In Progress", value: summary.in_progress || 0 },
    { label: "Passed", value: summary.passed || 0 },
    { label: "Failed", value: summary.failed || 0 },
    { label: "Defects", value: summary.defects || 0 },
    { label: "Approved", value: summary.approved || 0 }
  ];

  return (
    <div className="compliance-services-page">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Compliance Service Modules</p>
          <h2>Inspection, testing and audit services</h2>
          <p>Track PAT testing, fire inspections, electrical compliance and technical audits.</p>
        </div>

        {canCreate ? (
          <button className="primary-action" onClick={openCreateForm}>
            <Plus size={18} />
            Add Service
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

      <form className="filter-bar assets-filter" onSubmit={handleSearch}>
        <div className="search-box">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search compliance services, customers, buildings or assets..." />
        </div>

        <select value={serviceType} onChange={(event) => setServiceType(event.target.value)}>
          <option value="">All service types</option>
          <option>PAT Testing</option>
          <option>Fire Door Inspection</option>
          <option>Fire Damper Testing</option>
          <option>Electrical Compliance</option>
          <option>Technical Compliance Audit</option>
          <option>General Building Maintenance</option>
        </select>

        <select value={resultStatus} onChange={(event) => setResultStatus(event.target.value)}>
          <option value="">All results</option>
          <option>Not Started</option>
          <option>Pass</option>
          <option>Fail</option>
          <option>Advisory</option>
        </select>

        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option>Planned</option>
          <option>In Progress</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </select>

        <button className="secondary-button" type="submit">Search</button>
      </form>

      {error ? <div className="login-error">{error}</div> : null}

      <section className="table-card">
        <div className="table-header">
          <strong>Compliance Services</strong>
          <span>{services.length} shown</span>
        </div>

        {services.length ? (
          <div className="customer-list">
            {services.map((service) => (
              <div className="customer-row compliance-service-row" key={service.id}>
                <div>
                  <strong>{service.service_name}</strong>
                  <span>{service.service_reference}</span>
                </div>
                <div>
                  <span>{service.service_type}</span>
                  <span>{service.result_status} / {service.risk_rating}</span>
                </div>
                <div>
                  <span>{service.customer_name || "No customer"}</span>
                  <span>{service.building_name || service.asset_reference || "No site or asset"}</span>
                </div>
                <div>
                  <span className={`status-badge ${statusClassName(service.status)}`}>{service.status}</span>
                  <span>{service.scheduled_date ? `Scheduled: ${formatDateForDisplay(service.scheduled_date)}` : "No date"}</span>
                </div>
                <div className="row-actions">
                  {canEdit ? (
                    <button className="secondary-button" type="button" onClick={() => openEditForm(service)}>
                      Edit
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No compliance services yet.</div>
        )}
      </section>

      {formOpen ? (
        <div className="modal-backdrop">
          <form className="customer-form" onSubmit={saveService}>
            <div className="form-header">
              <div>
                <p className="eyebrow">{editingService ? "Edit Service" : "New Service"}</p>
                <h2>{editingService ? editingService.service_reference : "Add compliance service"}</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <Field label="Service reference" value={form.service_reference} onChange={(value) => updateField("service_reference", value)} placeholder={editingService ? "" : "Auto-generated if blank"} />
              <Field label="Service name" value={form.service_name} onChange={(value) => updateField("service_name", value)} required />

              <label>
                Service type
                <select value={form.service_type} onChange={(event) => updateField("service_type", event.target.value)}>
                  <option>PAT Testing</option>
                  <option>Fire Door Inspection</option>
                  <option>Fire Damper Testing</option>
                  <option>Electrical Compliance</option>
                  <option>Technical Compliance Audit</option>
                  <option>General Building Maintenance</option>
                </select>
              </label>

              <label>
                Status
                <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option>Planned</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
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
                Result
                <select value={form.result_status} onChange={(event) => updateField("result_status", event.target.value)}>
                  <option>Not Started</option>
                  <option>Pass</option>
                  <option>Fail</option>
                  <option>Advisory</option>
                </select>
              </label>

              <label>
                Risk rating
                <select value={form.risk_rating} onChange={(event) => updateField("risk_rating", event.target.value)}>
                  <option>Unrated</option>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </label>

              <label>
                Customer
                <select value={form.customer_id} onChange={(event) => updateField("customer_id", event.target.value)}>
                  <option value="">No customer</option>
                  {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.company_name}</option>)}
                </select>
              </label>

              <label>
                Building
                <select value={form.building_id} onChange={(event) => updateField("building_id", event.target.value)}>
                  <option value="">No building</option>
                  {buildings.map((building) => <option key={building.id} value={building.id}>{building.name} - {building.customer_name}</option>)}
                </select>
              </label>

              <label>
                Asset
                <select value={form.asset_id} onChange={(event) => updateField("asset_id", event.target.value)}>
                  <option value="">No asset</option>
                  {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.asset_reference} - {asset.asset_name}</option>)}
                </select>
              </label>

              <label>
                Work order
                <select value={form.work_order_id} onChange={(event) => updateField("work_order_id", event.target.value)}>
                  <option value="">No work order</option>
                  {workOrders.map((workOrder) => <option key={workOrder.id} value={workOrder.id}>{workOrder.work_order_reference} - {workOrder.title}</option>)}
                </select>
              </label>

              <label>
                Assigned user
                <select value={form.assigned_user_id} onChange={(event) => updateField("assigned_user_id", event.target.value)}>
                  <option value="">Unassigned</option>
                  {staffUsers.map((staffUser) => <option key={staffUser.id} value={staffUser.id}>{staffUser.name} - {staffUser.role}</option>)}
                </select>
              </label>

              <Field label="Scheduled date" value={form.scheduled_date} onChange={(value) => updateField("scheduled_date", value)} type="date" />
              <Field label="Completed date" value={form.completed_date} onChange={(value) => updateField("completed_date", value)} type="date" />

              <label>
                Certificate status
                <select value={form.certificate_status} onChange={(event) => updateField("certificate_status", event.target.value)}>
                  <option>Not Required</option>
                  <option>Required</option>
                  <option>Draft</option>
                  <option>Issued</option>
                </select>
              </label>

              <label>
                Report status
                <select value={form.report_status} onChange={(event) => updateField("report_status", event.target.value)} disabled={!canApprove && form.report_status === "Approved"}>
                  <option>Draft</option>
                  <option>Ready for Review</option>
                  {canApprove ? <option>Approved</option> : null}
                  <option>Issued</option>
                </select>
              </label>

              <label className="inline-toggle">
                <input type="checkbox" checked={form.defects_found} onChange={(event) => updateField("defects_found", event.target.checked)} />
                Defects found
              </label>

              <label className="inline-toggle">
                <input type="checkbox" checked={form.certificate_required} onChange={(event) => updateField("certificate_required", event.target.checked)} />
                Certificate required
              </label>

              <label className="wide-field">
                Findings
                <textarea value={form.findings || ""} onChange={(event) => updateField("findings", event.target.value)} rows={4} />
              </label>

              <label className="wide-field">
                Corrective actions
                <textarea value={form.corrective_actions || ""} onChange={(event) => updateField("corrective_actions", event.target.value)} rows={3} />
              </label>

              <label className="wide-field">
                Notes
                <textarea value={form.notes || ""} onChange={(event) => updateField("notes", event.target.value)} rows={3} />
              </label>
            </div>

            {editingService ? (
              <RecordHistoryPanel entityType="compliance_service" entityId={editingService.id} />
            ) : null}

            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={closeForm}>Cancel</button>
              <button className="primary-action" type="submit" disabled={busy}>
                <Save size={18} />
                {busy ? "Saving..." : "Save Service"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function FormTemplatesPage({ user }) {
  const [templates, setTemplates] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    draft: 0,
    active: 0,
    archived: 0,
    approval_required: 0
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [form, setForm] = useState(emptyFormTemplate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canCreate = hasPermission(user, PERMISSIONS.FORM_TEMPLATES_CREATE);
  const canEdit = hasPermission(user, PERMISSIONS.FORM_TEMPLATES_EDIT);
  const canApprove = hasPermission(user, PERMISSIONS.FORM_TEMPLATES_APPROVE);

  async function loadTemplates() {
    const [summaryData, templatesData] = await Promise.all([
      getFormTemplateSummary(),
      listFormTemplates({ search, status, service_type: serviceType })
    ]);

    setSummary(summaryData.summary || {});
    setTemplates(templatesData.form_templates || []);
  }

  useEffect(() => {
    loadTemplates().catch((err) => setError(err.message));
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    setError("");

    try {
      await loadTemplates();
    } catch (err) {
      setError(err.message);
    }
  }

  function openCreateForm() {
    setEditingTemplate(null);
    setForm(emptyFormTemplate);
    setFormOpen(true);
    setError("");
  }

  function openEditForm(template) {
    setEditingTemplate(template);
    setForm({
      ...emptyFormTemplate,
      ...template,
      template_reference: template.template_reference || "",
      version_number: template.version_number || 1,
      scoring_enabled: Boolean(template.scoring_enabled),
      approval_required: Boolean(template.approval_required),
      sections_text: JSON.stringify(template.sections || [], null, 2)
    });
    setFormOpen(true);
    setError("");
  }

  function closeForm() {
    setFormOpen(false);
    setEditingTemplate(null);
    setForm(emptyFormTemplate);
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function saveTemplate(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      let sections;

      try {
        sections = JSON.parse(form.sections_text || "[]");
      } catch (err) {
        throw new Error("Sections JSON must be valid JSON.");
      }

      if (!Array.isArray(sections)) {
        throw new Error("Sections JSON must be an array.");
      }

      const payload = {
        ...form,
        version_number: Number(form.version_number) || 1,
        sections
      };

      delete payload.sections_text;

      if (editingTemplate) {
        await updateFormTemplate(editingTemplate.id, payload);
      } else {
        await createFormTemplate(payload);
      }

      closeForm();
      await loadTemplates();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const summaryCards = [
    { label: "Total", value: summary.total || 0 },
    { label: "Draft", value: summary.draft || 0 },
    { label: "Active", value: summary.active || 0 },
    { label: "Archived", value: summary.archived || 0 },
    { label: "Approval Required", value: summary.approval_required || 0 }
  ];

  return (
    <div className="form-templates-page">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Forms and Inspection Builder</p>
          <h2>Reusable inspection templates</h2>
          <p>Build form templates with sections, questions, answer types and scoring rules.</p>
        </div>

        {canCreate ? (
          <button className="primary-action" onClick={openCreateForm}>
            <Plus size={18} />
            Add Template
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

      <form className="filter-bar assets-filter" onSubmit={handleSearch}>
        <div className="search-box">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search form templates..." />
        </div>

        <select value={serviceType} onChange={(event) => setServiceType(event.target.value)}>
          <option value="">All service types</option>
          <option>PAT Testing</option>
          <option>Fire Door Inspection</option>
          <option>Fire Damper Testing</option>
          <option>Electrical Compliance</option>
          <option>Technical Compliance Audit</option>
          <option>General Building Maintenance</option>
        </select>

        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All templates</option>
          <option>Draft</option>
          <option>Active</option>
          <option>Archived</option>
        </select>

        <button className="secondary-button" type="submit">Search</button>
      </form>

      {error ? <div className="login-error">{error}</div> : null}

      <section className="table-card">
        <div className="table-header">
          <strong>Forms Builder</strong>
          <span>{templates.length} shown</span>
        </div>

        {templates.length ? (
          <div className="customer-list">
            {templates.map((template) => (
              <div className="customer-row form-template-row" key={template.id}>
                <div>
                  <strong>{template.template_name}</strong>
                  <span>{template.template_reference}</span>
                </div>
                <div>
                  <span>{template.service_type}</span>
                  <span>Version {template.version_number}</span>
                </div>
                <div>
                  <span>{template.section_count || 0} sections</span>
                  <span>{template.question_count || 0} questions</span>
                </div>
                <div>
                  <span className={`status-badge ${statusClassName(template.status)}`}>{template.status}</span>
                  <span>{template.scoring_enabled ? "Scoring enabled" : "Scoring disabled"}</span>
                </div>
                <div className="row-actions">
                  {canEdit ? (
                    <button className="secondary-button" type="button" onClick={() => openEditForm(template)}>
                      Edit
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No form templates yet.</div>
        )}
      </section>

      {formOpen ? (
        <div className="modal-backdrop">
          <form className="customer-form" onSubmit={saveTemplate}>
            <div className="form-header">
              <div>
                <p className="eyebrow">{editingTemplate ? "Edit Template" : "New Template"}</p>
                <h2>{editingTemplate ? editingTemplate.template_reference : "Add form template"}</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <Field label="Template reference" value={form.template_reference} onChange={(value) => updateField("template_reference", value)} placeholder={editingTemplate ? "" : "Auto-generated if blank"} />
              <Field label="Template name" value={form.template_name} onChange={(value) => updateField("template_name", value)} required />

              <label>
                Service type
                <select value={form.service_type} onChange={(event) => updateField("service_type", event.target.value)}>
                  <option>PAT Testing</option>
                  <option>Fire Door Inspection</option>
                  <option>Fire Damper Testing</option>
                  <option>Electrical Compliance</option>
                  <option>Technical Compliance Audit</option>
                  <option>General Building Maintenance</option>
                </select>
              </label>

              <label>
                Status
                <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option>Draft</option>
                  {canApprove || form.status === "Active" ? <option>Active</option> : null}
                  <option>Archived</option>
                </select>
              </label>

              <Field label="Version" value={form.version_number} onChange={(value) => updateField("version_number", value)} type="number" />

              <label className="inline-toggle">
                <input type="checkbox" checked={form.scoring_enabled} onChange={(event) => updateField("scoring_enabled", event.target.checked)} />
                Scoring enabled
              </label>

              <label className="inline-toggle">
                <input type="checkbox" checked={form.approval_required} onChange={(event) => updateField("approval_required", event.target.checked)} />
                Approval required
              </label>

              <label className="wide-field">
                Description
                <textarea value={form.description || ""} onChange={(event) => updateField("description", event.target.value)} rows={3} />
              </label>

              <label className="wide-field">
                Sections JSON
                <textarea value={form.sections_text || ""} onChange={(event) => updateField("sections_text", event.target.value)} rows={14} />
              </label>
            </div>

            {editingTemplate ? (
              <RecordHistoryPanel entityType="form_template" entityId={editingTemplate.id} />
            ) : null}

            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={closeForm}>Cancel</button>
              <button className="primary-action" type="submit" disabled={busy}>
                <Save size={18} />
                {busy ? "Saving..." : "Save Template"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function ReportsPage({ user }) {
  const [reports, setReports] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [assets, setAssets] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    draft: 0,
    ready_for_review: 0,
    approved: 0,
    issued: 0
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [reportType, setReportType] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [form, setForm] = useState(emptyReport);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canCreate = hasPermission(user, PERMISSIONS.REPORTS_CREATE);
  const canEdit = hasPermission(user, PERMISSIONS.REPORTS_EDIT);
  const canApprove = hasPermission(user, PERMISSIONS.REPORTS_APPROVE);
  const canExport = hasPermission(user, PERMISSIONS.REPORTS_EXPORT);
  const canViewCustomers = hasPermission(user, PERMISSIONS.CUSTOMERS_VIEW);
  const canViewBuildings = hasPermission(user, PERMISSIONS.BUILDINGS_VIEW);
  const canViewAssets = hasPermission(user, PERMISSIONS.ASSETS_VIEW);
  const canViewWorkOrders = hasPermission(user, PERMISSIONS.WORK_ORDERS_VIEW);
  const canViewServices = hasPermission(user, PERMISSIONS.COMPLIANCE_SERVICES_VIEW);

  async function loadReports() {
    const [summaryData, reportsData, customersData, buildingsData, assetsData, workOrdersData, servicesData] = await Promise.all([
      getReportSummary(),
      listReports({ search, status, report_type: reportType, customer_id: customerId }),
      canViewCustomers ? listCustomers() : Promise.resolve({ customers: [] }),
      canViewBuildings ? listBuildings() : Promise.resolve({ buildings: [] }),
      canViewAssets ? listAssets() : Promise.resolve({ assets: [] }),
      canViewWorkOrders ? listWorkOrders() : Promise.resolve({ work_orders: [] }),
      canViewServices ? listComplianceServices() : Promise.resolve({ compliance_services: [] })
    ]);

    setSummary(summaryData.summary || {});
    setReports(reportsData.reports || []);
    setCustomers(customersData.customers || []);
    setBuildings(buildingsData.buildings || []);
    setAssets(assetsData.assets || []);
    setWorkOrders(workOrdersData.work_orders || []);
    setServices(servicesData.compliance_services || []);
  }

  useEffect(() => {
    loadReports().catch((err) => setError(err.message));
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    setError("");

    try {
      await loadReports();
    } catch (err) {
      setError(err.message);
    }
  }

  function openCreateForm() {
    setEditingReport(null);
    setForm({
      ...emptyReport,
      customer_id: customers[0]?.id || ""
    });
    setFormOpen(true);
    setError("");
  }

  function openEditForm(report) {
    setEditingReport(report);
    setForm({
      ...emptyReport,
      ...report,
      customer_id: report.customer_id || "",
      building_id: report.building_id || "",
      asset_id: report.asset_id || "",
      work_order_id: report.work_order_id || "",
      compliance_service_id: report.compliance_service_id || "",
      date_from: formatDateForInput(report.date_from),
      date_to: formatDateForInput(report.date_to)
    });
    setFormOpen(true);
    setError("");
  }

  function closeForm() {
    setFormOpen(false);
    setEditingReport(null);
    setForm(emptyReport);
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function saveReport(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload = {
        ...form,
        customer_id: form.customer_id ? Number(form.customer_id) : null,
        building_id: form.building_id ? Number(form.building_id) : null,
        asset_id: form.asset_id ? Number(form.asset_id) : null,
        work_order_id: form.work_order_id ? Number(form.work_order_id) : null,
        compliance_service_id: form.compliance_service_id ? Number(form.compliance_service_id) : null
      };

      if (editingReport) {
        await updateReport(editingReport.id, payload);
      } else {
        await createReport(payload);
      }

      closeForm();
      await loadReports();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleExport(report) {
    setError("");

    try {
      const blob = await exportReport(report.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.report_reference}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  const summaryCards = [
    { label: "Total", value: summary.total || 0 },
    { label: "Draft", value: summary.draft || 0 },
    { label: "Ready for Review", value: summary.ready_for_review || 0 },
    { label: "Approved", value: summary.approved || 0 },
    { label: "Issued", value: summary.issued || 0 }
  ];

  return (
    <div className="reports-page">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Reports Foundation</p>
          <h2>Operational and compliance reports</h2>
          <p>Create controlled reports for customers, buildings, assets, work orders and compliance services.</p>
        </div>

        {canCreate ? (
          <button className="primary-action" onClick={openCreateForm}>
            <Plus size={18} />
            Add Report
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

      <form className="filter-bar assets-filter" onSubmit={handleSearch}>
        <div className="search-box">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports..." />
        </div>

        <select value={reportType} onChange={(event) => setReportType(event.target.value)}>
          <option value="">All report types</option>
          <option>Compliance Summary</option>
          <option>Asset Condition</option>
          <option>Work Order Summary</option>
          <option>Service Report</option>
          <option>Customer Review</option>
        </select>

        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All reports</option>
          <option>Draft</option>
          <option>Ready for Review</option>
          <option>Approved</option>
          <option>Issued</option>
        </select>

        <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
          <option value="">All customers</option>
          {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.company_name}</option>)}
        </select>

        <button className="secondary-button" type="submit">Search</button>
      </form>

      {error ? <div className="login-error">{error}</div> : null}

      <section className="table-card">
        <div className="table-header">
          <strong>Reports</strong>
          <span>{reports.length} shown</span>
        </div>

        {reports.length ? (
          <div className="customer-list">
            {reports.map((report) => (
              <div className="customer-row report-row" key={report.id}>
                <div>
                  <strong>{report.report_title}</strong>
                  <span>{report.report_reference}</span>
                </div>
                <div>
                  <span>{report.report_type}</span>
                  <span>{report.customer_name || "No customer"}</span>
                </div>
                <div>
                  <span>{report.building_name || report.asset_reference || report.service_reference || "No linked record"}</span>
                  <span>{report.date_from || report.date_to ? `${formatDateForDisplay(report.date_from)} - ${formatDateForDisplay(report.date_to)}` : "No date range"}</span>
                </div>
                <div>
                  <span className={`status-badge ${statusClassName(report.status)}`}>{report.status}</span>
                  <span>{report.approved_by_name ? `Approved by ${report.approved_by_name}` : "Not approved"}</span>
                </div>
                <div className="row-actions">
                  {canExport ? (
                    <button className="secondary-button" type="button" onClick={() => handleExport(report)}>
                      Export
                    </button>
                  ) : null}
                  {canEdit ? (
                    <button className="secondary-button" type="button" onClick={() => openEditForm(report)}>
                      Edit
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No reports yet.</div>
        )}
      </section>

      {formOpen ? (
        <div className="modal-backdrop">
          <form className="customer-form" onSubmit={saveReport}>
            <div className="form-header">
              <div>
                <p className="eyebrow">{editingReport ? "Edit Report" : "New Report"}</p>
                <h2>{editingReport ? editingReport.report_reference : "Add report"}</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <Field label="Report reference" value={form.report_reference} onChange={(value) => updateField("report_reference", value)} placeholder={editingReport ? "" : "Auto-generated if blank"} />
              <Field label="Report title" value={form.report_title} onChange={(value) => updateField("report_title", value)} required />

              <label>
                Report type
                <select value={form.report_type} onChange={(event) => updateField("report_type", event.target.value)}>
                  <option>Compliance Summary</option>
                  <option>Asset Condition</option>
                  <option>Work Order Summary</option>
                  <option>Service Report</option>
                  <option>Customer Review</option>
                </select>
              </label>

              <label>
                Status
                <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option>Draft</option>
                  <option>Ready for Review</option>
                  {canApprove || form.status === "Approved" ? <option>Approved</option> : null}
                  <option>Issued</option>
                </select>
              </label>

              <label>
                Customer
                <select value={form.customer_id} onChange={(event) => updateField("customer_id", event.target.value)}>
                  <option value="">No customer</option>
                  {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.company_name}</option>)}
                </select>
              </label>

              <label>
                Building
                <select value={form.building_id} onChange={(event) => updateField("building_id", event.target.value)}>
                  <option value="">No building</option>
                  {buildings.map((building) => <option key={building.id} value={building.id}>{building.name} - {building.customer_name}</option>)}
                </select>
              </label>

              <label>
                Asset
                <select value={form.asset_id} onChange={(event) => updateField("asset_id", event.target.value)}>
                  <option value="">No asset</option>
                  {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.asset_reference} - {asset.asset_name}</option>)}
                </select>
              </label>

              <label>
                Work order
                <select value={form.work_order_id} onChange={(event) => updateField("work_order_id", event.target.value)}>
                  <option value="">No work order</option>
                  {workOrders.map((workOrder) => <option key={workOrder.id} value={workOrder.id}>{workOrder.work_order_reference} - {workOrder.title}</option>)}
                </select>
              </label>

              <label>
                Compliance service
                <select value={form.compliance_service_id} onChange={(event) => updateField("compliance_service_id", event.target.value)}>
                  <option value="">No compliance service</option>
                  {services.map((service) => <option key={service.id} value={service.id}>{service.service_reference} - {service.service_name}</option>)}
                </select>
              </label>

              <Field label="Date from" value={form.date_from} onChange={(value) => updateField("date_from", value)} type="date" />
              <Field label="Date to" value={form.date_to} onChange={(value) => updateField("date_to", value)} type="date" />

              <label className="wide-field">
                Summary
                <textarea value={form.summary || ""} onChange={(event) => updateField("summary", event.target.value)} rows={4} />
              </label>

              <label className="wide-field">
                Findings
                <textarea value={form.findings || ""} onChange={(event) => updateField("findings", event.target.value)} rows={4} />
              </label>

              <label className="wide-field">
                Recommendations
                <textarea value={form.recommendations || ""} onChange={(event) => updateField("recommendations", event.target.value)} rows={4} />
              </label>
            </div>

            {editingReport ? (
              <RecordHistoryPanel entityType="report" entityId={editingReport.id} />
            ) : null}

            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={closeForm}>Cancel</button>
              <button className="primary-action" type="submit" disabled={busy}>
                <Save size={18} />
                {busy ? "Saving..." : "Save Report"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function CertificatesPage({ user }) {
  const [certificates, setCertificates] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [assets, setAssets] = useState([]);
  const [services, setServices] = useState([]);
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    draft: 0,
    issued: 0,
    revoked: 0,
    expired: 0,
    expiring_soon: 0
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [certificateType, setCertificateType] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);
  const [form, setForm] = useState(emptyCertificate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canCreate = hasPermission(user, PERMISSIONS.CERTIFICATES_CREATE);
  const canEdit = hasPermission(user, PERMISSIONS.CERTIFICATES_EDIT);
  const canIssue = hasPermission(user, PERMISSIONS.CERTIFICATES_ISSUE);
  const canRevoke = hasPermission(user, PERMISSIONS.CERTIFICATES_REVOKE);
  const canExport = hasPermission(user, PERMISSIONS.CERTIFICATES_EXPORT);
  const canViewCustomers = hasPermission(user, PERMISSIONS.CUSTOMERS_VIEW);
  const canViewBuildings = hasPermission(user, PERMISSIONS.BUILDINGS_VIEW);
  const canViewAssets = hasPermission(user, PERMISSIONS.ASSETS_VIEW);
  const canViewServices = hasPermission(user, PERMISSIONS.COMPLIANCE_SERVICES_VIEW);
  const canViewReports = hasPermission(user, PERMISSIONS.REPORTS_VIEW);

  async function loadCertificates() {
    const [summaryData, certificatesData, customersData, buildingsData, assetsData, servicesData, reportsData] = await Promise.all([
      getCertificateSummary(),
      listCertificates({ search, status, certificate_type: certificateType, customer_id: customerId }),
      canViewCustomers ? listCustomers() : Promise.resolve({ customers: [] }),
      canViewBuildings ? listBuildings() : Promise.resolve({ buildings: [] }),
      canViewAssets ? listAssets() : Promise.resolve({ assets: [] }),
      canViewServices ? listComplianceServices() : Promise.resolve({ compliance_services: [] }),
      canViewReports ? listReports() : Promise.resolve({ reports: [] })
    ]);

    setSummary(summaryData.summary || {});
    setCertificates(certificatesData.certificates || []);
    setCustomers(customersData.customers || []);
    setBuildings(buildingsData.buildings || []);
    setAssets(assetsData.assets || []);
    setServices(servicesData.compliance_services || []);
    setReports(reportsData.reports || []);
  }

  useEffect(() => {
    loadCertificates().catch((err) => setError(err.message));
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    setError("");

    try {
      await loadCertificates();
    } catch (err) {
      setError(err.message);
    }
  }

  function openCreateForm() {
    setEditingCertificate(null);
    setForm({
      ...emptyCertificate,
      customer_id: customers[0]?.id || ""
    });
    setFormOpen(true);
    setError("");
  }

  function openEditForm(certificate) {
    setEditingCertificate(certificate);
    setForm({
      ...emptyCertificate,
      ...certificate,
      customer_id: certificate.customer_id || "",
      building_id: certificate.building_id || "",
      asset_id: certificate.asset_id || "",
      compliance_service_id: certificate.compliance_service_id || "",
      report_id: certificate.report_id || "",
      issue_date: formatDateForInput(certificate.issue_date),
      expiry_date: formatDateForInput(certificate.expiry_date)
    });
    setFormOpen(true);
    setError("");
  }

  function closeForm() {
    setFormOpen(false);
    setEditingCertificate(null);
    setForm(emptyCertificate);
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function saveCertificate(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload = {
        ...form,
        customer_id: form.customer_id ? Number(form.customer_id) : null,
        building_id: form.building_id ? Number(form.building_id) : null,
        asset_id: form.asset_id ? Number(form.asset_id) : null,
        compliance_service_id: form.compliance_service_id ? Number(form.compliance_service_id) : null,
        report_id: form.report_id ? Number(form.report_id) : null
      };

      if (editingCertificate) {
        await updateCertificate(editingCertificate.id, payload);
      } else {
        await createCertificate(payload);
      }

      closeForm();
      await loadCertificates();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleExport(certificate) {
    setError("");

    try {
      const blob = await exportCertificate(certificate.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${certificate.certificate_reference}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  const summaryCards = [
    { label: "Total", value: summary.total || 0 },
    { label: "Draft", value: summary.draft || 0 },
    { label: "Issued", value: summary.issued || 0 },
    { label: "Revoked", value: summary.revoked || 0 },
    { label: "Expired", value: summary.expired || 0 },
    { label: "Expiring Soon", value: summary.expiring_soon || 0 }
  ];

  return (
    <div className="certificates-page">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Certificates Foundation</p>
          <h2>Controlled compliance certificates</h2>
          <p>Create, issue, revoke and export certificates linked to services, reports, assets and customers.</p>
        </div>

        {canCreate ? (
          <button className="primary-action" onClick={openCreateForm}>
            <Plus size={18} />
            Add Certificate
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

      <form className="filter-bar assets-filter" onSubmit={handleSearch}>
        <div className="search-box">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search certificates..." />
        </div>

        <select value={certificateType} onChange={(event) => setCertificateType(event.target.value)}>
          <option value="">All certificate types</option>
          <option>Compliance Certificate</option>
          <option>Inspection Certificate</option>
          <option>Test Certificate</option>
          <option>Completion Certificate</option>
          <option>Safety Certificate</option>
        </select>

        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All certificates</option>
          <option>Draft</option>
          <option>Issued</option>
          <option>Revoked</option>
          <option>Expired</option>
        </select>

        <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
          <option value="">All customers</option>
          {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.company_name}</option>)}
        </select>

        <button className="secondary-button" type="submit">Search</button>
      </form>

      {error ? <div className="login-error">{error}</div> : null}

      <section className="table-card">
        <div className="table-header">
          <strong>Certificates</strong>
          <span>{certificates.length} shown</span>
        </div>

        {certificates.length ? (
          <div className="customer-list">
            {certificates.map((certificate) => (
              <div className="customer-row certificate-row" key={certificate.id}>
                <div>
                  <strong>{certificate.certificate_title}</strong>
                  <span>{certificate.certificate_reference}</span>
                </div>
                <div>
                  <span>{certificate.certificate_type}</span>
                  <span>{certificate.customer_name || "No customer"}</span>
                </div>
                <div>
                  <span>{certificate.asset_reference || certificate.service_reference || certificate.report_reference || "No linked record"}</span>
                  <span>{certificate.expiry_date ? `Expires: ${formatDateForDisplay(certificate.expiry_date)}` : "No expiry date"}</span>
                </div>
                <div>
                  <span className={`status-badge ${statusClassName(certificate.status)}`}>{certificate.status}</span>
                  <span>{certificate.issued_by_name ? `Issued by ${certificate.issued_by_name}` : "Not issued"}</span>
                </div>
                <div className="row-actions">
                  {canExport ? (
                    <button className="secondary-button" type="button" onClick={() => handleExport(certificate)}>
                      Export
                    </button>
                  ) : null}
                  {canEdit ? (
                    <button className="secondary-button" type="button" onClick={() => openEditForm(certificate)}>
                      Edit
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No certificates yet.</div>
        )}
      </section>

      {formOpen ? (
        <div className="modal-backdrop">
          <form className="customer-form" onSubmit={saveCertificate}>
            <div className="form-header">
              <div>
                <p className="eyebrow">{editingCertificate ? "Edit Certificate" : "New Certificate"}</p>
                <h2>{editingCertificate ? editingCertificate.certificate_reference : "Add certificate"}</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <Field label="Certificate reference" value={form.certificate_reference} onChange={(value) => updateField("certificate_reference", value)} placeholder={editingCertificate ? "" : "Auto-generated if blank"} />
              <Field label="Certificate title" value={form.certificate_title} onChange={(value) => updateField("certificate_title", value)} required />

              <label>
                Certificate type
                <select value={form.certificate_type} onChange={(event) => updateField("certificate_type", event.target.value)}>
                  <option>Compliance Certificate</option>
                  <option>Inspection Certificate</option>
                  <option>Test Certificate</option>
                  <option>Completion Certificate</option>
                  <option>Safety Certificate</option>
                </select>
              </label>

              <label>
                Status
                <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option>Draft</option>
                  {canIssue || form.status === "Issued" ? <option>Issued</option> : null}
                  {canRevoke || form.status === "Revoked" ? <option>Revoked</option> : null}
                  <option>Expired</option>
                </select>
              </label>

              <label>
                Customer
                <select value={form.customer_id} onChange={(event) => updateField("customer_id", event.target.value)}>
                  <option value="">No customer</option>
                  {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.company_name}</option>)}
                </select>
              </label>

              <label>
                Building
                <select value={form.building_id} onChange={(event) => updateField("building_id", event.target.value)}>
                  <option value="">No building</option>
                  {buildings.map((building) => <option key={building.id} value={building.id}>{building.name} - {building.customer_name}</option>)}
                </select>
              </label>

              <label>
                Asset
                <select value={form.asset_id} onChange={(event) => updateField("asset_id", event.target.value)}>
                  <option value="">No asset</option>
                  {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.asset_reference} - {asset.asset_name}</option>)}
                </select>
              </label>

              <label>
                Compliance service
                <select value={form.compliance_service_id} onChange={(event) => updateField("compliance_service_id", event.target.value)}>
                  <option value="">No compliance service</option>
                  {services.map((service) => <option key={service.id} value={service.id}>{service.service_reference} - {service.service_name}</option>)}
                </select>
              </label>

              <label>
                Report
                <select value={form.report_id} onChange={(event) => updateField("report_id", event.target.value)}>
                  <option value="">No report</option>
                  {reports.map((report) => <option key={report.id} value={report.id}>{report.report_reference} - {report.report_title}</option>)}
                </select>
              </label>

              <Field label="Issue date" value={form.issue_date} onChange={(value) => updateField("issue_date", value)} type="date" />
              <Field label="Expiry date" value={form.expiry_date} onChange={(value) => updateField("expiry_date", value)} type="date" />

              <label className="wide-field">
                Certificate body
                <textarea value={form.certificate_body || ""} onChange={(event) => updateField("certificate_body", event.target.value)} rows={5} />
              </label>

              <label className="wide-field">
                Revocation reason
                <textarea value={form.revocation_reason || ""} onChange={(event) => updateField("revocation_reason", event.target.value)} rows={3} />
              </label>
            </div>

            {editingCertificate ? (
              <RecordHistoryPanel entityType="certificate" entityId={editingCertificate.id} />
            ) : null}

            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={closeForm}>Cancel</button>
              <button className="primary-action" type="submit" disabled={busy}>
                <Save size={18} />
                {busy ? "Saving..." : "Save Certificate"}
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
              <div
                className="customer-row technician-job-row"
                key={job.id}
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
                <div className="row-actions">
                  {canUpdate ? (
                    <button className="secondary-button" type="button" onClick={() => openUpdateForm(job)}>
                      Edit
                    </button>
                  ) : null}
                </div>
              </div>
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

            {editingJob ? (
              <RecordHistoryPanel entityType="work_order" entityId={editingJob.id} />
            ) : null}

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

function formatHistoryAction(action) {
  return String(action || "Record updated").split(".").map((part) => (
    part.charAt(0).toUpperCase() + part.slice(1)
  )).join(" ");
}

function formatHistoryMetadata(metadata) {
  const value = metadata && typeof metadata === "object" ? metadata : {};
  const entries = Object.entries(value).filter(([, entryValue]) => (
    entryValue !== undefined && entryValue !== null && entryValue !== ""
  ));

  if (!entries.length) {
    return "";
  }

  return entries.slice(0, 4).map(([key, entryValue]) => (
    `${key.split("_").join(" ")}: ${entryValue}`
  )).join(" / ");
}

function RecordHistoryPanel({ entityType, entityId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!entityType || !entityId) {
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    listRecordHistory(entityType, entityId)
      .then((data) => {
        if (active) {
          setHistory(data.history || []);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [entityType, entityId]);

  if (!entityId) {
    return null;
  }

  return (
    <section className="record-history-panel">
      <div className="table-header">
        <strong>Update History</strong>
        <span>{history.length} events</span>
      </div>

      {loading ? <div className="empty-state">Loading history...</div> : null}
      {error ? <div className="form-error">{error}</div> : null}

      {!loading && !error ? (
        history.length ? (
          <div className="record-history-list">
            {history.map((event) => (
              <div className="record-history-row" key={event.id}>
                <div>
                  <strong>{formatHistoryAction(event.action)}</strong>
                  <span>{formatDateForDisplay(event.created_at)}</span>
                </div>
                <div>
                  <span>{event.actor_name || event.actor_email || "System"}</span>
                  <span>{formatHistoryMetadata(event.metadata)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No update history has been recorded yet.</div>
        )
      ) : null}
    </section>
  );
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
