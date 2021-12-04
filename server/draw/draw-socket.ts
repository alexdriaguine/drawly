import { Server as SocketIOServer, Socket } from 'socket.io'
import { Coordinate } from '@shared/types'
import { SocketEvents } from '@server/socket/socket-events'

export const setupDrawSocket = (
  io: SocketIOServer<SocketEvents>,
  socket: Socket<SocketEvents>
) => {
  socket.on('draw-send', drawLine)

  function drawLine(data: {
    current: Coordinate
    next: Coordinate
    roomId: string
  }) {
    socket
      .to(data.roomId)
      .emit('draw-receive', { current: data.current, next: data.next })
  }
}
