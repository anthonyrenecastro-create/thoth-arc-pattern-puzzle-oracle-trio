import React from 'react';
import { BaselineSolverResponse } from '../types/arc';
import { ARCGridView } from './ARCGridView';

interface BaselineSolverPanelProps {
  result: BaselineSolverResponse | null;
  isRunning: boolean;
}

export const BaselineSolverPanel: React.FC<BaselineSolverPanelProps> = ({ result, isRunning }) => {
  return (
    <div className="bg-zinc-900/90 border border-indigo-500/30 rounded-2xl p-5 shadow-xl shadow-indigo-500/5 flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Twin A — Baseline
          </span>
          <h3 className="text-base font-bold text-zinc-100 mt-1">Gemini Baseline Solver</h3>
        </div>
        <div className="flex items-center gap-2">
          {isRunning ? (
            <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              Solving...
            </span>
          ) : result ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Completed
            </span>
          ) : (
            <span className="text-xs text-zinc-500 font-medium">Ready</span>
          )}
        </div>
      </div>

      {isRunning ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-zinc-400 font-mono">Gemini single-pass inference running...</p>
        </div>
      ) : result ? (
        <div className="space-y-4">
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3 flex flex-col items-center">
            <span className="text-xs font-medium text-zinc-400 mb-2">Predicted Test Grid</span>
            <ARCGridView grid={result.predictedOutput} size="lg" />
          </div>

          <div className="space-y-2 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/80">
            <div className="text-xs font-semibold text-indigo-300">Rule Summary</div>
            <p className="text-xs text-zinc-300 leading-relaxed">{result.ruleSummary}</p>
          </div>

          {result.reasoningSteps && result.reasoningSteps.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">Reasoning Steps</span>
              <ul className="text-xs text-zinc-400 space-y-1 pl-4 list-disc font-mono">
                {result.reasoningSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800 text-center">
            <div className="bg-zinc-950/50 p-2 rounded-lg border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block">Latency</span>
              <span className="text-xs font-mono font-semibold text-zinc-200">{result.metrics.latencyMs || 0} ms</span>
            </div>
            <div className="bg-zinc-950/50 p-2 rounded-lg border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block">API Calls</span>
              <span className="text-xs font-mono font-semibold text-zinc-200">{result.metrics.apiCalls}</span>
            </div>
            <div className="bg-zinc-950/50 p-2 rounded-lg border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block">Tokens</span>
              <span className="text-xs font-mono font-semibold text-zinc-200">{result.metrics.totalTokens}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 flex flex-col items-center justify-center text-center text-zinc-500 space-y-2">
          <p className="text-xs">Run the benchmark to generate Twin A baseline predictions.</p>
        </div>
      )}
    </div>
  );
};
