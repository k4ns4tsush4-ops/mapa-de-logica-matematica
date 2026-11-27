import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeConceptMap,
  computeEdgeGeometry,
  extractPropositions,
  findOpenNodePosition,
  serializeMapToSvg,
  validateEdgeInput,
  validateNodeInput,
  ConceptNode,
  ConceptEdge,
} from './conceptMapModel';
import { LOGIC_PRESETS } from '../data/logicPresets';

test('finds collision-free open position for new concepts', () => {
  const nodes = LOGIC_PRESETS[2].nodes;
  const pos = findOpenNodePosition(nodes);
  const collides = nodes.some(
    (n) => Math.abs(n.x - pos.x) < 185 && Math.abs(n.y - pos.y) < 84
  );
  assert.equal(collides, false);
});

test('extracts semantic propositions and detects cross-links', () => {
  const nodes: ConceptNode[] = [
    { id: 'n1', label: 'Proposição', category: 'fundamento', x: 100, y: 100, definition: 'def' },
    { id: 'n2', label: 'Tabela-Verdade', category: 'semantica', x: 400, y: 100, definition: 'def' },
    { id: 'n3', label: 'Isolado', category: 'inferencia', x: 400, y: 300, definition: 'def' },
  ];
  const edges: ConceptEdge[] = [
    { id: 'e1', sourceId: 'n1', targetId: 'n2', linkingPhrase: 'é avaliada na', isCrossLink: true },
  ];

  const props = extractPropositions(nodes, edges);
  assert.equal(props.length, 1);
  assert.equal(props[0].sentence, 'Proposição é avaliada na Tabela-Verdade.');
  assert.equal(props[0].isCrossLink, true);

  const analysis = analyzeConceptMap(nodes, edges);
  assert.equal(analysis.conceptCount, 3);
  assert.equal(analysis.propositionCount, 1);
  assert.equal(analysis.crossLinkCount, 1);
  assert.deepEqual(analysis.isolatedNodeIds, ['n3']);
});

test('validates node and edge inputs cleanly', () => {
  const nodes: ConceptNode[] = [
    { id: 'n1', label: 'Modus Ponens', category: 'inferencia', x: 100, y: 100, definition: 'def' },
    { id: 'n2', label: 'Tautologia', category: 'semantica', x: 300, y: 100, definition: 'def' },
  ];
  const edges: ConceptEdge[] = [
    { id: 'e1', sourceId: 'n1', targetId: 'n2', linkingPhrase: 'apoia-se em' },
  ];

  assert.equal(validateNodeInput('', nodes).valid, false);
  assert.equal(validateNodeInput('modus ponens', nodes).valid, false);
  assert.equal(validateNodeInput('Modus Tollens', nodes).valid, true);

  assert.equal(validateEdgeInput('n1', 'n1', 'gera', edges).valid, false);
  assert.equal(validateEdgeInput('n1', 'n2', '   ', edges).valid, false);
  assert.equal(validateEdgeInput('n1', 'n2', 'apoia-se em', edges).valid, false);
  assert.equal(validateEdgeInput('n2', 'n1', 'fundamenta', edges).valid, true);
});

test('computes border intersection geometry and SVG serialization', () => {
  const preset = LOGIC_PRESETS[0];
  const geom = computeEdgeGeometry(preset.nodes[0], preset.nodes[1], 0);
  assert.ok(geom.pathD.startsWith('M '));
  assert.ok(Number.isFinite(geom.labelX));
  assert.ok(Number.isFinite(geom.labelY));

  const svg = serializeMapToSvg(preset);
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('Lógica Matemática'));
  assert.ok(svg.includes('estrutura-se na'));
});
