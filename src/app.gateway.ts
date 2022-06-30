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

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);

    const randomId = Math.floor(Math.random() * 10000);
    const notification = {
      id: randomId,
      message: `VC SE CONECTOU, PARABAINS!`,
    };
    client.emit('notification', notification);
  }
}
