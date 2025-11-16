const POINTS = {
  VOTE_RECEIVED: 10,
  CONSISTENCY_BONUS: 25,
  SCRIBE_COMPLETION: 15
};

function calculateScores(votedSubmissions, chosenId, scribeId) {
  const scores = {};
  
  // Award points for votes received
  votedSubmissions.forEach(({ submissionId, votes }) => {
    scores[submissionId] = votes * POINTS.VOTE_RECEIVED;
    
    // Consistency bonus for chosen sentence
    if (submissionId === chosenId) {
      scores[submissionId] += POINTS.CONSISTENCY_BONUS;
    }
  });
  
  // Scribe completion bonus
  scores[scribeId] = (scores[scribeId] || 0) + POINTS.SCRIBE_COMPLETION;
  
  return scores;
}

module.exports = { calculateScores, POINTS };