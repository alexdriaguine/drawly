import { SocketEvents } from '@shared/events'
import { io, Socket } from 'socket.io-client'

export const socket: Socket<SocketEvents> = io()
