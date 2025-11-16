export const themeIcons = {
  'Gritty Sci-Fi': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="5" y="5" width="14" height="14" rx="2" ry="2"/>
      <path d="M10 9h4"/>
      <path d="M10 15h4"/>
      <path d="M10 12h-4"/>
      <path d="M14 12h4"/>
      <path d="M12 5v-2"/>
      <path d="M12 19v2"/>
      <line x1="17" y1="7" x2="15" y2="9" stroke-dasharray="2 2"/>
    </svg>
  `,
  'High Fantasy': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      <path d="M12 7l-2 2h4l-2 2"/>
    </svg>
  `,
  'Weird West': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/>
      <path d="M8 12h8"/>
      <path d="M6 15c2.5 2 4.5 2 6 2s3.5 0 6-2"/>
      <path d="M2 20s3-3 10-3s10 3 10 3"/>
    </svg>
  `,
  'Cyberpunk Noir': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="10" width="20" height="12"/>
      <path d="M6 22V15"/>
      <path d="M10 22V18"/>
      <path d="M14 22V16"/>
      <path d="M18 22V19"/>
      <line x1="5" y1="7" x2="7" y2="4"/>
      <line x1="17" y1="7" x2="19" y2="4"/>
      <line x1="11" y1="5" x2="13" y2="2"/>
    </svg>
  `,
  'Cosmic Horror': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10z"/>
      <path d="M7 12c0 2.761 2.239 5 5 5s5-2.239 5-5s-2.239-5-5-5s-5 2.239-5 5z" fill="currentColor"/>
      <circle cx="12" cy="12" r="1" fill="white" stroke="white"/>
      <path d="M2 12c1-2 4-4 10-4s9 2 10 4M2 12c1 2 4 4 10 4s9-2 10-4"/>
    </svg>
  `
};

export function getThemeIcon(themeName) {
  return themeIcons[themeName] || themeIcons['Gritty Sci-Fi'];
}