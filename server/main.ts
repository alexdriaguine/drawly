import express, { Request, Response } from 'express'
import next from 'next'
import http from 'http'
import { setupSocketIO } from '@server/socket/setup-socket'
import { NextServer } from 'next/dist/server/next'
import { createRoomService } from './rooms/room-service'

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

  const roomService = createRoomService()

  setupSocketIO({ httpServer, roomService })

  app.use(express.json())
  app.use(
    express.urlencoded({
      extended: true,
    })
  )

  app.get('/rooms', (req, res) => {
    res.json(roomService.rooms)
  })

  app.all('*', handleNextRequest(nextApp))

  httpServer.listen(port, () => {
    console.log(`🎉 Started on port ${port} ✔`)
  })
}

main()

process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection')
  console.error(err)
  process.exit(1)
})
