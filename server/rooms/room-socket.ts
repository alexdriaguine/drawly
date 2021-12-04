import { SocketEvents } from '@server/socket/socket-events'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { RoomService } from './room-service'

export const setupRoomSocket = (
  io: SocketIOServer<SocketEvents>,
  socket: Socket<SocketEvents>,
  roomService: RoomService
) => {
  socket.on('create-room', createRoom)
  socket.on('message', sendMessage)
  socket.on('room-join', joinRoom)
  socket.on('leave-room', leaveRoom)

  function createRoom(data: { playerId: string }) {
    console.log('create-room', data)
    const { playerId } = data
    roomService
      .createRoom({ playerId })
      .then((room) => {
        socket.join(room.id)
        io.in(room.id).emit('player-joined', { room })
      })
      .catch((error) => socket.emit('exception', { error }))
  }

  function sendMessage(data: { message: string; roomId: string }) {
    io.in(data.roomId).emit('new-message', {
      id: Date.now().toString(),
      text: data.message,
    })
  }

  function joinRoom({
    playerId,
    roomId,
  }: {
    roomId: string
    playerId: string
  }) {
    console.log(playerId, roomId)
    roomService
      .addPlayer({ playerId, roomId })
      .then((room) => {
        socket.join(room.id)
        io.in(room.id).emit('player-joined', { room })
      })
      .catch((error) => socket.emit('exception', { error }))
  }

  function leaveRoom({
    roomId,
    playerId,
  }: {
    roomId: string
    playerId: string
  }) {
    socket.leave(roomId)
    roomService
      .leaveRoom({ playerId, roomId })
      .then((room) => {
        io.in(room.id).emit('player-left', { room })
      })
      .catch((error) => socket.emit('exception', { error }))
  }
}
