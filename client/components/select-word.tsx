import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react'

type Props = {
  show: boolean
  onSelectWord: (word: string) => void
  potentialWords?: string[]
}

export const SelectWord = ({ show, potentialWords, onSelectWord }: Props) => {
  return (
    <Modal onClose={() => {}} isOpen={show}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textAlign="center">Select word to draw</ModalHeader>
        <ModalBody
          display="flex"
          alignItems=""
          justifyContent="space-around"
          paddingBottom="32px"
        >
          {potentialWords?.map((word, i) => (
            <Button
              colorScheme="purple"
              onClick={() => onSelectWord(word)}
              key={word}
            >
              {word}
            </Button>
          ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
