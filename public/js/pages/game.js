import { auth } from '../auth.js';
import { router } from '../router.js';

export class GamePage {
  constructor(params) {
    this.roomId = params.roomId;
    this.user = auth.getUser();
    this.gameState = null;
    this.narrative = [];
    this.container = null;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'game-page';
    container.innerHTML = `
      <div class="game-container">
        <div class="game-header">
          <div class="round-info">
            <span id="phase-display">SETTING</span>
            <span id="round-display">ROUND 1/15</span>
          </div>
          <div class="scribe-indicator" id="scribe-indicator">
            SCRIBE: <span id="scribe-name">---</span>
          </div>
        </div>

        <div class="story-block" id="story-block">
          <div id="narrative" class="narrative"></div>
          <div id="prompt" class="prompt">Loading prompt...</div>
        </div>

        <div class="game-phase" id="game-phase">
          <div class="waiting-state">
            <p>Waiting for game to start...</p>
          </div>
        </div>

        <div class="players-sidebar">
          <h3>SCORES</h3>
          <div id="scores-list"></div>
        </div>
      </div>
    `;

    // Store container reference
    this.container = container;
    
    // Join the socket room
    this.joinRoom();
    
    // Setup socket listeners AFTER container is created
    this.setupSocketListeners();
    
    return container;
  }

  joinRoom() {
    const socket = window.socket;
    if (socket && this.roomId) {
      console.log('🔌 Joining socket room:', this.roomId);
      socket.emit('joinRoom', { roomId: this.roomId });
    }
  }

  setupSocketListeners() {
    const socket = window.socket;
    
    if (!socket) {
      console.error('❌ Socket not initialized');
      alert('Connection error. Please refresh the page.');
      router.navigate('/dashboard');
      return;
    }

    console.log('🎮 Setting up game socket listeners for room:', this.roomId);

    socket.on('gameStarted', (data) => {
      console.log('✅ gameStarted event received:', { 
        round: data.currentRound, 
        phase: data.phase,
        hasOrigin: !!data.origin,
        hasPrompt: !!data.prompt,
        theme: data.theme,
        scribeId: data.scribeId,
        narrative: data.narrative
      });
      
      this.gameState = {
        currentRound: data.currentRound,
        phase: data.phase,
        scribeId: data.scribeId,
        maxRounds: data.maxRounds,
        theme: data.theme,
        origin: data.origin,
        prompt: data.prompt
      };
      
      this.narrative = data.narrative || [];
      
      // Ensure DOM is ready before updating
      if (this.container) {
        console.log('📝 Updating game UI...');
        this.updateGameUI();
        this.displayStoryContent();
        this.showSubmitPhase();
        console.log('✅ Game UI updated successfully');
      } else {
        console.error('❌ Container not ready when gameStarted received');
      }
    });

    socket.on('submissionReceived', ({ totalSubmissions, requiredSubmissions }) => {
      console.log(`📝 Submission progress: ${totalSubmissions}/${requiredSubmissions}`);
      this.updateSubmissionProgress(totalSubmissions, requiredSubmissions);
    });

    socket.on('votingPhase', ({ submissions }) => {
      console.log(`🗳️ Voting phase started with ${submissions.length} submissions`);
      this.showVotingPhase(submissions);
    });

    socket.on('voteReceived', ({ totalVotes, requiredVotes }) => {
      console.log(`🗳️ Vote progress: ${totalVotes}/${requiredVotes}`);
      this.updateVotingProgress(totalVotes, requiredVotes);
    });

    socket.on('scribeChoice', ({ topVoted, scribeId }) => {
      console.log(`✍️ Scribe choice phase. Scribe: ${scribeId}, Top voted: ${topVoted.length}`);
      if (this.user._id === scribeId) {
        this.showScribeChoice(topVoted);
      } else {
        this.showWaitingForScribe();
      }
    });

    socket.on('roundComplete', ({ chosenSentence, scribeTag, round }) => {
      console.log(`✅ Round ${round} complete`);
      this.addToNarrative(chosenSentence, scribeTag);
    });

    socket.on('nextRound', (data) => {
      console.log(`➡️ Moving to round ${data.currentRound}`);
      this.gameState = { ...this.gameState, ...data };
      if (this.container) {
        this.updateGameUI();
        this.displayStoryContent();
        this.showSubmitPhase();
      }
    });

    socket.on('gameComplete', () => {
      console.log(`🎉 Game complete!`);
      this.showGameComplete();
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      alert(error.message || 'An error occurred');
    });
  }

  updateGameUI() {
    if (!this.container || !this.gameState) {
      console.warn('updateGameUI called but container or gameState not ready');
      return;
    }

    const phaseDisplay = this.container.querySelector('#phase-display');
    const roundDisplay = this.container.querySelector('#round-display');
    const scribeName = this.container.querySelector('#scribe-name');
    
    if (!phaseDisplay || !roundDisplay || !scribeName) {
      console.error('Game UI elements not found in DOM');
      return;
    }

    phaseDisplay.textContent = this.gameState.phase;
    roundDisplay.textContent = `ROUND ${this.gameState.currentRound}/15`;
    scribeName.textContent = this.getPlayerName(this.gameState.scribeId);
  }

  displayStoryContent() {
    if (!this.container || !this.gameState) {
      console.warn('displayStoryContent: container or gameState not ready');
      return;
    }

    const narrativeEl = this.container.querySelector('#narrative');
    const promptEl = this.container.querySelector('#prompt');
    
    if (!narrativeEl || !promptEl) {
      console.error('Story content elements not found');
      return;
    }
    
    // Display origin story if it's the first round
    if (this.gameState.currentRound === 1 && this.gameState.origin) {
      narrativeEl.innerHTML = `
        <div class="origin-story">
          <h3>${this.gameState.origin.title}</h3>
          <p>${this.gameState.origin.text}</p>
        </div>
      `;
      console.log('📖 Displayed origin story:', this.gameState.origin.title);
    } else if (this.narrative.length > 0) {
      // Display built narrative
      narrativeEl.innerHTML = this.narrative.map((entry, index) => 
        `<p class="narrative-line">
          <span class="line-num">[${index + 1}]</span> 
          ${entry.sentence} 
          <em class="scribe-tag">${entry.tag}</em>
        </p>`
      ).join('');
      console.log('📖 Displayed narrative with', this.narrative.length, 'entries');
    } else {
      narrativeEl.innerHTML = '<p class="waiting-state">Story begins...</p>';
    }
    
    // Display current prompt
    if (this.gameState.prompt) {
      promptEl.innerHTML = `
        <div class="current-prompt">
          <strong>Prompt:</strong> ${this.gameState.prompt.text}
        </div>
      `;
      console.log('📝 Displayed prompt:', this.gameState.prompt.text);
    } else {
      promptEl.textContent = 'Loading prompt...';
    }
  }

  showSubmitPhase() {
    if (!this.container || !this.gameState) return;

    const isScribe = this.gameState.scribeId === this.user._id;
    const phaseContainer = this.container.querySelector('#game-phase');
    
    if (!phaseContainer) return;

    if (isScribe) {
      phaseContainer.innerHTML = `
        <div class="scribe-wait">
          <p>You are the Scribe this round.</p>
          <p>Wait for other players to submit their sentences...</p>
        </div>
      `;
    } else {
      phaseContainer.innerHTML = `
        <div class="submit-phase">
          <h3>SUBMIT YOUR SENTENCE</h3>
          <textarea 
            id="sentence-input" 
            class="input-field" 
            placeholder="Write a sentence that fits the established story..."
            maxlength="200"
          ></textarea>
          <div class="char-count"><span id="char-count">0</span>/200</div>
          <button id="submit-sentence-btn" class="btn-primary">SUBMIT</button>
        </div>
      `;

      const textarea = phaseContainer.querySelector('#sentence-input');
      const charCount = phaseContainer.querySelector('#char-count');
      
      if (textarea && charCount) {
        textarea.addEventListener('input', () => {
          charCount.textContent = textarea.value.length;
        });
      }

      const submitBtn = phaseContainer.querySelector('#submit-sentence-btn');
      if (submitBtn && textarea) {
        submitBtn.addEventListener('click', () => {
          this.submitSentence(textarea.value);
        });
      }
    }
  }

  submitSentence(sentence) {
    if (!sentence.trim()) {
      alert('Please enter a sentence');
      return;
    }
    
    if (!window.socket) {
      alert('Connection lost. Please refresh.');
      return;
    }

    console.log('📤 Submitting sentence:', sentence.substring(0, 50) + '...');

    window.socket.emit('submitSentence', {
      roomId: this.roomId,
      sentence: sentence.trim(),
      playerId: this.user._id,
      playerName: this.user.username
    });

    const phaseContainer = this.container?.querySelector('#game-phase');
    if (phaseContainer) {
      phaseContainer.innerHTML = `
        <div class="waiting-state">
          <p>✅ Sentence submitted</p>
          <p>Waiting for other players...</p>
        </div>
      `;
    }
  }

  updateSubmissionProgress(total, required) {
    const phaseContainer = this.container?.querySelector('#game-phase');
    if (phaseContainer) {
      phaseContainer.innerHTML = `
        <div class="waiting-state">
          <p>✅ Sentence submitted</p>
          <p>Waiting for other players... (${total}/${required})</p>
        </div>
      `;
    }
  }

  showVotingPhase(submissions) {
    const phaseContainer = this.container?.querySelector('#game-phase');
    if (!phaseContainer) return;

    phaseContainer.innerHTML = `
      <div class="voting-phase">
        <h3>Vote for the Best Sentence</h3>
        <div class="submissions-list">
          ${submissions.map(sub => `
            <div class="submission-card" data-id="${sub.playerId}">
              <p class="submission-text">"${sub.sentence}"</p>
              <button class="btn-vote" data-id="${sub.playerId}">Vote</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Attach vote handlers
    phaseContainer.querySelectorAll('.btn-vote').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const submissionId = e.target.dataset.id;
        this.submitVote(submissionId);
      });
    });
  }

  submitVote(submissionId) {
    if (!window.socket) return;

    window.socket.emit('submitVote', {
      roomId: this.roomId,
      submissionId
    });

    const phaseContainer = this.container?.querySelector('#game-phase');
    if (phaseContainer) {
      phaseContainer.innerHTML = `
        <div class="waiting-state">
          <p>✅ Vote submitted</p>
          <p>Waiting for other votes...</p>
        </div>
      `;
    }
  }

  updateVotingProgress(total, required) {
    const phaseContainer = this.container?.querySelector('#game-phase');
    if (phaseContainer) {
      phaseContainer.innerHTML = `
        <div class="waiting-state">
          <p>✅ Vote submitted</p>
          <p>Waiting for other votes... (${total}/${required})</p>
        </div>
      `;
    }
  }

  showScribeChoice(topVoted) {
    const phaseContainer = this.container?.querySelector('#game-phase');
    if (!phaseContainer) return;

    phaseContainer.innerHTML = `
      <div class="scribe-choice">
        <h3>You're the Scribe! Choose a sentence:</h3>
        <div class="submissions-list">
          ${topVoted.map(sub => `
            <div class="submission-card" data-id="${sub.playerId}">
              <p class="submission-text">"${sub.sentence}"</p>
              <p class="vote-count">Votes: ${sub.votes || 0}</p>
              <button class="btn-choose" data-id="${sub.playerId}">Choose This</button>
            </div>
          `).join('')}
        </div>
        <div class="scribe-tag-input">
          <label>Add your scribe tag (optional):</label>
          <input type="text" id="scribe-tag" placeholder="e.g., [DRAMATIC]" maxlength="20">
        </div>
      </div>
    `;

    phaseContainer.querySelectorAll('.btn-choose').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const chosenId = e.target.dataset.id;
        const tag = document.getElementById('scribe-tag')?.value || '';
        this.submitScribeChoice(chosenId, tag);
      });
    });
  }

  submitScribeChoice(chosenId, scribeTag) {
    if (!window.socket) return;

    window.socket.emit('scribeChoice', {
      roomId: this.roomId,
      chosenId,
      scribeTag
    });

    const phaseContainer = this.container?.querySelector('#game-phase');
    if (phaseContainer) {
      phaseContainer.innerHTML = `
        <div class="waiting-state">
          <p>✅ Choice submitted</p>
          <p>Preparing next round...</p>
        </div>
      `;
    }
  }

  showWaitingForScribe() {
    const phaseContainer = this.container?.querySelector('#game-phase');
    if (phaseContainer) {
      phaseContainer.innerHTML = `
        <div class="waiting-state">
          <p>Waiting for Scribe to choose...</p>
        </div>
      `;
    }
  }

  addToNarrative(sentence, scribeTag) {
    const tag = scribeTag ? ` ${scribeTag}` : '';
    this.narrative.push({ sentence: sentence + tag, tag: scribeTag });
    
    if (this.container) {
      this.displayStoryContent();
    }
  }

  showGameComplete() {
    const phaseContainer = this.container?.querySelector('#game-phase');
    if (phaseContainer) {
      phaseContainer.innerHTML = `
        <div class="game-complete">
          <h2>🎉 Story Complete!</h2>
          <p>Your collaborative tale has been forged.</p>
          <button class="btn" onclick="router.navigate('/dashboard')">Back to Dashboard</button>
        </div>
      `;
    }
  }

  getPlayerName(playerId) {
    if (!playerId) return 'Unknown';
    
    // If it's the current user
    if (playerId === this.user._id) return this.user.username;
    
    // Try to find in game state players
    if (this.gameState?.players) {
      const player = this.gameState.players.find(p => p.id === playerId);
      if (player) return player.name;
    }
    
    return 'Player';
  }
}
