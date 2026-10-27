import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { connectSocket } from "../services/socketService.js";

function emitWithAck(socket, event, payload) {
  return new Promise((resolve, reject) => {
    socket.timeout(8000).emit(event, payload, (timeoutError, response) => {
      if (timeoutError) {
        reject(new Error("The room connection did not respond. Try again."));
      } else if (response?.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
  });
}

export default function useRoomSocket(roomId, { enabled = true, isHost = false } = {}) {
  const { token, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [stageStatus, setStageStatus] = useState("idle");
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    if (!enabled || !roomId || !token) return undefined;

    let disposed = false;
    const socket = connectSocket(token);
    socketRef.current = socket;

    const joinRoom = () => {
      socket.emit("room:join", { roomId }, (response) => {
        if (disposed) return;
        if (response?.error) {
          setError(response.error);
          return;
        }
        setError("");
        if (isHost) setRequests(response.requests || []);
        else setStageStatus(response.stageStatus || "idle");
      });
    };
    const handleConnect = () => {
      setIsConnected(true);
      joinRoom();
    };
    const handleDisconnect = () => setIsConnected(false);
    const handleQueueUpdate = (payload) => {
      if (payload.roomId === roomId) setRequests(payload.requests || []);
    };
    const handleApproved = (payload) => {
      if (payload.roomId === roomId) setStageStatus("approved");
    };
    const handleRejected = (payload) => {
      if (payload.roomId === roomId) setStageStatus("rejected");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("room:queue_updated", handleQueueUpdate);
    socket.on("room:stage_approved", handleApproved);
    socket.on("room:stage_rejected", handleRejected);
    if (socket.connected) handleConnect();

    return () => {
      disposed = true;
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("room:queue_updated", handleQueueUpdate);
      socket.off("room:stage_approved", handleApproved);
      socket.off("room:stage_rejected", handleRejected);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, isHost, roomId, token]);

  async function requestStage() {
    setError("");
    const response = await emitWithAck(socketRef.current, "room:request_stage", {
      roomId,
      userId: user?.id,
    });
    setStageStatus(response.status || "pending");
  }

  async function approveStage(targetUserId) {
    setError("");
    await emitWithAck(socketRef.current, "room:approve_stage", { roomId, targetUserId });
  }

  async function rejectStage(targetUserId) {
    setError("");
    await emitWithAck(socketRef.current, "room:reject_stage", { roomId, targetUserId });
  }

  return {
    approveStage,
    error,
    isConnected,
    rejectStage,
    requestStage,
    requests,
    stageStatus,
  };
}