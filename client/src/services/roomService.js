import { apiRequest } from "./apiClient.js";

const roomService = {
  async getLiveRooms({ signal } = {}) {
    const result = await apiRequest("/rooms?status=ongoing", { signal });
    return result.rooms;
  },
  createRoom(details) {
    return apiRequest("/rooms", { method: "POST", body: JSON.stringify(details) });
  },
  joinRoom(roomId) {
    return apiRequest(`/rooms/${encodeURIComponent(roomId)}/participants`, { method: "POST" });
  },
  leaveRoom(roomId) {
    return apiRequest(`/rooms/${encodeURIComponent(roomId)}/participants/me`, { method: "DELETE" });
  },
  endRoom(roomId) {
    return apiRequest(`/rooms/${encodeURIComponent(roomId)}/end`, { method: "PATCH" });
  },
};

export default roomService;