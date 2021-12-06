import { v4 as uuidv4 } from 'uuid'
import { Game } from '@shared/types'
import { GameError } from './game-error'
import { getWord } from './words'

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
      wordsDrawn: [],
      score: {},
      currentDrawingPlayer: '',
      currentWord: '',
      currentWordLength: 0,
      guesses: [],
      currentRound: 0,
      maxRounds,
      roundTime,
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

    game.status = 'choosing-word'

    const playerIds = game.players.map((p) => p.id)
    game.drawingQueue = shuffleArray(playerIds)
    game.score = game.players.reduce(
      (acc, curr) => ({
        ...acc,
        [curr.id]: 0,
      }),
      {}
    )
    return game
  }

  async function nextRound({ gameId }: { gameId: string }) {
    const game = await _getGame({ gameId })

    if (!game) {
      throw new GameError('Game not found', 'NOT_FOUND')
    }

    const currentDrawingPlayer = game.drawingQueue.shift()

    if (!currentDrawingPlayer) {
      throw new GameError('Could not assign next drawing player')
    }

    game.currentDrawingPlayer = currentDrawingPlayer
    game.drawingQueue.push(game.currentDrawingPlayer)
    game.currentWord = getWord(game.wordsDrawn)
    game.currentWordLength = game.currentWord.length
    game.wordsDrawn.push(game.currentWord)
    game.currentRound += 1

    return game
  }

  async function makeGuess({
    gameId,
    playerId,
    text,
    date,
  }: {
    gameId: string
    playerId: string
    text: string
    date: Date
  }) {
    const game = await _getGame({ gameId })
    if (!game) {
      throw new GameError('Game not found', 'NOT_FOUND')
    }
    const isCorrect = text === game.currentWord

    const guess = { date, id: uuidv4(), text, isCorrect, playerId }

    if (isCorrect) {
      // implement time based scores!
      game.score[playerId] += 1
    }

    game.guesses.push(guess)

    return { guess, score: game.score }
  }

  async function setWordForRound({
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
    game.status = 'playing'

    game.currentWord = word
    return game
  }

  return {
    creategame: createGame,
    addPlayer,
    removePlayer,
    leaveGame,
    startGame,
    nextRound,
    makeGuess,
    setWordForRound,
    getGame: _getGame,
    get games() {
      return games
    },
  }
}

export type GameService = ReturnType<typeof createGameService>
