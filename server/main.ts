import express, { Request, Response } from 'express'
import next from 'next'
import http from 'http'
import { setupSocketIO } from '@server/socket/setup-socket'
import { NextServer } from 'next/dist/server/next'
import { createGameService } from './game/game-service'

const handleNextRequest =
  (nextApp: NextServer) => (req: Request, res: Response) => {
    const handler = nextApp.getRequestHandler()
    return handler(req, res)
  }

async function main() {
  const port = 3000
  const nextApp = next({ dev: process.env.NODE_ENV !== 'production' })

  await nextApp.prepare()

  const app = express()
  const httpServer = http.createServer(app)

  const gameService = createGameService()

  setupSocketIO({ httpServer, gameService })

  app.use(express.json())
  app.use(
    express.urlencoded({
      extended: true,
    })
  )

  app.get('/games', (req, res) => {
    res.json(gameService.games)
  })

  app.all('*', handleNextRequest(nextApp))

  httpServer.listen(port, () => {
    console.log(`🎉 Started on port ${port} ✔`)
  })
}

main()

process.on('unhandledRejection', (error, promise) => {
  console.error(`Unhandled rejection`)
  console.error(`Promise: ${promise}`)
  console.error(`Reason: ${error}`)
  console.log(typeof error)
  // @ts-ignore
  console.log(`Stack:\n${error.stack}`)
  process.exit(1)
})
