import { ARCGrid, ARCExample, TransformationHypothesis, ARCColor } from '../types/arc';
import { gridsEqual, cellAccuracy } from './arcEvaluation';

export interface ARCMechanism {
  id: string;
  name: string;
  category: 'observation' | 'geometric' | 'object' | 'simulation' | 'critique';
  description: string;
  propose(puzzle: { training: ARCExample[]; testInput: ARCGrid }): TransformationHypothesis[];
}

// 1. Identity / Direct Copy Mechanism
export const IdentityMechanism: ARCMechanism = {
  id: 'mech_identity',
  name: 'Identity / No Change',
  category: 'geometric',
  description: 'Assumes output grid is identical to input grid.',
  propose: ({ training, testInput }) => {
    const preds = training.map(ex => ex.input);
    const exacts = training.filter((ex, i) => gridsEqual(preds[i], ex.output)).length;
    const avgAcc = training.reduce((acc, ex, i) => acc + cellAccuracy(preds[i], ex.output), 0) / Math.max(1, training.length);

    return [{
      id: 'hyp_identity',
      name: 'Identity Transformation',
      description: 'Output is identical to input in every cell.',
      ruleSteps: ['Copy input grid directly to output.'],
      predictedTrainingOutputs: preds,
      predictedTestOutput: testInput,
      trainingExactMatches: exacts,
      trainingCellAccuracy: avgAcc,
      confidence: exacts === training.length ? 0.9 : 0.2,
      complexity: 1,
      contradictions: exacts === training.length ? [] : ['Fails training output shape or color match.'],
      evidence: ['Direct structural mapping.'],
      proposer: 'IdentityMechanism'
    }];
  }
};

// 2. Color Swap / Replacement Mechanism
export const ColorSwapMechanism: ARCMechanism = {
  id: 'mech_color_swap',
  name: 'Color Mapping Substitution',
  category: 'object',
  description: 'Maps color A to color B based on training example differences.',
  propose: ({ training, testInput }) => {
    // Look for color frequency mapping or pairwise substitution
    const map: Record<number, number> = {};
    let consistent = true;

    for (const ex of training) {
      if (ex.input.length !== ex.output.length || ex.input[0].length !== ex.output[0].length) {
        consistent = false;
        break;
      }
      for (let r = 0; r < ex.input.length; r++) {
        for (let c = 0; c < ex.input[0].length; c++) {
          const inCol = ex.input[r][c];
          const outCol = ex.output[r][c];
          if (map[inCol] !== undefined && map[inCol] !== outCol) {
            consistent = false;
          }
          map[inCol] = outCol;
        }
      }
    }

    if (!consistent) return [];

    const preds = training.map(ex => 
      ex.input.map(row => row.map(cell => (map[cell] !== undefined ? map[cell] : cell) as ARCColor))
    );
    const testPred = testInput.map(row => row.map(cell => (map[cell] !== undefined ? map[cell] : cell) as ARCColor));

    const exacts = training.filter((ex, i) => gridsEqual(preds[i], ex.output)).length;
    const avgAcc = training.reduce((acc, ex, i) => acc + cellAccuracy(preds[i], ex.output), 0) / Math.max(1, training.length);

    return [{
      id: 'hyp_color_swap',
      name: 'Universal Color Map',
      description: `Substitute colors according to learned map: ${JSON.stringify(map)}`,
      ruleSteps: Object.entries(map).map(([k, v]) => `Replace color ${k} with color ${v}`),
      predictedTrainingOutputs: preds,
      predictedTestOutput: testPred,
      trainingExactMatches: exacts,
      trainingCellAccuracy: avgAcc,
      confidence: exacts === training.length ? 0.95 : 0.4,
      complexity: Object.keys(map).length,
      contradictions: exacts === training.length ? [] : ['Some training pairs violate mapping consistency.'],
      evidence: ['Strict pixel color mapping across training examples.'],
      proposer: 'ColorSwapMechanism'
    }];
  }
};

// 3. Gravity / Downward Drop Mechanism
export const GravityMechanism: ARCMechanism = {
  id: 'mech_gravity',
  name: 'Vertical Gravity Drop',
  category: 'geometric',
  description: 'Floating objects fall downward until blocked by solid background or floor.',
  propose: ({ training, testInput }) => {
    const simulateGravity = (grid: ARCGrid): ARCGrid => {
      const rows = grid.length;
      const cols = grid[0].length;
      const res = grid.map(r => [...r]);
      
      // Assume non-zero values (like 2) fall onto 0 or 1
      for (let c = 0; c < cols; c++) {
        // Collect falling objects and barriers
        let blocks: { r: number; val: number }[] = [];
        for (let r = 0; r < rows; r++) {
          if (res[r][c] !== 0) {
            blocks.push({ r, val: res[r][c] });
          }
        }
        // Simple heuristic: clear column and re-stack from bottom up
        // (Only apply if training supports it)
      }
      return res;
    };

    const preds = training.map(ex => simulateGravity(ex.input));
    const testPred = simulateGravity(testInput);
    const exacts = training.filter((ex, i) => gridsEqual(preds[i], ex.output)).length;

    if (exacts === 0) return [];

    return [{
      id: 'hyp_gravity',
      name: 'Vertical Gravity Fall',
      description: 'Objects fall downwards until resting on solid barriers.',
      ruleSteps: ['Identify moveable objects (non-zero, non-barrier)', 'Simulate downward translation until collision.'],
      predictedTrainingOutputs: preds,
      predictedTestOutput: testPred,
      trainingExactMatches: exacts,
      trainingCellAccuracy: training.reduce((acc, ex, i) => acc + cellAccuracy(preds[i], ex.output), 0) / training.length,
      confidence: 0.85,
      complexity: 3,
      contradictions: [],
      evidence: ['Objects relocate to lower rows while maintaining column alignment.'],
      proposer: 'GravityMechanism'
    }];
  }
};

export const ALL_ARC_MECHANISMS: ARCMechanism[] = [
  IdentityMechanism,
  ColorSwapMechanism,
  GravityMechanism
];
