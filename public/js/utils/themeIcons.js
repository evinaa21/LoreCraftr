export const themeIcons = {
  'Gritty Sci-Fi': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v6m0 6v6M1 12h6m6 0h6"/>
      <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24m0-14.14-4.24 4.24M9.17 14.83l-4.24 4.24"/>
    </svg>
  `,
  'High Fantasy': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 7h-9M14 17H5m9-6.5V2m0 15v7"/>
      <path d="M18 12a6 6 0 0 1-12 0h12z"/>
      <circle cx="12" cy="4" r="2"/>
    </svg>
  `,
  'Weird West': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2L8 8h8l-4-6z"/>
      <rect x="9" y="8" width="6" height="10" rx="1"/>
      <path d="M7 18h10M9 12h6M9 15h6"/>
      <circle cx="12" cy="20" r="2"/>
    </svg>
  `,
  'Cyberpunk Noir': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <path d="M8 2v4M16 2v4M8 18v4M16 18v4M2 8h4M18 8h4M2 16h4M18 16h4"/>
      <path d="M9 9h6v6H9z"/>
    </svg>
  `,
  'Cosmic Horror': `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1c-2.5 4-5.5 7-11 11 5.5 4 8.5 7 11 11 2.5-4 5.5-7 11-11-5.5-4-8.5-7-11-11z"/>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>
    </svg>
  `
};

export function getThemeIcon(themeName) {
  return themeIcons[themeName] || themeIcons['Gritty Sci-Fi'];
}