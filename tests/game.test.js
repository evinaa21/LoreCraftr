const { calculateScores, POINTS } = require('../utils/scoring');

describe('Scoring System', () => {
  test('awards scribe completion bonus', () => {
    const scores = calculateScores([], null, 'scribe1');
    
    expect(scores.scribe1).toBe(POINTS.SCRIBE_COMPLETION);
  });

  test('awards chosen bonus to selected submission', () => {
    const scores = calculateScores([], 'player1', 'scribe1');
    
    expect(scores.player1).toBe(POINTS.CHOSEN_BONUS);
    expect(scores.scribe1).toBe(POINTS.SCRIBE_COMPLETION);
  });
});

describe('GameState', () => {
  const GameState = require('../models/GameState');

  test('initializes with correct defaults', () => {
    const players = [
      { id: 'p1', name: 'Player 1' },
      { id: 'p2', name: 'Player 2' }
    ];
    
    const game = new GameState('room1', players);
    
    expect(game.currentRound).toBe(1);
    expect(game.maxRounds).toBe(10);
    expect(game.phase).toBe('SETTING');
    expect(game.getPhase()).toBe('SETTING');
  });

  test('calculates phase correctly for 10 rounds', () => {
    const players = [{ id: 'p1', name: 'Player 1' }];
    const game = new GameState('room1', players);
    
    // SETTING: rounds 1-3
    game.currentRound = 1;
    expect(game.getPhase()).toBe('SETTING');
    game.currentRound = 3;
    expect(game.getPhase()).toBe('SETTING');
    
    // ACTION: rounds 4-7
    game.currentRound = 4;
    expect(game.getPhase()).toBe('ACTION');
    game.currentRound = 7;
    expect(game.getPhase()).toBe('ACTION');
    
    // CONSEQUENCE: rounds 8-10
    game.currentRound = 8;
    expect(game.getPhase()).toBe('CONSEQUENCE');
    game.currentRound = 10;
    expect(game.getPhase()).toBe('CONSEQUENCE');
  });

  test('rotates scribe correctly', () => {
    const players = [
      { id: 'p1', name: 'Player 1' },
      { id: 'p2', name: 'Player 2' },
      { id: 'p3', name: 'Player 3' }
    ];
    
    const game = new GameState('room1', players);
    const firstScribe = game.scribeId;
    
    game.rotateScribe();
    const secondScribe = game.scribeId;
    
    expect(secondScribe).not.toBe(firstScribe);
    
    game.rotateScribe();
    const thirdScribe = game.scribeId;
    
    expect(thirdScribe).not.toBe(secondScribe);
    expect(thirdScribe).not.toBe(firstScribe);
  });

  test('prevents scribe from submitting', () => {
    const players = [
      { id: 'p1', name: 'Player 1' },
      { id: 'p2', name: 'Player 2' }
    ];
    
    const game = new GameState('room1', players);
    
    expect(() => {
      game.addSubmission(game.scribeId, 'test sentence', 'Scribe');
    }).toThrow('Scribe cannot submit a sentence');
  });

  test('tracks all submissions correctly', () => {
    const players = [
      { id: 'p1', name: 'Player 1' },
      { id: 'p2', name: 'Player 2' },
      { id: 'p3', name: 'Player 3' }
    ];
    
    const game = new GameState('room1', players);
    
    // p1 is scribe, p2 and p3 can submit
    const nonScribeId = game.players.find(id => id !== game.scribeId);
    game.addSubmission(nonScribeId, 'First sentence', 'Player');
    
    expect(game.allSubmitted()).toBe(false);
    
    const submissions = game.getAllSubmissions();
    expect(submissions.length).toBe(1);
  });
});
