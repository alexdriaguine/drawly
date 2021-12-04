import { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { Button } from '@chakra-ui/react'
import { css } from '@emotion/react'
import { Canvas } from '@components/canvas'
import { socket } from '@socket/io' // todo fix this ugly ass shit
import { CreateJoinGame } from '@components/create-join-game'
import { v4 as uuidv4 } from 'uuid'
import { ProfileForm } from '@components/profile-form'
import { Player } from '@shared/types'

const Home: NextPage = () => {
  const [gameId, setgameId] = useState<string>()
  const [players, setPlayers] = useState<Player[]>([])
  const [playerProfile, setPlayerProfile] =
    useState<{ id: string; name: string }>()

  useEffect(() => {
    const gameId = localStorage.getItem('gameId')
    const profile = localStorage.getItem('profile')

    if (profile) {
      try {
        const parsedProfile = JSON.parse(profile)
        setPlayerProfile(parsedProfile)

        if (gameId) {
          console.log('rejoining')
          socket.emit('join-game', {
            playerId: parsedProfile.id,
            gameId,
            name: parsedProfile.name,
          })
        }
      } catch (e) {
        // nah
        console.log('No profile found')
      }
    }
  }, [])

  useEffect(() => {
    socket.on('exception', console.error)
    socket.on('game-created', (data) => {
      setgameId(data.game.id)
      setPlayers(data.game.players)
      localStorage.setItem('gameId', data.game.id)
    })

    socket.on('game-start', (data) => {
      console.log('game start')
      setgameId(data.game.id)
      setPlayers(data.game.players)
    })

    socket.on('player-left', (data) => {
      setPlayers(data.game.players)
    })

    socket.on('player-joined', (data) => {
      setgameId(data.game.id)
      setPlayers(data.game.players)
      console.log('player-joined')
    })
  }, [])

  const leaveGame = () => {
    if (gameId && playerProfile?.id) {
      socket.emit('leave-game', { gameId, playerId: playerProfile.id })
      localStorage.removeItem('gameId')
      setgameId(undefined)
      setPlayers([])
    }
  }

  const handleJoinGame = (gameId: string) => {
    if (playerProfile) {
      socket.emit('join-game', {
        gameId,
        playerId: playerProfile.id,
        name: playerProfile.name,
      })
      localStorage.setItem('gameId', gameId)
      setgameId(gameId)
    }
  }

  const handleCreateGame = () => {
    console.log(playerProfile)
    playerProfile?.id &&
      socket.emit('create-game', {
        playerId: playerProfile.id,
        name: playerProfile.name,
      })
  }

  const createProfile = (values: { name: string }) => {
    const id = uuidv4()
    const profile = { ...values, id }
    setPlayerProfile(profile)
    localStorage.setItem('profile', JSON.stringify(profile))
  }

  // lazy ass "auth"
  if (!playerProfile) {
    return <ProfileForm onSubmit={createProfile} />
  }

  return (
    <div
      css={css`
        max-width: 600px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 16px;
      `}
    >
      <pre>{JSON.stringify(playerProfile, null, 2)}</pre>
      {!gameId && (
        <CreateJoinGame onJoin={handleJoinGame} onCreate={handleCreateGame} />
      )}
      {gameId && (
        <div
          css={css`
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          `}
        >
          <div>
            <p>
              Your id:{' '}
              <span
                css={css`
                  font-weight: bold;
                  text-decoration: underline;
                  text-transform: uppercase;
                `}
              >
                {socket.id}
              </span>
            </p>
            <p>
              Connected to game{' '}
              <span
                css={css`
                  font-weight: bold;
                  text-decoration: underline;
                  text-transform: uppercase;
                `}
              >
                {gameId}
              </span>
            </p>
            <Button colorScheme="red" onClick={leaveGame}>
              Leave game
            </Button>
          </div>
          <div>
            <p
              css={css`
                font-weight: bold;
              `}
            >
              Players in game
            </p>
            <ul
              css={css`
                list-style: none;
              `}
            >
              {players?.map((player) => (
                <li key={player.id}>
                  {player.name} {player.isLeader && '👑'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {gameId && <Canvas gameId={gameId} />}
    </div>
  )
}

export default Home
