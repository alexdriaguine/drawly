type GameErrorCode = 'NOT_FOUND' | 'UNKOWN'

export class GameError extends Error {
  public code?: GameErrorCode
  constructor(message: string, code: GameErrorCode = 'UNKOWN') {
    super(message)
    code = code
  }
}
