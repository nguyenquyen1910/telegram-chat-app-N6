const MY_UID = "user-1777539989466-zj9lce6n";
const MY_NAME = "Nguyen Quyen";

const PROJECT_ID = "mini-telegram-f45b4";
const API_KEY = "AIzaSyDGrShkUUfz_ylMFoZaznO7vFUQjVGjZ_8";
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const str = (v) => ({ stringValue: String(v) });
const bool = (v) => ({ booleanValue: Boolean(v) });
const nul = () => ({ nullValue: "NULL_VALUE" });
const tval = (msAgo = 0) => ({
  timestampValue: new Date(Date.now() - msAgo).toISOString(),
});
const SEED_USERS = [
  {
    uid: "uid_valverde_seed",
    displayName: "Federico Valverde",
    phoneNumber: "+59899123456",
    photoURL:
      "https://res.cloudinary.com/dvfwvnq88/image/upload/v1777688777/lossncsiuytsi6ozzato.png",
    bio: "Midfielder 🇺🇾 Real Madrid",
    isOnline: false,
    msAgoLastSeen: 5 * 60 * 1000,
  },
  {
    uid: "uid_bellingham_seed",
    displayName: "Jude Bellingham",
    phoneNumber: "+447911234567",
    photoURL:
      "https://res.cloudinary.com/dvfwvnq88/image/upload/v1777688798/xoyhquwfw3vrt3xnegwp.png",
    bio: "Midfielder 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Real Madrid",
    isOnline: true,
    msAgoLastSeen: 0,
  },
  {
    uid: "uid_mbappe_seed",
    displayName: "Kylian Mbappé",
    phoneNumber: "+33612345678",
    photoURL:
      "https://res.cloudinary.com/dvfwvnq88/image/upload/v1777688800/geg3cpf35hzhzx32r6i2.png",
    bio: "Forward ⚡ Real Madrid",
    isOnline: false,
    msAgoLastSeen: 30 * 60 * 1000,
  },
  {
    uid: "uid_kroos_seed",
    displayName: "Toni Kroos",
    phoneNumber: "+4917612345678",
    photoURL:
      "https://res.cloudinary.com/dvfwvnq88/image/upload/v1777688802/i7yjvetrmo0vymbrqkcl.png",
    bio: "Retired Legend 🇩🇪",
    isOnline: false,
    msAgoLastSeen: 2 * 24 * 60 * 60 * 1000,
  },
];

function buildUserFields(user) {
  return {
    displayName: str(user.displayName),
    phoneNumber: str(user.phoneNumber),
    photoURL: str(user.photoURL),
    avatarUrl: str(user.photoURL),
    bio: str(user.bio),
    isOnline: bool(user.isOnline),
    lastSeen: tval(user.msAgoLastSeen),
    createdAt: tval(365 * 24 * 60 * 60 * 1000),
  };
}

async function seedUsers() {
  console.log("");
  console.log(`[*] Seeding ${SEED_USERS.length} users mẫu vào Firestore...`);
  console.log("");

  let ok = 0,
    fail = 0;

  for (const user of SEED_USERS) {
    const url = `${FIRESTORE_URL}/users/${user.uid}?key=${API_KEY}`;
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: buildUserFields(user) }),
      });

      if (res.ok) {
        console.log(`  ✅ ${user.uid.padEnd(25)} → ${user.displayName}`);
        ok++;
      } else {
        const err = await res.json();
        console.error(
          `  ❌ ${user.uid} → ${err?.error?.message ?? "Unknown error"}`,
        );
        fail++;
      }
    } catch (e) {
      console.error(`  ❌ ${user.uid} → Network error: ${e.message}`);
      fail++;
    }
  }

  console.log("");
  console.log(`  [+] Thành công: ${ok} | [-] Thất bại: ${fail}`);
  console.log("");
  console.log("  💡 Chạy tiếp: node scripts/seedCalls.js");
  console.log("     rồi:      node scripts/seedIncomingCall.js");
  console.log("");
}

seedUsers();
