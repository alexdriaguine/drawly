import { Coordinate, Room } from '@shared/types'

export type GenericSocketEvents = {
  exception: (data: { error: any }) => void
}

export type GameEvents = {
  'game-start': (data: { room: Room }) => void
}

export type RoomEvents = GenericSocketEvents &
  GameEvents & {
    'create-room': (data: { playerId: string }) => void
    message: (data: { message: string; roomId: string }) => void
    'room-created': (data: { room: Room; playerId: string }) => void
    'new-message': (data: { id: string; text: string }) => void
    'room-join': (data: { roomId: string; playerId: string }) => void
    'leave-room': (data: { roomId: string; playerId: string }) => void
    'player-left': (data: { room: Room }) => void
    'player-joined': (data: { room: Room }) => void
  }

export type DrawEvents = {
  'draw-send': (data: {
    current: Coordinate
    next: Coordinate
    roomId: string
  }) => void
  'draw-receive': (data: { current: Coordinate; next: Coordinate }) => void
}

export type SocketEvents = RoomEvents & DrawEvents & GenericSocketEvents
