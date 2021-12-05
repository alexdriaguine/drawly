import { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { Button } from '@chakra-ui/react'
import { css } from '@emotion/react'
import { Canvas } from '@components/canvas'
import { socket } from '@socket/io' // todo fix this ugly ass shit
import { CreateJoinGame } from '@components/create-join-game'
import { v4 as uuidv4 } from 'uuid'
import { ProfileForm } from '@components/profile-form'
import { Game as GameType, GameStatus, Player } from '@shared/types'

type Game = Pick<GameType, 'id' | 'players' | 'score' | 'status'>
const initialGame: Game = {
  id: '',
  players: [],
  score: {},
  status: 'unkown',
}

const Home: NextPage = () => {
  const [game, setGame] = useState<Game>(initialGame)
  const [playerProfile, setPlayerProfile] = useState<Omit<Player, 'isLeader'>>()
  const [currentDrawingId, setCurrentDrawingId] = useState<string>()
  const [socketId, setSocketId] = useState<string>()

  useEffect(() => {
    socket.on('connect', () => {
      setSocketId(socket.id)
    })
  }, [])

  useEffect(() => {
    socket.on('connect', () => {
      setSocketId(socket.id)
      const gameId = localStorage.getItem('gameId')
      const profile = localStorage.getItem('profile')
      if (profile) {
        try {
          const parsedProfile = JSON.parse(profile)
          setPlayerProfile(parsedProfile)

          if (gameId) {
            socket.emit('join-game', {
              playerId: parsedProfile.id,
              gameId,
              name: parsedProfile.name,
              socketId: socket.id,
            })
          }
        } catch (e) {
          // nah
        }
      }
    })
    socket.on('exception', (data) => {
      // todo: show a toast or something
      console.log('exception', data)
      setGame(initialGame)
    })

    socket.on('connected', (data) => console.log(data))

    socket.on('player-left', (data) => {
      setGame((game) => ({ ...game, players: data.game.players }))
    })

    socket.on('player-joined', (data) => {
      console.log('data')
      localStorage.setItem('gameId', data.game.id)
      setGame(data.game)
      console.log('player-joined', data)
    })

    socket.on('game-started', (data) => {
      setGame((game) => ({ ...game, status: data.game.status }))
    })

    socket.on('round-started', (data) => {
      console.log('start next roun', data)
      setCurrentDrawingId(data.drawingPlayerId)
    })
  }, [])

  const startGame = () => {
    if (game.id) {
      socket.emit('start-game', { gameId: game.id })
    }
  }

  const nextRound = () => {
    if (game.id) {
      socket.emit('start-next-round', { gameId: game.id })
    }
  }

  const leaveGame = () => {
    if (game?.id && playerProfile?.id) {
      socket.emit('leave-game', { gameId: game.id, playerId: playerProfile.id })
      localStorage.removeItem('gameId')
      setGame(initialGame)
    }
  }

  const handleJoinGame = (gameId: string) => {
    if (playerProfile) {
      socket.emit('join-game', {
        gameId,
        playerId: playerProfile.id,
        name: playerProfile.name,
        socketId: socket.id,
      })
    }
  }

  const handleCreateGame = () => {
    playerProfile?.id &&
      socket.emit('create-game', {
        playerId: playerProfile.id,
        name: playerProfile.name,
        socketId: socket.id,
      })
  }

  const createProfile = (values: { name: string }) => {
    const id = uuidv4()
    const profile = { ...values, id }
    setPlayerProfile({ ...profile, socketId: socket.id })
    localStorage.setItem('profile', JSON.stringify(profile))
  }

  if (!playerProfile) {
    return <ProfileForm onSubmit={createProfile} />
  }

  const isYourTurn =
    game.status === 'playing' && playerProfile.id === currentDrawingId

  const isLeader = game.players.find((p) => p.id === playerProfile.id)?.isLeader

  return (
    <div>
      {!game.id && (
        <CreateJoinGame onJoin={handleJoinGame} onCreate={handleCreateGame} />
      )}
      {game.id && (
        <div
          css={css`
            display: flex;
            justify-content: space-between;
          `}
        >
          <div
            css={css`
              display: flex;
              flex-direction: column;
            `}
          >
            {isLeader && (
              <>
                {game.status === 'playing' ? (
                  <Button onClick={nextRound}>Next round</Button>
                ) : (
                  <Button onClick={startGame} colorScheme="green">
                    Start game
                  </Button>
                )}
              </>
            )}
            <Button colorScheme="red" onClick={leaveGame}>
              Leave game
            </Button>
          </div>
          <div>{isYourTurn && <p>Your turn drawing!</p>}</div>
          <div>
            <p>GameId: {game.id}</p>
            <ul
              css={css`
                list-style: none;
              `}
            >
              {game.players.map((player) => (
                <li key={player.id}>
                  <span
                    css={css`
                      font-weight: ${player.id === playerProfile.id
                        ? 'bold'
                        : 'normal'};
                    `}
                  >
                    {player.name}
                  </span>{' '}
                  {player.isLeader && '👑'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {game.id && (
        <div>
          <Canvas disabled={!isYourTurn} gameId={game.id} />
          <div></div>
        </div>
      )}
      <pre
        css={css`
          background-color: #383434;
          color: white;
          font-family: monospace;
          font-size: 12px;
          padding: 16px;
          line-height: 1.5;
        `}
      >
        {JSON.stringify(
          { playerId: playerProfile.id, socketId, game },
          null,
          2
        )}
      </pre>
    </div>
  )
}

export default Home
