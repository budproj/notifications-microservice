import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { setTimeout } from 'timers/promises';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;
  socketsByUserSub: Map<string, string> = new Map();

  private readonly logger = new Logger(EventsGateway.name);

  @SubscribeMessage('events')
  async findAll(@MessageBody() data: number): Promise<any> {
    console.log('alguem se subscreveu em events', data);
    await setTimeout(1000);
    return { event: 'events', biru: 'leibe' };
  }

  @SubscribeMessage('identity')
  async identity(@MessageBody() data: number): Promise<number> {
    return data;
  }

  @SubscribeMessage('health-check')
  healthcheck(
    @MessageBody() data: unknown,
    @ConnectedSocket() socket: Socket,
  ): unknown {
    socket.emit('health-checked', true);

    return data;
  }

  @SubscribeMessage('comment')
  async commentHandler(
    @MessageBody() data: number,
    @ConnectedSocket() socket: Socket,
  ): Promise<number> {
    console.log(`
      The socket ${socket.id} has sent a comment:
      ${data}
    `);

    const notifications = [...Array(5).keys()].map(() => ({
      id: Math.floor(Math.random() * 10000),
      message: `${socket.id} has commented on your post`,
    }));

    notifications.forEach((notification) => {
      socket.emit('notification', notification);
    });

    return data;
  }

  afterInit() {
    this.logger.log('Websocket Server Started,Listening on Port:');
  }

  handleConnection(socket: Socket, ...args: any[]) {
    console.log(`Client connected: ${socket.id}`);

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
    socket.emit('notification', notification);
  }
}
