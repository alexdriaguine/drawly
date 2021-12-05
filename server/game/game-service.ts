import { Game } from '@shared/types'

type GameErrorCode = 'NOT_FOUND' | 'UNKOWN'

export class GameError extends Error {
  public code?: GameErrorCode
  constructor(message: string, code: GameErrorCode = 'UNKOWN') {
    super(message)
    code = code
  }
}

const words = ['house', 'ball', 'car', 'bike', 'balloon', 'pistol', 'mountain']

function generateGameId() {
  return (Math.random() + 1).toString(36).substring(7)
}

function getWord(alreadySeenWords: string[]) {
  // Todo: larger list. Keep in file
  // if word has been seen, fetch a new one.
  const word = words[Math.floor(Math.random() * words.length)]
  return word
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

  function getGame({ gameId }: { gameId: string }): Promise<Game | undefined> {
    return Promise.resolve(
      games.find((game) => game.id.toLowerCase() === gameId.toLowerCase())
    )
  }

  function createGame({
    playerId,
    name,
    socketId,
  }: {
    playerId: string
    name: string
    socketId: string
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
    const game = await getGame({ gameId })
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

    return Promise.resolve(game)
  }

  function removePlayer({
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
    return Promise.resolve({ playerId })
  }

  async function leaveGame({
    playerId,
    gameId,
  }: {
    playerId: string
    gameId: string
  }) {
    const game = await getGame({ gameId })
    if (!game) {
      throw new GameError('Game not found', 'NOT_FOUND')
    }
    game.players = game.players.filter((p) => p.id !== playerId)
    game.drawingQueue = game.drawingQueue.filter((id) => id !== playerId)
    delete game.score[playerId]

    return Promise.resolve(game)
  }

  async function startGame({ gameId }: { gameId: string }) {
    const game = await getGame({ gameId })
    if (!game) {
      throw new GameError('Game not found', 'NOT_FOUND')
    }

    game.status = 'playing'

    // todo: make some kind of count down instead of emitting directly

    // create a queue of who drawing order that moves

    // [1, 2, 3, 4] first draw
    // [2, 3, 4, 1] second draw
    // [3, 4, 1, 2] third draw

    const playerIds = game.players.map((p) => p.id)
    game.drawingQueue = shuffleArray(playerIds) // shuffle?
    game.score = game.players.reduce(
      (acc, curr) => ({
        ...acc,
        [curr.id]: 0,
      }),
      {}
    )
    return Promise.resolve(game)
  }

  async function nextRound({ gameId }: { gameId: string }) {
    const game = await getGame({ gameId })

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

    return Promise.resolve(game)
  }

  return {
    creategame: createGame,
    addPlayer,
    removePlayer,
    leaveGame,
    startGame,
    nextRound,
    get games() {
      return games
    },
  }
}

export type GameService = ReturnType<typeof createGameService>
