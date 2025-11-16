import { auth } from '../auth.js';
import { router } from '../router.js';

const API_URL = '/api';

export class ProfilePage {
  constructor() {
    this.user = auth.getUser();
    this.currentTab = 'stories';
    this.stories = [];
    this.currentStoryIndex = 0;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'profile-page';
    container.innerHTML = `
      <div class="profile-container">
        <div class="profile-header">
          <h1>PROFILE</h1>
          <button class="btn-ghost" onclick="router.navigate('/dashboard')">← Back to Dashboard</button>
        </div>

        <div class="profile-info">
          <div class="user-avatar">
            <span class="initials">${this.user.initials || this.user.username.substring(0, 2).toUpperCase()}</span>
          </div>
          <div class="user-details">
            <h2>${this.user.username}</h2>
            <p class="user-email">${this.user.email}</p>
            <div class="user-stats">
              <div class="stat">
                <span class="stat-value">${this.user.gamesPlayed || 0}</span>
                <span class="stat-label">Games Played</span>
              </div>
              <div class="stat">
                <span class="stat-value">${this.user.totalScore || 0}</span>
                <span class="stat-label">Total Score</span>
              </div>
            </div>
          </div>
        </div>

        <div class="profile-tabs">
          <button class="tab-btn active" data-tab="stories">Completed Stories</button>
          <button class="tab-btn" data-tab="username">Change Username</button>
          <button class="tab-btn" data-tab="password">Change Password</button>
        </div>

        <div class="profile-content" id="profile-content">
          <div class="loading">Loading...</div>
        </div>
      </div>
    `;

    this.container = container;
    this.attachEventListeners();
    this.loadStories();

    return container;
  }

  attachEventListeners() {
    const tabButtons = this.container.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Update active tab
        tabButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        // Switch content
        this.currentTab = e.target.dataset.tab;
        this.renderTabContent();
      });
    });
  }

  async loadStories() {
    try {
      const response = await fetch(`${API_URL}/users/stories`, {
        headers: {
          'Authorization': `Bearer ${auth.getToken()}`
        }
      });

      if (response.ok) {
        this.stories = await response.json();
      } else {
        this.stories = [];
      }
    } catch (error) {
      console.error('Failed to load stories:', error);
      this.stories = [];
    }

    this.renderTabContent();
  }

  renderTabContent() {
    const content = this.container.querySelector('#profile-content');
    if (!content) return;

    switch (this.currentTab) {
      case 'stories':
        this.renderStoriesTab(content);
        break;
      case 'username':
        this.renderUsernameTab(content);
        break;
      case 'password':
        this.renderPasswordTab(content);
        break;
    }
  }

  renderStoriesTab(content) {
    if (this.stories.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <p>No completed stories yet.</p>
          <p>Join a game and create your first collaborative tale!</p>
        </div>
      `;
      return;
    }

    const story = this.stories[this.currentStoryIndex];
    
    content.innerHTML = `
      <div class="story-viewer">
        <div class="story-navigation">
          <button id="prev-story" class="btn-nav" ${this.currentStoryIndex === 0 ? 'disabled' : ''}>← Previous</button>
          <span class="story-counter">${this.currentStoryIndex + 1} / ${this.stories.length}</span>
          <button id="next-story" class="btn-nav" ${this.currentStoryIndex === this.stories.length - 1 ? 'disabled' : ''}>Next →</button>
        </div>

        <div class="story-display">
          <h3>${story.title || 'Untitled Story'}</h3>
          <p class="story-theme">Theme: ${story.theme}</p>
          <div class="story-origin">
            <strong>Origin:</strong> ${story.origin}
          </div>
          <div class="story-narrative">
            ${story.narrative.map((line, idx) => `
              <p class="narrative-line"><span class="line-num">${idx + 1}.</span> ${line.text}</p>
            `).join('')}
          </div>
          <div class="story-scores">
            <h4>Final Scores:</h4>
            ${Array.from(story.scores || new Map()).map(([playerId, score]) => `
              <div class="score-item">
                <span>${this.getPlayerNameFromStory(story, playerId)}</span>
                <span>${score} pts</span>
              </div>
            `).join('')}
          </div>
        </div>

        <button class="btn-primary" id="share-story">📤 Share Story</button>
      </div>
    `;

    // Attach navigation listeners
    const prevBtn = content.querySelector('#prev-story');
    const nextBtn = content.querySelector('#next-story');
    const shareBtn = content.querySelector('#share-story');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentStoryIndex > 0) {
          this.currentStoryIndex--;
          this.renderTabContent();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.currentStoryIndex < this.stories.length - 1) {
          this.currentStoryIndex++;
          this.renderTabContent();
        }
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        router.navigate(`/story/${story._id}`);
      });
    }
  }

  renderUsernameTab(content) {
    content.innerHTML = `
      <div class="settings-form">
        <h3>Change Username</h3>
        <div class="form-group">
          <label for="new-username">New Username</label>
          <input 
            type="text" 
            id="new-username" 
            class="input-field" 
            placeholder="Enter new username"
            minlength="3"
            maxlength="20"
          >
        </div>
        <div class="error-message" id="username-error"></div>
        <button class="btn-primary" id="save-username">Save Changes</button>
      </div>
    `;

    const saveBtn = content.querySelector('#save-username');
    const input = content.querySelector('#new-username');
    const errorEl = content.querySelector('#username-error');

    saveBtn.addEventListener('click', async () => {
      const newUsername = input.value.trim();
      
      if (newUsername.length < 3 || newUsername.length > 20) {
        errorEl.textContent = 'Username must be 3-20 characters';
        return;
      }

      try {
        const response = await fetch(`${API_URL}/users/profile`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${auth.getToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username: newUsername })
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('user', JSON.stringify(data));
          this.user = data;
          alert('Username updated successfully!');
          router.navigate('/dashboard');
        } else {
          const error = await response.json();
          errorEl.textContent = error.error || 'Failed to update username';
        }
      } catch (error) {
        errorEl.textContent = 'Network error. Please try again.';
      }
    });
  }

  renderPasswordTab(content) {
    content.innerHTML = `
      <div class="settings-form">
        <h3>Change Password</h3>
        <div class="form-group">
          <label for="current-password">Current Password</label>
          <input 
            type="password" 
            id="current-password" 
            class="input-field"
            placeholder="Enter current password"
          >
        </div>
        <div class="form-group">
          <label for="new-password">New Password</label>
          <input 
            type="password" 
            id="new-password" 
            class="input-field"
            placeholder="Enter new password"
            minlength="6"
          >
        </div>
        <div class="form-group">
          <label for="confirm-password">Confirm New Password</label>
          <input 
            type="password" 
            id="confirm-password" 
            class="input-field"
            placeholder="Confirm new password"
          >
        </div>
        <div class="error-message" id="password-error"></div>
        <button class="btn-primary" id="save-password">Save Changes</button>
      </div>
    `;

    const saveBtn = content.querySelector('#save-password');
    const currentPass = content.querySelector('#current-password');
    const newPass = content.querySelector('#new-password');
    const confirmPass = content.querySelector('#confirm-password');
    const errorEl = content.querySelector('#password-error');

    saveBtn.addEventListener('click', async () => {
      if (newPass.value.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters';
        return;
      }

      if (newPass.value !== confirmPass.value) {
        errorEl.textContent = 'Passwords do not match';
        return;
      }

      try {
        const response = await fetch(`${API_URL}/users/password`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${auth.getToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            currentPassword: currentPass.value,
            newPassword: newPass.value 
          })
        });

        if (response.ok) {
          alert('Password updated successfully!');
          currentPass.value = '';
          newPass.value = '';
          confirmPass.value = '';
          errorEl.textContent = '';
        } else {
          const error = await response.json();
          errorEl.textContent = error.error || 'Failed to update password';
        }
      } catch (error) {
        errorEl.textContent = 'Network error. Please try again.';
      }
    });
  }

  getPlayerNameFromStory(story, playerId) {
    const player = story.players?.find(p => p._id === playerId);
    return player?.username || 'Unknown';
  }
}
