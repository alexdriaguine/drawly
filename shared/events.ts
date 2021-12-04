import { Coordinate, Game } from '@shared/types'

export type GenericSocketEvents = {
  exception: (data: { error: any }) => void
}

export type GameEvents = GenericSocketEvents & {
  'create-game': (data: { playerId: string; name: string }) => void
  message: (data: { message: string; gameId: string }) => void
  'game-created': (data: { game: Game; playerId: string }) => void
  'new-message': (data: { id: string; text: string }) => void
  'join-game': (data: {
    gameId: string
    playerId: string
    name: string
  }) => void
  'leave-game': (data: { gameId: string; playerId: string }) => void
  'player-left': (data: { game: Game }) => void
  'player-joined': (data: { game: Game }) => void
  'game-start': (data: { game: Game }) => void
}

export type DrawEvents = {
  'draw-send': (data: {
    current: Coordinate
    next: Coordinate
    gameId: string
  }) => void
  'draw-receive': (data: { current: Coordinate; next: Coordinate }) => void
}

export type SocketEvents = GameEvents & DrawEvents & GenericSocketEvents
