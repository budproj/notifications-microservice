export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  natsConnectionString:
    process.env.NATS_CONNECTION_STRING || 'nats://localhost:4222',
});
