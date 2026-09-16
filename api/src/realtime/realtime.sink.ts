/**
 * The seam between the ported notification/messaging internals and the socket
 * gateway.
 *
 * dispatch() and the messaging service are plain functions and Nest providers
 * respectively; the gateway is a provider that needs to reach both. Rather than
 * thread it through as a dependency — which would drag Nest DI into 1,300 lines
 * of ported dispatch logic — the gateway registers itself here on init and the
 * emitters call through this.
 *
 * Default is a no-op, so nothing changes when realtime is not running: the
 * REST endpoints and push both behave exactly as they did.
 */
export type RealtimeSink = {
  toUser(userId: string, event: string, payload: unknown): void;
  toMentorship(mentorshipId: string, event: string, payload: unknown): void;
};

const NOOP: RealtimeSink = { toUser: () => {}, toMentorship: () => {} };

let sink: RealtimeSink = NOOP;

export function setRealtimeSink(next: RealtimeSink | null): void {
  sink = next ?? NOOP;
}

/**
 * Emit to one person's own channel.
 *
 * Never throws and never awaits anything meaningful: a realtime failure must
 * not fail the notification that triggered it. The database row is already
 * written by the time this runs, so a dropped emit costs the recipient nothing
 * worse than the delay they had before — the next poll or reconnect picks it up.
 */
export function emitToUser(
  userId: string,
  event: string,
  payload: unknown,
): void {
  try {
    sink.toUser(userId, event, payload);
  } catch {
    // Deliberately swallowed. See above.
  }
}

/** Emit to both parties of a mentorship thread. */
export function emitToMentorship(
  mentorshipId: string,
  event: string,
  payload: unknown,
): void {
  try {
    sink.toMentorship(mentorshipId, event, payload);
  } catch {
    // Deliberately swallowed. See above.
  }
}

/** Room names. One definition, so the gateway and any test agree. */
export const ROOM = {
  user: (userId: string) => `user:${userId}`,
  mentorship: (id: string) => `mentorship:${id}`,
};
