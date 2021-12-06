import { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { Button, Box } from '@chakra-ui/react'
import { css } from '@emotion/react'
import { Canvas } from '@components/canvas'
import { socket } from '@socket/io' // todo fix this ugly ass shit
import { CreateJoinGame } from '@components/create-join-game'
import { v4 as uuidv4 } from 'uuid'
import { ProfileForm } from '@components/profile-form'
import { Game as GameType, Player } from '@shared/types'
import { Guesses } from '@components/guesses'
import {
  GameStartedEventData,
  GuessMadeEventData,
  PlayerJoinedEventData,
  PlayerLeftEventData,
  RoundStartedEventData,
  SendWordEventData,
} from '@shared/events'
import { Score } from '@components/score'

type Game = Pick<GameType, 'id' | 'players' | 'score' | 'status'>
const initialGame: Game = {
  id: '',
  players: [],
  score: {},
  status: 'unknown',
}

const GamePage: NextPage = () => {
  const [game, setGame] = useState<Game>(initialGame)
  const [playerProfile, setPlayerProfile] = useState<Omit<Player, 'isLeader'>>()
  const [currentDrawingId, setCurrentDrawingId] = useState<string>()
  const [score, setScore] = useState<Record<string, number>>({})
  const [potentialWords, setPotentialWords] = useState<string[]>()
  const [currentWord, setCurrentWord] = useState<string>()

  useEffect(() => {
    const handleConnect = () => {
      const profile = localStorage.getItem('profile')
      if (profile) {
        try {
          const parsedProfile = JSON.parse(profile)
          setPlayerProfile(parsedProfile)
        } catch (e) {
          // nah
          console.error(e)
        }
      }
    }
    const handleExceptio = (data: { error: unknown }) => {
      // todo: show a toast or something
      console.log('exception', data)
      setGame(initialGame)
    }
    const handlePlayerLeft = (data: PlayerLeftEventData) => {
      setGame((game) => ({ ...game, players: data.game.players }))
    }
    const handlePlayerJoined = (data: PlayerJoinedEventData) => {
      localStorage.setItem('gameId', data.game.id)
      setGame(data.game)
    }
    const handleGameStarted = (data: GameStartedEventData) => {
      setGame((game) => ({ ...game, status: data.game.status }))
    }
    const handleRoundStarted = (data: RoundStartedEventData) => {
      setCurrentDrawingId(data.drawingPlayerId)
    }
    const handleSendWord = (data: SendWordEventData) => {
      console.log('Receivd word', data.words)
      setPotentialWords(data.words)
      setGame((game) => ({ ...game, status: data.gameStatus }))
    }

    socket
      .on('connect', handleConnect)
      .on('exception', handleExceptio)
      .on('player-left', handlePlayerLeft)
      .on('player-joined', handlePlayerJoined)
      .on('game-started', handleGameStarted)
      .on('round-started', handleRoundStarted)
      .on('send-words', handleSendWord)

    return () => {
      socket
        .off('connect', handleConnect)
        .off('exception', handleExceptio)
        .off('player-left', handlePlayerLeft)
        .off('player-joined', handlePlayerJoined)
        .off('game-started', handleGameStarted)
        .off('round-started', handleRoundStarted)
        .off('send-words', handleSendWord)
    }
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

  const handleGuessReceived = (data: GuessMadeEventData) => {
    setScore(data.score)
  }

  const makeGuess = (guess: string) => {
    if (game && playerProfile) {
      socket.emit('make-guess', {
        gameId: game.id,
        guess,
        playerId: playerProfile.id,
        date: new Date(),
      })
    }
  }

  if (!playerProfile) {
    return <ProfileForm onSubmit={createProfile} />
  }

  const isYourTurn =
    game.status === 'playing' && playerProfile.id === currentDrawingId

  const isLeader = game.players.find((p) => p.id === playerProfile.id)?.isLeader

  return (
    <Box
      css={css`
        padding: 32px;
      `}
    >
      {!game.id && (
        <CreateJoinGame onJoin={handleJoinGame} onCreate={handleCreateGame} />
      )}
      {game.id && (
        <Box
          css={css`
            display: flex;
            justify-content: space-between;
            width: 600px;
          `}
        >
          <Box
            css={css`
              display: flex;
              flex-direction: column;
            `}
          >
            <p>
              GameId: <strong>{game.id}</strong>
            </p>
            <p>
              GameStatus: <strong>{game.status}</strong>
            </p>
            {isLeader && (
              <>
                {game.status === 'playing' ? (
                  <Button
                    css={css`
                      margin-bottom: 8px;
                    `}
                    onClick={nextRound}
                  >
                    Next round
                  </Button>
                ) : (
                  <Button
                    css={css`
                      margin-bottom: 8px;
                    `}
                    onClick={startGame}
                    colorScheme="green"
                  >
                    Start game
                  </Button>
                )}
              </>
            )}
            <Button
              css={css`
                margin-bottom: 8px;
              `}
              colorScheme="red"
              onClick={leaveGame}
            >
              Leave game
            </Button>
          </Box>
          {isYourTurn && game.status === 'playing' ? (
            <p>🖌Draw a {currentWord}</p>
          ) : (
            <p>Make a guess</p>
          )}
          <Score
            gameStatus={game.status}
            score={score}
            players={game.players}
          />
        </Box>
      )}
      {game.id && (
        <Box
          css={css`
            display: flex;
            flex-direction: column;
          `}
        >
          {isYourTurn && game.status === 'choosing-word' && potentialWords && (
            <Box>
              {potentialWords.map((word) => (
                <Button key={word}>{word}</Button>
              ))}
            </Box>
          )}
          <Canvas disabled={!isYourTurn} gameId={game.id} />
          <Guesses
            players={game.players}
            disabled={isYourTurn}
            onGuess={makeGuess}
            onGuessReceived={handleGuessReceived}
          />
        </Box>
      )}
    </Box>
  )
}

export default GamePage
