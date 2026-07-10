const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5055";

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

export async function login(email, password) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function getMe() {
  return apiRequest("/auth/me");
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
