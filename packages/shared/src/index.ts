import { z } from 'zod';

export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);
export const CreateCaseSchema = z.object({ premise: z.string().trim().min(20).max(500), difficulty: DifficultySchema });
export const SuspectSchema = z.object({ id: z.string(), name: z.string(), role: z.string(), description: z.string(), motive: z.string(), alibi: z.string() });
export const ClueSchema = z.object({ id: z.string(), title: z.string(), text: z.string(), location: z.string(), relevance: z.number().min(0).max(1) });
export const QuestionSchema = z.object({ id: z.string(), prompt: z.string(), response: z.string(), next: z.array(z.string()).default([]) });
export const CasePublicSchema = z.object({ id: z.string(), shareCode: z.string(), source: z.enum(['gemini','demo']), title: z.string(), setting: z.string(), opening: z.string(), difficulty: DifficultySchema, suspects: z.array(SuspectSchema), clues: z.array(ClueSchema), interviews: z.record(z.string(),z.array(QuestionSchema)), hintsUsed: z.number(), hintsRemaining: z.number(), discoveredClueIds: z.array(z.string()), links: z.array(z.object({ clueId: z.string(), suspectId: z.string() })), journal: z.array(z.object({ id: z.string(), text: z.string(), at: z.string(), kind: z.string() })), notes: z.string(), phase: z.enum(['investigating', 'complete']) });
export type Difficulty = z.infer<typeof DifficultySchema>;
export type CasePublic = z.infer<typeof CasePublicSchema>;
export type PrivateCase = CasePublic & { solution: { culpritId: string; motive: string; method: string; explanation: string; relevantLinks: string[] }; hints: string[]; score: null | { total: number; breakdown: Record<string, number> }; accusation: string | null };
