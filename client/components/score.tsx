import { UnorderedList, ListItem } from '@chakra-ui/react'
import { GameStatus, Player } from '@shared/types'

type Props = {
  score: Record<string, number>
  players: Player[]
  gameStatus: GameStatus
}

export const Score = (props: Props) => {
  const { players, score, gameStatus } = props
  console.log(score)
  return (
    <UnorderedList>
      {players.map((player) => (
        <ListItem key={player.id}>
          <span>{player.name}</span>
          {gameStatus !== 'lobby' && <span> :{score[player.id]}</span>}
        </ListItem>
      ))}
    </UnorderedList>
  )
}
