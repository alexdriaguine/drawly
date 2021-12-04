import {
  VStack,
  Button,
  Input,
  StackDivider,
  Box,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Flex,
} from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { css } from '@emotion/react'

type CreateRoomProps = {
  onCreate: () => void
  onJoin: (roomId: string) => void
}

export const CreateJoinRoom = (props: CreateRoomProps) => {
  const { onCreate, onJoin } = props
  const { handleSubmit, register, reset } = useForm<{ roomId: string }>()

  return (
    <Flex direction="column">
      <Box>
        <Button colorScheme="blue" onClick={onCreate}>
          Create a game
        </Button>
      </Box>
      <Box>
        <p>Or join and existing</p>
        <form
          css={css`
            display: 'flex';
          `}
          onSubmit={handleSubmit((data) => {
            onJoin(data.roomId)
            reset()
          })}
        >
          <FormControl id="email">
            <Flex>
              <Input {...register('roomId')} placeholder="Enter a room id" />
              <Button type="submit" colorScheme="blue" variant="outline">
                Join
              </Button>
            </Flex>
            <FormHelperText>Enter the 5 character code</FormHelperText>
          </FormControl>
        </form>
      </Box>
    </Flex>
  )
}
