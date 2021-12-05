import http from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { setupGameSocket } from '@server/game/game-socket'
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

  io.use((socket, next) => {
    console.log('socket middleware')
    try {
      console.log('try')
      next()
    } catch (err) {
      console.log('catch err')
      // @ts-ignore
      next(err)
    }
  })

  io.sockets.on('connection', (socket) => {
    socket.emit('connected', 'connected')
    // https://stackoverflow.com/a/10099325
    setupGeneralSocket(io, socket)
    setupGameSocket(io, socket, gameService)
  })
}
