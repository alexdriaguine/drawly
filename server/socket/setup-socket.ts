import http from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { setupRoomSocket } from '@server/rooms/room-socket'
import { setupDrawSocket } from '@server/draw/draw-socket'
import { RoomService, createRoomService } from '@server/rooms/room-service'
import { GenericSocketEvents, SocketEvents } from './socket-events'

const setupGeneralSocket = (
  io: SocketIOServer<SocketEvents>,
  socket: Socket<SocketEvents>,
  roomService: RoomService
) => {
  socket.on('disconnect', handleDisconnect)
  socket.on('disconnecting', handleDisconnecting)

  function handleDisconnect() {
    roomService.removePlayer({ playerId: socket.id })
  }

  function handleDisconnecting() {
    console.log('disconnecting')
  }
}

export const setupSocketIO = (options: {
  httpServer: http.Server
  roomService: RoomService
}) => {
  const { httpServer, roomService } = options
  const io = new SocketIOServer<SocketEvents>(httpServer)

  io.sockets.on('connection', (socket) => {
    // list of how to emit stuf with sockets
    // https://stackoverflow.com/a/10099325
    setupGeneralSocket(io, socket, roomService)
    setupRoomSocket(io, socket, roomService)
    setupDrawSocket(io, socket)
  })
}
