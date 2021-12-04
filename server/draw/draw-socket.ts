import { Server as SocketIOServer, Socket } from 'socket.io'
import { Coordinate } from '@shared/types'
import { SocketEvents } from '@shared/events'

export const setupDrawSocket = (
  io: SocketIOServer<SocketEvents>,
  socket: Socket<SocketEvents>
) => {
  socket.on('draw-send', drawLine)

  function drawLine(data: {
    current: Coordinate
    next: Coordinate
    gameId: string
  }) {
    socket
      .to(data.gameId)
      .emit('draw-receive', { current: data.current, next: data.next })
  }
}
