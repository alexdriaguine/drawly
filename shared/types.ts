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

export type GameStatus =
  | 'lobby'
  | 'choosing-word'
  | 'drawing'
  | 'round-end'
  | 'done'
  | 'unknown'

export type Guess = {
  id: string
  text: string
  date: Date
  isCorrect: boolean
  playerId: string
}

export type Game = {
  id: string
  status: GameStatus
  currentDrawingPlayer: string
  currentWord: string
  currentWordLength: number
  players: Player[]
  drawingQueue: string[]
  score: { [key: string]: number }
  wordsDrawn: string[]
  guesses: Guess[]
  maxRounds: number
  currentRound: number
  roundTime: number // seconds
  nextRoundEnd?: Date
}
