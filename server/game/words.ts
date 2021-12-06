const words = ['house', 'ball', 'car', 'bike', 'balloon', 'pistol', 'mountain']
export function getWord(alreadySeenWords: string[]) {
  // Todo: larger list. Keep in file
  // if word has been seen, fetch a new one.
  const word = words[Math.floor(Math.random() * words.length)]
  return word
}
