import { apiRequest } from "./apiClient.js";

const mentorService = {
  search(filters, { signal } = {}) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === "") continue;
      params.set(key, String(value));
    }
    return apiRequest(`/mentors?${params.toString()}`, { signal });
  },
};

export default mentorService;