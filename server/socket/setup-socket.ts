import http from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { setupgameSocket } from '@server/game/game-socket'
import { setupDrawSocket } from '@server/draw/draw-socket'
import { GameService } from '@server/game/game-service'
import { SocketEvents } from '@shared/events'

const setupGeneralSocket = (
  io: SocketIOServer<SocketEvents>,
  socket: Socket<SocketEvents>
) => {
  socket.on('disconnect', handleDisconnect)
  socket.on('disconnecting', handleDisconnecting)

  function handleDisconnect() {
    console.log('disconnected')
  }

  function handleDisconnecting() {
    console.log('disconnecting')
  }
}

export const setupSocketIO = (options: {
  httpServer: http.Server
  gameService: GameService
}) => {
  const { httpServer, gameService } = options
  const io = new SocketIOServer<SocketEvents>(httpServer)

  io.sockets.on('connection', (socket) => {
    // list of how to emit stuf with sockets
    // https://stackoverflow.com/a/10099325
    setupGeneralSocket(io, socket)
    setupgameSocket(io, socket, gameService)
    setupDrawSocket(io, socket)
  })
}
