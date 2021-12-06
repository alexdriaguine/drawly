import {
  ChooseWordEventData,
  CreateGameEventData,
  DrawReceiveEventData,
  DrawSendEventData,
  GameCreatedEventData,
  GameEndEventData,
  GameStartedEventData,
  GuessMadeEventData,
  JoinGameEventData,
  LeaveGameEventData,
  MakeGuessEventData,
  PlayerJoinedEventData,
  PlayerLeftEventData,
  RoundEndEventData,
  RoundStartedEventData,
  SendWordEventData,
  SocketEvents,
  StartGameEventData,
  StartNextRoundEventData,
} from '@shared/events'
import { Coordinate, Game, Guess } from '@shared/types'
import { socket } from '@socket/io'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { ReservedOrUserListener } from 'socket.io/dist/typed-events'
import { GameError } from './game-error'
import { GameService } from './game-service'

export type GameEvents = {
  // Game lifecyle
  'create-game': (data: CreateGameEventData) => void
  'game-created': (data: GameCreatedEventData) => void
  'start-game': (data: StartGameEventData) => void
  'game-started': (data: GameStartedEventData) => void
  'game-end': (data: GameEndEventData) => void

  // Player lifecyle
  'join-game': (data: JoinGameEventData) => void
  'player-joined': (data: PlayerJoinedEventData) => void
  'leave-game': (data: LeaveGameEventData) => void
  'player-left': (data: PlayerLeftEventData) => void

  // Game round lifecycle
  'start-next-round': (data: StartNextRoundEventData) => void
  'round-end': (data: RoundEndEventData) => void
  'round-started': (data: RoundStartedEventData) => void

  // Word events
  'choose-word': (data: ChooseWordEventData) => void
  'send-words': (data: SendWordEventData) => void
  'make-guess': (data: MakeGuessEventData) => void
  'guess-made': (data: GuessMadeEventData) => void

  // Draw events
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
  }

  // event handlers
  async function handleStartRound({ gameId }: StartNextRoundEventData) {
    emitNewRoundEvents(gameId)
  }

  async function handleCreateGame(data: CreateGameEventData) {
    const { playerId, name, socketId } = data
    const game = await gameService.creategame({
      playerId,
      name,
      socketId,
      maxRounds: 5,
      roundTime: 30,
    })

    if (game) {
      socket.join(game.id)
      io.in(game.id).emit('player-joined', { game: omitSecrets(game) })
    }
  }

  async function handleStartGame(data: StartGameEventData) {
    const game = await gameService.startGame({ gameId: data.gameId })

    io.in(data.gameId).emit('game-started', { game: omitSecrets(game) })

    const drawingPlayer = game.players.find(
      (p) => p.id === game.currentDrawingPlayer
    )

    if (!drawingPlayer) {
      throw new GameError('Not game found')
    }
    // io.to(drawingPlayer.socketId).emit('send-words', {
    //   words: [game.currentWord, 'poop', 'penis'],
    //   gameStatus: 'choosing-word',
    // })

    // const tick = game.roundTime * 1000
    // const gameInterval = setInterval(async () => {
    //   emitNewRoundEvents(data.gameId)
    //   const game = await gameService.getGame({ gameId: data.gameId })

    //   if (game) {
    //     if (game.currentRound === game.maxRounds) {
    //       clearInterval(gameInterval)
    //       io.in(game.id).emit('game-end', {})
    //     }
    //   }

    //   if (game?.currentRound === game?.maxRounds) {
    //     clearInterval(gameInterval)
    //   }
    // }, tick)
  }

  async function handleJoinGame(data: JoinGameEventData) {
    const game = await gameService.addPlayer(data)

    socket.join(game.id)

    io.in(game.id).emit('player-joined', { game: omitSecrets(game) })
  }

  async function handleLeaveGame({ gameId, playerId }: LeaveGameEventData) {
    const game = await gameService.leaveGame({ playerId, gameId })

    socket.leave(gameId)

    io.in(game.id).emit('player-left', { game: omitSecrets(game) })
  }

  async function handleChooseWord({ gameId, word }: ChooseWordEventData) {
    await gameService.setWordForRound({ gameId, word })
    const game = await gameService.nextRound({ gameId })

    io.in(game.id).emit('round-started', {
      drawingPlayerId: game.currentDrawingPlayer,
    })

    async function emitNewRoundEvents(gameId: string) {
      const drawingPlayer = game.players.find(
        (p) => p.id === game.currentDrawingPlayer
      )
    }

    // const tick = game.roundTime * 1000
    // const gameInterval = setInterval(async () => {
    //   emitNewRoundEvents(data.gameId)
    //   const game = await gameService.getGame({ gameId: data.gameId })

    //   if (game) {
    //     if (game.currentRound === game.maxRounds) {
    //       clearInterval(gameInterval)
    //       io.in(game.id).emit('game-end', {})
    //     }
    //   }

    //   if (game?.currentRound === game?.maxRounds) {
    //     clearInterval(gameInterval)
    //   }
    // }, tick)
  }

  async function handleMakeGuess({
    gameId,
    playerId,
    guess: text,
    date,
  }: MakeGuessEventData) {
    const { guess, score } = await gameService.makeGuess({
      gameId,
      playerId,
      text,
      date,
    })

    // socket.emit emits to the sender client
    socket.emit('guess-made', { guess, score })

    // socket.broadcast.to emits to everyone in the room except the sender
    socket.broadcast.to(gameId).emit('guess-made', {
      guess: { ...guess, text: guess.isCorrect ? '******' : guess.text },
      score,
    })
  }

  function handleDrawLine({ gameId, current, next }: DrawSendEventData) {
    socket.to(gameId).emit('draw-receive', { current, next })
  }

  // socket events
  socket
    .on('create-game', handleSocketError(handleCreateGame))
    .on('join-game', handleSocketError(handleJoinGame))
    .on('leave-game', handleSocketError(handleLeaveGame))
    .on('start-game', handleSocketError(handleStartGame))
    .on('draw-send', handleSocketError(handleDrawLine))
    .on('start-next-round', handleSocketError(handleStartRound))
    .on('make-guess', handleSocketError(handleMakeGuess))
    .on('choose-word', handleSocketError(handleChooseWord))
}
