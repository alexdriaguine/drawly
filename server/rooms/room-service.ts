import { Room } from '@shared/types'

// use a in memory database for this instead
export function createRoomService() {
  let rooms: Room[] = []

  function getRoom({ roomId }: { roomId: string }): Promise<Room | undefined> {
    return Promise.resolve(
      rooms.find((room) => room.id.toLowerCase() === roomId.toLowerCase())
    )
  }

  function createRoom({ playerId }: { playerId: string }): Promise<Room> {
    const roomId = (Math.random() + 1).toString(36).substring(7)
    const room = {
      id: roomId,
      players: [playerId],
    }

    rooms.push(room)
    return Promise.resolve(room)
  }

  async function addPlayer({
    playerId,
    roomId,
  }: {
    playerId: string
    roomId: string
  }): Promise<Room> {
    const maxNumPlayers = 2
    const room = await getRoom({ roomId })
    if (!room) {
      return Promise.reject('Room not found')
    }

    if (room.players.includes(playerId)) {
      return Promise.resolve(room)
    }

    if (room.players.length === maxNumPlayers) {
      return Promise.reject('Max 2 people in room')
    }

    room.players.push(playerId)

    return Promise.resolve(room)
  }

  function removePlayer({
    playerId,
  }: {
    playerId: string
  }): Promise<{ playerId: string }> {
    rooms = rooms
      .map((room) => ({
        ...room,
        players: room.players.filter((player) => player !== playerId),
      }))
      .filter((room) => room.players.length > 0)
    return Promise.resolve({ playerId })
  }

  async function leaveRoom({
    playerId,
    roomId,
  }: {
    playerId: string
    roomId: string
  }) {
    const room = await getRoom({ roomId })
    if (!room) {
      return Promise.reject('Room not found')
    }
    room.players = room.players.filter((player) => player !== playerId)

    return Promise.resolve(room)
  }

  return {
    createRoom,
    addPlayer,
    removePlayer,
    leaveRoom,
    get rooms() {
      return rooms
    },
  }
}

export type RoomService = ReturnType<typeof createRoomService>
