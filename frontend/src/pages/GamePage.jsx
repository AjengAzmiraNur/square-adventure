import { useParams } from 'react-router-dom'
import GameShell from '../components/games/GameShell'
import { AdventureQuest, CompletePattern, FormulaChallenge, NextNumber, SquareHunter } from '../components/games/Games'
import { GAME_META } from '../content/games'
import { ErrorBox } from '../components/ui'

const COMPONENTS = {
  'square-hunter': SquareHunter,
  'complete-pattern': CompletePattern,
  'next-number': NextNumber,
  'formula-challenge': FormulaChallenge,
  'adventure-quest': AdventureQuest,
}

export default function GamePage() {
  const { slug } = useParams()
  const Game = COMPONENTS[slug]
  if (!Game) return <ErrorBox message="Permainan tidak ditemukan." />
  return <GameShell key={slug} slug={slug} meta={GAME_META[slug]} Game={Game} />
}
