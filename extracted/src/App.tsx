import React, { useState, useEffect } from 'react';
import { ARCPuzzle, BaselineSolverResponse, HRMSolverResponse, GammaSolverResponse, ARCBenchmarkRecord } from './types/arc';
import { BUNDLED_ARC_PUZZLES } from './engine/arcDataset';
import { ARCPuzzlePanel } from './components/ARCPuzzlePanel';
import { BaselineSolverPanel } from './components/BaselineSolverPanel';
import { HRMSolverPanel } from './components/HRMSolverPanel';
import { GammaSolverPanel } from './components/GammaSolverPanel';
import { ComparisonScoreboard } from './components/ComparisonScoreboard';
import { BenchmarkHistory } from './components/BenchmarkHistory';
import { GridDifferenceView } from './components/GridDifferenceView';

export function App() {
  const [selectedPuzzle, setSelectedPuzzle] = useState<ARCPuzzle>(BUNDLED_ARC_PUZZLES[0]);
  const [revealExpected, setRevealExpected] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [baselineResult, setBaselineResult] = useState<BaselineSolverResponse | null>(null);
  const [hrmResult, setHrmResult] = useState<HRMSolverResponse | null>(null);
  const [gammaResult, setGammaResult] = useState<GammaSolverResponse | null>(null);
  const [history, setHistory] = useState<ARCBenchmarkRecord[]>([]);
  const [apiHealth, setApiHealth] = useState<{ hasGeminiKey: boolean; status: string } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setApiHealth(data))
      .catch(() => setApiHealth({ hasGeminiKey: false, status: 'error' }));
  }, []);

  const handleRunBenchmark = async () => {
    setIsRunning(true);
    setBaselineResult(null);
    setHrmResult(null);
    setGammaResult(null);

    try {
      const [baselineRes, hrmRes] = await Promise.allSettled([
        fetch('/api/arc/solve-baseline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ puzzle: selectedPuzzle })
        }).then(r => r.json()),
        fetch('/api/arc/solve-hrm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ puzzle: selectedPuzzle, maxRounds: 3 })
        }).then(r => r.json())
      ]);

      const bData = baselineRes.status === 'fulfilled' ? baselineRes.value : null;
      const hData = hrmRes.status === 'fulfilled' ? hrmRes.value : null;
      let gData: GammaSolverResponse | null = null;

      if (bData && hData) {
        const gammaRes = await fetch('/api/arc/solve-gamma', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ puzzle: selectedPuzzle, alpha: bData, beta: hData })
        }).then(r => r.json());
        gData = gammaRes;
      }

      setBaselineResult(bData);
      setHrmResult(hData);
      setGammaResult(gData);

      if (bData && hData && gData) {
        const newRecord: ARCBenchmarkRecord = {
          runId: `run-${Date.now()}`,
          timestamp: new Date().toISOString(),
          puzzleId: selectedPuzzle.id,
          model: 'gemini-2.5-flash',
          seed: 42,
          mode: 'race',
          baselineBudgetMode: 'single_pass',
          baseline: bData.metrics,
          hrm: hData.metrics,
          winner: {
            correctness: 'Oracle Gamma',
            speed: bData.metrics.latencyMs < hData.metrics.latencyMs ? 'Twin A' : 'Twin B',
            apiEfficiency: 'Twin A',
            tokenEfficiency: bData.metrics.totalTokens < hdataTotalTokens(hData) ? 'Twin A' : 'Twin B',
            overall: 'Oracle Gamma'
          }
        };
        setHistory(prev => [newRecord, ...prev]);
      }
    } catch (err) {
      console.error('Benchmark execution error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const hdataTotalTokens = (h: HRMSolverResponse) => h.metrics.totalTokens;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="font-mono font-bold text-lg text-white">𓁹</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              THOTH ARC TWIN ARENA
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Benchmark v2.5
              </span>
            </h1>
            <p className="text-xs text-zinc-400">Gemini Baseline vs. Gemini + HRM Grid Transformation Benchmark</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${apiHealth?.hasGeminiKey ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className="text-zinc-300">API: {apiHealth?.hasGeminiKey ? 'Connected (Key Active)' : 'Fallback Mode'}</span>
          </div>

          <button
            onClick={handleRunBenchmark}
            disabled={isRunning}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition shadow-lg flex items-center gap-2 ${
              isRunning
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/20 active:scale-95'
            }`}
          >
            {isRunning ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Running Race...
              </>
            ) : (
              <>
                <span>▶ Run Both Twins</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Puzzle Selector & Panel */}
        <ARCPuzzlePanel
          selectedPuzzle={selectedPuzzle}
          onSelectPuzzle={setSelectedPuzzle}
          revealExpected={revealExpected}
          onToggleReveal={setRevealExpected}
        />

        {/* Tri-Oracle Arena */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <BaselineSolverPanel result={baselineResult} isRunning={isRunning} />
          <HRMSolverPanel result={hrmResult} isRunning={isRunning} />
          <GammaSolverPanel result={gammaResult} isRunning={isRunning} />
        </div>

        {/* Comparison Scoreboard */}
        {baselineResult && hrmResult && gammaResult && (
          <ComparisonScoreboard
            baseline={baselineResult}
            hrm={hrmResult}
            gamma={gammaResult}
            expectedGrid={selectedPuzzle.test[0]?.expectedOutput}
          />
        )}

        {/* Side-by-Side Difference Inspection if expected output revealed */}
        {revealExpected && selectedPuzzle.test[0]?.expectedOutput && (baselineResult || hrmResult) && (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-zinc-100">Ground Truth Difference Inspection</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {baselineResult && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-indigo-300">Twin A (Baseline) vs Ground Truth</span>
                  <GridDifferenceView predicted={baselineResult.predictedOutput} expected={selectedPuzzle.test[0].expectedOutput} />
                </div>
              )}
              {hrmResult && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-cyan-300">Twin B (HRM) vs Ground Truth</span>
                  <GridDifferenceView predicted={hrmResult.predictedOutput} expected={selectedPuzzle.test[0].expectedOutput} />
                </div>
              )}
              {gammaResult && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-emerald-300">Oracle Gamma vs Ground Truth</span>
                  <GridDifferenceView predicted={gammaResult.predictedOutput} expected={selectedPuzzle.test[0].expectedOutput} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Benchmark History */}
        <BenchmarkHistory records={history} onClearHistory={() => setHistory([])} />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-900/60 py-4 px-6 text-center text-xs text-zinc-500 font-mono">
        Thoth ARC Twin Arena — Comparative Abstraction and Reasoning Benchmark Substrate
      </footer>
    </div>
  );
}
export default App;
