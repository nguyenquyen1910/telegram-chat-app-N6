const MY_UID  = 'user-1777539989466-zj9lce6n';
const MY_NAME = 'Me'; 

const PROJECT_ID    = 'mini-telegram-f45b4';
const API_KEY       = 'AIzaSyDGrShkUUfz_ylMFoZaznO7vFUQjVGjZ_8';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const str  = (v) => ({ stringValue: String(v) });
const num  = (v) => ({ integerValue: String(v) });
const nul  = ()  => ({ nullValue: 'NULL_VALUE' });
const tval = (msAgo) => ({
  timestampValue: new Date(Date.now() - msAgo).toISOString(),
});

const CALLERS = [
  {
    id:     'uid_valverde_seed',
    name:   'Federico Valverde',
    avatar: 'https://img.a.transfermarkt.technology/portrait/big/371998-1698056469.jpg',
  },
  {
    id:     'uid_bellingham_seed',
    name:   'Jude Bellingham',
    avatar: 'https://img.a.transfermarkt.technology/portrait/big/581678-1698056469.jpg',
  },
  {
    id:     'uid_mbappe_seed',
    name:   'Kylian Mbappé',
    avatar: 'https://img.a.transfermarkt.technology/portrait/big/342229-1698056469.jpg',
  },
  {
    id:     'uid_kroos_seed',
    name:   'Toni Kroos',
    avatar: 'https://img.a.transfermarkt.technology/portrait/big/36937-1698056469.jpg',
  },
];

const ME = { id: MY_UID, name: MY_NAME, avatar: '' };

const CALLS = [
  {
    caller: CALLERS[0], callee: ME,
    type: 'voice', status: 'missed',
    startedAt: null, endedAt: null, duration: 0,
    msAgo: 15 * 60 * 1000,
  },
  {
    caller: ME, callee: CALLERS[1],
    type: 'voice', status: 'ended',
    startedAt: tval(60 * 60 * 1000 + 3 * 60 * 1000),
    endedAt:   tval(60 * 60 * 1000),
    duration: 180,
    msAgo: 60 * 60 * 1000 + 3 * 60 * 1000,
  },
  {
    caller: CALLERS[2], callee: ME,
    type: 'video', status: 'ended',
    startedAt: tval(2 * 60 * 60 * 1000 + 7 * 60 * 1000 + 5000),
    endedAt:   tval(2 * 60 * 60 * 1000),
    duration: 425,
    msAgo: 2 * 60 * 60 * 1000 + 7 * 60 * 1000,
  },
  {
    caller: ME, callee: CALLERS[3],
    type: 'video', status: 'declined',
    startedAt: null, endedAt: null, duration: 0,
    msAgo: 3 * 60 * 60 * 1000,
  },
  {
    caller: CALLERS[1], callee: ME,
    type: 'voice', status: 'ended',
    startedAt: tval(26 * 60 * 60 * 1000 + 70 * 1000),
    endedAt:   tval(26 * 60 * 60 * 1000),
    duration: 70,
    msAgo: 26 * 60 * 60 * 1000,
  },
  {
    caller: ME, callee: CALLERS[0],
    type: 'voice', status: 'missed',
    startedAt: null, endedAt: null, duration: 0,
    msAgo: 27 * 60 * 60 * 1000,
  },
  {
    caller: CALLERS[3], callee: ME,
    type: 'video', status: 'missed',
    startedAt: null, endedAt: null, duration: 0,
    msAgo: 2 * 24 * 60 * 60 * 1000,
  },
  {
    caller: ME, callee: CALLERS[2],
    type: 'video', status: 'ended',
    startedAt: tval(3 * 24 * 60 * 60 * 1000 + 62 * 60 * 1000),
    endedAt:   tval(3 * 24 * 60 * 60 * 1000),
    duration: 3720,
    msAgo: 3 * 24 * 60 * 60 * 1000 + 62 * 60 * 1000,
  },
];

function buildFields(call) {
  return {
    callerId:        str(call.caller.id),
    callerName:      str(call.caller.name),
    callerAvatar:    str(call.caller.avatar),
    calleeId:        str(call.callee.id),
    calleeName:      str(call.callee.name),
    calleeAvatar:    str(call.callee.avatar),
    type:            str(call.type),
    status:          str(call.status),
    duration:        num(call.duration),
    livekitRoomName: str(`room_seed_${Math.random().toString(36).slice(2, 9)}`),
    createdAt:       tval(call.msAgo),
    startedAt:       call.startedAt ?? nul(),
    endedAt:         call.endedAt   ?? nul(),
  };
}

async function seed() {
  console.log('');
  console.log(`[*] Seeding ${CALLS.length} cuộc gọi mẫu...`);
  console.log(`    UID: ${MY_UID}`);
  console.log('');

  let ok = 0, fail = 0;

  for (const call of CALLS) {
    const url  = `${FIRESTORE_URL}/calls?key=${API_KEY}`;
    const body = JSON.stringify({ fields: buildFields(call) });

    try {
      const res  = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data?.error?.message ?? JSON.stringify(data).slice(0, 100);
        console.error(`[${call.caller.name} → ${call.callee.name}] ${errMsg}`);
        fail++;
        continue;
      }

      const docId   = data.name?.split('/').pop() ?? '?';
      const dir     = call.caller.id === MY_UID ? 'OUTGOING' : 'INCOMING';
      const status  = call.status.toUpperCase();
      const typeStr = call.type.toUpperCase();
      
      console.log(`  [${status.padEnd(8)}] [${dir.padEnd(8)}] [${typeStr.padEnd(5)}] ${call.caller.name.padEnd(20)} -> ${call.callee.name.padEnd(20)} | id: ${docId}`);
      ok++;
    } catch (e) {
      console.error(`  [ERROR] Network error: ${e.message}`);
      fail++;
    }
  }

  console.log('');
  console.log(`  [+] Thành công: ${ok} | [-] Thất bại: ${fail}`);
  console.log('');

  if (fail > 0) {
    console.log('  [INFO] Nếu bị lỗi 400/403:');
    console.log('         - Kiểm tra Firestore rules có cho phép write không.');
    console.log('         - Hoặc tạm thời set rules: allow write: if true;');
    console.log('');
  }
}

seed();
