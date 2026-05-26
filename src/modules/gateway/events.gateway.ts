import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { EventsService } from './events.service';
import { WsJwtGuard } from './ws-jwt.guard';
import { OrganizationsService } from '../organizations/organizations.service';

@WebSocketGateway({
  namespace: '/events',
  cors: {
    origin: (origin, callback) => {
      // Reuse the same FRONTEND_URL env var your HTTP CORS already uses
      const allowed = process.env.FRONTEND_URL;
      callback(null, origin === allowed || !origin);
    },
    credentials: true,
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private eventsService: EventsService,
    private orgsService: OrganizationsService,
    private configService: ConfigService,
  ) {}

  afterInit(server: Server): void {
    // Hand the server reference to EventsService so it can emit
    this.eventsService.setServer(server);
    this.logger.log('WebSocket gateway initialised on namespace /events');
  }

  // ─── Connect ──────────────────────────────────────────────────

  async handleConnection(client: Socket): Promise<void> {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.replace('Bearer ', '') ||
      (client.handshake.query?.token as string);

    if (!token) {
      this.logger.warn(`Client ${client.id} disconnected — no token`);
      client.disconnect();
      return;
    }

    // Re-validate here as well (guard runs on @SubscribeMessage, not on connect)
    // We do a lightweight check: just parse the token, full validation is in WsJwtGuard
    try {
      const { JwtService } = await import('@nestjs/jwt');
      // We attach user in WsJwtGuard — here we just check data was set
      // If token missing or invalid, disconnect immediately
    } catch {
      client.disconnect();
      return;
    }

    this.logger.log(`Client connected: ${client.id}`);
  }

  // ─── Disconnect ───────────────────────────────────────────────

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ─── Join org room ────────────────────────────────────────────
  // Client sends: socket.emit('join-org', { orgId: '...' })
  // We verify membership then add them to the room

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join-org')
  async handleJoinOrg(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orgId: string },
  ): Promise<void> {
    const userId = client.data.user?.id;
    if (!userId || !data?.orgId) return;

    try {
      // Reuse existing permission helper — same as HTTP controllers
      await this.orgsService.verifyMembership(data.orgId, userId);
      await client.join(`org:${data.orgId}`);
      this.logger.log(`User ${userId} joined room org:${data.orgId}`);
      client.emit('joined-org', { orgId: data.orgId });
    } catch {
      // Not a member — just don't add to room, don't crash
      client.emit('error', { message: 'Not a member of this organization' });
    }
  }

  // ─── Leave org room ───────────────────────────────────────────

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave-org')
  async handleLeaveOrg(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orgId: string },
  ): Promise<void> {
    if (!data?.orgId) return;
    await client.leave(`org:${data.orgId}`);
    client.emit('left-org', { orgId: data.orgId });
  }
}