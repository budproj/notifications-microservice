import {
  forwardRef,
  Inject,
  Logger,
  NotImplementedException,
} from '@nestjs/common';
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
import { NotificationService } from './notification.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebSocketService
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  constructor(private notification: NotificationService) {}

  @WebSocketServer()
  server: Server;

  @Client({ transport: Transport.NATS })
  private client: ClientProxy;

  public _socketsByUserSub: Map<string, string> = new Map();

  private readonly logger = new Logger(WebSocketService.name);

  @SubscribeMessage('health-check')
  public onHealthcheck(
    @MessageBody() data: unknown,
    @ConnectedSocket() socket: Socket,
  ): unknown {
    socket.emit('health-checked', true);
    return data;
  }

  public notifyUser(userSub: string, notificationData: unknown): void {
    // TODO: pega o userSub, enconntra o socket e envia a notificationData
    throw new NotImplementedException();
  }

  public afterInit() {
    this.logger.log('Websocket Server Started,Listening on Port:');
  }

  @SubscribeMessage('connected')
  public async connected(
    @MessageBody() userToken: string,
    @ConnectedSocket() socket: Socket,
  ) {
    const user = JSON.parse(userToken);
    const userSub = user.sub;

    this._socketsByUserSub.set(userSub, socket.id);
    Object.assign(socket, { data: { userSub: userSub } });

    const notifications = await this.notification.notifications({
      where: { recipientId: userSub },
      take: 50,
    });

    notifications.forEach((notification) => {
      socket.emit('newNotification', notification);
    });
  }

  @SubscribeMessage('readNotifications')
  public async readNotifications(@ConnectedSocket() socket: Socket) {
    const { userSub } = socket?.data;

    await this.notification.updatenotifications({
      where: { recipientId: userSub, isRead: false },
      data: { isRead: true },
    });
  }

  public handleDisconnect(socket: Socket) {
    const userId = socket.data.userSub;
    this._socketsByUserSub.delete(userId);

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
