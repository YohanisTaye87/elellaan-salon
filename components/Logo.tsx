type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  withShadow?: boolean;
  className?: string;
};

/**
 * Vector recreation of the elellaan makeup logo: a purple-gradient round
 * mark with a stylized woman silhouette + flowing hair, and the cursive
 * wordmark + "makeup" caption underneath. Used as the visible header mark
 * AND as the favicon (via app/icon.svg) until /public/logo.png is supplied.
 */
export default function Logo({
  size = 96,
  showWordmark = true,
  withShadow = true,
  className = "",
}: LogoProps) {
  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 220 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="elellaan makeup"
        role="img"
      >
        <defs>
          <linearGradient id="ring" x1="20" y1="20" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D9C2DD" />
            <stop offset="55%" stopColor="#A684A8" />
            <stop offset="100%" stopColor="#6E5470" />
          </linearGradient>
          <linearGradient id="hair" x1="60" y1="40" x2="180" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C7A8CB" />
            <stop offset="100%" stopColor="#7A5C7E" />
          </linearGradient>
          <radialGradient id="inside" cx="50%" cy="60%" r="62%">
            <stop offset="0%" stopColor="#F6EEF6" />
            <stop offset="100%" stopColor="#E5D2E7" />
          </radialGradient>
          <linearGradient id="silhouette" x1="80" y1="60" x2="160" y2="170" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9B7BA0" />
            <stop offset="100%" stopColor="#6E5470" />
          </linearGradient>
          {withShadow && (
            <filter id="soft" x="-20%" y="-20%" width="140%" height="160%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
              <feOffset dx="0" dy="4" result="off" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.18" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        <g filter={withShadow ? "url(#soft)" : undefined}>
          {/* outer ring */}
          <circle cx="110" cy="110" r="92" fill="none" stroke="url(#ring)" strokeWidth="9" />
          {/* inner blush */}
          <circle cx="110" cy="110" r="83" fill="url(#inside)" />

          {/* hair sweep — three feathered waves coming over the top */}
          <path
            d="M 36 95
               C 45 55, 90 30, 130 38
               C 170 46, 192 80, 188 108
               C 175 90, 152 78, 128 80
               C 100 82, 78 92, 60 100
               C 50 104, 42 102, 36 95 Z"
            fill="url(#hair)"
          />
          <path
            d="M 60 78
               C 90 60, 130 60, 170 80"
            stroke="#FFFFFF"
            strokeOpacity="0.45"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 70 92
               C 100 78, 140 80, 175 96"
            stroke="#FFFFFF"
            strokeOpacity="0.25"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* face silhouette — profile facing right, chin tucked */}
          <path
            d="M 96 88
               C 122 85, 142 100, 144 122
               C 145 138, 138 152, 124 162
               C 116 168, 105 172, 96 170
               C 92 152, 92 130, 94 114
               C 95 104, 95 96, 96 88 Z"
            fill="url(#silhouette)"
          />

          {/* eyelash detail */}
          <g stroke="#3F2C44" strokeWidth="1.6" strokeLinecap="round" fill="none">
            <path d="M 124 116 l 8 -3" />
            <path d="M 126 122 l 9 -2" />
            <path d="M 128 128 l 9 -1" />
          </g>

          {/* subtle highlight on cheek */}
          <ellipse cx="110" cy="142" rx="6" ry="3" fill="#FFFFFF" opacity="0.18" />
        </g>
      </svg>

      {showWordmark && (
        <div className="mt-1.5 text-center leading-none">
          <div className="font-serif italic text-[1.55em] font-semibold tracking-tight text-brand-700">
            elellaan
          </div>
          <div className="mt-0.5 text-[0.55em] uppercase tracking-[0.4em] text-brand-500">
            makeup
          </div>
        </div>
      )}
    </div>
  );
}
