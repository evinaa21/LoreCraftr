class GameState {
  constructor(roomId, players = []) {
    this.roomId = roomId;
    this.currentRound = 1;
    this.maxRounds = 15;
    this.phase = 'SETTING'; // SETTING (1-5), ACTION (6-10), CONSEQUENCE (11-15)
    this.submissions = new Map(); // playerId -> { sentence, playerId, playerName }
    this.votes = new Map(); // playerId -> votedSubmissionId
    this.scribeId = null;
    this.topVoted = []; // Top 2 sentences by votes
    this.players = players;
    // Persisted game metadata so late joiners can catch up
    this.theme = null;
    this.origin = null;   // { title, text }
    this.prompt = null;   // { text, category }
    this.narrative = [];  // [{ sentence, tag }]
    this.rotateScribe();
  }

  getPhase() {
    if (this.currentRound <= 5) return 'SETTING';
    if (this.currentRound <= 10) return 'ACTION';
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

  addVote(voterId, submissionId) {
    if (voterId === this.scribeId) {
      throw new Error('Scribe cannot vote');
    }
    if (voterId === submissionId) {
      throw new Error('Cannot vote for your own submission');
    }
    this.votes.set(voterId, submissionId);
  }

  calculateTopVoted() {
    const voteCounts = new Map();
    
    this.votes.forEach(votedId => {
      voteCounts.set(votedId, (voteCounts.get(votedId) || 0) + 1);
    });

    this.topVoted = Array.from(voteCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([submissionId, voteCount]) => ({
        submissionId,
        votes: voteCount,
        ...this.submissions.get(submissionId)
      }));

    return this.topVoted;
  }

  nextRound() {
    this.currentRound++;
    this.submissions.clear();
    this.votes.clear();
    this.topVoted = [];
    this.rotateScribe();
  }

  isComplete() {
    return this.currentRound > this.maxRounds;
  }

  canVote() {
    return this.submissions.size >= 2;
  }

  allSubmitted() {
    return this.submissions.size === this.players.length - 1; // All except scribe
  }

  allVoted() {
    return this.votes.size === this.players.length - 1; // All except scribe
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