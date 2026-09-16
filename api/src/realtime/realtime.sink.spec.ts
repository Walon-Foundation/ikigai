import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  emitToMentorship,
  emitToUser,
  ROOM,
  setRealtimeSink,
} from './realtime.sink.js';

describe('realtime sink', () => {
  beforeEach(() => setRealtimeSink(null));

  it('is a no-op when no gateway is registered', () => {
    // The API must behave identically with realtime switched off: notifications
    // are already written to the database before anything is emitted.
    expect(() => emitToUser('u1', 'notification', {})).not.toThrow();
    expect(() => emitToMentorship('m1', 'message', {})).not.toThrow();
  });

  it('routes to the registered gateway', () => {
    const toUser = vi.fn();
    const toMentorship = vi.fn();
    setRealtimeSink({ toUser, toMentorship });

    emitToUser('u1', 'notification', { id: 'n1' });
    emitToMentorship('m1', 'message', { id: 'x1' });

    expect(toUser).toHaveBeenCalledWith('u1', 'notification', { id: 'n1' });
    expect(toMentorship).toHaveBeenCalledWith('m1', 'message', { id: 'x1' });
  });

  it('swallows a gateway failure rather than failing the caller', () => {
    // A socket problem must never fail the notification or the message that
    // triggered it — the row is committed, and the REST endpoint still has it.
    setRealtimeSink({
      toUser: () => {
        throw new Error('socket exploded');
      },
      toMentorship: () => {
        throw new Error('socket exploded');
      },
    });
    expect(() => emitToUser('u1', 'notification', {})).not.toThrow();
    expect(() => emitToMentorship('m1', 'message', {})).not.toThrow();
  });

  it('namespaces rooms so a user id cannot collide with a mentorship id', () => {
    const id = '00000000-0000-0000-0000-000000000000';
    expect(ROOM.user(id)).toBe(`user:${id}`);
    expect(ROOM.mentorship(id)).toBe(`mentorship:${id}`);
    expect(ROOM.user(id)).not.toBe(ROOM.mentorship(id));
  });
});
