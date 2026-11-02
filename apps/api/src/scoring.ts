import type { PrivateCase } from '@ciphercase/shared';

export function calculateScore(game: PrivateCase, suspectId: string) {
  const correct = suspectId === game.solution.culpritId;
  const diff = { easy: 1, medium: 1.15, hard: 1.3 }[game.difficulty];
  const base = correct ? 60 : 0;
  const discovered = Math.min(20, game.discoveredClueIds.reduce((sum, id) => sum + (game.clues.find(c => c.id === id)?.relevance ?? 0) * 4, 0));
  const validLinks = game.links.filter(link => game.solution.relevantLinks.includes(`${link.clueId}:${link.suspectId}`)).length;
  const evidence = Math.min(10, validLinks * 5);
  const interviews = Math.min(10, Object.values(game.interviews).reduce((n, questions) => n + questions.filter(q => game.journal.some(j => j.kind === 'interview' && j.id === q.id)).length, 0) * 2);
  const multiplied = Math.round((base + discovered + evidence + interviews) * diff);
  const hintPenalty = [0, 5, 15, 30][game.hintsUsed] ?? 30;
  const wrongPenalty = correct ? 0 : 15;
  const total = Math.max(0, Math.min(100, multiplied - hintPenalty - wrongPenalty));
  return { total, breakdown: { correctAccusation: base, clues: Math.round(discovered), evidenceLinks: evidence, interviews, difficultyMultiplier: diff, beforePenalties: multiplied, hintPenalty: -hintPenalty, incorrectAccusationPenalty: -wrongPenalty } };
}
