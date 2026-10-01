import { apiRequest, tokenStorage } from "./apiClient.js";

const authService = {
  getToken: tokenStorage.get,
  storeToken: tokenStorage.set,
  clearToken: tokenStorage.clear,
  register: (details) =>
    apiRequest("/auth/register", { method: "POST", body: JSON.stringify(details) }),
  login: (credentials) =>
    apiRequest("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  getCurrentUser: () => apiRequest("/auth/me"),
};

export default authService;