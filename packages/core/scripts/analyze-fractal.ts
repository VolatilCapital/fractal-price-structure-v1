#!/usr/bin/env npx tsx
/**
 * Fractal Structure Analysis Script
 *
 * Validates that the fractal structure is built correctly according to
 * the specification in docs/fractal-logic.md
 *
 * Usage: npx tsx scripts/analyze-fractal.ts [fixture-file]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FractalEngine } from '../src/index.js';
import type { Candle } from '../src/index.js';
import type { PriceMove } from '../src/domain/price-move/PriceMove.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ANSI colors
const C = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

interface ValidationResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string[];
}

interface AnalysisReport {
  summary: {
    totalMoves: number;
    uniqueMoves: number;
    activeMoves: number;
    closedMoves: number;
    generations: number;
    rootMoves: number;
    movesWithParent: number;
    movesWithChildren: number;
    maxChildren: number;
  };
  validations: ValidationResult[];
  issues: string[];
  passed: boolean;
}

/**
 * Analyze a fractal structure and return a detailed report
 */
function analyzeStructure(engine: FractalEngine): AnalysisReport {
  const allMoves = engine.getAllMoves();
  const activeMoves = engine.getActiveMoves();
  const layers = engine.getLayers();
  const stats = engine.getMemoryStats();

  const validations: ValidationResult[] = [];
  const issues: string[] = [];

  // Calculate summary
  const uniqueIds = new Set(allMoves.map(m => m.id.toString()));
  const rootMoves = allMoves.filter(m => !m.englobingMove);

  const summary = {
    totalMoves: allMoves.length,
    uniqueMoves: uniqueIds.size,
    activeMoves: activeMoves.length,
    closedMoves: stats.closedMoves,
    generations: stats.layerCount,
    rootMoves: rootMoves.length,
    movesWithParent: stats.movesWithParent,
    movesWithChildren: stats.movesWithChildren,
    maxChildren: stats.maxChildCount,
  };

  // Validation 1: No duplicate moves (by ID)
  const duplicateCheck = summary.totalMoves === summary.uniqueMoves;
  validations.push({
    name: 'No duplicate moves',
    passed: duplicateCheck,
    message: duplicateCheck
      ? `All ${summary.totalMoves} moves have unique IDs`
      : `Found ${summary.totalMoves - summary.uniqueMoves} duplicate IDs`,
  });
  if (!duplicateCheck) {
    issues.push('Duplicate move IDs detected');
  }

  // Validation 2: No duplicate children in childMoves arrays
  let duplicateChildrenCount = 0;
  const movesWithDuplicateChildren: string[] = [];
  for (const move of allMoves) {
    const childIds = move.childMoves.map(c => c.id.toString());
    const uniqueChildIds = new Set(childIds);
    if (childIds.length !== uniqueChildIds.size) {
      duplicateChildrenCount++;
      movesWithDuplicateChildren.push(
        `Move ${move.id.toString().slice(0, 8)} has ${childIds.length - uniqueChildIds.size} duplicate children`
      );
    }
  }
  validations.push({
    name: 'No duplicate children',
    passed: duplicateChildrenCount === 0,
    message: duplicateChildrenCount === 0
      ? 'No moves have duplicate children'
      : `${duplicateChildrenCount} moves have duplicate children`,
    details: movesWithDuplicateChildren.slice(0, 5),
  });
  if (duplicateChildrenCount > 0) {
    issues.push(`${duplicateChildrenCount} moves have duplicate entries in childMoves`);
  }

  // Validation 3: Bidirectional relationships
  let bidirectionalErrors = 0;
  const bidirectionalDetails: string[] = [];
  for (const move of allMoves) {
    // Check: if move has englobingMove, it should be in parent's childMoves
    if (move.englobingMove) {
      if (!move.englobingMove.childMoves.includes(move)) {
        bidirectionalErrors++;
        bidirectionalDetails.push(
          `Move ${move.id.toString().slice(0, 8)} has parent but not in parent's childMoves`
        );
      }
    }
    // Check: all children should reference this move as englobingMove
    for (const child of move.childMoves) {
      if (child.englobingMove !== move) {
        bidirectionalErrors++;
        bidirectionalDetails.push(
          `Move ${move.id.toString().slice(0, 8)} has child that doesn't reference it as parent`
        );
      }
    }
  }
  validations.push({
    name: 'Bidirectional relationships',
    passed: bidirectionalErrors === 0,
    message: bidirectionalErrors === 0
      ? 'All parent-child relationships are bidirectional'
      : `${bidirectionalErrors} relationship errors found`,
    details: bidirectionalDetails.slice(0, 5),
  });
  if (bidirectionalErrors > 0) {
    issues.push('Parent-child relationships are not bidirectional');
  }

  // Validation 4: Generation consistency
  let generationErrors = 0;
  const generationDetails: string[] = [];
  for (const move of allMoves) {
    if (move.englobingMove) {
      const expectedGen = move.englobingMove.generation + 1;
      if (move.generation !== expectedGen) {
        generationErrors++;
        generationDetails.push(
          `Move ${move.id.toString().slice(0, 8)}: gen=${move.generation}, expected=${expectedGen} (parent gen=${move.englobingMove.generation})`
        );
      }
    }
  }
  validations.push({
    name: 'Generation consistency',
    passed: generationErrors === 0,
    message: generationErrors === 0
      ? 'All children have generation = parent.generation + 1'
      : `${generationErrors} generation mismatches found`,
    details: generationDetails.slice(0, 5),
  });
  if (generationErrors > 0) {
    issues.push('Child generations are not parent.generation + 1');
  }

  // Validation 5: Multiple generations exist
  const hasHierarchy = summary.generations > 1;
  validations.push({
    name: 'Fractal hierarchy exists',
    passed: hasHierarchy,
    message: hasHierarchy
      ? `Structure has ${summary.generations} generations (depth)`
      : 'Structure is flat - only 1 generation',
  });
  if (!hasHierarchy) {
    issues.push('No fractal hierarchy - all moves are at generation 0');
  }

  // Validation 6: Reasonable number of roots
  const rootRatio = summary.rootMoves / summary.totalMoves;
  const reasonableRoots = rootRatio < 0.5; // Less than 50% should be roots
  validations.push({
    name: 'Reasonable root count',
    passed: reasonableRoots,
    message: `${summary.rootMoves} roots out of ${summary.totalMoves} moves (${(rootRatio * 100).toFixed(1)}%)`,
  });
  if (!reasonableRoots) {
    issues.push('Too many root moves - structure is not consolidating');
  }

  // Validation 7: Some moves have been closed (invalidation works)
  const hasClosedMoves = summary.closedMoves > 0;
  validations.push({
    name: 'Invalidation occurs',
    passed: hasClosedMoves,
    message: hasClosedMoves
      ? `${summary.closedMoves} moves have been closed/invalidated`
      : 'No moves have been closed - invalidation may not be working',
  });

  // Validation 8: Structure validation (built-in check)
  const structureValidation = engine.validate();
  validations.push({
    name: 'Internal structure validation',
    passed: structureValidation.valid,
    message: structureValidation.valid
      ? 'Engine validation passed'
      : `Engine validation failed with ${structureValidation.errors.length} errors`,
    details: structureValidation.errors.slice(0, 5),
  });
  if (!structureValidation.valid) {
    issues.push(...structureValidation.errors.slice(0, 3));
  }

  const passed = validations.every(v => v.passed);

  return { summary, validations, issues, passed };
}

/**
 * Print the analysis report to console
 */
function printReport(report: AnalysisReport): void {
  console.log('\n' + C.bold + '═'.repeat(70) + C.reset);
  console.log(C.bold + ' FRACTAL STRUCTURE ANALYSIS REPORT' + C.reset);
  console.log(C.bold + '═'.repeat(70) + C.reset);

  // Summary
  console.log('\n' + C.blue + C.bold + '📊 SUMMARY' + C.reset);
  console.log('─'.repeat(40));
  console.log(`  Total moves:        ${report.summary.totalMoves}`);
  console.log(`  Unique moves:       ${report.summary.uniqueMoves}`);
  console.log(`  Active moves:       ${report.summary.activeMoves}`);
  console.log(`  Closed moves:       ${report.summary.closedMoves}`);
  console.log(`  Generations:        ${report.summary.generations}`);
  console.log(`  Root moves:         ${report.summary.rootMoves}`);
  console.log(`  Moves with parent:  ${report.summary.movesWithParent}`);
  console.log(`  Moves with children:${report.summary.movesWithChildren}`);
  console.log(`  Max children:       ${report.summary.maxChildren}`);

  // Validations
  console.log('\n' + C.blue + C.bold + '✓ VALIDATIONS' + C.reset);
  console.log('─'.repeat(40));
  for (const v of report.validations) {
    const icon = v.passed ? C.green + '✓' : C.red + '✗';
    const color = v.passed ? C.green : C.red;
    console.log(`  ${icon} ${color}${v.name}${C.reset}`);
    console.log(`    ${C.dim}${v.message}${C.reset}`);
    if (v.details && v.details.length > 0) {
      for (const detail of v.details) {
        console.log(`    ${C.dim}  - ${detail}${C.reset}`);
      }
    }
  }

  // Issues
  if (report.issues.length > 0) {
    console.log('\n' + C.red + C.bold + '⚠ ISSUES FOUND' + C.reset);
    console.log('─'.repeat(40));
    for (const issue of report.issues) {
      console.log(`  ${C.red}• ${issue}${C.reset}`);
    }
  }

  // Final verdict
  console.log('\n' + '═'.repeat(70));
  if (report.passed) {
    console.log(C.green + C.bold + '  ✓ ALL VALIDATIONS PASSED' + C.reset);
  } else {
    const failedCount = report.validations.filter(v => !v.passed).length;
    console.log(C.red + C.bold + `  ✗ ${failedCount} VALIDATION(S) FAILED` + C.reset);
  }
  console.log('═'.repeat(70) + '\n');
}

async function main(): Promise<void> {
  // Get fixture file from args or use default
  const fixtureArg = process.argv[2];
  const fixturePath = fixtureArg
    ? path.resolve(fixtureArg)
    : path.join(__dirname, '../src/__fixtures__/btcusdt-1d.json');

  console.log(`\n${C.dim}Loading fixture: ${fixturePath}${C.reset}`);

  // Load candles
  let candles: Candle[];
  try {
    const content = await fs.readFile(fixturePath, 'utf-8');
    const data = JSON.parse(content);
    candles = data.candles || data;
  } catch (e) {
    console.error(`${C.red}Error loading fixture: ${e}${C.reset}`);
    process.exit(1);
  }

  console.log(`${C.dim}Loaded ${candles.length} candles${C.reset}`);

  // Build structure
  console.log(`${C.dim}Building fractal structure...${C.reset}`);
  const engine = new FractalEngine({ deterministic: true });
  engine.buildFromCandles(candles);

  // Analyze
  const report = analyzeStructure(engine);

  // Print report
  printReport(report);

  // Exit with appropriate code
  process.exit(report.passed ? 0 : 1);
}

main().catch(console.error);
