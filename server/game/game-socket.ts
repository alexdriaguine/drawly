import { SocketEvents } from '@shared/events'
import { Coordinate, Game } from '@shared/types'
import { socket } from '@socket/io'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { ReservedOrUserListener } from 'socket.io/dist/typed-events'
import { GameService } from './game-service'

type GameWithoutSecrets = Omit<Game, 'currentWord' | 'wordsDrawn'>

type CreateGameEventData = {
  playerId: string
  name: string
  socketId: string
}
type GameCreatedEventData = { game: GameWithoutSecrets; playerId: string }
type JoinGameEventData = {
  gameId: string
  playerId: string
  name: string
  socketId: string
}
type LeaveGameEventData = { gameId: string; playerId: string }
type PlayerLeftEventData = { game: GameWithoutSecrets }
type PlayerJoinedEventData = { game: GameWithoutSecrets }
type GameStartedEventData = { game: GameWithoutSecrets }
type StartGameEventData = { gameId: string }
type StartNextRoundEventData = { gameId: string }
type RoundStartedEventData = { drawingPlayerId: string }
type DrawReceiveEventData = { current: Coordinate; next: Coordinate }
type DrawSendEventData = {
  current: Coordinate
  next: Coordinate
  gameId: string
}

export type GameEvents = {
  'create-game': (data: CreateGameEventData) => void
  'game-created': (data: GameCreatedEventData) => void
  'join-game': (data: JoinGameEventData) => void
  'leave-game': (data: LeaveGameEventData) => void
  'player-left': (data: PlayerLeftEventData) => void
  'player-joined': (data: PlayerJoinedEventData) => void
  'start-game': (data: StartGameEventData) => void
  'game-started': (data: GameStartedEventData) => void
  'round-started': (data: RoundStartedEventData) => void
  'start-next-round': (data: StartNextRoundEventData) => void
  'draw-send': (data: DrawSendEventData) => void
  'draw-receive': (data: DrawReceiveEventData) => void
}

function handleSocketError(
  handler: ReservedOrUserListener<GameEvents, GameEvents, any>
) {
  return async function handle(data: any) {
    try {
      await handler(data)
    } catch (error) {
      console.error('socket error: ', error)
      socket.emit('exception', { error })
    }
  }
}

export function setupGameSocket(
  io: SocketIOServer<SocketEvents>,
  socket: Socket<SocketEvents>,
  gameService: GameService
) {
  // internal helpers

  function omitSecrets(game: Game) {
    const { currentWord: _, wordsDrawn: __, ...gameWithoutSecrets } = game
    return gameWithoutSecrets
  }
  async function emitNewRoundEvents(gameId: string) {
    const game = await gameService.nextRound({ gameId })

    io.in(game.id).emit('round-started', {
      drawingPlayerId: game.currentDrawingPlayer,
    })
    const drawingPlayer = game.players.find(
      (p) => p.id === game.currentDrawingPlayer
    )

    if (socket.id === drawingPlayer?.socketId) {
      console.log(drawingPlayer)
    }
  }

  // socket listeners
  async function startRound({ gameId }: StartNextRoundEventData) {
    emitNewRoundEvents(gameId)
  }

  async function createGame(data: CreateGameEventData) {
    const { playerId, name, socketId } = data
    const game = await gameService.creategame({ playerId, name, socketId })

    if (game) {
      socket.join(game.id)
      io.in(game.id).emit('player-joined', { game: omitSecrets(game) })
    }
  }

  async function startGame(data: StartGameEventData) {
    const game = await gameService.startGame({ gameId: data.gameId })

    io.in(data.gameId).emit('game-started', { game: omitSecrets(game) })

    emitNewRoundEvents(game.id)
  }

  async function joinGame(data: JoinGameEventData) {
    const game = await gameService.addPlayer(data)

    socket.join(game.id)

    io.in(game.id).emit('player-joined', { game: omitSecrets(game) })
  }

  async function leaveGame({ gameId, playerId }: LeaveGameEventData) {
    const game = await gameService.leaveGame({ playerId, gameId })

    socket.leave(gameId)

    io.in(game.id).emit('player-left', { game: omitSecrets(game) })
  }

  function drawLine({ gameId, current, next }: DrawSendEventData) {
    socket.to(gameId).emit('draw-receive', { current, next })
  }

  // socket events
  socket
    .on('create-game', handleSocketError(createGame))
    .on('join-game', handleSocketError(joinGame))
    .on('leave-game', handleSocketError(leaveGame))
    .on('start-game', handleSocketError(startGame))
    .on('draw-send', handleSocketError(drawLine))
    .on('start-next-round', handleSocketError(startRound))
}
