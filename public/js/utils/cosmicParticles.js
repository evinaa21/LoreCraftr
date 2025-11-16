export class CosmicParticles {
  constructor(options = {}) {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationId = null;
    
    // Configuration
    this.config = {
      particleCount: options.particleCount || 150,
      maxSize: options.maxSize || 3,
      minSize: options.minSize || 0.5,
      speed: options.speed || 0.3,
      connectionDistance: options.connectionDistance || 120,
      showConnections: options.showConnections !== false,
      twinkle: options.twinkle !== false,
      ...options
    };
    
    this.init();
  }

  init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'cosmic-particles';
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      opacity: 0.4;
    `;
    
    document.body.insertBefore(this.canvas, document.body.firstChild);
    
    this.ctx = this.canvas.getContext('2d');
    
    // Set canvas size
    this.resize();
    
    // Create particles
    this.createParticles();
    
    // Start animation
    this.animate();
    
    // Handle resize
    window.addEventListener('resize', () => this.resize());
    
    // Watch for theme changes
    this.watchTheme();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    this.particles = [];
    
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * this.config.speed;
    
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      size: Math.random() * (this.config.maxSize - this.config.minSize) + this.config.minSize,
      speedX: Math.cos(angle) * speed,
      speedY: Math.sin(angle) * speed,
      opacity: Math.random() * 0.5 + 0.5,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      twinklePhase: Math.random() * Math.PI * 2,
      baseOpacity: Math.random() * 0.3 + 0.3
    };
  }

  getColor() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return isDark ? 'rgba(255, 255, 255' : 'rgba(0, 0, 0';
  }

  animate() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    const colorBase = this.getColor();
    
    // Draw connections first (behind particles)
    if (this.config.showConnections) {
      this.drawConnections(colorBase);
    }
    
    // Update and draw particles
    this.particles.forEach(particle => {
      this.updateParticle(particle);
      this.drawParticle(particle, colorBase);
    });
    
    // Continue animation
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  updateParticle(particle) {
    // Update position
    particle.x += particle.speedX;
    particle.y += particle.speedY;
    
    // Wrap around edges
    if (particle.x < -10) particle.x = this.canvas.width + 10;
    if (particle.x > this.canvas.width + 10) particle.x = -10;
    if (particle.y < -10) particle.y = this.canvas.height + 10;
    if (particle.y > this.canvas.height + 10) particle.y = -10;
    
    // Update twinkle
    if (this.config.twinkle) {
      particle.twinklePhase += particle.twinkleSpeed;
    }
  }

  drawParticle(particle, colorBase) {
    // Calculate twinkle effect
    const twinkle = this.config.twinkle 
      ? Math.sin(particle.twinklePhase) * 0.4 + 0.6 
      : 1;
    
    const opacity = particle.baseOpacity * twinkle;
    
    // Draw main particle
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    this.ctx.fillStyle = `${colorBase}, ${opacity})`;
    this.ctx.fill();
    
    // Draw glow for larger particles
    if (particle.size > 1.5) {
      const gradient = this.ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size * 4
      );
      gradient.addColorStop(0, `${colorBase}, ${opacity * 0.8})`);
      gradient.addColorStop(0.5, `${colorBase}, ${opacity * 0.3})`);
      gradient.addColorStop(1, `${colorBase}, 0)`);
      
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size * 4, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }
  }

  drawConnections(colorBase) {
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.config.connectionDistance) {
          const opacity = (1 - distance / this.config.connectionDistance) * 0.15;
          
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `${colorBase}, ${opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }
  }

  watchTheme() {
    const observer = new MutationObserver(() => {
      // Theme changed, canvas will update on next frame
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.createParticles(); // Recreate with new settings
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.canvas) {
      this.canvas.remove();
    }
  }
}