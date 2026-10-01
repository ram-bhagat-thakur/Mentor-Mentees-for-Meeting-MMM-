import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { connectSocket } from "../services/socketService.js";

export default function useSocket({ onFeedStatusChange } = {}) {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const feedHandlerRef = useRef(onFeedStatusChange);
  feedHandlerRef.current = onFeedStatusChange;

  useEffect(() => {
    if (!token) {
      setIsConnected(false);
      return undefined;
    }

    const socket = connectSocket(token);
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleFeedStatusChange = (payload) => feedHandlerRef.current?.(payload);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("feed:status_change", handleFeedStatusChange);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("feed:status_change", handleFeedStatusChange);
      socket.disconnect();
    };
  }, [token]);

  return { isConnected };
}