// School crest + Miz School wordmark + campus illustration.
// The crest is a placeholder built from brand tokens; a school's approved logo_url replaces it.

export function Crest({ school, size = 40 }) {
  if (school?.logo_url) {
    return <img src={school.logo_url} alt={`${school.name} logo`} width={size} height={size} style={{ objectFit: 'contain' }} />;
  }
  const primary = school?.primary_color || 'var(--brand)';
  const ink = school?.secondary_color || 'var(--brand-ink)';
  const accent = school?.accent_color || 'var(--accent)';
  const initials = school?.crest_initials || 'MS';
  return (
    <svg width={size} height={size * 1.12} viewBox="0 0 100 112" role="img" aria-label={`${school?.short_name || 'School'} crest`} style={{ flexShrink: 0 }}>
      <path d="M50 3 L93 14 V52 C93 80 74 98 50 109 C26 98 7 80 7 52 V14 Z" fill={ink} />
      <path d="M50 10 L86 19.5 V52 C86 75.5 70 91 50 101 C30 91 14 75.5 14 52 V19.5 Z" fill={primary} />
      <path d="M14 38 H86" stroke={accent} strokeWidth="4" />
      <path d="M32 26 l4 -5 l4 5 M60 26 l4 -5 l4 5" stroke={accent} strokeWidth="2.6" fill="none" strokeLinejoin="round" />
      <path d="M50 16 v16 M43 23 h14" stroke={accent} strokeWidth="3" />
      <text x="50" y="74" textAnchor="middle" fontFamily="'Source Serif 4', Georgia, serif" fontWeight="700" fontSize="27" fill="#fff" letterSpacing="1">{initials}</text>
      <path d="M30 86 Q50 94 70 86" stroke={accent} strokeWidth="2.4" fill="none" />
    </svg>
  );
}

export function MizMark({ size = 30, light = false }) {
  return (
    <span className="row" style={{ gap: 9 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <rect width="40" height="40" rx="7" fill={light ? '#fff' : '#0B2345'} />
        <path d="M9 29 V13 l6 8 l5 -8 l5 8 l6 -8 V29" stroke={light ? '#0B2345' : '#fff'} strokeWidth="3.2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <rect x="9" y="31.5" width="22" height="2.4" rx="1.2" fill="#C8962E" />
      </svg>
      <span style={{ fontWeight: 700, fontSize: size * 0.62, color: light ? '#fff' : '#0B2345', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
        Miz <span style={{ fontWeight: 500 }}>School</span>
      </span>
    </span>
  );
}

/** Line illustration of a school facade — stands in for the approved campus photo. */
export function CampusArt({ color = 'rgba(255,255,255,.55)', className = '', style }) {
  return (
    <svg className={className} viewBox="0 0 600 300" preserveAspectRatio="xMidYMax meet" style={{ width: '100%', display: 'block', ...style }} aria-hidden="true">
      <g fill="none" stroke={color} strokeWidth="1.6">
        {/* clock tower */}
        <path d="M270 120 V40 L300 14 L330 40 V120" />
        <circle cx="300" cy="62" r="13" />
        <path d="M300 62 V53 M300 62 L307 66" />
        <path d="M285 88 h30 v28 h-30z M300 88 v28" />
        {/* main block */}
        <path d="M130 290 V120 H470 V290" />
        <path d="M120 120 H480 L470 108 H130 Z" />
        {[160, 200, 240, 360, 400, 440].map((x) => (
          <g key={x}>
            <path d={`M${x - 12} 150 h24 v34 h-24z M${x} 150 v34`} />
            <path d={`M${x - 12} 214 h24 v34 h-24z M${x} 214 v34`} />
          </g>
        ))}
        {/* portico */}
        <path d="M260 290 V190 H340 V290" />
        <path d="M252 190 L300 160 L348 190" />
        {[272, 290, 310, 328].map((x) => <path key={x} d={`M${x} 196 V290`} />)}
        <path d="M284 290 V250 a16 16 0 0 1 32 0 V290" />
        {/* wings */}
        <path d="M20 290 V170 H130 M470 170 H580 V290" />
        {[48, 90, 510, 552].map((x) => <path key={x} d={`M${x - 10} 196 h20 v28 h-20z M${x - 10} 240 h20 v28 h-20z`} />)}
        {/* flag */}
        <path d="M300 14 V-4" />
        {/* trees + ground */}
        <path d="M0 290 H600" />
        <circle cx="78" cy="262" r="20" /><path d="M78 282 v8" />
        <circle cx="522" cy="262" r="20" /><path d="M522 282 v8" />
        <path d="M200 290 q10 -14 20 0 M380 290 q10 -14 20 0" />
      </g>
    </svg>
  );
}
