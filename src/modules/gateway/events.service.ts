import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class EventsService {
  private server!: Server;

  // Called once by EventsGateway after the socket server is ready
  setServer(server: Server): void {
    this.server = server;
  }

  // The one method every other service calls
  // emits to every socket in the org's room
  emitToOrg(orgId: string, event: string, payload: unknown): void {
    if (!this.server) return; // guard: server not ready yet (startup edge case)
    this.server.to(`org:${orgId}`).emit(event, payload);
  }
}