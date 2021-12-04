import { SocketEvents } from '@server/socket/socket-events'
import { io, Socket } from 'socket.io-client'

export const socket: Socket<SocketEvents> = io()
