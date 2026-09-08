import logo from '../../assets/logo.png'

export default function Logo({ className = 'h-7 w-7' }) {
  return (
    <img
      src={logo}
      alt="Landia"
      className={`object-contain flex-shrink-0 ${className}`}
    />
  )
}
