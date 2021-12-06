import { NextPage } from 'next'
import Link from 'next/link'

const HomePage: NextPage = () => {
  return (
    <div>
      <h1>Welcome to this shitty drawing game!</h1>
      <Link href="/game">Play</Link>
    </div>
  )
}

export default HomePage
