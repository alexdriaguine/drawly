import { SocketEvents } from '@server/socket/socket-events'
import { Room } from '@shared/types'
import { Server as SocketIOServer, Socket } from 'socket.io'

/**
 * GAME_RULES
 * 1. 'game-start' When the second player joins the room, emit the 'game-start' event to both players
 * of the room. This notifies players that the game is able to start.
 * Players could click a "Ready" button that indicates they are ready for the next round
 *
 * 2. 'start-round'.
 *
 *
 *
 * 3. 'end-round'
 *
 *
 *
 *
 */

export const setupGameSocket = (
  io: SocketIOServer<SocketEvents>,
  socket: Socket<SocketEvents>
) => {
  function gameStart(data: { room: Room }) {}
}
