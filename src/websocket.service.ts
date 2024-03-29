import { Logger } from '@nestjs/common';
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
import { Stopwatch } from './decorators/pino.decorator';

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

  public _socketsByUserSub: Map<string, string> = new Map();

  private readonly logger = new Logger(WebSocketService.name);

  @Stopwatch()
  @SubscribeMessage('health-check')
  public onHealthcheck(
    @MessageBody() data: unknown,
    @ConnectedSocket() socket: Socket,
  ): unknown {
    socket.emit('health-checked', true);
    return data;
  }

  @Stopwatch()
  @SubscribeMessage('notifyUser')
  public notifyUser(userSub: string, notificationData: notification) {
    const socketId = this._socketsByUserSub.get(userSub);
    this.logger.log(`Notifying user: ${userSub}@${socketId}`);
    this._server.to(userSub).emit('newNotification', notificationData);
  }

  public afterInit() {
    this.logger.log('Websocket Server Started,Listening on Port:');
  }

  @Stopwatch()
  public async getNotifications(@ConnectedSocket() socket: Socket) {
    const { userSub } = socket?.data;
    const notifications = await this.notification.notifications({
      where: { recipientId: userSub },
      take: 50,
      orderBy: { timestamp: 'desc' }
    });

    notifications.forEach((notification) => {
      socket.emit('newNotification', notification);
    });

    return notifications;
  }

  @Stopwatch()
  @SubscribeMessage('readNotifications')
  public async readNotifications(@ConnectedSocket() socket: Socket) {
    const { userSub } = socket?.data;

    await this.notification.updatenotifications({
      where: { recipientId: userSub, isRead: false },
      data: { isRead: true },
    });
  }

  public handleDisconnect(socket: Socket) {
    this.logger.log(`Client disconnected: ${socket.id}`);
  }

  @Stopwatch()
  public async handleConnection(@ConnectedSocket() socket: Socket) {
    this.logger.log(`Client connected: ${socket.id}`);
    const token = socket.handshake.auth.token;

    try {
      const decodedToken = await this.authService.verifyToken(token);
      const userSub = decodedToken.sub;

      this.logger.log(`Registering user: ${userSub}`);
      socket.join(userSub);
      Object.assign(socket, { data: { userSub } });

      this.logger.log(`Getting ${userSub}'s notifications`);
      this.getNotifications(socket);
    } catch (err) {
      this.logger.error(err);
      socket.disconnect(true);
    }
  }
}
