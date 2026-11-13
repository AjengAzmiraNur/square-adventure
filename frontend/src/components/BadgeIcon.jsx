import { Award, Compass, Flag, Gamepad2, Gem, Mountain, Search, Sigma, Star, Trophy } from 'lucide-react'

const ICONS = { flag: Flag, compass: Compass, search: Search, sigma: Sigma, gem: Gem, mountain: Mountain, trophy: Trophy, gamepad: Gamepad2, star: Star }

export default function BadgeIcon({ name, size = 24, className = '' }) {
  const Icon = ICONS[name] || Award
  return <Icon size={size} className={className} aria-hidden="true" />
}
