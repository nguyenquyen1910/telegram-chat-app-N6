export async function getLivekitToken(
  roomName: string,
  participantName: string,
): Promise<string> {
  try {
    const YOUR_PC_IP = "192.168.62.102";

    const response = await fetch(`http://${YOUR_PC_IP}:3000/getToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomName, participantName }),
    });

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error("LiveKit token fetch error:", error);
    throw new Error("Không thể kết nối đến Server tạo Token trên máy tính");
  }
}
