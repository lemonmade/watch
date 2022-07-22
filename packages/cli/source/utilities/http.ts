import type {Server} from 'net';

// Adapted from https://github.com/gajus/http-terminator/blob/master/src/factories/createInternalHttpTerminator.ts
export function makeStoppableServer(server: Server) {
  let stopping = false;

  const sockets = new Set<import('net').Socket>();

  server.on('connection', (socket) => {
    if (stopping) {
      socket.destroy();
      return;
    }

    sockets.add(socket);
    socket.once('destroy', () => sockets.delete(socket));
  });

  return () => {
    stopping = true;

    server.on('request', (_, outgoingMessage) => {
      if (!outgoingMessage.headersSent) {
        outgoingMessage.setHeader('connection', 'close');
      }
    });

    for (const socket of sockets) {
      // @ts-expect-error it's here, I promise
      const serverResponse = socket._httpMessage;

      if (serverResponse) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader('connection', 'close');
        }

        continue;
      }

      socket.destroy();
    }

    return new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  };
}

export function findPortAndListen(server: Server, initialPort = 3000) {
  return new Promise<number>((resolve, reject) => {
    let port = initialPort;

    function handleError(error: Error & {code?: string}) {
      if (error.code === 'EADDRINUSE') {
        port += 1;
        server.listen(port, handleListen);
      } else {
        server.off('error', handleError);
        reject(error);
      }
    }

    function handleListen() {
      server.off('error', handleError);
      resolve(port);
    }

    server.on('error', handleError);
    server.listen(port, handleListen);
  });
}
