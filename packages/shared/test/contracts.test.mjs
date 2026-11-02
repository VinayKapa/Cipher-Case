import test from 'node:test';
import assert from 'node:assert/strict';
import { CreateCaseSchema, CasePublicSchema } from '../dist/index.js';

test('creation contract accepts a bounded premise and known difficulty',()=>{
  assert.equal(CreateCaseSchema.safeParse({premise:'A locked observatory after midnight',difficulty:'hard'}).success,true);
  assert.equal(CreateCaseSchema.safeParse({premise:'too short',difficulty:'hard'}).success,false);
  assert.equal(CreateCaseSchema.safeParse({premise:'A locked observatory after midnight',difficulty:'impossible'}).success,false);
});

test('public case contract rejects a DTO that contains a private solution',()=>{
  const dto={id:'case',shareCode:'ABC123',source:'gemini',title:'Test',setting:'At night',opening:'A test.',difficulty:'easy',suspects:[],clues:[],interviews:{},hintsUsed:0,hintsRemaining:3,discoveredClueIds:[],links:[],journal:[],notes:'',phase:'investigating',solution:{culpritId:'x'}};
  assert.equal(CasePublicSchema.safeParse(dto).success,true); // Zod strips unknown private fields at the API boundary.
  assert.equal('solution' in CasePublicSchema.parse(dto),false);
});
