import { Logger, type OnModuleDestroy } from '@nestjs/common';
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { and, eq, or } from 'drizzle-orm';
import type { Server, Socket } from 'socket.io';
import { auth } from '../auth/auth.js';
import { db } from '../db/db.js';
import { mentorships } from '../db/schema.js';
import { env } from '../env.js';
import { ROOM, setRealtimeSink } from './realtime.sink.js';

type AuthedSocket = Socket & { userId?: string };

/**
 * ONE socket per client, carrying both chat and notifications.
 *
 * Two connections would mean two handshakes, two auth round-trips, two
 * keepalives and two reconnect storms on a flaky network — roughly twice the
 * data and battery for no benefit. Rooms separate the concerns instead:
 *
 *   user:<userId>          this person's notification feed
 *   mentorship:<id>        one thread, both parties
 *
 * Socket.IO rather than raw ws, for one reason that matters here: it falls back
 * to HTTP long-polling when a carrier or proxy blocks the WebSocket upgrade,
 * which happens on mobile networks more than it should. Raw ws just fails, and
 * "it should just work" is the requirement.
 *
 * THE SOCKET IS AN ACCELERATOR, NOT A TRANSPORT OF RECORD. Every message and
 * notification is written to the database before it is emitted, and the REST
 * endpoints remain the source of truth and the catch-up path — a client that
 * misses an emit re-reads with GET /messages/:id?after=<cursor>. On networks
 * like this one, dropped connections are the normal case, so a socket that were
 * the only delivery path would lose messages routinely.
 */
@WebSocketGateway({
  cors: {
    origin: [env.appUrl, env.adminUrl, env.marketingUrl],
    credentials: true,
  },
  // Long-polling stays enabled on purpose — see above.
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  afterInit(server: Server) {
    // Authenticate in the HANDSHAKE, not in handleConnection.
    //
    // Disconnecting inside handleConnection is too late: Socket.IO has already
    // completed the handshake, so the client fires its own `connect` event and
    // is only torn down afterwards. An unauthenticated client therefore
    // observes a successful connection, however briefly — and any code that
    // acts on `connect` runs. Rejecting here means the connection never exists.
    server.use(async (socket, next) => {
      const userId = await this.resolveUser(socket as AuthedSocket);
      if (!userId) return next(new Error('unauthorized'));
      (socket as AuthedSocket).userId = userId;
      next();
    });

    setRealtimeSink({
      toUser: (userId, event, payload) =>
        this.server.to(ROOM.user(userId)).emit(event, payload),
      toMentorship: (mentorshipId, event, payload) =>
        this.server.to(ROOM.mentorship(mentorshipId)).emit(event, payload),
    });
    this.logger.log('realtime gateway ready');
  }

  onModuleDestroy() {
    setRealtimeSink(null);
  }

  /**
   * Resolve the acting user from the handshake.
   *
   * Better Auth only — a cookie from the browser, a bearer token from Expo.
   * Deliberately NOT the internal shared secret the REST guards still accept:
   * this is the first thing where a browser talks to the API directly, and a
   * secret that lets its holder act as any user must never reach client code.
   *
   * A consequence worth knowing: the Expo app works the moment it ships,
   * because it authenticates with Better Auth from the start. The web client
   * cannot connect until the auth cutover, because it still holds a Clerk
   * session. That is the right way round — it fails closed.
   */
  private async resolveUser(client: AuthedSocket): Promise<string | null> {
    try {
      const headers = new Headers();
      for (const [key, value] of Object.entries(client.handshake.headers)) {
        if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
        else if (value) headers.set(key, value);
      }
      // Expo has no cookie jar and sends the token in handshake.auth.
      const token = (client.handshake.auth as { token?: string })?.token;
      if (token) headers.set('authorization', `Bearer ${token}`);

      const session = await auth.api.getSession({ headers });
      return session?.user?.id ?? null;
    } catch {
      return null;
    }
  }

  /** The handshake middleware has already authenticated by this point. */
  async handleConnection(client: AuthedSocket) {
    if (!client.userId) {
      client.disconnect(true);
      return;
    }
    // Everyone joins their own channel. Thread rooms are joined on request,
    // after membership is checked.
    await client.join(ROOM.user(client.userId));
  }

  handleDisconnect(_client: AuthedSocket) {
    // Socket.IO leaves every room automatically. Nothing to clean up.
  }

  /**
   * Join a mentorship thread.
   *
   * Membership is checked HERE, against the database, every time. A room name
   * is a guessable uuid, so without this any authenticated socket could join
   * any thread and read two other people's conversation — one of them usually
   * a child.
   */
  @SubscribeMessage('mentorship:join')
  async joinMentorship(client: AuthedSocket, mentorshipId: string) {
    if (!client.userId || typeof mentorshipId !== 'string') {
      return { ok: false };
    }

    const [member] = await db
      .select({ id: mentorships.id })
      .from(mentorships)
      .where(
        and(
          eq(mentorships.id, mentorshipId),
          or(
            eq(mentorships.menteeId, client.userId),
            eq(mentorships.mentorId, client.userId),
          ),
        ),
      )
      .limit(1);

    if (!member) return { ok: false };

    await client.join(ROOM.mentorship(mentorshipId));
    return { ok: true };
  }

  @SubscribeMessage('mentorship:leave')
  async leaveMentorship(client: AuthedSocket, mentorshipId: string) {
    if (typeof mentorshipId !== 'string') return { ok: false };
    await client.leave(ROOM.mentorship(mentorshipId));
    return { ok: true };
  }
}
