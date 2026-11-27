import test from 'node:test';
import assert from 'node:assert/strict';
import {
  areFormulasEquivalent,
  generateTruthTable,
} from './propositionalLogic';

test('evaluates implication p -> q truth table correctly', () => {
  const result = generateTruthTable('p -> q');
  assert.equal(result.normalizedFormula, 'p → q');
  assert.deepEqual(result.variables, ['p', 'q']);
  assert.equal(result.totalRows, 4);
  assert.equal(result.trueCount, 3);
  assert.equal(result.classification, 'Contingência');
  // Order: VV (V), VF (F), FV (V), FF (V)
  assert.deepEqual(
    result.rows.map((r) => r.result),
    [true, false, true, true]
  );
});

test('identifies tautology (Excluded Middle and Modus Ponens)', () => {
  const excludedMiddle = generateTruthTable('p ∨ ¬p');
  assert.equal(excludedMiddle.classification, 'Tautologia');
  assert.equal(excludedMiddle.trueCount, 2);

  const modusPonens = generateTruthTable('((p → q) ∧ p) → q');
  assert.equal(modusPonens.classification, 'Tautologia');
  assert.equal(modusPonens.trueCount, 4);
});

test('identifies contradiction p ∧ ¬p', () => {
  const contradiction = generateTruthTable('p & ~p');
  assert.equal(contradiction.classification, 'Contradição');
  assert.equal(contradiction.trueCount, 0);
});

test('verifies De Morgan and contrapositive equivalences', () => {
  assert.equal(areFormulasEquivalent('¬(p ∧ q)', '¬p ∨ ¬q'), true);
  assert.equal(areFormulasEquivalent('p → q', '¬q → ¬p'), true);
  assert.equal(areFormulasEquivalent('p → q', 'q → p'), false);
});

test('throws descriptive Portuguese error on malformed formulas', () => {
  assert.throws(() => generateTruthTable(''), /Digite uma fórmula/);
  assert.throws(() => generateTruthTable('(p ∧ q'), /Parêntese/);
  assert.throws(() => generateTruthTable('p ∧ z'), /Símbolo não reconhecido/);
});
