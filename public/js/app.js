import { auth } from './auth.js';
import { router } from './router.js';
import { ThemeToggle } from './utils/themeToggle.js';
import { CosmicParticles } from './utils/cosmicParticles.js';
import { getOptimalPreset } from './utils/particleConfig.js';

class LoreCraftr {
  constructor() {
    this.currentUser = null;
    this.socket = null;
    this.themeToggle = null;
    this.particles = null;
    this.init();
  }

  async init() {
    // Initialize cosmic particle background with optimal settings
    const preset = getOptimalPreset();
    this.particles = new CosmicParticles(preset);
    
    // Initialize theme toggle
    this.themeToggle = new ThemeToggle();
    
    // Check authentication
    this.currentUser = await auth.checkSession();
    
    // Set up socket if authenticated (before router init)
    if (this.currentUser) {
      this.initSocket();
    }
    
    // Initialize router after socket is ready
    router.init(this.currentUser);
    
    // Add particle control to settings (optional)
    this.addParticleControls();
    
    // Make router globally accessible for updates
    window.router = router;
  }

  addParticleControls() {
    // Add keyboard shortcut to toggle particles
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        const canvas = document.getElementById('cosmic-particles');
        if (canvas) {
          canvas.style.opacity = canvas.style.opacity === '0' ? '0.4' : '0';
        }
      }
    });
  }

  initSocket() {
    const token = auth.getToken();
    if (!token) return;

    this.socket = io(window.location.origin, {
      auth: { token }
    });
    
    // Make socket available globally immediately
    window.socket = this.socket;

    this.socket.on('connect', () => {
      console.log('✓ Connected to server', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('✗ Disconnected from server', { reason });
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      this.showNotification('Connection error: ' + error.message, 'error');
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      this.showNotification(error.message || error, 'error');
    });
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
  window.app = new LoreCraftr();
});
