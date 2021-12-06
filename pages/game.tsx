import { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { Button, Box } from '@chakra-ui/react'
import { css } from '@emotion/react'
import { Canvas } from '@components/canvas'
import { socket } from '@socket/io' // todo fix this ugly ass shit
import { CreateJoinGame } from '@components/create-join-game'
import { v4 as uuidv4 } from 'uuid'
import { ProfileForm } from '@components/profile-form'
import { Game as GameType, GameStatus, Player } from '@shared/types'
import { Guesses } from '@components/guesses'
import {
  GameStartedEventData,
  GuessMadeEventData,
  PlayerJoinedEventData,
  PlayerLeftEventData,
  RoundEndEventData,
  RoundStartedEventData,
  SendWordEventData,
} from '@shared/events'
import { Score } from '@components/score'

type Game = Omit<
  GameType,
  'currentWord' | 'previousWords' | 'guesses' | 'drawingQueue'
>
const initialGame: Game = {
  id: '',
  status: 'unknown',
  players: [],
  score: {},
  currentDrawingPlayer: '',
  currentWordLength: 0,
  roundTime: 0,
  breakTime: 0,
  maxRounds: 0,
  currentRound: 0,
  nextRoundEnd: new Date(),
}

const GamePage: NextPage = () => {
  const [game, setGame] = useState<Game>(initialGame)
  const [playerProfile, setPlayerProfile] = useState<Omit<Player, 'isLeader'>>()
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
      setGame(data.game)
    }
    const handleRoundStarted = (data: RoundStartedEventData) => {
      setGame((game) => ({
        ...game,
        status: data.gameStatus,
        nextRoundEnd: data.nextRoundEnd,
      }))
    }
    const handleSendWord = (data: SendWordEventData) => {
      setPotentialWords(data.words)
    }
    const handleRoundEnd = (data: RoundEndEventData) => {
      setGame((game) => ({ ...game, status: data.gameStatus }))
    }

    socket
      .on('connect', handleConnect)
      .on('exception', handleExceptio)
      .on('player-left', handlePlayerLeft)
      .on('player-joined', handlePlayerJoined)
      .on('prepare-next-round', handleGameStarted)
      .on('round-start', handleRoundStarted)
      .on('send-words', handleSendWord)
      .on('round-end', handleRoundEnd)

    return () => {
      socket
        .off('connect', handleConnect)
        .off('exception', handleExceptio)
        .off('player-left', handlePlayerLeft)
        .off('player-joined', handlePlayerJoined)
        .off('prepare-next-round', handleGameStarted)
        .off('round-start', handleRoundStarted)
        .off('send-words', handleSendWord)
        .off('round-end', handleRoundEnd)
    }
  }, [])

  const startGame = () => {
    if (game.id) {
      socket.emit('start-game', { gameId: game.id })
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
    setGame((game) => ({ ...game, score: data.score }))
  }

  const makeGuess = (guess: string) => {
    if (game && playerProfile) {
      socket.emit('make-guess', {
        gameId: game.id,
        guess,
        playerId: playerProfile.id,
      })
    }
  }

  if (!playerProfile) {
    return <ProfileForm onSubmit={createProfile} />
  }

  const playingStatuses: GameStatus[] = ['choosing-word', 'drawing']

  const isYourTurn =
    playingStatuses.includes(game.status) &&
    playerProfile.id === game.currentDrawingPlayer

  const isLeader = game.players.find((p) => p.id === playerProfile.id)?.isLeader
  const canDrawOnCanvas = game.status === 'drawing' && isYourTurn
  const canMakeGuess = game.status === 'drawing' && !isYourTurn

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
                {game.status === 'lobby' && (
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
          {game.status === 'drawing' &&
            (isYourTurn ? <p>🖌Draw a {currentWord}</p> : <p>Make a guess</p>)}

          <Score
            gameStatus={game.status}
            score={game.score}
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
                <Button
                  onClick={() => {
                    socket.emit('choose-word', {
                      gameId: game.id,
                      word,
                    })
                    setPotentialWords(undefined)
                    setCurrentWord(word)
                  }}
                  key={word}
                >
                  {word}
                </Button>
              ))}
            </Box>
          )}
          <div style={{ display: 'flex' }}>
            <Canvas disabled={!canDrawOnCanvas} gameId={game.id} />
            <Box>
              <pre
                css={css`
                  font-size: 12px;
                  font-family: monospace;
                  padding: 16px;
                  background-color: lightgrey;
                `}
              >
                {JSON.stringify(
                  {
                    status: game.status,
                    score: game.score,
                    round: game.currentRound,
                    nextRoundEnd: game.nextRoundEnd,
                  },
                  null,
                  2
                )}
              </pre>
            </Box>
          </div>
          <Guesses
            players={game.players}
            disabled={!canMakeGuess}
            onGuess={makeGuess}
            onGuessReceived={handleGuessReceived}
          />
        </Box>
      )}
    </Box>
  )
}

export default GamePage
