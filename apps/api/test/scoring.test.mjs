import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateScore } from '../dist/scoring.js';

function game(overrides={}) { return {difficulty:'easy',clues:[{id:'c1',relevance:1},{id:'c2',relevance:1},{id:'c3',relevance:1},{id:'c4',relevance:1},{id:'c5',relevance:1},{id:'c6',relevance:1}],discoveredClueIds:[],links:[],interviews:{},journal:[],hintsUsed:0,solution:{culpritId:'s1',relevantLinks:[]},...overrides}; }

test('correct accusation earns the base and investigation points',()=>{const score=calculateScore(game({discoveredClueIds:['c1','c2']}),'s1');assert.equal(score.total,68);});
test('difficulty multiplier applies to earned points and final score is capped',()=>{const score=calculateScore(game({difficulty:'hard',discoveredClueIds:['c1','c2','c3','c4','c5','c6']}),'s1');assert.equal(score.total,100);assert.equal(score.breakdown.difficultyMultiplier,1.3);});
test('hint penalties accumulate and apply after the multiplier',()=>{const score=calculateScore(game({discoveredClueIds:['c1'],hintsUsed:2}),'s1');assert.equal(score.breakdown.hintPenalty,-15);assert.equal(score.total,49);});
test('wrong accusation loses base points and incurs penalty',()=>{const score=calculateScore(game({difficulty:'medium',discoveredClueIds:['c1','c2']}),'s2');assert.equal(score.breakdown.incorrectAccusationPenalty,-15);assert.equal(score.total,0);});
test('matching evidence links earn capped link points',()=>{const score=calculateScore(game({links:[{clueId:'c1',suspectId:'s1'},{clueId:'c2',suspectId:'s1'},{clueId:'c3',suspectId:'s1'}],solution:{culpritId:'s1',relevantLinks:['c1:s1','c2:s1','c3:s1']}}),'s1');assert.equal(score.breakdown.evidenceLinks,10);});
