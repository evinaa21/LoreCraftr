import { auth } from '../auth.js';
import { router } from '../router.js';

const API_URL = '/api';

export class StoryPage {
  constructor(params) {
    this.storyId = params.storyId;
    this.story = null;
  }

  async render() {
    const container = document.createElement('div');
    container.className = 'story-page';
    
    // Load story data
    await this.loadStory();

    if (!this.story) {
      container.innerHTML = `
        <div class="story-container">
          <div class="error-state">
            <h2>Story Not Found</h2>
            <p>The story you're looking for doesn't exist or has been removed.</p>
            <button class="btn-primary" onclick="router.navigate('/dashboard')">Back to Dashboard</button>
          </div>
        </div>
      `;
      return container;
    }

    container.innerHTML = `
      <div class="story-container shared-story">
        <div class="story-header">
          <h1>${this.story.title || 'Untitled Collaborative Tale'}</h1>
          <button class="btn-ghost" onclick="window.print()">🖨️ Print</button>
        </div>

        <div class="story-meta">
          <div class="meta-item">
            <span class="meta-label">Theme:</span>
            <span class="meta-value">${this.story.theme}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Players:</span>
            <span class="meta-value">${this.story.players?.length || 0}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Rounds:</span>
            <span class="meta-value">${this.story.currentRound || this.story.narrative?.length || 0}</span>
          </div>
        </div>

        <div class="story-origin-block">
          <h3>ORIGIN</h3>
          <p>${this.story.origin}</p>
        </div>

        <div class="story-narrative-block">
          <h3>THE TALE</h3>
          ${this.story.narrative?.map((line, idx) => `
            <p class="narrative-line">
              <span class="line-number">${idx + 1}.</span>
              <span class="line-text">${line.text}</span>
            </p>
          `).join('') || '<p>No narrative available.</p>'}
        </div>

        <div class="story-scoreboard">
          <h3>FINAL SCOREBOARD</h3>
          <div class="score-grid">
            ${this.renderScoreboard()}
          </div>
        </div>

        <div class="story-actions">
          <div class="share-link-container">
            <input 
              type="text" 
              id="share-link" 
              class="share-link-input" 
              value="${window.location.href}" 
              readonly
            >
            <button class="btn-primary" id="copy-link">📋 Copy Link</button>
          </div>
          <button class="btn-ghost" onclick="router.navigate('/profile')">View More Stories</button>
          <button class="btn-ghost" onclick="router.navigate('/dashboard')">Back to Dashboard</button>
        </div>
      </div>
    `;

    this.container = container;
    this.attachEventListeners();

    return container;
  }

  async loadStory() {
    try {
      const response = await fetch(`${API_URL}/stories/${this.storyId}`, {
        headers: auth.getToken() ? {
          'Authorization': `Bearer ${auth.getToken()}`
        } : {}
      });

      if (response.ok) {
        this.story = await response.json();
      } else {
        this.story = null;
      }
    } catch (error) {
      console.error('Failed to load story:', error);
      this.story = null;
    }
  }

  renderScoreboard() {
    if (!this.story.scores || this.story.scores.size === 0) {
      return '<p>No scores available</p>';
    }

    // Convert Map to array and sort by score
    const sortedScores = Array.from(this.story.scores).sort((a, b) => b[1] - a[1]);

    return sortedScores.map(([playerId, score], index) => {
      const player = this.story.players?.find(p => p._id === playerId);
      const username = player?.username || 'Unknown';
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

      return `
        <div class="score-card rank-${index + 1}">
          <span class="player-rank">${medal || `#${index + 1}`}</span>
          <span class="player-name">${username}</span>
          <span class="player-score">${score} pts</span>
        </div>
      `;
    }).join('');
  }

  attachEventListeners() {
    const copyBtn = this.container.querySelector('#copy-link');
    const linkInput = this.container.querySelector('#share-link');

    if (copyBtn && linkInput) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(linkInput.value);
          copyBtn.textContent = '✅ Copied!';
          copyBtn.classList.add('success');
          
          setTimeout(() => {
            copyBtn.textContent = '📋 Copy Link';
            copyBtn.classList.remove('success');
          }, 2000);
        } catch (error) {
          // Fallback for older browsers
          linkInput.select();
          document.execCommand('copy');
          copyBtn.textContent = '✅ Copied!';
        }
      });
    }
  }
}
