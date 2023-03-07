export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  rabbitmqConnectionString:
    process.env.RABBITMQ_CONNECTION_STRING || 'amqp://rabbitmq:5672',
});
