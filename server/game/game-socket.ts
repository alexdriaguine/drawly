import { SocketEvents } from '@shared/events'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { GameService } from './game-service'

export const setupgameSocket = (
  io: SocketIOServer<SocketEvents>,
  socket: Socket<SocketEvents>,
  gameService: GameService
) => {
  socket.on('create-game', createGame)
  socket.on('message', sendMessage)
  socket.on('join-game', joinGame)
  socket.on('leave-game', leaveGame)

  function createGame(data: { playerId: string; name: string }) {
    console.log('create-game', data)
    const { playerId, name } = data
    gameService
      .creategame({ playerId, name })
      .then((game) => {
        socket.join(game.id)
        io.in(game.id).emit('player-joined', { game })
      })
      .catch((error) => socket.emit('exception', { error }))
  }

  function sendMessage(data: { message: string; gameId: string }) {
    io.in(data.gameId).emit('new-message', {
      id: Date.now().toString(),
      text: data.message,
    })
  }

  function joinGame({
    playerId,
    gameId,
    name,
  }: {
    gameId: string
    playerId: string
    name: string
  }) {
    gameService
      .addPlayer({ playerId, gameId, name })
      .then((game) => {
        socket.join(game.id)
        io.in(game.id).emit('player-joined', { game })
      })
      .catch((error) => socket.emit('exception', { error }))
  }

  function leaveGame({
    gameId,
    playerId,
  }: {
    gameId: string
    playerId: string
  }) {
    socket.leave(gameId)
    gameService
      .leavegame({ playerId, gameId })
      .then((game) => {
        io.in(game.id).emit('player-left', { game })
      })
      .catch((error) => socket.emit('exception', { error }))
  }
}
