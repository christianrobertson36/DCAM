const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const uploadRoot = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads"));

function safeColour(value, fallback) {
  return /^#[0-9A-F]{6}$/i.test(String(value || "")) ? value : fallback;
}

function text(value, fallback = "Not recorded") {
  const result = value === undefined || value === null ? "" : String(value).trim();
  return result || fallback;
}

function date(value) {
  if (!value) return "Not recorded";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(parsed);
}

async function loadBranding(pool) {
  const result = await pool.query("SELECT * FROM branding_settings WHERE id = 1 LIMIT 1");
  const branding = result.rows[0] || {};
  let logoPath = null;

  if (branding.logo_filename && branding.logo_content_type === "image/png") {
    const candidate = path.join(uploadRoot, "branding", branding.logo_filename);
    if (fs.existsSync(candidate)) logoPath = candidate;
  }

  return {
    productName: branding.product_name || "DCAM",
    companyName: branding.company_name || "Digital Compliance & Asset Management",
    tagline: branding.tagline || "Technical compliance operations, connected.",
    primary: safeColour(branding.primary_color, "#2563EB"),
    accent: safeColour(branding.accent_color, "#38BDF8"),
    supportEmail: branding.support_email,
    supportPhone: branding.support_phone,
    companyAddress: branding.company_address,
    showPoweredBy: branding.show_powered_by !== false,
    logoPath
  };
}

function drawBrandHeader(doc, branding, documentType, reference) {
  doc.rect(0, 0, doc.page.width, 122).fill(branding.primary);
  doc.rect(0, 116, doc.page.width, 6).fill(branding.accent);

  if (branding.logoPath) {
    try {
      doc.image(branding.logoPath, 48, 32, { fit: [74, 52], align: "left", valign: "center" });
    } catch (err) {
      // A damaged logo must never prevent a controlled document export.
    }
  }

  const identityX = branding.logoPath ? 138 : 48;
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(20).text(branding.productName, identityX, 34, { width: 260 });
  doc.fillColor("#DBEAFE").font("Helvetica").fontSize(9).text(branding.companyName, identityX, 60, { width: 300 });
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(12).text(documentType.toUpperCase(), 370, 36, { width: 175, align: "right" });
  doc.fillColor("#DBEAFE").font("Helvetica").fontSize(9).text(reference, 370, 58, { width: 175, align: "right" });
  doc.y = 150;
}

function drawTitle(doc, title, subtitle) {
  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(24).text(text(title));
  if (subtitle) doc.moveDown(0.35).fillColor("#64748B").font("Helvetica").fontSize(10).text(subtitle);
  doc.moveDown(1);
}

function drawMetadata(doc, fields, branding) {
  const startX = 48;
  const columnWidth = 245;
  fields.forEach((field, index) => {
    const column = index % 2;
    if (index > 0 && column === 0) doc.moveDown(1.15);
    const y = doc.y;
    const x = startX + (column * 270);
    doc.fillColor(branding.primary).font("Helvetica-Bold").fontSize(8).text(field.label.toUpperCase(), x, y, { width: columnWidth });
    doc.fillColor("#1E293B").font("Helvetica").fontSize(10).text(text(field.value), x, y + 13, { width: columnWidth });
    if (column === 1 || index === fields.length - 1) doc.y = y + 32;
  });
  doc.moveDown(0.8);
}

function drawSection(doc, heading, content, branding) {
  if (!content) return;
  if (doc.y > 690) doc.addPage();
  doc.moveDown(0.5);
  doc.fillColor(branding.primary).font("Helvetica-Bold").fontSize(12).text(heading);
  doc.moveDown(0.35);
  doc.fillColor("#334155").font("Helvetica").fontSize(10).text(text(content), { lineGap: 3 });
  doc.moveDown(0.8);
}

function drawFooter(doc, branding, exportedAt) {
  const details = [branding.companyAddress, branding.supportEmail, branding.supportPhone].filter(Boolean).join(" · ");
  if (doc.y > 720) doc.addPage();
  doc.moveDown(1.5);
  doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor("#CBD5E1").stroke();
  doc.moveDown(0.8);
  doc.fillColor("#64748B").font("Helvetica").fontSize(8).text(details || branding.companyName, { align: "center" });
  doc.moveDown(0.35).text(`Exported ${date(exportedAt)}${branding.showPoweredBy ? " · Powered by DCAM" : ""}`, { align: "center" });
}

function renderPdf(build) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, info: { Creator: "DCAM" } });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    build(doc);
    doc.end();
  });
}

async function createReportPdf(pool, report) {
  const branding = await loadBranding(pool);
  const exportedAt = new Date();
  return renderPdf((doc) => {
    doc.info.Title = `${report.report_reference} - ${report.report_title}`;
    doc.info.Author = branding.companyName;
    drawBrandHeader(doc, branding, report.report_type || "Compliance Report", report.report_reference);
    drawTitle(doc, report.report_title, `${report.status} · ${report.report_type || "Report"}`);
    drawMetadata(doc, [
      { label: "Customer", value: report.customer_name },
      { label: "Building / Site", value: report.building_name },
      { label: "Asset", value: [report.asset_reference, report.asset_name].filter(Boolean).join(" · ") },
      { label: "Work Order", value: [report.work_order_reference, report.work_order_title].filter(Boolean).join(" · ") },
      { label: "Service", value: [report.service_reference, report.service_name].filter(Boolean).join(" · ") },
      { label: "Reporting Period", value: `${date(report.date_from)} – ${date(report.date_to)}` },
      { label: "Approved By", value: report.approved_by_name },
      { label: "Approved At", value: date(report.approved_at) }
    ], branding);
    drawSection(doc, "Executive Summary", report.summary, branding);
    drawSection(doc, "Findings", report.findings, branding);
    drawSection(doc, "Recommendations", report.recommendations, branding);
    drawFooter(doc, branding, exportedAt);
  });
}

async function createCertificatePdf(pool, certificate) {
  const branding = await loadBranding(pool);
  const exportedAt = new Date();
  return renderPdf((doc) => {
    doc.info.Title = `${certificate.certificate_reference} - ${certificate.certificate_title}`;
    doc.info.Author = branding.companyName;
    drawBrandHeader(doc, branding, certificate.certificate_type || "Compliance Certificate", certificate.certificate_reference);
    doc.roundedRect(38, 138, 519, 560, 12).lineWidth(2).strokeColor(branding.accent).stroke();
    doc.y = 164;
    drawTitle(doc, certificate.certificate_title, `${certificate.status} · ${certificate.certificate_type || "Certificate"}`);
    drawMetadata(doc, [
      { label: "Certificate Reference", value: certificate.certificate_reference },
      { label: "Status", value: certificate.status },
      { label: "Customer", value: certificate.customer_name },
      { label: "Building / Site", value: certificate.building_name },
      { label: "Asset", value: [certificate.asset_reference, certificate.asset_name].filter(Boolean).join(" · ") },
      { label: "Compliance Service", value: [certificate.service_reference, certificate.service_name].filter(Boolean).join(" · ") },
      { label: "Issue Date", value: date(certificate.issue_date) },
      { label: "Expiry Date", value: date(certificate.expiry_date) },
      { label: "Issued By", value: certificate.issued_by_name },
      { label: "Issued At", value: date(certificate.issued_at) }
    ], branding);
    drawSection(doc, "Certification Statement", certificate.certificate_body, branding);
    if (certificate.status === "Revoked") drawSection(doc, "Revocation", certificate.revocation_reason, branding);
    drawFooter(doc, branding, exportedAt);
  });
}

module.exports = {
  createCertificatePdf,
  createReportPdf
};
