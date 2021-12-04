import { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { Button } from '@chakra-ui/react'
import { css } from '@emotion/react'
import { Canvas } from '@components/canvas'
import { socket } from '@socket/io' // todo fix this ugly ass shit
import { CreateJoinRoom } from '@components/create-join-room'
import { v4 as uuidv4 } from 'uuid'
import { ProfileForm } from '@components/profile-form'

const Home: NextPage = () => {
  const [roomId, setRoomId] = useState<string>()
  const [players, setPlayers] = useState<string[]>([])
  const [playerProfile, setPlayerProfile] =
    useState<{ id: string; name: string }>()

  useEffect(() => {
    const roomId = localStorage.getItem('roomId')
    const profile = localStorage.getItem('profile')

    if (profile) {
      try {
        const parsedProfile = JSON.parse(profile)
        setPlayerProfile(parsedProfile)

        if (roomId) {
          console.log('rejoining')
          socket.emit('room-join', { playerId: parsedProfile.id, roomId })
        }
      } catch (e) {
        // nah
        console.log('No profile found')
      }
    }
  }, [])

  useEffect(() => {
    socket.on('exception', console.error)
    socket.on('room-created', (data) => {
      setRoomId(data.room.id)
      setPlayers(data.room.players)
      localStorage.setItem('roomId', data.room.id)
    })

    socket.on('game-start', (data) => {
      console.log('game start')
      setRoomId(data.room.id)
      setPlayers(data.room.players)
    })

    socket.on('player-left', (data) => {
      setPlayers(data.room.players)
    })

    socket.on('player-joined', (data) => {
      setRoomId(data.room.id)
      setPlayers(data.room.players)
      console.log('player-joined')
    })
  }, [])

  const leaveRoom = () => {
    if (roomId && playerProfile?.id) {
      socket.emit('leave-room', { roomId, playerId: playerProfile.id })
      localStorage.removeItem('roomId')
      setRoomId(undefined)
      setPlayers([])
    }
  }

  const handleJoinRoom = (roomId: string) => {
    if (playerProfile?.id) {
      socket.emit('room-join', { roomId, playerId: playerProfile?.id })
      localStorage.setItem('roomId', roomId)
      setRoomId(roomId)
    }
  }

  const handleCreateRoom = () => {
    console.log(playerProfile)
    playerProfile?.id &&
      socket.emit('create-room', { playerId: playerProfile.id })
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
      {!roomId && (
        <CreateJoinRoom onJoin={handleJoinRoom} onCreate={handleCreateRoom} />
      )}
      {roomId && (
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
              Connected to room{' '}
              <span
                css={css`
                  font-weight: bold;
                  text-decoration: underline;
                  text-transform: uppercase;
                `}
              >
                {roomId}
              </span>
            </p>
            <Button colorScheme="red" onClick={leaveRoom}>
              Leave room
            </Button>
          </div>
          <div>
            <p
              css={css`
                font-weight: bold;
              `}
            >
              Players in room
            </p>
            <ul
              css={css`
                list-style: none;
              `}
            >
              {players?.map((player) => (
                <li key={player}>{player}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {roomId && <Canvas roomId={roomId} />}
    </div>
  )
}

export default Home
