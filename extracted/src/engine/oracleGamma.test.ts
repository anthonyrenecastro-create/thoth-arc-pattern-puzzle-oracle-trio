import test from 'node:test';
import assert from 'node:assert/strict';
import { synthesizeGammaPrediction } from './oracleGamma.js';

test('synthesizeGammaPrediction merges alpha and beta grids into a final analyst verdict', () => {
  const puzzle = {
    id: 'p-test',
    name: 'Consensus test',
    description: 'Test tri-oracle synthesis',
    training: [{ input: [[1]], output: [[2]] }],
    test: [{ input: [[3]] }],
  };

  const alpha = {
    solverType: 'gemini_baseline' as const,
    puzzleId: puzzle.id,
    predictedOutput: [[1]],
    ruleSummary: 'Copy input',
    reasoningSteps: ['copy'],
    confidence: 0.7,
    metrics: {
      startedAt: 0,
      completedAt: 1,
      latencyMs: 10,
      apiCalls: 1,
      reasoningRounds: 1,
      inputTokens: 10,
      outputTokens: 10,
      totalTokens: 20,
      hypothesesGenerated: 1,
      hypothesesRejected: 0,
      revisions: 0,
      trainingExactMatch: true,
      validGrid: true,
    },
  };

  const beta = {
    solverType: 'gemini_hrm' as const,
    puzzleId: puzzle.id,
    predictedOutput: [[2]],
    committedHypothesis: undefined,
    hypothesesLedger: [],
    reasoningRounds: 1,
    metrics: {
      startedAt: 0,
      completedAt: 1,
      latencyMs: 12,
      apiCalls: 1,
      reasoningRounds: 1,
      inputTokens: 10,
      outputTokens: 12,
      totalTokens: 22,
      hypothesesGenerated: 1,
      hypothesesRejected: 0,
      revisions: 0,
      trainingExactMatch: true,
      validGrid: true,
    },
  };

  const result = synthesizeGammaPrediction(puzzle, alpha, beta);

  assert.equal(result.solverType, 'gemini_gamma');
  assert.deepEqual(result.predictedOutput, [[2]]);
  assert.match(result.analystSummary, /Oracle Gamma/i);
  assert.ok(result.reasoningSteps.length > 0);
});
