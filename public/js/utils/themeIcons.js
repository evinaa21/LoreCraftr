export const themeIcons = {
  'Gritty Sci-Fi': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M15 14c.2-.5.5-1 1-1.5a4.2 4.2 0 0 0-4.5-4.5 4.2 4.2 0 0 0-4.5 4.5c.3.5.6 1 1 1.5"/>
      <path d="M9 18h6"/>
      <path d="M10 22h4"/>
      <path d="M12 22v-3"/>
      <path d="M8 20v-2"/>
      <path d="M16 20v-2"/>
    </svg>
  `,
  'High Fantasy': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      <path d="M10 7h6"/>
      <path d="M10 12h6"/>
      <path d="M10 17h6"/>
    </svg>
  `,
  'Weird West': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  `,
  'Cyberpunk Noir': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="5" y="5" width="14" height="14" rx="2" ry="2"/>
      <path d="M10 9h4"/>
      <path d="M10 15h4"/>
      <path d="M9 10v4"/>
      <path d="M15 10v4"/>
      <rect x="8" y="8" width="8" height="8" rx="1" ry="1"/>
    </svg>
  `,
  'Cosmic Horror': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2v20"/>
      <path d="M22 12H2"/>
      <path d="M17.5 6.5l-11 11"/>
      <path d="M6.5 6.5l11 11"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  `
};

export function getThemeIcon(themeName) {
  return themeIcons[themeName] || themeIcons['Gritty Sci-Fi'];
}