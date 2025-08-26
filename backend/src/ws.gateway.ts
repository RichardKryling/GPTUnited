import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/ws',
  cors: { origin: process.env.CORS_ORIGIN || '*' },
})
export class WsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    client.emit('ready', { ok: true });
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() payload: any) {
    // echo back a pong; include payload for visibility
    this.server.emit('pong', { ok: true, payload });
  }
}
