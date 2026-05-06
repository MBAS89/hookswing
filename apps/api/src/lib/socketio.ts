import type { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function setIO(socketServer: SocketIOServer) {
  io = socketServer;
}

export function getIO(): SocketIOServer | null {
  return io;
}
