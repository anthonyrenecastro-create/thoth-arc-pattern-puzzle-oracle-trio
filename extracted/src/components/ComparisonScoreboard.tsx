import React from 'react';
import { BaselineSolverResponse, HRMSolverResponse, GammaSolverResponse, ARCGrid } from '../types/arc';
import { gridsEqual, cellAccuracy } from '../engine/arcEvaluation';

interface ComparisonScoreboardProps {
  baseline: BaselineSolverResponse | null;
  hrm: HRMSolverResponse | null;
  gamma: GammaSolverResponse | null;
  expectedGrid?: ARCGrid;
}

export const ComparisonScoreboard: React.FC<ComparisonScoreboardProps> = ({
  baseline,
  hrm,
  gamma,
  expectedGrid
}) => {
  if (!baseline || !hrm || !gamma) return null;

  const bExact = expectedGrid ? gridsEqual(baseline.predictedOutput, expectedGrid) : null;
  const hExact = expectedGrid ? gridsEqual(hrm.predictedOutput, expectedGrid) : null;
  const gExact = expectedGrid ? gridsEqual(gamma.predictedOutput, expectedGrid) : null;

  const bAcc = expectedGrid ? cellAccuracy(baseline.predictedOutput, expectedGrid) : 100;
  const hAcc = expectedGrid ? cellAccuracy(hrm.predictedOutput, expectedGrid) : 100;
  const gAcc = expectedGrid ? cellAccuracy(gamma.predictedOutput, expectedGrid) : 100;

  const speedWinner = baseline.metrics.latencyMs! < hrm.metrics.latencyMs! ? 'Twin A (Baseline)' : 'Twin B (HRM)';
  const tokenWinner = baseline.metrics.totalTokens < hrm.metrics.totalTokens ? 'Twin A (Baseline)' : 'Twin B (HRM)';

  let correctnessWinner = 'Tie';
  if (bExact !== null && hExact !== null && gExact !== null) {
    if (gExact && !(bExact || hExact)) correctnessWinner = 'Oracle Gamma';
    else if (bExact && !hExact && !gExact) correctnessWinner = 'Twin A (Baseline)';
    else if (hExact && !bExact && !gExact) correctnessWinner = 'Twin B (HRM)';
    else if (gAcc > Math.max(bAcc, hAcc)) correctnessWinner = 'Oracle Gamma';
    else if (bAcc > Math.max(hAcc, gAcc)) correctnessWinner = 'Twin A (Baseline)';
    else if (hAcc > Math.max(bAcc, gAcc)) correctnessWinner = 'Twin B (HRM)';
  }

  const overallWinner = gExact && (!bExact || !hExact)
    ? 'Oracle Gamma'
    : bExact && !gExact ? 'Twin A (Baseline)' : hExact && !gExact ? 'Twin B (HRM)' : gAcc >= Math.max(bAcc, hAcc) ? 'Oracle Gamma' : hAcc >= Math.max(bAcc, gAcc) ? 'Twin B (HRM)' : 'Twin A (Baseline)';

  return (
    <div className="bg-zinc-900/95 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Benchmark Comparison & Scoreboard
        </h3>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
          Winner: {overallWinner}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono text-zinc-500">Correctness Winner</span>
          <span className="text-sm font-bold text-cyan-300 mt-1">{correctnessWinner}</span>
          <span className="text-[10px] text-zinc-400 mt-1">
            {expectedGrid ? (gExact ? 'Gamma Exact Match' : 'Cell Accuracy Evaluated') : 'Unverified (No Ground Truth)'}
          </span>
        </div>

        <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono text-zinc-500">Speed Winner</span>
          <span className="text-sm font-bold text-indigo-300 mt-1">{speedWinner}</span>
          <span className="text-[10px] text-zinc-400 mt-1">
            A: {baseline.metrics.latencyMs}ms vs B: {hrm.metrics.latencyMs}ms
          </span>
        </div>

        <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono text-zinc-500">Token Efficiency</span>
          <span className="text-sm font-bold text-amber-300 mt-1">{tokenWinner}</span>
          <span className="text-[10px] text-zinc-400 mt-1">
            A: {baseline.metrics.totalTokens}t vs B: {hrm.metrics.totalTokens}t
          </span>
        </div>

        <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono text-zinc-500">Reasoning Rounds</span>
          <span className="text-sm font-bold text-emerald-300 mt-1">Oracle Gamma ({gamma.metrics.reasoningRounds} Rounds)</span>
          <span className="text-[10px] text-zinc-400 mt-1">Gamma final analyst synthesis</span>
        </div>
      </div>
    </div>
  );
};
