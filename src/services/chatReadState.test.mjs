import assert from 'node:assert/strict';
import { Timestamp } from 'firebase/firestore';
import { getComputedMessageStatus, shouldMarkConversationRead } from './chatReadState.ts';

function makeMessage(overrides = {}) {
  return {
    id: 'm1',
    conversationId: 'c1',
    senderId: 'u1',
    text: 'hello',
    type: 'text',
    status: 'sent',
    createdAt: Timestamp.fromMillis(1_000),
    ...overrides,
  };
}

function run() {
  assert.equal(
    getComputedMessageStatus({
      message: makeMessage(),
      currentUid: 'u1',
      otherUid: 'u2',
      lastReadBy: { u2: Timestamp.fromMillis(1_500) },
    }),
    'read'
  );

  assert.equal(
    getComputedMessageStatus({
      message: makeMessage(),
      currentUid: 'u1',
      otherUid: 'u2',
      lastReadBy: { u2: Timestamp.fromMillis(500) },
    }),
    'sent'
  );

  assert.equal(
    getComputedMessageStatus({
      message: makeMessage({ senderId: 'u2' }),
      currentUid: 'u1',
      otherUid: 'u2',
      lastReadBy: { u2: Timestamp.fromMillis(1_500) },
    }),
    'sent'
  );

  assert.equal(
    shouldMarkConversationRead({
      chatId: 'c1',
      currentUid: 'u1',
      loading: false,
      messageCount: 3,
    }),
    true
  );

  assert.equal(
    shouldMarkConversationRead({
      chatId: 'c1',
      currentUid: 'u1',
      loading: true,
      messageCount: 3,
    }),
    false
  );

  assert.equal(
    shouldMarkConversationRead({
      chatId: 'c1',
      currentUid: 'u1',
      loading: false,
      messageCount: 0,
    }),
    false
  );

  console.log('chatReadState tests passed');
}

run();
