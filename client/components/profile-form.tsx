import { Button } from '.pnpm/@chakra-ui+button@1.5.1_f649fec385943b6263fa511f86a70dad/node_modules/@chakra-ui/button'
import { Input } from '.pnpm/@chakra-ui+input@1.3.1_f649fec385943b6263fa511f86a70dad/node_modules/@chakra-ui/input'
import { useForm } from 'react-hook-form'

type Props = {
  onSubmit: (values: { name: string }) => void
}
export const ProfileForm = (props: Props) => {
  const { onSubmit } = props
  const { register, handleSubmit } = useForm()
  return (
    <form>
      <Input {...register('name')}></Input>
      <Button type="submit" onClick={handleSubmit(onSubmit)}>
        Save
      </Button>
    </form>
  )
}
