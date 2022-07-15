import { Logger, NotImplementedException } from '@nestjs/common';
import { Client, ClientProxy, Transport } from '@nestjs/microservices';
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
import { notification } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebSocketService
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  constructor(
    private authService: AuthService,
    private notification: NotificationService,
  ) {}

  @WebSocketServer()
  public _server: Server;

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

  @SubscribeMessage('notifyUser')
  public notifyUser(userSub: string, notificationData: notification) {
    // TODO: pega o userSub, encontra o socket e envia a notificationData

    const socketId = this._socketsByUserSub.get(userSub);

    const socket = this._server.sockets.sockets.get(socketId);

    if (socket) {
      socket.emit('newNotification', notificationData);
    }
  }

  public afterInit() {
    this.logger.log('Websocket Server Started,Listening on Port:');
  }

  @SubscribeMessage('connected')
  public async connected(
    @MessageBody() data: { token: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const decodedToken = await this.authService.verifyToken(data.token);
    const userSub = decodedToken.sub;

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
    // const socketToUser = this._server.sockets.sockets.get(socketId);

    const randomId = Math.floor(Math.random() * 10000);
    const notification = {
      id: randomId,
      message: `VC SE CONECTOU, PARABAINS!`,
    };
    socket.send('teste');
    socket.emit('notification', notification);
  }
}
