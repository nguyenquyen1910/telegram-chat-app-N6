const MY_UID = "user-1777539989466-zj9lce6n";

const PROJECT_ID = "mini-telegram-f45b4";
const API_KEY = "AIzaSyDGrShkUUfz_ylMFoZaznO7vFUQjVGjZ_8";
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const SEED_CALLER_UIDS = [
  "uid_valverde_seed",
  "uid_bellingham_seed",
  "uid_mbappe_seed",
  "uid_kroos_seed",
];

const str = (v) => ({ stringValue: String(v) });
const num = (v) => ({ integerValue: String(v) });
const nul = () => ({ nullValue: "NULL_VALUE" });
const tval = (msAgo) => ({
  timestampValue: new Date(Date.now() - msAgo).toISOString(),
});

async function getUser(uid) {
  const url = `${FIRESTORE_URL}/users/${uid}?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const doc = await res.json();
  if (!doc.fields) return null;
  const f = doc.fields;
  return {
    id: uid,
    name: f.displayName?.stringValue ?? uid,
    avatar: f.photoURL?.stringValue ?? f.avatarUrl?.stringValue ?? "",
  };
}

async function seed() {
  console.log("");
  console.log(`[*] Fetching users from Firestore...`);

  const me = await getUser(MY_UID);
  if (!me) {
    console.error(
      `❌ Không tìm thấy thông tin user hiện tại (${MY_UID}) trong Firestore!`,
    );
    return;
  }

  const callers = [];
  for (const uid of SEED_CALLER_UIDS) {
    const user = await getUser(uid);
    if (user) callers.push(user);
  }

  if (callers.length === 0) {
    console.error(
      "❌ Không tìm thấy user mẫu. Vui lòng chạy node scripts/seedUsers.js trước.",
    );
    return;
  }

  const CALLS = [
    {
      caller: callers[0],
      callee: me,
      type: "voice",
      status: "missed",
      startedAt: null,
      endedAt: null,
      duration: 0,
      msAgo: 15 * 60 * 1000,
    },
    {
      caller: me,
      callee: callers[1],
      type: "voice",
      status: "ended",
      startedAt: tval(60 * 60 * 1000 + 3 * 60 * 1000),
      endedAt: tval(60 * 60 * 1000),
      duration: 180,
      msAgo: 60 * 60 * 1000 + 3 * 60 * 1000,
    },
    {
      caller: callers[2],
      callee: me,
      type: "video",
      status: "ended",
      startedAt: tval(2 * 60 * 60 * 1000 + 7 * 60 * 1000 + 5000),
      endedAt: tval(2 * 60 * 60 * 1000),
      duration: 425,
      msAgo: 2 * 60 * 60 * 1000 + 7 * 60 * 1000,
    },
    {
      caller: me,
      callee: callers[3],
      type: "video",
      status: "declined",
      startedAt: null,
      endedAt: null,
      duration: 0,
      msAgo: 3 * 60 * 60 * 1000,
    },
  ];

  console.log(`[*] Seeding ${CALLS.length} lịch sử cuộc gọi mẫu...`);
  let ok = 0,
    fail = 0;

  for (const call of CALLS) {
    const url = `${FIRESTORE_URL}/calls?key=${API_KEY}`;
    const fields = {
      callerId: str(call.caller.id),
      callerName: str(call.caller.name),
      callerAvatar: str(call.caller.avatar),
      calleeId: str(call.callee.id),
      calleeName: str(call.callee.name),
      calleeAvatar: str(call.callee.avatar),
      type: str(call.type),
      status: str(call.status),
      duration: num(call.duration),
      livekitRoomName: str(
        `room_history_${Math.random().toString(36).slice(2, 9)}`,
      ),
      createdAt: tval(call.msAgo),
      startedAt: call.startedAt ?? nul(),
      endedAt: call.endedAt ?? nul(),
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error(
          `[${call.caller.name} → ${call.callee.name}] ${data?.error?.message}`,
        );
        fail++;
        continue;
      }

      const status = call.status.toUpperCase();
      console.log(
        `  ✅ [${status.padEnd(8)}] ${call.caller.name.padEnd(18)} -> ${call.callee.name.padEnd(18)}`,
      );
      ok++;
    } catch (e) {
      console.error(`  ❌ Lỗi: ${e.message}`);
      fail++;
    }
  }

  console.log(`\n  [+] Thành công: ${ok} | [-] Thất bại: ${fail}\n`);
}

seed();
