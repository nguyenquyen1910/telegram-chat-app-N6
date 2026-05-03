const express = require('express');
const { AccessToken } = require('livekit-server-sdk');
const app = express();
app.use(express.json());

app.post('/getToken', async (req, res) => {
  const { roomName, participantName } = req.body;
  console.log(`Đang tạo token cho phòng: ${roomName}, User: ${participantName}`);
  
  const apiKey = "API2DAMqzQvUdki";
  const apiSecret = "NLUfeGU4tykhnpdcw7r3ktSFbtiXnwopTef675efZpzP";

  try {
    const at = new AccessToken(apiKey, apiSecret, { identity: participantName });
    at.addGrant({ 
      roomJoin: true, 
      room: roomName, 
      canPublish: true, 
      canSubscribe: true 
    });
    
    const token = await at.toJwt();
    res.send({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Lỗi server" });
  }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('-------------------------------------------');
  console.log(`Server tạo Token đang chạy tại cổng ${PORT}`);
  console.log(`Hãy đảm bảo điện thoại và máy tính dùng chung Wi-Fi!`);
  console.log('-------------------------------------------');
});
