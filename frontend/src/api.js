const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5055";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("dcam_token");

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
