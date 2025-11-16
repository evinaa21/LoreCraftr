const POINTS = {
  CHOSEN_BONUS: 50, // Points for having your sentence chosen by scribe
  SCRIBE_COMPLETION: 15 // Points for completing scribe duties
};

function calculateScores(votedSubmissions, chosenId, scribeId) {
  const scores = {};
  
  // Award points to chosen submission winner
  if (chosenId) {
    scores[chosenId] = POINTS.CHOSEN_BONUS;
  }
  
  // Scribe completion bonus
  scores[scribeId] = (scores[scribeId] || 0) + POINTS.SCRIBE_COMPLETION;
  
  return scores;
}

module.exports = { calculateScores, POINTS };