import { auth } from '../auth.js';
import { router } from '../router.js';
import { getThemeIcon } from '../utils/themeIcons.js';

const API_URL = '/api';

export class LobbyPage {
  constructor(params) {
    this.roomId = params.roomId;
    this.user = auth.getUser();
    this.room = null;
    this.socket = window.socket;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'lobby-page';
    container.innerHTML = `
      <div class="lobby-container">
        <div class="lobby-header">
          <h1 id="room-name">Loading...</h1>
          <div class="room-code-display">
            <span>CODE:</span>
            <span id="room-code">------</span>
          </div>
        </div>

        <div class="lobby-content">
          <div class="players-section">
            <h2>PLAYERS</h2>
            <div id="players-list" class="players-list"></div>
          </div>

          <div class="settings-section">
            <h2>THEME</h2>
            <div id="theme-display" class="theme-display" data-theme="">
              <div class="theme-display-icon"></div>
              <div class="theme-display-name">---</div>
            </div>
            <div id="theme-selector" class="theme-selector" style="display: none;"></div>
          </div>
        </div>

        <div class="lobby-actions">
          <button id="leave-btn" class="btn-secondary">LEAVE</button>
          <button id="start-btn" class="btn-primary" style="display: none;">START GAME</button>
        </div>
      </div>
    `;

    this.loadRoom(container);
    this.attachEventListeners(container);
    this.setupSocketListeners();
    return container;
  }

  async loadRoom(container) {
    try {
      const response = await fetch(`${API_URL}/rooms/${this.roomId}`, {
        headers: {
          'Authorization': `Bearer ${auth.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Room not found');
      }

      this.room = await response.json();
      
      container.setAttribute('data-game-theme', this.room.theme);
      
      this.updateUI(container);
    } catch (error) {
      console.error('Error loading room:', error);
      alert('Room not found or no longer available');
      router.navigate('/dashboard');
    }
  }

  updateUI(container) {
    container.querySelector('#room-name').textContent = this.room.name;
    container.querySelector('#room-code').textContent = this.room.code;
    
    const themeDisplay = container.querySelector('#theme-display');
    themeDisplay.setAttribute('data-theme', this.room.theme);
    themeDisplay.querySelector('.theme-display-icon').innerHTML = getThemeIcon(this.room.theme);
    themeDisplay.querySelector('.theme-display-name').textContent = this.room.theme;

    const playersList = container.querySelector('#players-list');
    playersList.innerHTML = this.room.players.map(player => `
      <div class="player-item">
        <div class="player-avatar">${player.initials}</div>
        <span class="player-name">${player.username}</span>
        ${player._id === this.room.host._id ? '<span class="host-badge">HOST</span>' : ''}
      </div>
    `).join('');

    const isHost = this.room.host._id === this.user._id;
    const hasEnoughPlayers = this.room.players.length >= 2;
    
    if (isHost && hasEnoughPlayers) {
      container.querySelector('#start-btn').style.display = 'block';
    } else {
      container.querySelector('#start-btn').style.display = 'none';
    }

    if (isHost) {
      const themes = [
        { name: 'Gritty Sci-Fi' },
        { name: 'High Fantasy' },
        { name: 'Weird West' },
        { name: 'Cyberpunk Noir' },
        { name: 'Cosmic Horror' }
      ];
      
      const themeSelector = container.querySelector('#theme-selector');
      themeSelector.style.display = 'grid';
      themeSelector.innerHTML = themes.map(theme => `
        <button 
          class="theme-option ${theme.name === this.room.theme ? 'active' : ''}" 
          data-theme="${theme.name}"
        >
          <div class="theme-option-icon">${getThemeIcon(theme.name)}</div>
          <span>${theme.name}</span>
        </button>
      `).join('');

      themeSelector.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', () => this.changeTheme(btn.dataset.theme));
      });
    }
  }

  attachEventListeners(container) {
    container.querySelector('#leave-btn').addEventListener('click', () => {
      this.leaveRoom();
    });

    const startBtn = container.querySelector('#start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.startGame();
      });
    }
  }

  setupSocketListeners() {
    if (!this.socket) {
      console.error('Socket not available');
      return;
    }

    this.socket.emit('joinRoom', { roomId: this.roomId });

    this.socket.on('playerJoined', () => {
      this.loadRoom(document.querySelector('.lobby-container').parentElement);
    });

    this.socket.on('playerLeft', () => {
      this.loadRoom(document.querySelector('.lobby-container').parentElement);
    });

    this.socket.on('themeUpdated', ({ theme }) => {
      this.room.theme = theme;
      this.updateUI(document.querySelector('.lobby-container').parentElement);
    });

    this.socket.on('gameStarted', () => {
      router.navigate(`/game/${this.roomId}`);
    });
  }

  async changeTheme(theme) {
    try {
      const response = await fetch(`${API_URL}/rooms/theme/${this.roomId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.getToken()}`
        },
        body: JSON.stringify({ theme })
      });

      if (!response.ok) {
        throw new Error('Failed to change theme');
      }

      this.room.theme = theme;
      const container = document.querySelector('.lobby-page');
      container.setAttribute('data-game-theme', theme);
      this.updateUI(container.querySelector('.lobby-container').parentElement);
      
      if (this.socket) {
        this.socket.emit('themeChanged', { roomId: this.roomId, theme });
      }
    } catch (error) {
      console.error('Error changing theme:', error);
      alert('Failed to change theme');
    }
  }

  async leaveRoom() {
    try {
      await fetch(`${API_URL}/rooms/leave/${this.roomId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.getToken()}`
        }
      });

      if (this.socket) {
        this.socket.emit('leaveRoom', { roomId: this.roomId });
      }
      router.navigate('/dashboard');
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }

  async startGame() {
    try {
      console.log('🎮 Starting game from lobby...');
      console.log('  Room ID:', this.roomId);
      console.log('  Socket connected:', !!this.socket);
      console.log('  Socket ID:', this.socket?.id);
      
      const response = await fetch(`${API_URL}/rooms/start/${this.roomId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.getToken()}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start game');
      }

      console.log('✅ Room status updated to IN_PROGRESS');

      if (this.socket) {
        console.log('📡 Emitting startGame event...');
        this.socket.emit('startGame', {
          roomId: this.roomId,
          players: this.room.players.map(p => ({ id: p._id, name: p.username }))
        });
        console.log('✅ startGame event emitted');
      } else {
        console.error('❌ Socket not available!');
        throw new Error('Connection lost. Please refresh the page.');
      }
    } catch (error) {
      console.error('❌ Error starting game:', error);
      alert(error.message);
    }
  }
}
