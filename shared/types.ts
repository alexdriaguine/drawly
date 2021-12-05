export type Coordinate = {
  x: number
  y: number
}

export type Player = {
  id: string
  name: string
  socketId: string
  isLeader: boolean
}

export type GameStatus = 'lobby' | 'playing' | 'done'

export type Game = {
  id: string
  status: 'unkown' | 'lobby' | 'playing' | 'done'
  currentDrawingPlayer: string
  currentWord: string
  players: Player[]
  drawingQueue: string[]
  score: { [key: string]: number }
  wordsDrawn: string[]
}
