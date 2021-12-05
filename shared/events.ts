import { GameEvents } from '@server/game/game-socket'

// TODO, extract types or keep em inline?
type GenericSocketEvents = {
  exception: (data: { error: any }) => void
  connected: (data: string) => void
}

export type SocketEvents = GameEvents & GenericSocketEvents
