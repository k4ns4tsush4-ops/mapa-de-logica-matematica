export type ConceptCategory =
  | 'fundamento'
  | 'conectivo'
  | 'semantica'
  | 'inferencia'
  | 'predicado';

export interface ConceptNode {
  id: string;
  label: string;
  category: ConceptCategory;
  x: number; // center x on logical canvas
  y: number; // center y on logical canvas
  width?: number;
  height?: number;
  notation?: string;
  definition: string;
  example?: string;
  formula?: string;
  level?: number;
}

export interface ConceptEdge {
  id: string;
  sourceId: string;
  targetId: string;
  linkingPhrase: string;
  isCrossLink?: boolean;
}

export interface ConceptMapDocument {
  id: string;
  title: string;
  subtitle: string;
  focusQuestion: string;
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

export interface ExtractedProposition {
  id: string;
  sourceId: string;
  sourceLabel: string;
  linkingPhrase: string;
  targetId: string;
  targetLabel: string;
  sentence: string;
  isCrossLink: boolean;
}

export interface ConceptMapAnalysis {
  conceptCount: number;
  propositionCount: number;
  crossLinkCount: number;
  isolatedNodeIds: string[];
  emptyPhraseEdgeIds: string[];
  qualityHints: string[];
}

export interface EdgeGeometry {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cx: number;
  cy: number;
  labelX: number;
  labelY: number;
  pathD: string;
}

export const DEFAULT_NODE_WIDTH = 166;
export const DEFAULT_NODE_HEIGHT = 62;

export const CATEGORY_META: Record<
  ConceptCategory,
  {
    label: string;
    boxBg: string;
    boxBorder: string;
    selectedBorder: string;
    accentText: string;
    svgFill: string;
    svgStroke: string;
    svgLabelColor: string;
  }
> = {
  fundamento: {
    label: 'Fundamento',
    boxBg: 'bg-white',
    boxBorder: 'border-slate-300',
    selectedBorder: 'border-blue-700 ring-2 ring-blue-600/20',
    accentText: 'text-blue-700',
    svgFill: '#ffffff',
    svgStroke: '#94a3b8',
    svgLabelColor: '#1d4ed8',
  },
  conectivo: {
    label: 'Conectivo',
    boxBg: 'bg-sky-50/70',
    boxBorder: 'border-sky-300',
    selectedBorder: 'border-sky-700 ring-2 ring-sky-600/20',
    accentText: 'text-sky-800',
    svgFill: '#f0f9ff',
    svgStroke: '#7dd3fc',
    svgLabelColor: '#0369a1',
  },
  semantica: {
    label: 'Semântica',
    boxBg: 'bg-emerald-50/60',
    boxBorder: 'border-emerald-300',
    selectedBorder: 'border-emerald-700 ring-2 ring-emerald-600/20',
    accentText: 'text-emerald-800',
    svgFill: '#ecfdf5',
    svgStroke: '#6ee7b7',
    svgLabelColor: '#047857',
  },
  inferencia: {
    label: 'Inferência',
    boxBg: 'bg-amber-50/70',
    boxBorder: 'border-amber-300',
    selectedBorder: 'border-amber-700 ring-2 ring-amber-600/20',
    accentText: 'text-amber-800',
    svgFill: '#fffbeb',
    svgStroke: '#fcd34d',
    svgLabelColor: '#b45309',
  },
  predicado: {
    label: 'Predicado',
    boxBg: 'bg-slate-100',
    boxBorder: 'border-slate-400',
    selectedBorder: 'border-slate-800 ring-2 ring-slate-700/20',
    accentText: 'text-slate-700',
    svgFill: '#f1f5f9',
    svgStroke: '#94a3b8',
    svgLabelColor: '#334155',
  },
};

export function extractPropositions(
  nodes: ConceptNode[],
  edges: ConceptEdge[]
): ExtractedProposition[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const result: ExtractedProposition[] = [];

  for (const edge of edges) {
    const src = nodeMap.get(edge.sourceId);
    const tgt = nodeMap.get(edge.targetId);
    if (!src || !tgt) continue;

    const phrase = edge.linkingPhrase.trim() || '(sem frase de ligação)';
    const cross = Boolean(edge.isCrossLink);

    result.push({
      id: edge.id,
      sourceId: src.id,
      sourceLabel: src.label,
      linkingPhrase: phrase,
      targetId: tgt.id,
      targetLabel: tgt.label,
      sentence: `${src.label} ${phrase} ${tgt.label}.`,
      isCrossLink: cross,
    });
  }

  return result;
}

export function analyzeConceptMap(
  nodes: ConceptNode[],
  edges: ConceptEdge[]
): ConceptMapAnalysis {
  const connectedIds = new Set<string>();
  const emptyPhraseEdgeIds: string[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  let crossLinkCount = 0;

  for (const edge of edges) {
    const src = nodeMap.get(edge.sourceId);
    const tgt = nodeMap.get(edge.targetId);
    if (!src || !tgt) continue;

    connectedIds.add(src.id);
    connectedIds.add(tgt.id);

    if (!edge.linkingPhrase.trim()) {
      emptyPhraseEdgeIds.push(edge.id);
    }

    if (Boolean(edge.isCrossLink)) {
      crossLinkCount++;
    }
  }

  const isolatedNodeIds = nodes
    .filter((n) => !connectedIds.has(n.id))
    .map((n) => n.id);

  const qualityHints: string[] = [];
  if (nodes.length === 0) {
    qualityHints.push('Adicione um conceito raiz para iniciar seu mapa conceitual de Lógica Matemática.');
  } else {
    if (isolatedNodeIds.length > 0) {
      qualityHints.push(
        `${isolatedNodeIds.length} conceito(s) ainda estão isolados. Segundo Novak, todo conceito deve formar ao menos uma proposição.`
      );
    }
    if (emptyPhraseEdgeIds.length > 0) {
      qualityHints.push(
        `${emptyPhraseEdgeIds.length} seta(s) não possuem palavra ou frase de ligação para formar uma unidade semântica.`
      );
    }
    if (nodes.length >= 4 && crossLinkCount === 0) {
      qualityHints.push(
        'Crie ao menos uma ligação cruzada entre ramos distintos (ex.: Conectivos → Tabela-Verdade) para aprofundar a aprendizagem significativa.'
      );
    }
    if (qualityHints.length === 0) {
      qualityHints.push(
        'Rede proposicional consistente: todos os conceitos participam de unidades semânticas com sentido de leitura explícito.'
      );
    }
  }

  return {
    conceptCount: nodes.length,
    propositionCount: edges.filter((e) => nodeMap.has(e.sourceId) && nodeMap.has(e.targetId)).length,
    crossLinkCount,
    isolatedNodeIds,
    emptyPhraseEdgeIds,
    qualityHints,
  };
}

export function validateNodeInput(
  label: string,
  existingNodes: ConceptNode[],
  ignoreId?: string
): { valid: boolean; error?: string } {
  const trimmed = label.trim();
  if (!trimmed) {
    return { valid: false, error: 'Informe o nome do conceito (ex.: Modus Ponens).' };
  }
  if (trimmed.length > 48) {
    return { valid: false, error: 'Mantenha o rótulo conciso (máximo de 48 caracteres).' };
  }
  const duplicate = existingNodes.find(
    (n) => n.id !== ignoreId && n.label.trim().toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) {
    return { valid: false, error: `O conceito "${duplicate.label}" já existe neste mapa.` };
  }
  return { valid: true };
}

export function findOpenNodePosition(
  existingNodes: ConceptNode[]
): { x: number; y: number } {
  const candidateCols = [160, 380, 600, 820, 1040, 1260];
  const candidateRows = [120, 250, 380, 520, 660, 790];

  for (const y of candidateRows) {
    for (const x of candidateCols) {
      const collides = existingNodes.some(
        (n) => Math.abs(n.x - x) < 178 && Math.abs(n.y - y) < 76
      );
      if (!collides) {
        return { x, y };
      }
    }
  }

  return {
    x: 200 + ((existingNodes.length * 90) % 980),
    y: 160 + ((existingNodes.length * 70) % 580),
  };
}

export function validateEdgeInput(
  sourceId: string,
  targetId: string,
  linkingPhrase: string,
  existingEdges: ConceptEdge[],
  ignoreEdgeId?: string
): { valid: boolean; error?: string } {
  if (!sourceId || !targetId) {
    return { valid: false, error: 'Selecione o conceito de origem e o conceito de destino.' };
  }
  if (sourceId === targetId) {
    return { valid: false, error: 'Uma proposição deve ligar dois conceitos diferentes.' };
  }
  const trimmed = linkingPhrase.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Informe a frase de ligação sobre a seta (ex.: "é composta por", "determina").',
    };
  }
  if (trimmed.length > 42) {
    return { valid: false, error: 'A frase de ligação deve ser breve (máximo de 42 caracteres).' };
  }
  const duplicate = existingEdges.find(
    (e) =>
      e.id !== ignoreEdgeId &&
      e.sourceId === sourceId &&
      e.targetId === targetId &&
      e.linkingPhrase.trim().toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) {
    return { valid: false, error: 'Essa proposição exata já existe entre esses dois conceitos.' };
  }
  return { valid: true };
}

function getBoxBorderIntersection(
  cx: number,
  cy: number,
  w: number,
  h: number,
  targetX: number,
  targetY: number,
  padding = 4
): { x: number; y: number } {
  const dx = targetX - cx;
  const dy = targetY - cy;
  if (dx === 0 && dy === 0) {
    return { x: cx, y: cy };
  }
  const halfW = w / 2 + padding;
  const halfH = h / 2 + padding;
  const scaleX = Math.abs(dx) > 0.001 ? halfW / Math.abs(dx) : Infinity;
  const scaleY = Math.abs(dy) > 0.001 ? halfH / Math.abs(dy) : Infinity;
  const t = Math.min(scaleX, scaleY);
  return {
    x: cx + dx * t,
    y: cy + dy * t,
  };
}

export function computeEdgeGeometry(
  source: ConceptNode,
  target: ConceptNode,
  curveOffset = 0
): EdgeGeometry {
  const sw = source.width ?? DEFAULT_NODE_WIDTH;
  const sh = source.height ?? DEFAULT_NODE_HEIGHT;
  const tw = target.width ?? DEFAULT_NODE_WIDTH;
  const th = target.height ?? DEFAULT_NODE_HEIGHT;

  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist;
  const ny = dx / dist;

  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  const cx = midX + nx * curveOffset;
  const cy = midY + ny * curveOffset;

  const p1 = getBoxBorderIntersection(source.x, source.y, sw, sh, cx, cy, 3);
  const p2 = getBoxBorderIntersection(target.x, target.y, tw, th, cx, cy, 6);

  // Quadratic Bezier point at t = 0.5
  const labelX = 0.25 * p1.x + 0.5 * cx + 0.25 * p2.x;
  const labelY = 0.25 * p1.y + 0.5 * cy + 0.25 * p2.y;

  const pathD =
    Math.abs(curveOffset) < 1
      ? `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
      : `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;

  return {
    x1: p1.x,
    y1: p1.y,
    x2: p2.x,
    y2: p2.y,
    cx,
    cy,
    labelX,
    labelY,
    pathD,
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function serializeMapToSvg(doc: ConceptMapDocument): string {
  const width = 1400;
  const height = 880;
  const nodeMap = new Map(doc.nodes.map((n) => [n.id, n]));

  const edgesSvg = doc.edges
    .map((edge, index) => {
      const src = nodeMap.get(edge.sourceId);
      const tgt = nodeMap.get(edge.targetId);
      if (!src || !tgt) return '';

      const hasReverse = doc.edges.some(
        (other) => other.sourceId === edge.targetId && other.targetId === edge.sourceId
      );
      const offset = hasReverse ? 34 : edge.isCrossLink ? 24 : 0;
      const geom = computeEdgeGeometry(src, tgt, offset);
      const phrase = escapeXml(edge.linkingPhrase);
      const boxW = Math.max(72, edge.linkingPhrase.length * 6.8 + 18);
      const stroke = edge.isCrossLink ? '#b45309' : '#475569';
      const dash = edge.isCrossLink ? ' stroke-dasharray="5 4"' : '';

      return `<g id="edge-${index}">
  <path d="${geom.pathD}" fill="none" stroke="${stroke}" stroke-width="1.75"${dash} marker-end="url(#arrow-${edge.isCrossLink ? 'cross' : 'std'})" />
  <rect x="${(geom.labelX - boxW / 2).toFixed(1)}" y="${(geom.labelY - 11).toFixed(1)}" width="${boxW.toFixed(1)}" height="22" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
  <text x="${geom.labelX.toFixed(1)}" y="${(geom.labelY + 3.5).toFixed(1)}" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="11" font-weight="600" fill="${edge.isCrossLink ? '#92400e' : '#334155'}">${phrase}</text>
</g>`;
    })
    .join('\n');

  const nodesSvg = doc.nodes
    .map((node) => {
      const w = node.width ?? DEFAULT_NODE_WIDTH;
      const h = node.height ?? DEFAULT_NODE_HEIGHT;
      const x = node.x - w / 2;
      const y = node.y - h / 2;
      const meta = CATEGORY_META[node.category];
      const notationLine = node.notation
        ? `<text x="${node.x}" y="${y + h - 12}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#475569">${escapeXml(node.notation)}</text>`
        : '';

      return `<g>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${meta.svgFill}" stroke="${meta.svgStroke}" stroke-width="1.5" />
  <text x="${node.x}" y="${y + 18}" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="9.5" font-weight="700" fill="${meta.svgLabelColor}">${escapeXml(meta.label)}</text>
  <text x="${node.x}" y="${y + (node.notation ? 38 : 42)}" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="700" fill="#0f172a">${escapeXml(node.label)}</text>
  ${notationLine}
</g>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <marker id="arrow-std" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#475569" />
    </marker>
    <marker id="arrow-cross" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#b45309" />
    </marker>
  </defs>
  <rect width="${width}" height="${height}" fill="#f8fafc" />
  <text x="36" y="38" font-family="Fraunces, Georgia, serif" font-size="22" font-weight="700" fill="#0f172a">${escapeXml(doc.title)}</text>
  <text x="36" y="60" font-family="Plus Jakarta Sans, sans-serif" font-size="12" fill="#475569">Questão focal: ${escapeXml(doc.focusQuestion)}</text>
  ${edgesSvg}
  ${nodesSvg}
</svg>`;
}
