export default function WaveLogo({ size = 32, className = '' }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" fill="none">
        <defs>
          <linearGradient id="wave-grad-logo" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#4d7cff" />
          </linearGradient>
        </defs>
        <path
          d="M2 14 Q 7 4 12 14 T 22 14"
          stroke="url(#wave-grad-logo)"
          strokeWidth="2.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </svg>
    </div>
  )
}
