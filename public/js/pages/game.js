import { auth } from '../auth.js';
import { router } from '../router.js';

export class GamePage {
  constructor(params) {
    this.roomId = params.roomId;
    this.user = auth.getUser();
    this.gameState = null;
    this.narrative = [];
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
          <!-- Dynamic phase content -->
        </div>

        <div class="players-sidebar">
          <h3>SCORES</h3>
          <div id="scores-list"></div>
        </div>
      </div>
    `;

    this.setupSocketListeners();
    return container;
  }

  setupSocketListeners() {
    const socket = window.socket;

    socket.on('game-started', (data) => {
      this.gameState = data;
      this.updateGameUI();
      this.showSubmitPhase();
    });

    socket.on('submission-received', ({ totalSubmissions, requiredSubmissions }) => {
      this.updateSubmissionProgress(totalSubmissions, requiredSubmissions);
    });

    socket.on('voting-phase', ({ submissions }) => {
      this.showVotingPhase(submissions);
    });

    socket.on('vote-received', ({ totalVotes, requiredVotes }) => {
      this.updateVotingProgress(totalVotes, requiredVotes);
    });

    socket.on('scribe-choice', ({ topVoted, scribeId }) => {
      if (this.user._id === scribeId) {
        this.showScribeChoice(topVoted);
      } else {
        this.showWaitingForScribe();
      }
    });

    socket.on('round-complete', ({ chosenSentence, scribeTag, round }) => {
      this.addToNarrative(chosenSentence.sentence, scribeTag);
    });

    socket.on('next-round', (data) => {
      this.gameState = data;
      this.updateGameUI();
      this.showSubmitPhase();
    });

    socket.on('game-complete', () => {
      this.showGameComplete();
    });
  }

  updateGameUI() {
    document.querySelector('#phase-display').textContent = this.gameState.phase;
    document.querySelector('#round-display').textContent = 
      `ROUND ${this.gameState.currentRound}/15`;
    document.querySelector('#scribe-name').textContent = 
      this.getPlayerName(this.gameState.scribeId);
  }

  showSubmitPhase() {
    const isScribe = this.gameState.scribeId === this.user._id;
    const phaseContainer = document.querySelector('#game-phase');

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
      
      textarea.addEventListener('input', () => {
        charCount.textContent = textarea.value.length;
      });

      phaseContainer.querySelector('#submit-sentence-btn').addEventListener('click', () => {
        this.submitSentence(textarea.value);
      });
    }
  }

  submitSentence(sentence) {
    if (!sentence.trim()) return;

    window.socket.emit('submit-sentence', {
      roomId: this.roomId,
      playerId: this.user._id,
      sentence,
      playerName: this.user.username
    });

    document.querySelector('#game-phase').innerHTML = `
      <div class="waiting-state">
        <p>Sentence submitted</p>
        <p>Waiting for other players...</p>
      </div>
    `;
  }

  showVotingPhase(submissions) {
    if (this.gameState.scribeId === this.user._id) {
      document.querySelector('#game-phase').innerHTML = `
        <div class="scribe-wait">
          <p>Players are voting on submissions...</p>
        </div>
      `;
      return;
    }

    const phaseContainer = document.querySelector('#game-phase');
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

    phaseContainer.querySelector('#submit-vote-btn').addEventListener('click', () => {
      const selected = phaseContainer.querySelector('input[name="vote"]:checked');
      if (selected) {
        this.submitVote(selected.value);
      }
    });
  }

  submitVote(submissionId) {
    window.socket.emit('submit-vote', {
      roomId: this.roomId,
      voterId: this.user._id,
      submissionId
    });

    document.querySelector('#game-phase').innerHTML = `
      <div class="waiting-state">
        <p>Vote submitted</p>
        <p>Waiting for other players...</p>
      </div>
    `;
  }

  showScribeChoice(topVoted) {
    const phaseContainer = document.querySelector('#game-phase');
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

    phaseContainer.querySelector('#submit-choice-btn').addEventListener('click', () => {
      const selected = phaseContainer.querySelector('input[name="scribe-choice"]:checked');
      const tag = phaseContainer.querySelector('#scribe-tag').value;
      
      if (selected) {
        window.socket.emit('scribe-select', {
          roomId: this.roomId,
          chosenId: selected.value,
          scribeTag: tag
        });
      }
    });
  }

  showWaitingForScribe() {
    document.querySelector('#game-phase').innerHTML = `
      <div class="waiting-state">
        <p>Waiting for Scribe to choose...</p>
      </div>
    `;
  }

  addToNarrative(sentence, tag) {
    const fullText = tag ? `${sentence} ${tag}` : sentence;
    this.narrative.push(fullText);

    const narrativeEl = document.querySelector('#narrative');
    narrativeEl.innerHTML = this.narrative.map((text, idx) => `
      <p class="narrative-line"><span class="line-num">${idx + 1}.</span> ${text}</p>
    `).join('');
  }

  showGameComplete() {
    document.querySelector('#game-phase').innerHTML = `
      <div class="game-complete">
        <h2>STORY COMPLETE</h2>
        <p>The tale has been told.</p>
        <button id="return-btn" class="btn-primary">RETURN TO LOBBY</button>
      </div>
    `;

    document.querySelector('#return-btn').addEventListener('click', () => {
      router.navigate('/dashboard');
    });
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
