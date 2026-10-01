import { listLiveRooms } from "../services/roomService.js";

export async function getLiveRooms(_request, response, next) {
  try {
    const rooms = await listLiveRooms();
    return response.status(200).json({ rooms });
  } catch (error) {
    return next(error);
  }
}