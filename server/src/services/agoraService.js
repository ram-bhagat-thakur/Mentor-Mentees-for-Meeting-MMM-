import agoraToken from "agora-token";
import { getAgoraCredentials } from "../config/env.js";

const { RtcRole, RtcTokenBuilder } = agoraToken;
export const RTC_TOKEN_TTL_SECONDS = 60 * 60;

export function createAgoraRtcToken({ room, user, now = Date.now() }) {
  const { appId, appCertificate } = getAgoraCredentials();
  const userId = user._id.toString();
  const hostId = room.hostId?._id?.toString() || room.hostId.toString();
  const isHost = hostId === userId;
  const hasStagePermission = (room.stageParticipants || []).some((participantId) =>
    participantId.equals(user._id),
  );
  const role = isHost || user.role === "mentor" || hasStagePermission ? "PUBLISHER" : "SUBSCRIBER";
  const agoraRole = role === "PUBLISHER" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
  const channelName = room._id.toString();
  const uid = userId;
  const privilegeExpireTime = Math.floor(now / 1000) + RTC_TOKEN_TTL_SECONDS;
  const rtcToken = RtcTokenBuilder.buildTokenWithUserAccount(
    appId,
    appCertificate,
    channelName,
    uid,
    agoraRole,
    RTC_TOKEN_TTL_SECONDS,
    RTC_TOKEN_TTL_SECONDS,
  );

  return { rtcToken, channelName, uid, role, privilegeExpireTime };
}