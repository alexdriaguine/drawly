import { v4 as uuidv4 } from 'uuid'
import { addSeconds, differenceInSeconds } from 'date-fns'
import { Game } from '@shared/types'
import { GameError } from './game-error'
import { getWords } from './words'

function generateGameId() {
  return (Math.random() + 1).toString(36).substring(7)
}

function shuffleArray<T>(array: T[]): T[] {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
}

// use a in memory database for this instead
export function createGameService() {
  let games: Game[] = []

  function _getGame({ gameId }: { gameId: string }): Promise<Game | undefined> {
    return Promise.resolve(
      games.find((game) => game.id.toLowerCase() === gameId.toLowerCase())
    )
  }

  async function createGame({
    playerId,
    name,
    socketId,
    maxRounds,
    roundTime,
  }: {
    playerId: string
    name: string
    socketId: string
    maxRounds: number
    roundTime: number
  }): Promise<Game> {
    const gameId = generateGameId()
    const game: Game = {
      id: gameId,
      status: 'lobby',
      players: [{ id: playerId, name, isLeader: true, socketId }],
      drawingQueue: [playerId],
      previousWords: [],
      score: {},
      currentDrawingPlayer: '',
      currentWord: '',
      currentWordLength: 0,
      guesses: [],
      currentRound: 0,
      maxRounds,
      roundTime,
      breakTime: 5,
      nextRoundEnd: new Date(Date.UTC(1970, 0, 1)),
    }

    games.push(game)
    return Promise.resolve(game)
  }

  async function addPlayer({
    playerId,
    gameId,
    name,
    socketId,
  }: {
    playerId: string
    gameId: string
    name: string
    socketId: string
  }): Promise<Game> {
    const game = await _getGame({ gameId })
    if (!game) {
      throw new GameError('Game not found', 'NOT_FOUND')
    }

    const player = game.players.find((p) => p.id === playerId)
    if (player) {
      player.socketId = socketId
      return Promise.resolve(game)
    }

    game.players.push({ id: playerId, name, isLeader: false, socketId })
    game.drawingQueue.push(playerId)

    return game
  }

  async function removePlayer({
    playerId,
  }: {
    playerId: string
  }): Promise<{ playerId: string }> {
    games = games
      .map((game) => ({
        ...game,
        players: game.players.filter((p) => p.id !== playerId),
      }))
      .filter((game) => game.players.length > 0)
    return { playerId }
  }

  async function leaveGame({
    playerId,
    gameId,
  }: {
    playerId: string
    gameId: string
  }) {
    const game = await _getGame({ gameId })
    if (!game) {
      throw new GameError('Game not found', 'NOT_FOUND')
    }
    game.players = game.players.filter((p) => p.id !== playerId)
    game.drawingQueue = game.drawingQueue.filter((id) => id !== playerId)

    // check if someone is still leader

    if (!game.players.some((p) => p.isLeader)) {
      game.players[0].isLeader = true
    }
    delete game.score[playerId]

    return game
  }

  async function startGame({ gameId }: { gameId: string }) {
    const game = await _getGame({ gameId })
    if (!game) {
      throw new GameError('Game not found', 'NOT_FOUND')
    }

    const playerIds = game.players.map((p) => p.id)
    game.drawingQueue = shuffleArray(playerIds)
    game.score = game.players.reduce(
      (acc, curr) => ({
        ...acc,
        [curr.id]: 0,
      }),
      {}
    )

    return prepareNextRound({ gameId })
  }

  async function prepareNextRound({ gameId }: { gameId: string }) {
    const game = await _getGame({ gameId })

    if (!game) {
      throw new GameError('Game not found', 'NOT_FOUND')
    }

    const currentDrawingPlayer = game.drawingQueue.shift()

    if (!currentDrawingPlayer) {
      throw new GameError('Could not assign next drawing player')
    }
    game.status = 'choosing-word'
    game.currentDrawingPlayer = currentDrawingPlayer
    game.drawingQueue.push(game.currentDrawingPlayer)
    game.previousWords.push(game.currentWord)
    game.currentRound += 1

    return { game, potentialWords: getWords(game.previousWords) }
  }

  async function makeGuess({
    gameId,
    playerId,
    text,
  }: {
    gameId: string
    playerId: string
    text: string
  }) {
    const game = await _getGame({ gameId })
    if (!game) {
      throw new GameError('Game not found', 'NOT_FOUND')
    }
    const isCorrect = text.toLowerCase() === game.currentWord.toLowerCase()

    const guessMade = new Date()
    const guess = { date: guessMade, id: uuidv4(), text, isCorrect, playerId }

    const secondsUntilEndOfRound = differenceInSeconds(
      game.nextRoundEnd,
      guessMade
    )
    const pointInterval = 5
    const points = Math.ceil(secondsUntilEndOfRound / pointInterval)

    if (isCorrect) {
      game.score[playerId] += points
    }

    game.guesses.push(guess)

    return { guess, score: game.score }
  }

  async function startNextRound({
    gameId,
    word,
  }: {
    gameId: string
    word: string
  }) {
    const game = await _getGame({ gameId })
    if (!game) {
      throw new GameError('Game not found', 'NOT_FOUND')
    }
    game.status = 'drawing'

    game.currentWord = word
    game.previousWords.push(word)
    game.nextRoundEnd = addSeconds(Date.now(), game.roundTime)
    return game
  }

  async function endRound({ gameId }: { gameId: string }) {
    const game = await _getGame({ gameId })
    if (!game) {
      throw new GameError('Game not found', 'NOT_FOUND')
    }

    game.status = 'round-end'

    return game
  }

  return {
    creategame: createGame,
    addPlayer,
    removePlayer,
    leaveGame,
    startGame,
    prepareNextRound,
    makeGuess,
    startNextRound,
    endRound,
    getGame: _getGame,
    get games() {
      return games
    },
  }
}

export type GameService = ReturnType<typeof createGameService>
