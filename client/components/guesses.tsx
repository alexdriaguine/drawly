import { Flex, Box, Input, Button } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { socket } from '@socket/io' // todo fix this ugly ass shit
import { Guess, Player } from '@shared/types'
import { GuessMadeEventData } from '@shared/events'

type Props = {
  onGuess: (guess: string) => void
  onGuessReceived: (data: GuessMadeEventData) => void
  disabled: boolean
  players: Player[]
}

export const Guesses = (props: Props) => {
  const { onGuess, disabled, players, onGuessReceived } = props
  const { register, handleSubmit, reset } = useForm<{ guess: string }>()
  const [guesses, setGuesses] = useState<
    { playerName: string; text: string; id: string }[]
  >([])

  useEffect(() => {
    const handleGuessMade = (data: GuessMadeEventData) => {
      console.log('guess made!')
      const player = players.find((p) => p.id === data.guess.playerId)
      setGuesses((guesses) => [
        ...guesses,
        {
          playerName: player?.name ?? '',
          text: data.guess.text,
          id: data.guess.id,
        },
      ])
      onGuessReceived(data)
    }
    const handleStartNextRound = () => {
      setGuesses([])
    }
    socket.on('guess-made', handleGuessMade)
    socket.on('prepare-next-round', handleStartNextRound)

    return () => {
      socket.off('guess-made', handleGuessMade)
    }
  }, [onGuessReceived, players])

  const onSubmit = (data: { guess: string }) => {
    onGuess(data.guess)
    reset()
  }
  return (
    <Flex direction="column" height="400">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input disabled={disabled} {...register('guess')} />
        <Button disabled={disabled} type="submit">
          Send
        </Button>
      </form>
      <Box>
        {guesses.map((guess) => (
          <p key={guess.id}>{guess.text}</p>
        ))}
      </Box>
    </Flex>
  )
}
