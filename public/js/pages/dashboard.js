import { auth } from '../auth.js';
import { router } from '../router.js';
import { getThemeIcon } from '../utils/themeIcons.js';

const API_URL = '/api';

export class DashboardPage {
  constructor() {
    this.user = auth.getUser();
    this.rooms = [];
    this.refreshInterval = null;
    this.socket = window.socket;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'dashboard-page';
    container.innerHTML = `
      <header class="dashboard-header">
        <div class="header-content">
          <h1>LORECRAFTR</h1>
          <div class="user-info">
            <div class="player-avatar">${this.user.initials}</div>
            <span class="username">${this.user.username}</span>
            <button id="logout-btn" class="btn-ghost">LOGOUT</button>
          </div>
        </div>
      </header>

      <main class="dashboard-main">
        <div class="dashboard-actions">
          <button id="create-room-btn" class="btn-primary">CREATE ROOM</button>
          <button id="join-code-btn" class="btn-secondary">JOIN BY CODE</button>
          <button id="refresh-rooms-btn" class="btn-secondary">
            <span id="refresh-text">REFRESH</span>
          </button>
        </div>

        <div class="rooms-section">
          <h2>AVAILABLE ROOMS (<span id="room-count">0</span>)</h2>
          <div id="rooms-list" class="rooms-list">
            <div class="loading">Loading rooms...</div>
          </div>
        </div>

        <div class="stats-section">
          <h2>YOUR STATS</h2>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">${this.user.gamesPlayed || 0}</div>
              <div class="stat-label">Games Played</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${this.user.totalScore || 0}</div>
              <div class="stat-label">Total Score</div>
            </div>
          </div>
        </div>
      </main>
    `;

    this.attachEventListeners(container);
    this.loadRooms(container);
    this.refreshInterval = setInterval(() => this.loadRooms(container), 5000);
    
    return container;
  }

  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  attachEventListeners(container) {
    container.querySelector('#logout-btn').addEventListener('click', () => {
      this.destroy();
      auth.logout();
    });

    container.querySelector('#create-room-btn').addEventListener('click', () => {
      this.showCreateRoomModal();
    });

    container.querySelector('#join-code-btn').addEventListener('click', () => {
      this.showJoinCodeModal();
    });

    container.querySelector('#refresh-rooms-btn').addEventListener('click', () => {
      this.loadRooms(container, true);
    });
  }

  async loadRooms(container, manualRefresh = false) {
    try {
      if (manualRefresh) {
        const refreshText = container.querySelector('#refresh-text');
        refreshText.textContent = 'REFRESHING...';
      }

      const response = await fetch(`${API_URL}/rooms/available`);
      if (!response.ok) throw new Error('Failed to load rooms');

      const rooms = await response.json();
      this.rooms = rooms;

      const roomsList = container.querySelector('#rooms-list');
      const roomCount = container.querySelector('#room-count');
      roomCount.textContent = rooms.length;

      if (rooms.length === 0) {
        roomsList.innerHTML = `
          <div class="empty-state">
            <p>No rooms available</p>
            <p style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-tertiary);">
              Create one to start playing!
            </p>
          </div>
        `;
        return;
      }

      roomsList.innerHTML = rooms.map(room => `
        <div class="room-card" data-theme="${room.theme}">
          <div class="room-theme-icon">${getThemeIcon(room.theme)}</div>
          <div class="room-theme-badge">${room.theme}</div>
          <div class="room-header">
            <h3>${this.escapeHtml(room.name)}</h3>
            <span class="room-code">${room.code}</span>
          </div>
          <div class="room-info">
            <span class="room-players">${room.players.length}/${room.maxPlayers} Players</span>
            <span class="room-host">Host: ${this.escapeHtml(room.host.username)}</span>
          </div>
          <button 
            class="btn-join btn-primary" 
            data-room-id="${room._id}"
            ${room.players.length >= room.maxPlayers ? 'disabled' : ''}
          >
            ${room.players.length >= room.maxPlayers ? 'FULL' : 'JOIN'}
          </button>
        </div>
      `).join('');

      roomsList.querySelectorAll('.btn-join:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => this.joinRoom(btn.dataset.roomId));
      });

      if (manualRefresh) {
        container.querySelector('#refresh-text').textContent = 'REFRESH';
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      const roomsList = container.querySelector('#rooms-list');
      roomsList.innerHTML = `
        <div class="error-state">
          <p>Failed to load rooms</p>
          <button class="btn-secondary" onclick="window.location.reload()">RETRY</button>
        </div>
      `;
    }
  }

  async joinRoom(roomId) {
    try {
      const response = await fetch(`${API_URL}/rooms/join/${roomId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.getToken()}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join room');
      }

      const room = await response.json();
      this.destroy();
      router.navigate(`/lobby/${room._id}`);
    } catch (error) {
      alert(error.message);
    }
  }

  showCreateRoomModal() {
    const themes = [
      { name: 'Gritty Sci-Fi', desc: 'Dystopian futures, space exploration' },
      { name: 'High Fantasy', desc: 'Magic, dragons, ancient prophecies' },
      { name: 'Weird West', desc: 'Supernatural western frontier' },
      { name: 'Cyberpunk Noir', desc: 'Corporate intrigue, hackers, AI' },
      { name: 'Cosmic Horror', desc: 'Eldritch beings, reality-bending' }
    ];

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>CREATE ROOM</h2>
        <form id="create-room-form">
          <div class="form-group">
            <input 
              type="text" 
              id="room-name" 
              class="input-field" 
              placeholder="Room Name"
              maxlength="50"
              required
              autocomplete="off"
            />
          </div>
          
          <div class="form-group">
            <label style="font-size: 0.75rem; margin-bottom: 0.5rem; display: block; color: var(--text-primary);">THEME</label>
            <div class="theme-grid">
              ${themes.map((theme, idx) => `
                <label class="theme-card ${idx === 0 ? 'selected' : ''}" data-theme="${theme.name}">
                  <input type="radio" name="theme" value="${theme.name}" ${idx === 0 ? 'checked' : ''} style="display: none;">
                  <div class="theme-icon">${getThemeIcon(theme.name)}</div>
                  <div class="theme-name">${theme.name}</div>
                  <div class="theme-desc">${theme.desc}</div>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="form-group">
            <label style="font-size: 0.75rem; margin-bottom: 0.5rem; display: block; color: var(--text-primary);">MAX PLAYERS</label>
            <select id="max-players" class="input-field">
              <option value="2">2 Players</option>
              <option value="3">3 Players</option>
              <option value="4" selected>4 Players</option>
            </select>
          </div>

          <div class="error-message" id="create-error"></div>
          
          <div class="modal-actions">
            <button type="button" class="btn-secondary" id="cancel-btn">CANCEL</button>
            <button type="submit" class="btn-primary" id="create-submit">CREATE</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Theme selection
    modal.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        modal.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        card.querySelector('input').checked = true;
      });
    });

    setTimeout(() => modal.querySelector('#room-name').focus(), 100);

    modal.querySelector('#cancel-btn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    modal.querySelector('#create-room-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = modal.querySelector('#create-submit');
      const errorMsg = modal.querySelector('#create-error');
      errorMsg.textContent = '';
      
      const name = modal.querySelector('#room-name').value.trim();
      const theme = modal.querySelector('input[name="theme"]:checked').value;
      const maxPlayers = parseInt(modal.querySelector('#max-players').value);

      if (!name) {
        errorMsg.textContent = 'Please enter a room name';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'CREATING...';

      try {
        const response = await fetch(`${API_URL}/rooms/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.getToken()}`
          },
          body: JSON.stringify({ name, theme, maxPlayers })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create room');
        }

        const room = await response.json();
        modal.remove();
        this.destroy();
        router.navigate(`/lobby/${room._id}`);
      } catch (error) {
        console.error('Create room error:', error);
        errorMsg.textContent = error.message;
        submitBtn.disabled = false;
        submitBtn.textContent = 'CREATE';
      }
    });
  }

  showJoinCodeModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>JOIN BY CODE</h2>
        <form id="join-code-form">
          <div class="form-group">
            <input 
              type="text" 
              id="room-code" 
              class="input-field" 
              placeholder="Enter 6-digit code"
              maxlength="6"
              style="text-transform: uppercase; font-size: 1.5rem; text-align: center; letter-spacing: 0.5em;"
              required
              autocomplete="off"
            />
          </div>
          <div class="error-message" id="join-error"></div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" id="cancel-btn">CANCEL</button>
            <button type="submit" class="btn-primary" id="join-submit">JOIN</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const codeInput = modal.querySelector('#room-code');
    
    setTimeout(() => codeInput.focus(), 100);

    codeInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });

    modal.querySelector('#cancel-btn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    modal.querySelector('#join-code-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = modal.querySelector('#join-submit');
      const errorMsg = modal.querySelector('#join-error');
      errorMsg.textContent = '';
      
      const code = codeInput.value.toUpperCase().trim();

      if (code.length !== 6) {
        errorMsg.textContent = 'Room code must be 6 characters';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'JOINING...';

      try {
        const response = await fetch(`${API_URL}/rooms/join-code/${code}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.getToken()}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Room not found');
        }

        const room = await response.json();
        modal.remove();
        this.destroy();
        router.navigate(`/lobby/${room._id}`);
      } catch (error) {
        console.error('Join by code error:', error);
        errorMsg.textContent = error.message;
        submitBtn.disabled = false;
        submitBtn.textContent = 'JOIN';
        codeInput.select();
      }
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
