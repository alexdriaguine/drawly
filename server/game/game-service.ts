import { Game } from '@shared/types'

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
  }: {
    playerId: string
    name: string
  }): Promise<Game> {
    const gameId = (Math.random() + 1).toString(36).substring(7)
    const game: Game = {
      id: gameId,
      status: 'lobby',
      players: [{ id: playerId, name, isLeader: true }],
    }

    games.push(game)
    return Promise.resolve(game)
  }

  async function addPlayer({
    playerId,
    gameId,
    name,
  }: {
    playerId: string
    gameId: string
    name: string
  }): Promise<Game> {
    const game = await getGame({ gameId })
    if (!game) {
      return Promise.reject('game not found')
    }

    if (game.players.find((p) => p.id === playerId)) {
      return Promise.resolve(game)
    }

    game.players.push({ id: playerId, name, isLeader: false })

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
      return Promise.reject('game not found')
    }
    game.players = game.players.filter((p) => p.id !== playerId)

    return Promise.resolve(game)
  }

  return {
    creategame: createGame,
    addPlayer,
    removePlayer,
    leavegame: leaveGame,
    get games() {
      return games
    },
  }
}

export type GameService = ReturnType<typeof createGameService>
