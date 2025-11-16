const { calculateScores, POINTS } = require('../utils/scoring');

describe('Scoring System', () => {
  test('calculates vote points correctly', () => {
    const voteTally = [
      { submissionId: 'player1', votes: 3 },
      { submissionId: 'player2', votes: 2 }
    ];
    
    const scores = calculateScores(voteTally, 'player1', 'scribe1');
    
    expect(scores.player1).toBe(30 + 25); // 3 votes * 10 + consistency bonus
    expect(scores.player2).toBe(20); // 2 votes * 10
    expect(scores.scribe1).toBe(15); // scribe completion bonus
  });

  test('awards consistency bonus to chosen sentence', () => {
    const voteTally = [
      { submissionId: 'player1', votes: 2 }
    ];
    
    const scores = calculateScores(voteTally, 'player1', 'scribe1');
    
    expect(scores.player1).toBe(20 + 25); // votes + consistency
  });

  test('awards scribe completion bonus', () => {
    const voteTally = [
      { submissionId: 'player1', votes: 1 }
    ];
    
    const scores = calculateScores(voteTally, 'player1', 'scribe1');
    
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
    expect(game.maxRounds).toBe(15);
    expect(game.phase).toBe('SETTING');
    expect(game.getPhase()).toBe('SETTING');
  });

  test('calculates phase correctly', () => {
    const players = [{ id: 'p1', name: 'Player 1' }];
    const game = new GameState('room1', players);
    
    game.currentRound = 1;
    expect(game.getPhase()).toBe('SETTING');
    
    game.currentRound = 5;
    expect(game.getPhase()).toBe('SETTING');
    
    game.currentRound = 6;
    expect(game.getPhase()).toBe('ACTION');
    
    game.currentRound = 10;
    expect(game.getPhase()).toBe('ACTION');
    
    game.currentRound = 11;
    expect(game.getPhase()).toBe('CONSEQUENCE');
    
    game.currentRound = 15;
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

  test('prevents voting for own submission', () => {
    const players = [
      { id: 'p1', name: 'Player 1' },
      { id: 'p2', name: 'Player 2' }
    ];
    
    const game = new GameState('room1', players);
    
    expect(() => {
      game.addVote('p1', 'p1');
    }).toThrow('Cannot vote for your own submission');
  });
});
