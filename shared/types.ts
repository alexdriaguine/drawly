export type Coordinate = {
  x: number
  y: number
}

export type Player = {
  id: string
  name: string
  isLeader: boolean
}

export type Game = {
  id: string
  status: 'lobby' | 'playing' | 'done'
  players: Player[]
}
