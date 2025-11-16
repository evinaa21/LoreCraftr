class GameState {
  constructor(roomId, players = []) {
    this.roomId = roomId;
    this.currentRound = 1;
    this.maxRounds = 10;
    this.phase = 'SETTING'; // SETTING (1-3), ACTION (4-7), CONSEQUENCE (8-10)
    this.submissions = new Map(); // playerId -> { sentence, playerId, playerName }
    this.scribeId = null;
    this.players = players;
    this.submissionDeadline = null; // Timer for submissions
    this.scribeDeadline = null; // Timer for scribe choice
    // Persisted game metadata so late joiners can catch up
    this.theme = null;
    this.origin = null;   // { title, text }
    this.prompt = null;   // { text, category }
    this.narrative = [];  // [{ sentence, tag }]
    this.rotateScribe();
  }

  getPhase() {
    if (this.currentRound <= 3) return 'SETTING';
    if (this.currentRound <= 7) return 'ACTION';
    return 'CONSEQUENCE';
  }

  rotateScribe() {
    const currentScribeIndex = this.players.findIndex(p => p.id === this.scribeId);
    const nextIndex = (currentScribeIndex + 1) % this.players.length;
    this.scribeId = this.players[nextIndex]?.id || this.players[0]?.id;
  }

  addSubmission(playerId, sentence, playerName) {
    if (playerId === this.scribeId) {
      throw new Error('Scribe cannot submit a sentence');
    }
    this.submissions.set(playerId, { sentence, playerId, playerName });
  }

  getAllSubmissions() {
    return Array.from(this.submissions.values());
  }

  nextRound() {
    this.currentRound++;
    this.submissions.clear();
    this.submissionDeadline = null;
    this.scribeDeadline = null;
    this.rotateScribe();
  }

  isComplete() {
    return this.currentRound > this.maxRounds;
  }

  allSubmitted() {
    return this.submissions.size === this.players.length - 1; // All except scribe
  }

  // Persist a finalized sentence for narrative
  addNarrativeEntry(sentence, tag) {
    this.narrative.push({ sentence, tag });
  }

  // Public state payload used for gameStarted and catch-up
  getPublicState() {
    return {
      currentRound: this.currentRound,
      phase: this.getPhase(),
      scribeId: this.scribeId,
      maxRounds: this.maxRounds,
      theme: this.theme,
      origin: this.origin,
      prompt: this.prompt,
      narrative: this.narrative
    };
  }
}

module.exports = GameState;