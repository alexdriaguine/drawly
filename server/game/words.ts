import fs from 'fs'
import { words } from './word-list.json'

export function getWords(previous: string[]) {
  return [
    words[Math.floor(Math.random() * words.length)],
    words[Math.floor(Math.random() * words.length)],
    words[Math.floor(Math.random() * words.length)],
  ]
}
