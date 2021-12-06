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
} from '@shared/events'
import { Game } from '@shared/types'
import { socket } from '@socket/io'
import addSeconds from 'date-fns/addSeconds'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { ReservedOrUserListener } from 'socket.io/dist/typed-events'
import { GameError } from './game-error'
import { GameService } from './game-service'

export type GameEvents = {
  // Game lifecyle
  'create-game': (data: CreateGameEventData) => void
  'game-created': (data: GameCreatedEventData) => void
  'start-game': (data: StartGameEventData) => void
  'prepare-next-round': (data: GameStartedEventData) => void
  'game-end': (data: GameEndEventData) => void

  // Player lifecyle
  'join-game': (data: JoinGameEventData) => void
  'player-joined': (data: PlayerJoinedEventData) => void
  'leave-game': (data: LeaveGameEventData) => void
  'player-left': (data: PlayerLeftEventData) => void

  // Game round lifecycle
  'round-end': (data: RoundEndEventData) => void
  'round-start': (data: RoundStartedEventData) => void

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
  function omitSecrets(game: Game) {
    const { currentWord: _, wordsDrawn: __, ...gameWithoutSecrets } = game
    return gameWithoutSecrets
  }

  async function handleCreateGame(data: CreateGameEventData) {
    const { playerId, name, socketId } = data
    const game = await gameService.creategame({
      playerId,
      name,
      socketId,
      maxRounds: 5,
      roundTime: 5,
    })

    if (game) {
      socket.join(game.id)
      io.in(game.id).emit('player-joined', { game: omitSecrets(game) })
    }
  }

  /**
   * 1. Start game -> handleStartGame, setup
   * 2. handleNextRound() aka send 3 words to drawing player
   * 3. player chooses words, emits handle-choose-words
   * 4. handleStartRound() aka round starts. timer counts down
   * 5. handleRoundEnd() aka break for 5-10 seconds, update clients game state
   * 6. handleNextRound
   *
   */

  /**
   * socket event that fires when the "leader" presses the Start game button
   * prepares the game and then fires of the prepare-next-round event, sending
   * some words to the drawing player
   */
  async function handleGameStarted(data: StartGameEventData) {
    const { game, potentialWords } = await gameService.startGame({
      gameId: data.gameId,
    })

    const drawingPlayer = game.players.find(
      (p) => p.id === game.currentDrawingPlayer
    )

    if (!drawingPlayer) {
      throw new GameError('Could not find a player for drawing')
    }

    io.in(data.gameId).emit('prepare-next-round', {
      game: omitSecrets(game),
    })

    io.to(drawingPlayer.socketId).emit('send-words', {
      words: potentialWords,
    })
  }

  async function handleChooseWord({ gameId, word }: ChooseWordEventData) {
    // players chooses a word. update it
    const game = await gameService.startNextRound({ gameId, word })

    io.in(game.id).emit('round-start', {
      roundEnd: addSeconds(Date.now(), game.roundTime),
      gameStatus: game.status,
    })

    // todo: better timers, base on timestamps

    setTimeout(async () => {
      const game = await gameService.endRound({ gameId })
      io.in(game.id).emit('round-end', { gameStatus: game.status })

      setTimeout(async () => {
        const { game, potentialWords } = await gameService.prepareNextRound({
          gameId,
        })
        const drawingPlayer = game.players.find(
          (p) => p.id === game.currentDrawingPlayer
        )

        if (!drawingPlayer) {
          throw new Error('Drawing player not found')
        }

        io.in(game.id).emit('prepare-next-round', {
          game: omitSecrets(game),
        })

        io.to(drawingPlayer.socketId).emit('send-words', {
          words: potentialWords,
        })

        // emit a new round
      }, 5000)
    }, game.roundTime * 1000)
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
    .on('start-game', handleSocketError(handleGameStarted))
    .on('draw-send', handleSocketError(handleDrawLine))
    .on('make-guess', handleSocketError(handleMakeGuess))
    .on('choose-word', handleSocketError(handleChooseWord))
}
