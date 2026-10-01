import { apiRequest } from "./apiClient.js";

const roomService = {
  async getLiveRooms({ signal } = {}) {
    const result = await apiRequest("/rooms?status=ongoing", { signal });
    return result.rooms;
  },
};

export default roomService;