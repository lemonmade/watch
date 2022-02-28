import createLocalTunnelServer from 'localtunnel-server';

const port = process.env.PORT ?? 3000;
const server = createLocalTunnelServer();

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`server listening on port: ${port}`);
});
