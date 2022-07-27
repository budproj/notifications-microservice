import { Logger } from '@nestjs/common';
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
    const socketId = this._socketsByUserSub.get(userSub);
    this.logger.log(`Notifying user: ${userSub}@${socketId}`);
    this._server.to(socketId).emit('newNotification', notificationData);
  }

  public afterInit() {
    this.logger.log('Websocket Server Started,Listening on Port:');
  }

  public async getNotifications(@ConnectedSocket() socket: Socket) {
    const { userSub } = socket?.data;
    const notifications = await this.notification.notifications({
      where: { recipientId: userSub },
      take: 50,
    });

    notifications.forEach((notification) => {
      socket.emit('newNotification', notification);
    });

    return notifications;
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

  public async handleConnection(@ConnectedSocket() socket: Socket) {
    this.logger.log(`Client connected: ${socket.id}`);
    const token = socket.handshake.auth.token;

    try {
      const decodedToken = await this.authService.verifyToken(token);
      const userSub = decodedToken.sub;

      this.logger.log(`Registering user: ${userSub}`);
      this._socketsByUserSub.set(userSub, socket.id);
      Object.assign(socket, { data: { userSub } });

      this.logger.log(`Getting ${userSub}'s notifications`);
      this.getNotifications(socket);
    } catch (err) {
      this.logger.error(err);
      socket.disconnect(true);
    }
  }
}
