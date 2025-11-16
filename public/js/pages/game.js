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
    
    // Setup socket listeners AFTER container is created
    this.setupSocketListeners();
    
    return container;
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
        theme: data.theme
      });
      
      this.gameState = data;
      this.narrative = data.narrative || [];
      
      // Ensure DOM is ready before updating
      if (this.container) {
        this.updateGameUI();
        this.displayStoryContent();
        this.showSubmitPhase();
      } else {
        console.error('Container not ready when gameStarted received');
      }
    });

    socket.on('submissionReceived', ({ totalSubmissions, requiredSubmissions }) => {
      this.updateSubmissionProgress(totalSubmissions, requiredSubmissions);
    });

    socket.on('votingPhase', ({ submissions }) => {
      this.showVotingPhase(submissions);
    });

    socket.on('voteReceived', ({ totalVotes, requiredVotes }) => {
      this.updateVotingProgress(totalVotes, requiredVotes);
    });

    socket.on('scribeChoice', ({ topVoted, scribeId }) => {
      if (this.user._id === scribeId) {
        this.showScribeChoice(topVoted);
      } else {
        this.showWaitingForScribe();
      }
    });

    socket.on('roundComplete', ({ chosenSentence, scribeTag, round }) => {
      this.addToNarrative(chosenSentence, scribeTag);
    });

    socket.on('nextRound', (data) => {
      this.gameState = { ...this.gameState, ...data };
      if (this.container) {
        this.updateGameUI();
        this.displayStoryContent();
        this.showSubmitPhase();
      }
    });

    socket.on('gameComplete', () => {
      this.showGameComplete();
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
    if (!this.container || !this.gameState) return;

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
    } else {
      // Display built narrative
      narrativeEl.innerHTML = this.narrative.map((entry, index) => 
        `<p><span class="round-marker">[Round ${index + 1}]</span> ${entry.sentence} <em>${entry.tag}</em></p>`
      ).join('');
    }
    
    // Display current prompt
    if (this.gameState.prompt) {
      promptEl.innerHTML = `
        <div class="current-prompt">
          <strong>Current Prompt:</strong> ${this.gameState.prompt.text}
        </div>
      `;
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
    if (!sentence.trim()) return;
    
    if (!window.socket) {
      alert('Connection lost. Please refresh.');
      return;
    }

    window.socket.emit('submitSentence', {
      roomId: this.roomId,
      sentence,
      playerId: this.user._id,
      playerName: this.user.username
    });

    const phaseContainer = this.container?.querySelector('#game-phase');
    if (phaseContainer) {
      phaseContainer.innerHTML = `
        <div class="waiting-state">
          <p>Sentence submitted</p>
          <p>Waiting for other players...</p>
        </div>
      `;
    }
  }

  showVotingPhase(submissions) {
    if (!this.container || !this.gameState) return;

    if (this.gameState.scribeId === this.user._id) {
      const phaseContainer = this.container.querySelector('#game-phase');
      if (phaseContainer) {
        phaseContainer.innerHTML = `
          <div class="scribe-wait">
            <p>Players are voting on submissions...</p>
          </div>
        `;
      }
      return;
    }

    const phaseContainer = this.container.querySelector('#game-phase');
    if (!phaseContainer) return;

    phaseContainer.innerHTML = `
      <div class="voting-phase">
        <h3>VOTE FOR THE BEST FIT</h3>
        <div class="submissions-list">
          ${submissions.map((sub, idx) => `
            <div class="submission-option">
              <input 
                type="radio" 
                name="vote" 
                id="vote-${idx}" 
                value="${sub.playerId}"
              />
              <label for="vote-${idx}">${sub.sentence}</label>
            </div>
          `).join('')}
        </div>
        <button id="submit-vote-btn" class="btn-primary">SUBMIT VOTE</button>
      </div>
    `;

    const submitVoteBtn = phaseContainer.querySelector('#submit-vote-btn');
    if (submitVoteBtn) {
      submitVoteBtn.addEventListener('click', () => {
        const selected = phaseContainer.querySelector('input[name="vote"]:checked');
        if (selected) {
          this.submitVote(selected.value);
        }
      });
    }
  }

  submitVote(submissionId) {
    if (!window.socket) {
      alert('Connection lost. Please refresh.');
      return;
    }
    
    window.socket.emit('submitVote', {
      roomId: this.roomId,
      voterId: this.user._id,
      submissionId
    });

    const phaseContainer = this.container?.querySelector('#game-phase');
    if (phaseContainer) {
      phaseContainer.innerHTML = `
        <div class="waiting-state">
          <p>Vote submitted</p>
          <p>Waiting for other players...</p>
        </div>
      `;
    }
  }

  showScribeChoice(topVoted) {
    if (!this.container) return;

    const phaseContainer = this.container.querySelector('#game-phase');
    if (!phaseContainer) return;

    phaseContainer.innerHTML = `
      <div class="scribe-choice">
        <h3>CHOOSE THE FINAL SENTENCE</h3>
        <div class="top-voted-list">
          ${topVoted.map((item, idx) => `
            <div class="voted-option">
              <input 
                type="radio" 
                name="scribe-choice" 
                id="choice-${idx}" 
                value="${item.submissionId}"
              />
              <label for="choice-${idx}">
                <div class="sentence">${item.sentence}</div>
                <div class="votes">${item.votes} votes</div>
              </label>
            </div>
          `).join('')}
        </div>
        <textarea 
          id="scribe-tag" 
          class="input-field" 
          placeholder="Add your Scribe's Tag (3-5 words)..."
          maxlength="50"
        ></textarea>
        <button id="submit-choice-btn" class="btn-primary">FINALIZE</button>
      </div>
    `;

    const submitChoiceBtn = phaseContainer.querySelector('#submit-choice-btn');
    if (submitChoiceBtn) {
      submitChoiceBtn.addEventListener('click', () => {
        const selected = phaseContainer.querySelector('input[name="scribe-choice"]:checked');
        const tagInput = phaseContainer.querySelector('#scribe-tag');
        
        if (selected && window.socket && tagInput) {
          window.socket.emit('scribeChoice', {
            roomId: this.roomId,
            chosenId: selected.value,
            scribeTag: tagInput.value
          });
        }
      });
    }
  }

  showWaitingForScribe() {
    if (!this.container) return;

    const phaseContainer = this.container.querySelector('#game-phase');
    if (phaseContainer) {
      phaseContainer.innerHTML = `
        <div class="waiting-state">
          <p>Waiting for Scribe to choose...</p>
        </div>
      `;
    }
  }

  addToNarrative(sentence, tag) {
    this.narrative.push({ sentence, tag });
    this.displayStoryContent();
  }

  showGameComplete() {
    if (!this.container) return;

    const phaseContainer = this.container.querySelector('#game-phase');
    if (phaseContainer) {
      phaseContainer.innerHTML = `
        <div class="game-complete">
          <h2>STORY COMPLETE</h2>
          <p>The tale has been told.</p>
          <button id="return-btn" class="btn-primary">RETURN TO LOBBY</button>
        </div>
      `;

      const returnBtn = phaseContainer.querySelector('#return-btn');
      if (returnBtn) {
        returnBtn.addEventListener('click', () => {
          router.navigate('/dashboard');
        });
      }
    }
  }

  getPlayerName(playerId) {
    // This would need to be tracked from game state
    return 'Player';
  }

  updateSubmissionProgress(current, total) {
    // Optional: show progress indicator
  }

  updateVotingProgress(current, total) {
    // Optional: show progress indicator
  }
}
