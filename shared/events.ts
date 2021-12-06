import { GameEvents } from '@server/game/game-socket'
import { Coordinate, Game, GameStatus, Guess } from './types'

type GenericSocketEvents = {
  exception: (data: { error: any }) => void
  connected: (data: string) => void
}

export type SocketEvents = GameEvents & GenericSocketEvents
export type GameWithoutSecrets = Omit<Game, 'currentWord' | 'wordsDrawn'>

export type CreateGameEventData = {
  playerId: string
  name: string
  socketId: string
}
export type GameCreatedEventData = {
  game: GameWithoutSecrets
  playerId: string
}
export type JoinGameEventData = {
  gameId: string
  playerId: string
  name: string
  socketId: string
}
export type LeaveGameEventData = { gameId: string; playerId: string }
export type PlayerLeftEventData = { game: GameWithoutSecrets }
export type PlayerJoinedEventData = { game: GameWithoutSecrets }
export type GameStartedEventData = { game: GameWithoutSecrets }
export type StartGameEventData = { gameId: string }
export type StartNextRoundEventData = { gameId: string }
export type RoundStartedEventData = { drawingPlayerId: string }
export type DrawReceiveEventData = { current: Coordinate; next: Coordinate }
export type DrawSendEventData = {
  current: Coordinate
  next: Coordinate
  gameId: string
}
export type SendWordEventData = { words: string[]; gameStatus: GameStatus }
export type MakeGuessEventData = {
  guess: string
  gameId: string
  playerId: string
  date: Date
}
export type GuessMadeEventData = {
  guess: Guess
  score: { [key: string]: number }
}
export type GameEndEventData = {}
export type ChooseWordEventData = { word: string; gameId: string }
export type RoundEndEventData = {}
