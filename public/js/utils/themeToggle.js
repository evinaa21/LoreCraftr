export class ThemeToggle {
  constructor() {
    this.currentTheme = localStorage.getItem('theme') || 'light';
    this.init();
  }

  init() {
    // Apply saved theme immediately (before page renders)
    this.applyTheme(this.currentTheme);
    
    // Create toggle button
    this.createToggle();
  }

  createToggle() {
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle';
    toggle.setAttribute('aria-label', 'Toggle theme');
    toggle.setAttribute('title', `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} mode`);
    toggle.innerHTML = this.getIcon();
    
    toggle.addEventListener('click', () => this.toggle());
    
    document.body.appendChild(toggle);
    this.toggleButton = toggle;
  }

  getIcon() {
    if (this.currentTheme === 'dark') {
      // Sun icon (light mode)
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5" fill="currentColor"/>
          <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;
    } else {
      // Moon icon (dark mode)
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/>
        </svg>
      `;
    }
  }

  applyTheme(theme) {
    // Remove old theme
    document.documentElement.removeAttribute('data-theme');
    
    // Add slight delay to ensure smooth transition
    requestAnimationFrame(() => {
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    });
  }

  toggle() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    
    // Apply theme with transition
    this.applyTheme(this.currentTheme);
    
    // Save to localStorage
    localStorage.setItem('theme', this.currentTheme);
    
    // Update button icon and title
    this.toggleButton.innerHTML = this.getIcon();
    this.toggleButton.setAttribute('title', 
      `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} mode`
    );
    
    // Log for debugging
    console.log(`Theme switched to: ${this.currentTheme}`);
  }
}