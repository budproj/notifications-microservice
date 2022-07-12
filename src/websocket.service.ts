import { Logger, NotImplementedException } from '@nestjs/common';
import {
  Client,
  ClientProxy,
  Transport,
  // Transport,
} from '@nestjs/microservices';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebSocketService
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  @Client({ transport: Transport.NATS })
  private client: ClientProxy;

  private socketsByUserSub: Map<string, string> = new Map();

  private readonly logger = new Logger(WebSocketService.name);

  @SubscribeMessage('health-check')
  public onHealthcheck(
    @MessageBody() data: unknown,
    @ConnectedSocket() socket: Socket,
  ): unknown {
    socket.emit('health-checked', true);
    return data;
  }

  public getSocketsByUserSub(userSub: string) {
    return this.socketsByUserSub.get(userSub);
  }

  public setSocketsByUserSub(userSub: string, socketId: Socket['id']) {
    return this.socketsByUserSub.set(userSub, socketId);
  }

  public notifyUser(userSub: string, notificationData: unknown): void {
    // TODO: pega o userSub, enconntra o socket e envia a notificationData
    throw new NotImplementedException();
  }

  public afterInit() {
    this.logger.log('Websocket Server Started,Listening on Port:');
  }

  public handleDisconnect(socket: Socket) {
    const userId = socket.data.userSub;
    this.socketsByUserSub.delete(userId);

    this.logger.log(`Client disconnected: ${socket.id}`);
  }

  public handleConnection(socket: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${socket.id}`);

    // // connected
    // socket.data.userSub = 'userSub'
    // this.socketsByUserSub.set('userSub', socket.id);

    // // disconnected
    // const userSub = socket.data.userSub
    // this.socketsByUserSub.delete(userSub)

    // // quando outro local precisa enviar info para dado socket
    // const socketId = this.socketsByUserSub.get('userSub');
    // const socketToUser = this.server.sockets.sockets.get(socketId);

    const randomId = Math.floor(Math.random() * 10000);
    const notification = {
      id: randomId,
      message: `VC SE CONECTOU, PARABAINS!`,
    };
    socket.send('teste');
    socket.emit('notification', notification);
  }
}
