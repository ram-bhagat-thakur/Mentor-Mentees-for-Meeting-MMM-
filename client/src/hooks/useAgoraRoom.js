import { useEffect, useRef, useState } from "react";
import roomService from "../services/roomService.js";

const appId = import.meta.env.VITE_AGORA_APP_ID;

function getMediaErrorMessage(error) {
  if (["NotAllowedError", "PermissionDeniedError"].includes(error?.name)) {
    return "Camera or microphone permission was blocked. Allow access in your browser and rejoin to publish media.";
  }
  if (["NotFoundError", "DevicesNotFoundError"].includes(error?.name)) {
    return "No camera or microphone was found. You can stay in the room as a listener.";
  }
  return "Your camera or microphone could not be started. Check your device and browser permissions.";
}

function getConnectionErrorMessage(error) {
  const message = error?.message || "";
  if (/invalid token|authorized failed|CAN_NOT_GET_GATEWAY_SERVER/i.test(message)) {
    return "Agora rejected this room token. Confirm the server App ID and App Certificate belong to the same Agora project and token authentication is enabled.";
  }
  if (/NotAllowedError|PermissionDeniedError/i.test(message)) {
    return "Camera or microphone permission was blocked. Allow device access in your browser and retry.";
  }
  return "Unable to join this Agora video room. Check your network and try again.";
}

export default function useAgoraRoom(roomId, { enabled = true, retryKey = 0 } = {}) {
  const [connectionState, setConnectionState] = useState("DISCONNECTED");
  const [isJoined, setIsJoined] = useState(false);
  const [role, setRole] = useState("");
  const [uid, setUid] = useState("");
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [error, setError] = useState("");
  const [mediaWarning, setMediaWarning] = useState("");
  const promotionRef = useRef(null);

  useEffect(() => {
    if (!enabled || !roomId) return undefined;

    let disposed = false;
    let joined = false;
    let rtcClient = null;
    let AgoraRTC = null;
    let microphoneTrack = null;
    let cameraTrack = null;
    let isPromoting = false;

    setConnectionState("CONNECTING");
    setError("");
    setMediaWarning("");
    setRemoteUsers([]);
    setLocalAudioTrack(null);
    setLocalVideoTrack(null);

    const handleConnectionStateChange = (state) => {
      if (!disposed) setConnectionState(state);
    };

    const handleUserPublished = async (remoteUser, mediaType) => {
      try {
        await rtcClient.subscribe(remoteUser, mediaType);
        if (disposed) return;

        if (mediaType === "audio") remoteUser.audioTrack?.play();
        setRemoteUsers((current) => {
          const next = current.filter((user) => String(user.uid) !== String(remoteUser.uid));
          return [...next, remoteUser];
        });
      } catch {
        if (!disposed) setError("A participant's media stream could not be received.");
      }
    };

    const handleUserUnpublished = (remoteUser, mediaType) => {
      if (mediaType === "audio") remoteUser.audioTrack?.stop();
      if (mediaType === "video") remoteUser.videoTrack?.stop();
      if (!disposed) {
        setRemoteUsers((current) => current.map((user) => {
          if (String(user.uid) !== String(remoteUser.uid)) return user;
          return mediaType === "video"
            ? { ...user, videoTrack: undefined }
            : { ...user, audioTrack: undefined };
        }));
      }
    };

    const handleUserLeft = (remoteUser) => {
      remoteUser.audioTrack?.stop();
      remoteUser.videoTrack?.stop();
      if (!disposed) {
        setRemoteUsers((current) => current.filter((user) => String(user.uid) !== String(remoteUser.uid)));
      }
    };

    async function joinRoom() {
      try {
        if (!appId || appId === "your_agora_app_id") {
          throw new Error("Set VITE_AGORA_APP_ID in client/.env before joining a video room.");
        }

        const tokenDetails = await roomService.getAgoraToken(roomId);
        if (disposed) return;

        const agoraModule = await import("agora-rtc-sdk-ng");
        AgoraRTC = agoraModule.default || agoraModule;
        if (disposed) return;

        rtcClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
        rtcClient.on("connection-state-change", handleConnectionStateChange);
        rtcClient.on("user-published", handleUserPublished);
        rtcClient.on("user-unpublished", handleUserUnpublished);
        rtcClient.on("user-left", handleUserLeft);

        const isPublisher = tokenDetails.role === "PUBLISHER";
        await rtcClient.setClientRole(isPublisher ? "host" : "audience");
        await rtcClient.join(
          appId,
          tokenDetails.channelName,
          tokenDetails.rtcToken,
          tokenDetails.uid,
        );
        joined = true;
        if (disposed) return;

        setRole(tokenDetails.role);
        setUid(String(tokenDetails.uid));
        setIsJoined(true);

        if (!isPublisher) {
          setIsAudioEnabled(false);
          setIsVideoEnabled(false);
          promotionRef.current = async () => {
            if (isPromoting || disposed || !rtcClient || !joined) return;
            isPromoting = true;
            try {
              const refreshedToken = await roomService.getAgoraToken(roomId);
              if (refreshedToken.role !== "PUBLISHER") {
                throw new Error("Stage access is not active yet. Please retry in a moment.");
              }
              await rtcClient.renewToken(refreshedToken.rtcToken);
              await rtcClient.setClientRole("host");
              [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
              if (disposed) {
                microphoneTrack?.close();
                cameraTrack?.close();
                return;
              }
              setLocalAudioTrack(microphoneTrack);
              setLocalVideoTrack(cameraTrack);
              await rtcClient.publish([microphoneTrack, cameraTrack]);
              setRole("PUBLISHER");
              setIsAudioEnabled(true);
              setIsVideoEnabled(true);
              setMediaWarning("");
            } catch (mediaError) {
              if (microphoneTrack) {
                microphoneTrack.close();
                microphoneTrack = null;
              }
              if (cameraTrack) {
                cameraTrack.close();
                cameraTrack = null;
              }
              setLocalAudioTrack(null);
              setLocalVideoTrack(null);
              setIsAudioEnabled(false);
              setIsVideoEnabled(false);
              const warning = [
                "NotAllowedError",
                "PermissionDeniedError",
                "NotFoundError",
                "DevicesNotFoundError",
              ].includes(mediaError?.name)
                ? getMediaErrorMessage(mediaError)
                : getConnectionErrorMessage(mediaError);
              setMediaWarning(warning);
              throw new Error(warning);
            } finally {
              isPromoting = false;
            }
          };
          return;
        }

        try {
          [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
          if (disposed) {
            microphoneTrack?.close();
            cameraTrack?.close();
            return;
          }

          setLocalAudioTrack(microphoneTrack);
          setLocalVideoTrack(cameraTrack);
          await rtcClient.publish([microphoneTrack, cameraTrack]);
        } catch (mediaError) {
          if (!disposed) setMediaWarning(getMediaErrorMessage(mediaError));
          if (microphoneTrack) {
            microphoneTrack.close();
            microphoneTrack = null;
          }
          if (cameraTrack) {
            cameraTrack.close();
            cameraTrack = null;
          }
          if (!disposed) {
            setLocalAudioTrack(null);
            setLocalVideoTrack(null);
            setIsAudioEnabled(false);
            setIsVideoEnabled(false);
          }
        }
      } catch (connectionError) {
        if (!disposed) {
          setError(getConnectionErrorMessage(connectionError));
          setConnectionState("DISCONNECTED");
        }
      }
    }

    void joinRoom();

    return () => {
      disposed = true;
      promotionRef.current = null;
      const tracks = [microphoneTrack, cameraTrack].filter(Boolean);
      if (rtcClient) {
        rtcClient.off("connection-state-change", handleConnectionStateChange);
        rtcClient.off("user-published", handleUserPublished);
        rtcClient.off("user-unpublished", handleUserUnpublished);
        rtcClient.off("user-left", handleUserLeft);
      }

      const cleanup = async () => {
        if (tracks.length && joined) await rtcClient?.unpublish(tracks).catch(() => {});
        for (const track of tracks) {
          track.stop();
          track.close();
        }
        if (joined) await rtcClient?.leave().catch(() => {});
      };
      void cleanup();
    };
  }, [enabled, retryKey, roomId]);

  async function promoteToPublisher() {
    if (!promotionRef.current) {
      throw new Error("The room is not ready to enable stage access yet.");
    }
    await promotionRef.current();
  }

  async function toggleAudio() {
    if (!localAudioTrack) return;
    const nextEnabled = !isAudioEnabled;
    await localAudioTrack.setEnabled(nextEnabled);
    setIsAudioEnabled(nextEnabled);
  }

  async function toggleVideo() {
    if (!localVideoTrack) return;
    const nextEnabled = !isVideoEnabled;
    await localVideoTrack.setEnabled(nextEnabled);
    setIsVideoEnabled(nextEnabled);
  }

  return {
    connectionState,
    error,
    isAudioEnabled,
    isJoined,
    isVideoEnabled,
    localAudioTrack,
    localVideoTrack,
    mediaWarning,
    promoteToPublisher,
    remoteUsers,
    role,
    toggleAudio,
    toggleVideo,
    uid,
  };
}