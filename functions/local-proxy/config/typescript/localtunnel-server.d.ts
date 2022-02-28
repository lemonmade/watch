declare module 'localtunnel-server' {
  import type {Server} from 'http';

  export interface TunnelServerOptions {
    secure?: boolean;
  }

  function createLocalTunnelServer(options?: TunnelServerOptions): Server;

  export = createLocalTunnelServer;
}
