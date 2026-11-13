import { Link } from 'react-router-dom'
import Kubi from '../components/Kubi'

export default function NotFound() {
  return (
    <div className="world-bg grid min-h-dvh place-items-center px-4">
      <div className="panel max-w-md text-center">
        <Kubi mood="think" size={64}>
          Wah, sepertinya kita tersesat. Halaman ini tidak ada di peta.
        </Kubi>
        <Link to="/" className="btn-primary mt-4">
          Kembali ke beranda
        </Link>
      </div>
    </div>
  )
}
