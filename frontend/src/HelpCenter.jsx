import React, { useMemo, useState } from "react";
import { BookOpen, ChevronDown, CircleHelp, Search } from "lucide-react";
import "./styles/help-center.css";

const copy = {
  en: {
    eyebrow: "DCAM Help Centre",
    title: "Simple help, one step at a time",
    intro: "Choose a topic or search for what you want to do. These guides use plain language and explain the buttons you will see.",
    search: "Search help, for example: add a customer",
    all: "All topics",
    read: "Open guide",
    close: "Close guide",
    steps: "What to do",
    tip: "Helpful tip",
    noResults: "No guide matched that search. Try a shorter phrase such as customer, asset, job or report.",
    roleNote: "DCAM only shows tools your role is allowed to use. If a button in this guide is missing, ask your administrator to check your access.",
    language: "This guide is also available in Romanian. Change Language in the top-right area or in Settings.",
    quick: "Start here",
    crm: "Customers & sales",
    operations: "Jobs & assets",
    compliance: "Compliance",
    admin: "Account & settings"
  },
  ro: {
    eyebrow: "Centrul de ajutor DCAM",
    title: "Ajutor simplu, pas cu pas",
    intro: "Alegeti un subiect sau cautati ce doriti sa faceti. Ghidurile folosesc un limbaj simplu si explica butoanele pe care le vedeti.",
    search: "Cautati ajutor, de exemplu: adauga un client",
    all: "Toate subiectele",
    read: "Deschide ghidul",
    close: "Inchide ghidul",
    steps: "Ce trebuie sa faceti",
    tip: "Sfat util",
    noResults: "Niciun ghid nu corespunde cautarii. Incercati un cuvant mai scurt, precum client, activ, lucrare sau raport.",
    roleNote: "DCAM afiseaza doar instrumentele permise rolului dumneavoastra. Daca lipseste un buton din acest ghid, cereti administratorului sa verifice accesul.",
    language: "Acest ghid este disponibil si in engleza. Schimbati limba din zona dreapta-sus sau din Setari.",
    quick: "Incepeti aici",
    crm: "Clienti si vanzari",
    operations: "Lucrari si active",
    compliance: "Conformitate",
    admin: "Cont si setari"
  }
};

const articles = [
  {
    id: "first-steps",
    category: "quick",
    en: {
      title: "Your first 10 minutes in DCAM",
      summary: "Learn the basic order for setting up real work without getting lost.",
      steps: [
        "Start on Dashboard to see the overall position of the business.",
        "Open Customers and add the company you work for.",
        "Open Contacts and add the people you speak to at that company.",
        "Open Buildings and add each place where work will happen.",
        "Open Assets and register the equipment inside those buildings.",
        "Create a Work Order when work needs to be planned or completed."
      ],
      tip: "Use this order: Customer → Building → Asset → Work Order. Each record then connects correctly."
    },
    ro: {
      title: "Primele 10 minute in DCAM",
      summary: "Invatati ordinea de baza pentru configurarea lucrarilor reale fara confuzie.",
      steps: [
        "Incepeti in Panou principal pentru a vedea situatia generala a afacerii.",
        "Deschideti Clienti si adaugati compania pentru care lucrati.",
        "Deschideti Contacte si adaugati persoanele cu care discutati la acea companie.",
        "Deschideti Cladiri si adaugati fiecare locatie unde se vor efectua lucrari.",
        "Deschideti Active si inregistrati echipamentele din acele cladiri.",
        "Creati o Comanda de lucru cand o lucrare trebuie planificata sau finalizata."
      ],
      tip: "Folositi aceasta ordine: Client → Cladire → Activ → Comanda de lucru. Astfel, toate inregistrarile se leaga corect."
    }
  },
  {
    id: "navigation",
    category: "quick",
    en: {
      title: "Finding your way around",
      summary: "Understand the left menu, top bar, search and language control.",
      steps: [
        "Use the fixed menu on the left to move between areas.",
        "On a phone or tablet, press the menu button at the top to open the menu.",
        "Use global search to find customers, assets and operational records quickly.",
        "Your name and role appear at the top. Your role controls what you can see.",
        "Change English or Romanian from Settings."
      ],
      tip: "You cannot damage data just by opening a page. DCAM asks you to save before changes are recorded."
    },
    ro: {
      title: "Cum va orientati in aplicatie",
      summary: "Intelegerea meniului din stanga, barei de sus, cautarii si selectarii limbii.",
      steps: [
        "Folositi meniul fix din stanga pentru a trece intre sectiuni.",
        "Pe telefon sau tableta, apasati butonul de meniu din partea de sus.",
        "Folositi cautarea globala pentru a gasi rapid clienti, active si inregistrari operationale.",
        "Numele si rolul dumneavoastra apar sus. Rolul controleaza ce puteti vedea.",
        "Schimbati limba engleza sau romana din Setari."
      ],
      tip: "Nu puteti deteriora datele doar deschizand o pagina. DCAM cere salvarea inainte de a inregistra modificarile."
    }
  },
  {
    id: "customers",
    category: "crm",
    en: {
      title: "Adding and managing a customer",
      summary: "Create a customer and use Customer 360 to see the whole relationship.",
      steps: [
        "Open Customers and press Add Customer.",
        "Enter the legal company name and the best contact details you have.",
        "Choose the correct status, then press Save Customer.",
        "Use 360 View beside the customer to see buildings, assets, open work, requests and defects.",
        "In Customer 360 you can assign an account owner, record calls or meetings, and upload customer documents."
      ],
      tip: "Do not create a second customer when only the address changes. Add another Building under the existing customer."
    },
    ro: {
      title: "Adaugarea si administrarea unui client",
      summary: "Creati un client si folositi Client 360 pentru a vedea intreaga relatie.",
      steps: [
        "Deschideti Clienti si apasati Adauga client.",
        "Introduceti denumirea juridica a companiei si cele mai bune date de contact disponibile.",
        "Alegeti starea corecta, apoi apasati Salveaza client.",
        "Folositi Vedere 360 pentru a vedea cladirile, activele, lucrarile, solicitarile si defectele.",
        "In Client 360 puteti aloca un responsabil, inregistra apeluri sau sedinte si incarca documente."
      ],
      tip: "Nu creati un client nou doar pentru ca adresa este diferita. Adaugati o alta Cladire la clientul existent."
    }
  },
  {
    id: "sales",
    category: "crm",
    en: {
      title: "From sales opportunity to contract",
      summary: "Track a possible sale, issue a quotation and turn accepted work into a contract.",
      steps: [
        "Open Pipeline and add an opportunity for the customer.",
        "Update its stage, value, probability and next action as the sale progresses.",
        "Open Quotes & Contracts and press New Quotation.",
        "Choose the customer and add clear priced lines for every service.",
        "Change the quotation to Sent when it has gone to the customer.",
        "Change it to Accepted after approval, then press Create Contract."
      ],
      tip: "Only mark a quotation Accepted when the customer has genuinely approved it. This protects the commercial history."
    },
    ro: {
      title: "De la oportunitate de vanzare la contract",
      summary: "Urmariti o vanzare posibila, emiteti o oferta si transformati lucrarea acceptata intr-un contract.",
      steps: [
        "Deschideti Pipeline si adaugati o oportunitate pentru client.",
        "Actualizati etapa, valoarea, probabilitatea si urmatoarea actiune pe masura ce vanzarea avanseaza.",
        "Deschideti Oferte si contracte si apasati Oferta noua.",
        "Alegeti clientul si adaugati linii clare cu pret pentru fiecare serviciu.",
        "Schimbati oferta in Trimisa dupa ce a fost transmisa clientului.",
        "Schimbati-o in Acceptata dupa aprobare, apoi apasati Creeaza contract."
      ],
      tip: "Marcati oferta ca Acceptata doar dupa aprobarea reala a clientului. Astfel pastrati un istoric comercial corect."
    }
  },
  {
    id: "assets",
    category: "operations",
    en: {
      title: "Registering an asset",
      summary: "Add equipment to the correct customer building and keep its compliance history together.",
      steps: [
        "Make sure the Customer and Building already exist.",
        "Open Assets and press Add Asset.",
        "Choose the building, category and asset type.",
        "Add manufacturer, model, serial number and exact room or location when known.",
        "Set inspection dates and compliance status carefully.",
        "Save the asset, then add photos or documents from its detail view."
      ],
      tip: "Use one asset record for one physical item. Never reuse an asset tag for replacement equipment."
    },
    ro: {
      title: "Inregistrarea unui activ",
      summary: "Adaugati echipamentul la cladirea corecta si pastrati istoricul de conformitate impreuna.",
      steps: [
        "Asigurati-va ca Clientul si Cladirea exista deja.",
        "Deschideti Active si apasati Adauga activ.",
        "Alegeti cladirea, categoria si tipul activului.",
        "Adaugati producatorul, modelul, seria si camera sau locatia exacta, daca sunt cunoscute.",
        "Setati cu atentie datele inspectiilor si starea de conformitate.",
        "Salvati activul, apoi adaugati fotografii sau documente din pagina sa."
      ],
      tip: "Folositi o inregistrare pentru fiecare obiect fizic. Nu reutilizati eticheta unui activ pentru echipamentul inlocuit."
    }
  },
  {
    id: "work-orders",
    category: "operations",
    en: {
      title: "Creating and completing a work order",
      summary: "Plan a job, assign the right person and retain proof of completion.",
      steps: [
        "Open Work Orders and press Add Work Order.",
        "Choose the customer, building and relevant asset.",
        "Describe the work clearly and set priority and planned dates.",
        "Assign an engineer or technician who is available and qualified.",
        "The assigned person uses My Jobs to add notes, checks, files and signatures.",
        "Review the evidence before the work order is finally closed."
      ],
      tip: "Write the job description as an instruction someone else could follow without calling the office."
    },
    ro: {
      title: "Crearea si finalizarea unei comenzi de lucru",
      summary: "Planificati lucrarea, alocati persoana potrivita si pastrati dovada finalizarii.",
      steps: [
        "Deschideti Comenzi de lucru si apasati Adauga comanda.",
        "Alegeti clientul, cladirea si activul relevant.",
        "Descrieti clar lucrarea si stabiliti prioritatea si datele planificate.",
        "Alocati un inginer sau tehnician disponibil si calificat.",
        "Persoana alocata foloseste Joburile mele pentru note, verificari, fisiere si semnaturi.",
        "Verificati dovezile inainte de inchiderea finala a comenzii."
      ],
      tip: "Scrieti descrierea ca o instructiune pe care altcineva o poate urma fara sa sune la birou."
    }
  },
  {
    id: "requests-defects",
    category: "operations",
    en: {
      title: "Service requests and defects",
      summary: "Know when to use a customer request and when to record a compliance defect.",
      steps: [
        "Use Service Desk when a customer asks for help or reports a problem.",
        "Add updates so the communication history remains in one place.",
        "Convert an approved request into a Work Order when physical work is needed.",
        "Use Defects for a failed inspection, unsafe condition or compliance finding.",
        "Record severity, target date, evidence and the responsible person.",
        "A defect should only be closed after the corrective work has been checked."
      ],
      tip: "A request is something being asked for. A defect is something found wrong. They can be linked through a work order."
    },
    ro: {
      title: "Solicitari de service si defecte",
      summary: "Aflati cand folositi o solicitare a clientului si cand inregistrati un defect de conformitate.",
      steps: [
        "Folositi Birou de servicii cand un client cere ajutor sau raporteaza o problema.",
        "Adaugati actualizari pentru ca istoricul comunicarii sa ramana intr-un singur loc.",
        "Transformati solicitarea aprobata intr-o Comanda de lucru cand este necesara o interventie.",
        "Folositi Defecte pentru o inspectie nereusita, o conditie nesigura sau o constatare de conformitate.",
        "Inregistrati severitatea, termenul, dovezile si persoana responsabila.",
        "Defectul se inchide doar dupa verificarea lucrarii corective."
      ],
      tip: "O solicitare reprezinta ceva cerut. Un defect reprezinta ceva gasit incorect. Pot fi legate printr-o comanda de lucru."
    }
  },
  {
    id: "compliance",
    category: "compliance",
    en: {
      title: "Running a compliance inspection",
      summary: "Use service templates and forms to produce consistent inspection evidence.",
      steps: [
        "Open Compliance Services and choose the correct service type.",
        "Link the customer, building, assets and planned date.",
        "Use Forms Builder to prepare reusable questions and required evidence.",
        "During the visit, complete every required answer and attach clear photographs.",
        "Record failures as Defects so corrective action is not forgotten.",
        "Review the completed work before generating the report or certificate."
      ],
      tip: "A blank answer is not the same as a pass. Complete every mandatory field before sign-off."
    },
    ro: {
      title: "Efectuarea unei inspectii de conformitate",
      summary: "Folositi sabloane de servicii si formulare pentru dovezi consecvente.",
      steps: [
        "Deschideti Servicii de conformitate si alegeti tipul corect de serviciu.",
        "Asociati clientul, cladirea, activele si data planificata.",
        "Folositi Constructor formulare pentru intrebari reutilizabile si dovezi obligatorii.",
        "In timpul vizitei, completati fiecare raspuns obligatoriu si atasati fotografii clare.",
        "Inregistrati neconformitatile ca Defecte pentru a nu uita actiunile corective.",
        "Verificati lucrarea finalizata inainte de generarea raportului sau certificatului."
      ],
      tip: "Un raspuns necompletat nu inseamna conform. Completati toate campurile obligatorii inainte de semnare."
    }
  },
  {
    id: "reports",
    category: "compliance",
    en: {
      title: "Reports and certificates",
      summary: "Prepare, approve and download formal customer documents.",
      steps: [
        "Open Reports for detailed findings and recommendations.",
        "Open Certificates for formal confirmation of completed compliance work.",
        "Check the customer, building, asset, dates and status before approval.",
        "Use the approval or issue action only when the information has been reviewed.",
        "Download the branded PDF and keep the issued record in DCAM."
      ],
      tip: "Do not overwrite an old certificate to represent new work. Issue a new record so the history remains trustworthy."
    },
    ro: {
      title: "Rapoarte si certificate",
      summary: "Pregatiti, aprobati si descarcati documentele oficiale ale clientului.",
      steps: [
        "Deschideti Rapoarte pentru constatari si recomandari detaliate.",
        "Deschideti Certificate pentru confirmarea oficiala a lucrarilor de conformitate.",
        "Verificati clientul, cladirea, activul, datele si starea inainte de aprobare.",
        "Folositi aprobarea sau emiterea doar dupa verificarea informatiilor.",
        "Descarcati PDF-ul personalizat si pastrati inregistrarea emisa in DCAM."
      ],
      tip: "Nu modificati un certificat vechi pentru a reprezenta lucrari noi. Emiteti unul nou pentru un istoric de incredere."
    }
  },
  {
    id: "users-settings",
    category: "admin",
    en: {
      title: "Users, permissions, branding and language",
      summary: "Set up safe access and make DCAM look right for the company.",
      steps: [
        "Use Users & Access to create staff accounts and choose the closest role.",
        "Give each person only the access needed for their job.",
        "Use Settings to change company name, logo, colours and document branding.",
        "Choose English or Romanian for the interface.",
        "Test a new user account before giving the login details to the user."
      ],
      tip: "Never share one login between several people. Individual accounts create a reliable audit history."
    },
    ro: {
      title: "Utilizatori, permisiuni, branding si limba",
      summary: "Configurati accesul sigur si aspectul DCAM pentru companie.",
      steps: [
        "Folositi Utilizatori si acces pentru conturile personalului si alegeti rolul potrivit.",
        "Oferiti fiecarei persoane doar accesul necesar activitatii sale.",
        "Folositi Setari pentru denumirea companiei, logo, culori si brandingul documentelor.",
        "Alegeti engleza sau romana pentru interfata.",
        "Testati un cont nou inainte de a transmite datele de conectare."
      ],
      tip: "Nu impartiti acelasi cont intre mai multe persoane. Conturile individuale creeaza un istoric de audit sigur."
    }
  },
  {
    id: "troubleshooting",
    category: "admin",
    en: {
      title: "When something does not work",
      summary: "Simple checks to try before asking for technical support.",
      steps: [
        "Read the red message on screen; it usually explains what is missing.",
        "Check that required fields marked by the form are completed.",
        "Refresh the page and sign in again if your session has expired.",
        "If a button is missing, your role may not have that permission.",
        "Try the same action once more and note the customer, record and time.",
        "Send those details and a screenshot to your DCAM administrator."
      ],
      tip: "Do not repeatedly press Save. Wait for the first request to finish so duplicate records are not created."
    },
    ro: {
      title: "Cand ceva nu functioneaza",
      summary: "Verificari simple inainte de a solicita asistenta tehnica.",
      steps: [
        "Cititi mesajul rosu de pe ecran; de obicei explica ce lipseste.",
        "Verificati daca toate campurile obligatorii sunt completate.",
        "Reincarcati pagina si autentificati-va din nou daca sesiunea a expirat.",
        "Daca lipseste un buton, este posibil ca rolul sa nu aiba permisiunea necesara.",
        "Incercati actiunea o singura data si notati clientul, inregistrarea si ora.",
        "Trimiteti aceste detalii si o captura de ecran administratorului DCAM."
      ],
      tip: "Nu apasati Salveaza in mod repetat. Asteptati finalizarea primei cereri pentru a evita duplicatele."
    }
  }
];

export default function HelpCenter({ language = "en", user }) {
  const lang = language === "ro" ? "ro" : "en";
  const t = copy[lang];
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [openArticle, setOpenArticle] = useState("first-steps");

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(lang === "ro" ? "ro" : "en");
    return articles.filter((article) => {
      const content = article[lang];
      const categoryMatches = category === "all" || article.category === category;
      const searchText = [content.title, content.summary, ...content.steps, content.tip].join(" ").toLocaleLowerCase();
      return categoryMatches && (!query || searchText.includes(query));
    });
  }, [category, lang, search]);

  const categories = ["all", "quick", "crm", "operations", "compliance", "admin"];

  return (
    <div className="help-centre-page">
      <section className="help-hero">
        <div className="help-hero-icon"><CircleHelp size={34} /></div>
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h2>{t.title}</h2>
          <p>{t.intro}</p>
        </div>
      </section>

      <section className="help-notes">
        <p><strong>{user?.role}</strong> — {t.roleNote}</p>
        <p>{t.language}</p>
      </section>

      <div className="help-search">
        <Search size={20} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.search} />
      </div>

      <div className="help-categories">
        {categories.map((item) => (
          <button className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)}>
            {item === "all" ? t.all : t[item]}
          </button>
        ))}
      </div>

      <section className="help-articles">
        {filtered.map((article) => {
          const content = article[lang];
          const open = openArticle === article.id;
          return (
            <article className={`help-article ${open ? "open" : ""}`} key={article.id}>
              <button className="help-article-heading" onClick={() => setOpenArticle(open ? "" : article.id)} aria-expanded={open}>
                <span className="help-book"><BookOpen size={20} /></span>
                <span><strong>{content.title}</strong><small>{content.summary}</small></span>
                <span className="help-open-label">{open ? t.close : t.read}<ChevronDown size={18} /></span>
              </button>
              {open ? (
                <div className="help-article-content">
                  <h3>{t.steps}</h3>
                  <ol>{content.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
                  <div className="help-tip"><strong>{t.tip}</strong><p>{content.tip}</p></div>
                </div>
              ) : null}
            </article>
          );
        })}
        {!filtered.length ? <div className="empty-state">{t.noResults}</div> : null}
      </section>
    </div>
  );
}
