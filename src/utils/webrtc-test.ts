import { RTCPeerConnection, RTCSessionDescription } from "react-native-webrtc";

export const testWebRTC = async () => {
  try {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    console.log("RPTCConnection created successfully");
    pc.close();
    return true;
  } catch (error) {
    console.error("Test failed", error);
    return false;
  }
};
