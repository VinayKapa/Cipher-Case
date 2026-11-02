import test from 'node:test';
import assert from 'node:assert/strict';
import { action, createCase, createDemoCase, getCase, publicCase } from '../dist/cases.js';

const fixture={title:'The Bell at Blackthorn House',setting:'A storm-locked manor',opening:'A compass vanished during a blackout.',suspects:[{id:'mara',name:'Mara Venn',role:'Restorer',description:'A conservator.',motive:'A collection sale.',alibi:'She was in the studio.'},{id:'ellis',name:'Ellis Crowe',role:'Curator',description:'The night curator.',motive:'He owed money.',alibi:'He checked the generator.'},{id:'june',name:'June Ash',role:'Historian',description:'A visiting scholar.',motive:'She disputed ownership.',alibi:'She was in the library.'}],clues:[{id:'ledger',title:'Altered ledger',text:'The log was changed.',location:'Cellar',relevance:1},{id:'bell',title:'Silent bell',text:'The service bell was cut.',location:'Studio',relevance:.9},{id:'wax',title:'Blue wax',text:'Wax clung to the latch.',location:'Gallery',relevance:.8},{id:'mud',title:'Tide-line mud',text:'Mud marked the sill.',location:'Window',relevance:.7},{id:'thread',title:'Silver thread',text:'A thread caught on felt.',location:'Display',relevance:.5}],interviews:{mara:[{id:'mara-1',prompt:'Ask about the latch',response:'The wax is used in the studio.',next:['mara-2']},{id:'mara-2',prompt:'Ask about the outage',response:'The bell went quiet first.'}],ellis:[{id:'ellis-1',prompt:'Ask about the log',response:'I corrected it after the blackout.'},{id:'ellis-2',prompt:'Ask about the coat',response:'It caught on the display.'}],june:[{id:'june-1',prompt:'Ask about the clasp',response:'It opens at the north star.'}]},hints:['Review the timeline.','One record was changed.','Ellis changed the log and disabled the bell.'],solution:{culpritId:'ellis',motive:'His debts gave him a reason.',method:'He staged a blackout and altered the log.',explanation:'The ledger and bell show the curator prepared the blackout.',relevantLinks:['ledger:ellis','bell:ellis']}};
const generator=async()=>structuredClone(fixture);
async function newCase(){process.env.GEMINI_API_KEY='test-key';return createCase('A moonstone compass disappears during a storm','medium',generator);}

test('case answer remains private until accusation and a finished case is locked',async()=>{
  const game=await newCase();const safe=publicCase(game);assert.equal(safe.source,'gemini');assert.equal('solution' in safe,false);assert.equal('hints' in safe,false);
  await action(game.id,'discover',{clueId:'ledger'});await action(game.id,'interview',{suspectId:'ellis',questionId:'ellis-1'});
  const result=await action(game.id,'accuse',{suspectId:'ellis'});assert.equal(result.correct,true);assert.equal(result.case.phase,'complete');
  await assert.rejects(()=>action(game.id,'accuse',{suspectId:'mara'}),e=>e.status===409);assert.equal((await getCase(game.id)).solution.culpritId,'ellis');
});

test('Gemini generation is required when no API key is configured',async()=>{
  delete process.env.GEMINI_API_KEY;await assert.rejects(()=>createCase('A moonstone compass disappears during a storm','easy',generator),e=>e.status===503);
});

test('the explicitly requested demo works without Gemini and keeps its solution private',async()=>{
  delete process.env.GEMINI_API_KEY;const game=await createDemoCase();assert.equal(game.source,'demo');const safe=publicCase(game);assert.equal(safe.source,'demo');assert.equal('solution' in safe,false);
});

test('invalid Gemini output gets a correction attempt and still returns Gemini output only',async()=>{
  process.env.GEMINI_API_KEY='test-key';let calls=0;const repairing=async(_premise,_difficulty,correction)=>{calls++;if(calls===1)throw new Error('Schema validation failed: clues count');assert.match(correction,/clues count/);return structuredClone(fixture)};
  const game=await createCase('A moonstone compass disappears during a storm','easy',repairing);assert.equal(calls,2);assert.equal(game.source,'gemini');
});

test('a failed Gemini request returns an error rather than a replacement story',async()=>{
  process.env.GEMINI_API_KEY='test-key';let calls=0;await assert.rejects(()=>createCase('A moonstone compass disappears during a storm','easy',async()=>{calls++;throw Object.assign(new Error('503 UNAVAILABLE'),{status:503})}),e=>e.status===503&&/Gemini is busy/.test(e.message));assert.equal(calls,2);
});

test('branching follow-up cannot be asked before its parent',async()=>{
  const game=await newCase();await assert.rejects(()=>action(game.id,'interview',{suspectId:'mara',questionId:'mara-2'}),e=>e.status===400);
  const first=await action(game.id,'interview',{suspectId:'mara',questionId:'mara-1'});assert.equal(first.choices.some(x=>x.id==='mara-2'),true);
});

test('simultaneous accusations can only finalize the case once',async()=>{
  const game=await newCase();const attempts=await Promise.allSettled([action(game.id,'accuse',{suspectId:'ellis'}),action(game.id,'accuse',{suspectId:'mara'})]);
  assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1);assert.equal(attempts.filter(x=>x.status==='rejected').length,1);
});
