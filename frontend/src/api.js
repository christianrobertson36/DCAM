const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5055";

export function brandingAssetUrl(path, updatedAt) {
  if (!path) return "";
  const url = `${API_URL}${path}`;
  return updatedAt ? `${url}?v=${encodeURIComponent(updatedAt)}` : url;
}

function getStoredToken() {
  try {
    return window.localStorage.getItem("dcam_token");
  } catch (err) {
    return null;
  }
}

export async function apiRequest(path, options = {}) {
  const token = getStoredToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error || data?.message || "Request failed";
    throw new Error(message);
  }

  return data;
}

export async function apiBlobRequest(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.error || data?.message || "Request failed";
    throw new Error(message);
  }

  return response.blob();
}

export async function login(email, password, tenant = "") {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, tenant })
  });
}

export async function getMe() {
  return apiRequest("/auth/me");
}

export async function getMicrosoftSsoStatus() {
  return apiRequest("/auth/microsoft/status");
}

export function microsoftLoginUrl() {
  return `${API_URL}/auth/microsoft`;
}

export async function getTenant() {
  return apiRequest("/api/tenant");
}

export async function updateTenant(payload) {
  return apiRequest("/api/tenant", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function getBranding() {
  return apiRequest("/api/settings/branding");
}

export async function updateBranding(payload) {
  return apiRequest("/api/settings/branding", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function uploadBrandingAsset(kind, payload) {
  return apiRequest(`/api/settings/branding/${kind}`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function removeBrandingAsset(kind) {
  return apiRequest(`/api/settings/branding/${kind}`, {
    method: "DELETE"
  });
}

export async function getCustomerPortalDashboard(params = {}) {
  const query = new URLSearchParams();

  if (params.customer_id) {
    query.set("customer_id", params.customer_id);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/api/customer-portal/dashboard${suffix}`);
}

export async function getCustomerSummary() {
  return apiRequest("/api/customers/summary");
}

export async function listCustomers(params = {}) {
  const query = new URLSearchParams();

  if (params.search) {
    query.set("search", params.search);
  }

  if (params.status) {
    query.set("status", params.status);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/api/customers${suffix}`);
}

export async function createCustomer(payload) {
  return apiRequest("/api/customers", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateCustomer(id, payload) {
  return apiRequest(`/api/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function getCustomerOverview(id) {
  return apiRequest(`/api/customers/${id}/overview`);
}

export async function updateCustomerAccount(id, payload) {
  return apiRequest(`/api/customers/${id}/account`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function createCustomerActivity(id, payload) {
  return apiRequest(`/api/customers/${id}/activities`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function uploadCustomerDocument(id, payload) {
  return apiRequest(`/api/customers/${id}/documents`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function downloadCustomerDocument(id, documentId) {
  return apiBlobRequest(`/api/customers/${id}/documents/${documentId}/download`);
}

export async function getContactSummary() {
  return apiRequest("/api/contacts/summary");
}

export async function listContacts(params = {}) {
  const query = new URLSearchParams();

  ["search", "status", "customer_id"].forEach((key) => {
    if (params[key]) {
      query.set(key, params[key]);
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/api/contacts${suffix}`);
}

export async function createContact(payload) {
  return apiRequest("/api/contacts", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateContact(id, payload) {
  return apiRequest(`/api/contacts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function getPipelineSummary() {
  return apiRequest("/api/pipeline/summary");
}

export async function listPipelineOpportunities(params = {}) {
  const query = new URLSearchParams();

  ["search", "status", "stage", "customer_id", "owner_user_id"].forEach((key) => {
    if (params[key]) {
      query.set(key, params[key]);
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/api/pipeline${suffix}`);
}

export async function createPipelineOpportunity(payload) {
  return apiRequest("/api/pipeline", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updatePipelineOpportunity(id, payload) {
  return apiRequest(`/api/pipeline/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function getCommercialSummary() {
  return apiRequest("/api/commercial/summary");
}

export async function listQuotations() {
  return apiRequest("/api/commercial/quotations");
}

export async function getQuotation(id) {
  return apiRequest(`/api/commercial/quotations/${id}`);
}

export async function createQuotation(payload) {
  return apiRequest("/api/commercial/quotations", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateQuotationStatus(id, status) {
  return apiRequest(`/api/commercial/quotations/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export async function convertQuotationToContract(id, payload) {
  return apiRequest(`/api/commercial/quotations/${id}/contract`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function listContracts() {
  return apiRequest("/api/commercial/contracts");
}

export async function getContract(id) {
  return apiRequest(`/api/commercial/contracts/${id}`);
}

export async function updateContractRenewal(id, payload) {
  return apiRequest(`/api/commercial/contracts/${id}/renewal`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function createContractRenewalOpportunity(id) {
  return apiRequest(`/api/commercial/contracts/${id}/renewal-opportunity`, {
    method: "POST"
  });
}

export async function createContractService(id, payload) {
  return apiRequest(`/api/commercial/contracts/${id}/services`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function generateDueContractWork() {
  return apiRequest("/api/commercial/automation/generate-due-work", {
    method: "POST"
  });
}

export async function getBuildingSummary() {
  return apiRequest("/api/buildings/summary");
}

export async function listBuildings(params = {}) {
  const query = new URLSearchParams();

  if (params.search) {
    query.set("search", params.search);
  }

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.customer_id) {
    query.set("customer_id", params.customer_id);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/api/buildings${suffix}`);
}

export async function createBuilding(payload) {
  return apiRequest("/api/buildings", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateBuilding(id, payload) {
  return apiRequest(`/api/buildings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function getAssetSummary() {
  return apiRequest("/api/assets/summary");
}

export async function listAssets(params = {}) {
  const query = new URLSearchParams();

  if (params.search) {
    query.set("search", params.search);
  }

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.asset_category) {
    query.set("asset_category", params.asset_category);
  }

  if (params.asset_type) {
    query.set("asset_type", params.asset_type);
  }

  if (params.condition) {
    query.set("condition", params.condition);
  }

  if (params.customer_id) {
    query.set("customer_id", params.customer_id);
  }

  if (params.building_id) {
    query.set("building_id", params.building_id);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/api/assets${suffix}`);
}

export async function createAsset(payload) {
  return apiRequest("/api/assets", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateAsset(id, payload) {
  return apiRequest(`/api/assets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function getAssetByQrToken(token) {
  return apiRequest(`/api/assets/qr/${token}`);
}

export async function listAssetHistory(assetId) {
  return apiRequest(`/api/assets/${assetId}/history`);
}

export async function listAssetFiles(assetId) {
  return apiRequest(`/api/assets/${assetId}/files`);
}

export async function uploadAssetFile(assetId, payload) {
  return apiRequest(`/api/assets/${assetId}/files`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function downloadAssetFile(assetId, fileId) {
  return apiBlobRequest(`/api/assets/${assetId}/files/${fileId}/download`);
}

export async function deleteAssetFile(assetId, fileId) {
  return apiRequest(`/api/assets/${assetId}/files/${fileId}`, {
    method: "DELETE"
  });
}

export async function listAssetOptions(params = {}) {
  const query = new URLSearchParams();

  if (params.include_inactive) {
    query.set("include_inactive", "true");
  }

  if (params.option_type) {
    query.set("option_type", params.option_type);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/api/asset-options${suffix}`);
}

export async function createAssetOption(payload) {
  return apiRequest("/api/asset-options", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateAssetOption(id, payload) {
  return apiRequest(`/api/asset-options/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function getWorkOrderSummary() {
  return apiRequest("/api/work-orders/summary");
}

export async function listWorkOrders(params = {}) {
  const query = new URLSearchParams();

  ["search", "status", "priority", "customer_id", "building_id", "asset_id", "assigned_user_id"].forEach((key) => {
    if (params[key]) {
      query.set(key, params[key]);
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/api/work-orders${suffix}`);
}

export async function createWorkOrder(payload) {
  return apiRequest("/api/work-orders", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateWorkOrder(id, payload) {
  return apiRequest(`/api/work-orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function getScheduleSummary() {
  return apiRequest("/api/schedule/summary");
}

export async function listScheduleAssignments(params = {}) {
  const query = new URLSearchParams();

  ["date_from", "date_to", "assigned_user_id", "status"].forEach((key) => {
    if (params[key]) {
      query.set(key, params[key]);
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/api/schedule${suffix}`);
}

export async function createScheduleAssignment(payload) {
  return apiRequest("/api/schedule", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateScheduleAssignment(id, payload) {
  return apiRequest(`/api/schedule/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function getMaintenancePlanSummary() {
  return apiRequest("/api/maintenance-plans/summary");
}

export async function listMaintenancePlans(params = {}) {
  const query = new URLSearchParams();

  ["search", "status", "frequency", "customer_id", "building_id", "asset_id"].forEach((key) => {
    if (params[key]) {
      query.set(key, params[key]);
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/api/maintenance-plans${suffix}`);
}

export async function createMaintenancePlan(payload) {
  return apiRequest("/api/maintenance-plans", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateMaintenancePlan(id, payload) {
  return apiRequest(`/api/maintenance-plans/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function getComplianceServiceSummary() {
  return apiRequest("/api/compliance-services/summary");
}

export async function listComplianceServices(params = {}) {
  const query = new URLSearchParams();

  ["search", "status", "service_type", "result_status", "customer_id", "building_id", "asset_id"].forEach((key) => {
    if (params[key]) {
      query.set(key, params[key]);
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/api/compliance-services${suffix}`);
}

export async function createComplianceService(payload) {
  return apiRequest("/api/compliance-services", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateComplianceService(id, payload) {
  return apiRequest(`/api/compliance-services/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function getFormTemplateSummary() {
  return apiRequest("/api/form-templates/summary");
}

export async function listFormTemplates(params = {}) {
  const query = new URLSearchParams();

  ["search", "status", "service_type"].forEach((key) => {
    if (params[key]) {
      query.set(key, params[key]);
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/api/form-templates${suffix}`);
}

export async function createFormTemplate(payload) {
  return apiRequest("/api/form-templates", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateFormTemplate(id, payload) {
  return apiRequest(`/api/form-templates/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function getReportSummary() {
  return apiRequest("/api/reports/summary");
}

export async function listReports(params = {}) {
  const query = new URLSearchParams();

  ["search", "status", "report_type", "customer_id"].forEach((key) => {
    if (params[key]) {
      query.set(key, params[key]);
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/api/reports${suffix}`);
}

export async function createReport(payload) {
  return apiRequest("/api/reports", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateReport(id, payload) {
  return apiRequest(`/api/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function exportReport(id) {
  return apiBlobRequest(`/api/reports/${id}/export`);
}

export async function getCertificateSummary() {
  return apiRequest("/api/certificates/summary");
}

export async function listCertificates(params = {}) {
  const query = new URLSearchParams();

  ["search", "status", "certificate_type", "customer_id"].forEach((key) => {
    if (params[key]) {
      query.set(key, params[key]);
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/api/certificates${suffix}`);
}

export async function createCertificate(payload) {
  return apiRequest("/api/certificates", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateCertificate(id, payload) {
  return apiRequest(`/api/certificates/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function exportCertificate(id) {
  return apiBlobRequest(`/api/certificates/${id}/export`);
}

export async function getTechnicianJobSummary() {
  return apiRequest("/api/technician/jobs/summary");
}

export async function listTechnicianJobs(params = {}) {
  const query = new URLSearchParams();

  ["status", "assigned_user_id"].forEach((key) => {
    if (params[key]) {
      query.set(key, params[key]);
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/api/technician/jobs${suffix}`);
}

export async function updateTechnicianJob(id, payload) {
  return apiRequest(`/api/technician/jobs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function listTechnicianJobFiles(jobId) {
  return apiRequest(`/api/technician/jobs/${jobId}/files`);
}

export async function uploadTechnicianJobFile(jobId, payload) {
  return apiRequest(`/api/technician/jobs/${jobId}/files`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function downloadTechnicianJobFile(jobId, fileId) {
  return apiBlobRequest(`/api/technician/jobs/${jobId}/files/${fileId}/download`);
}

export async function listTechnicianJobChecklist(jobId) {
  return apiRequest(`/api/technician/jobs/${jobId}/checklist`);
}

export async function createTechnicianJobChecklistItem(jobId, payload) {
  return apiRequest(`/api/technician/jobs/${jobId}/checklist`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateTechnicianJobChecklistItem(jobId, itemId, payload) {
  return apiRequest(`/api/technician/jobs/${jobId}/checklist/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function listTechnicianJobSignatures(jobId) {
  return apiRequest(`/api/technician/jobs/${jobId}/signatures`);
}

export async function createTechnicianJobSignature(jobId, payload) {
  return apiRequest(`/api/technician/jobs/${jobId}/signatures`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getStaffSummary() {
  return apiRequest("/api/staff/summary");
}

export async function listStaffUsers() {
  return apiRequest("/api/staff/users");
}

export async function listStaffProfiles(params = {}) {
  const query = new URLSearchParams();

  ["search", "role", "availability_status"].forEach((key) => {
    if (params[key]) {
      query.set(key, params[key]);
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/api/staff${suffix}`);
}

export async function createStaffProfile(payload) {
  return apiRequest("/api/staff", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateStaffProfile(id, payload) {
  return apiRequest(`/api/staff/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function listStaffQualifications(profileId) {
  return apiRequest(`/api/staff/${profileId}/qualifications`);
}

export async function createStaffQualification(profileId, payload) {
  return apiRequest(`/api/staff/${profileId}/qualifications`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getSampleDataStatus() {
  return apiRequest("/api/settings/sample-data");
}

export async function installSampleData(currency = "GBP") {
  return apiRequest("/api/settings/sample-data", {
    method: "POST",
    body: JSON.stringify({ currency })
  });
}

export async function deleteSampleData() {
  return apiRequest("/api/settings/sample-data", {
    method: "DELETE"
  });
}

export async function listRecordHistory(entityType, entityId) {
  return apiRequest(`/api/audit/${entityType}/${entityId}`);
}

export async function listAdminUsers(params = {}) {
  const query = new URLSearchParams();

  ["search", "role", "status"].forEach((key) => {
    if (params[key]) query.set(key, params[key]);
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/api/admin/users${suffix}`);
}

export async function listAdminRoles() {
  return apiRequest("/api/admin/users/roles");
}

export async function createAdminUser(payload) {
  return apiRequest("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateAdminUser(id, payload) {
  return apiRequest(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function resetAdminUserPassword(id, password) {
  return apiRequest(`/api/admin/users/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ password })
  });
}

export async function listAdminUserAudit(id) {
  return apiRequest(`/api/admin/users/${id}/audit`);
}

export async function getServiceRequestSummary() {
  return apiRequest("/api/service-requests/summary");
}

export async function listServiceRequests(params = {}) {
  const query = new URLSearchParams();

  ["search", "status", "priority", "category", "customer_id", "assigned_user_id"].forEach((key) => {
    if (params[key]) query.set(key, params[key]);
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/api/service-requests${suffix}`);
}

export async function createServiceRequest(payload) {
  return apiRequest("/api/service-requests", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateServiceRequest(id, payload) {
  return apiRequest(`/api/service-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function listServiceRequestUpdates(id) {
  return apiRequest(`/api/service-requests/${id}/updates`);
}

export async function addServiceRequestUpdate(id, payload) {
  return apiRequest(`/api/service-requests/${id}/updates`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function listServiceRequestFiles(id) {
  return apiRequest(`/api/service-requests/${id}/files`);
}

export async function uploadServiceRequestFile(id, payload) {
  return apiRequest(`/api/service-requests/${id}/files`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function downloadServiceRequestFile(id, fileId) {
  return apiBlobRequest(`/api/service-requests/${id}/files/${fileId}/download`);
}

export async function convertServiceRequest(id) {
  return apiRequest(`/api/service-requests/${id}/convert`, {
    method: "POST"
  });
}

export async function closeServiceRequest(id, message) {
  return apiRequest(`/api/service-requests/${id}/close`, {
    method: "POST",
    body: JSON.stringify({ message })
  });
}

export async function getDefectSummary() {
  return apiRequest("/api/defects/summary");
}

export async function listDefects(params = {}) {
  const query = new URLSearchParams();
  ["search", "status", "severity", "risk_rating"].forEach((key) => {
    if (params[key]) query.set(key, params[key]);
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/api/defects${suffix}`);
}

export async function createDefect(payload) {
  return apiRequest("/api/defects", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateDefect(id, payload) {
  return apiRequest(`/api/defects/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function createDefectWorkOrder(id) {
  return apiRequest(`/api/defects/${id}/work-order`, { method: "POST" });
}

export async function verifyDefect(id, verification_notes) {
  return apiRequest(`/api/defects/${id}/verify`, {
    method: "POST",
    body: JSON.stringify({ verification_notes })
  });
}

export async function closeDefect(id) {
  return apiRequest(`/api/defects/${id}/close`, { method: "POST" });
}

export async function listDefectFiles(id) {
  return apiRequest(`/api/defects/${id}/files`);
}

export async function uploadDefectFile(id, payload) {
  return apiRequest(`/api/defects/${id}/files`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function downloadDefectFile(id, fileId) {
  return apiBlobRequest(`/api/defects/${id}/files/${fileId}/download`);
}
