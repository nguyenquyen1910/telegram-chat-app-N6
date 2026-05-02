const MY_UID = "user-1777539989466-zj9lce6n";

const SEED_CALLER_UIDS = [
  "uid_valverde_seed",
  "uid_bellingham_seed",
  "uid_mbappe_seed",
  "uid_kroos_seed",
];

const PROJECT_ID = "mini-telegram-f45b4";
const API_KEY = "AIzaSyDGrShkUUfz_ylMFoZaznO7vFUQjVGjZ_8";
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const args = process.argv.slice(2);
const MODE = args.includes("outgoing") ? "outgoing" : "incoming";
const CALL_TYPE = args.includes("video") ? "video" : "voice";

const str = (v) => ({ stringValue: String(v) });
const num = (v) => ({ integerValue: String(v) });
const nul = () => ({ nullValue: "NULL_VALUE" });

async function getUser(uid) {
  const url = `${FIRESTORE_URL}/users/${uid}?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const doc = await res.json();
  if (!doc.fields) return null;
  const f = doc.fields;
  return {
    uid,
    displayName: f.displayName?.stringValue ?? uid,
    photoURL: f.photoURL?.stringValue ?? f.avatarUrl?.stringValue ?? "",
  };
}

async function seedIncomingCall() {
  console.log("");
  console.log(
    `[*] Mode: ${MODE.toUpperCase()} | Type: ${CALL_TYPE.toUpperCase()}`,
  );

  const callerUid =
    SEED_CALLER_UIDS[Math.floor(Math.random() * SEED_CALLER_UIDS.length)];

  console.log(`[*] Fetching user info từ Firestore...`);

  const [caller, callee] = await Promise.all([
    getUser(MODE === "incoming" ? callerUid : MY_UID),
    getUser(MODE === "incoming" ? MY_UID : callerUid),
  ]);

  if (!caller || !callee) {
    console.error(
      "❌ Không lấy được thông tin user. Hãy chạy seedUsers.js trước.",
    );
    process.exit(1);
  }

  console.log(`    Caller: ${caller.displayName} (${caller.uid})`);
  console.log(`    Callee: ${callee.displayName} (${callee.uid})`);
  console.log("");

  const docId = `test_${MODE}_${Date.now()}`;
  const body = {
    fields: {
      callerId: str(caller.uid),
      callerName: str(caller.displayName),
      callerAvatar: str(caller.photoURL),
      calleeId: str(callee.uid),
      calleeName: str(callee.displayName),
      calleeAvatar: str(callee.photoURL),
      type: str(CALL_TYPE),
      status: str("ringing"),
      duration: num(0),
      livekitRoomName: str(`room_${docId}`),
      startedAt: nul(),
      endedAt: nul(),
      createdAt: { timestampValue: new Date().toISOString() },
    },
  };

  const url = `${FIRESTORE_URL}/calls/${docId}?key=${API_KEY}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    console.log(`✅ Cuộc gọi "${MODE}" đã được tạo!`);
    console.log(`   callId  : ${docId}`);
    console.log(`   type    : ${CALL_TYPE}`);
    console.log(`   status  : ringing`);
    console.log("");
    if (MODE === "incoming") {
      console.log(
        "🔔 Mở app → IncomingCallDetector sẽ tự navigate đến màn hình incoming.",
      );
    } else {
      console.log(
        `👉 Navigate thủ công: /(call-screens)/outgoing?callId=${docId}`,
      );
    }
  } else {
    const err = await res.text();
    console.error("❌ Lỗi tạo call:", err);
  }
  console.log("");
}

seedIncomingCall();
