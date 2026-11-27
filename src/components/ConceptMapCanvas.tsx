import React, { useEffect, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Link2,
  RotateCcw,
  Plus,
  PanelRightOpen,
  PanelRightClose,
  Calculator,
} from 'lucide-react';
import {
  CATEGORY_META,
  ConceptCategory,
  ConceptEdge,
  ConceptNode,
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  computeEdgeGeometry,
} from '../logic/conceptMapModel';

interface ConceptMapCanvasProps {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  branchFilter: ConceptCategory | 'all';
  onChangeBranchFilter: (cat: ConceptCategory | 'all') => void;
  connectMode: boolean;
  connectSourceId: string | null;
  deckOpen: boolean;
  onToggleDeck: () => void;
  onOpenTruthLab: () => void;
  onSelectNode: (nodeId: string | null) => void;
  onSelectEdge: (edgeId: string | null) => void;
  onMoveNode: (nodeId: string, x: number, y: number) => void;
  onToggleConnectMode: () => void;
  onResetLayout: () => void;
  onOpenAddConcept: () => void;
}

const LOGICAL_WIDTH = 1400;
const LOGICAL_HEIGHT = 865;

const BRANCH_OPTIONS: Array<{ id: ConceptCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Todos os ramos' },
  { id: 'fundamento', label: 'Fundamentos' },
  { id: 'conectivo', label: 'Conectivos' },
  { id: 'semantica', label: 'Semântica' },
  { id: 'inferencia', label: 'Inferência' },
  { id: 'predicado', label: 'Predicados' },
];

export function ConceptMapCanvas({
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  branchFilter,
  onChangeBranchFilter,
  connectMode,
  connectSourceId,
  deckOpen,
  onToggleDeck,
  onOpenTruthLab,
  onSelectNode,
  onSelectEdge,
  onMoveNode,
  onToggleConnectMode,
  onResetLayout,
  onOpenAddConcept,
}: ConceptMapCanvasProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fitScale, setFitScale] = useState(0.96);
  const [zoom, setZoom] = useState(1);
  const [dragState, setDragState] = useState<{
    nodeId: string;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const updateScale = () => {
      const w = el.clientWidth;
      if (w > 0) {
        const next = Math.min(1, Math.max(0.48, (w - 12) / LOGICAL_WIDTH));
        setFitScale(Number(next.toFixed(3)));
      }
    };

    updateScale();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateScale);
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, []);

  const effectiveScale = fitScale * zoom;
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const highlightedNodeIds = new Set<string>();
  const highlightedEdgeIds = new Set<string>();

  if (selectedNodeId) {
    highlightedNodeIds.add(selectedNodeId);
    for (const edge of edges) {
      if (edge.sourceId === selectedNodeId || edge.targetId === selectedNodeId) {
        highlightedEdgeIds.add(edge.id);
        highlightedNodeIds.add(edge.sourceId);
        highlightedNodeIds.add(edge.targetId);
      }
    }
  } else if (selectedEdgeId) {
    const activeEdge = edges.find((e) => e.id === selectedEdgeId);
    if (activeEdge) {
      highlightedEdgeIds.add(activeEdge.id);
      highlightedNodeIds.add(activeEdge.sourceId);
      highlightedNodeIds.add(activeEdge.targetId);
    }
  } else if (branchFilter !== 'all') {
    for (const node of nodes) {
      if (node.category === branchFilter) {
        highlightedNodeIds.add(node.id);
      }
    }
    for (const edge of edges) {
      const src = nodeMap.get(edge.sourceId);
      const tgt = nodeMap.get(edge.targetId);
      if (src?.category === branchFilter || tgt?.category === branchFilter) {
        highlightedEdgeIds.add(edge.id);
      }
    }
  }

  const hasFocus = Boolean(
    selectedNodeId || selectedEdgeId || branchFilter !== 'all'
  );

  const handlePointerDownNode = (
    e: React.PointerEvent<HTMLButtonElement>,
    node: ConceptNode
  ) => {
    if (connectMode) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragState({
      nodeId: node.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: node.x,
      origY: node.y,
      moved: false,
    });
  };

  const handlePointerMoveNode = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragState || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = LOGICAL_WIDTH / rect.width;
    const scaleY = LOGICAL_HEIGHT / rect.height;

    const dx = (e.clientX - dragState.startClientX) * scaleX;
    const dy = (e.clientY - dragState.startClientY) * scaleY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      const clampedX = Math.max(92, Math.min(LOGICAL_WIDTH - 92, dragState.origX + dx));
      const clampedY = Math.max(40, Math.min(LOGICAL_HEIGHT - 40, dragState.origY + dy));
      if (!dragState.moved) {
        setDragState((prev) => (prev ? { ...prev, moved: true } : null));
      }
      onMoveNode(dragState.nodeId, Math.round(clampedX), Math.round(clampedY));
    }
  };

  const handlePointerUpNode = (
    e: React.PointerEvent<HTMLButtonElement>,
    nodeId: string
  ) => {
    if (dragState && dragState.nodeId === nodeId) {
      const wasMoved = dragState.moved;
      setDragState(null);
      if (!wasMoved) {
        onSelectNode(nodeId);
      }
      return;
    }
    e.stopPropagation();
    onSelectNode(nodeId);
  };

  return (
    <section
      aria-label="Mapa conceitual completo de Lógica Matemática"
      className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden"
    >
      {/* Stage Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-2.5 no-print">
        {/* Branch Filter Tabs */}
        <div
          role="group"
          aria-label="Destacar ramo da Lógica Matemática"
          className="flex flex-wrap items-center gap-1"
        >
          {BRANCH_OPTIONS.map((opt) => {
            const active = branchFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                onClick={() => onChangeBranchFilter(opt.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Studio / Inspection & Zoom Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenTruthLab}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Calculator className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
            Tabela-Verdade
          </button>

          <button
            type="button"
            onClick={onOpenAddConcept}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
            Adicionar Conceito
          </button>

          <button
            type="button"
            onClick={onToggleConnectMode}
            aria-pressed={connectMode}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              connectMode
                ? 'border-blue-700 bg-blue-700 text-white'
                : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
            {connectMode ? 'Cancelar Ligação' : 'Conectar'}
          </button>

          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.75, Number((z - 0.1).toFixed(2))))}
              aria-label="Diminuir zoom do mapa"
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="w-10 text-center font-mono text-[11px] font-medium text-slate-600 tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.35, Number((z + 0.1).toFixed(2))))}
              aria-label="Aumentar zoom do mapa"
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              aria-label="Ajustar zoom para 100%"
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onResetLayout}
              aria-label="Restaurar posições originais dos conceitos"
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleDeck}
            aria-expanded={deckOpen}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            {deckOpen ? (
              <>
                <PanelRightClose className="h-3.5 w-3.5" aria-hidden="true" />
                Expandir Mapa
              </>
            ) : (
              <>
                <PanelRightOpen className="h-3.5 w-3.5" aria-hidden="true" />
                Abrir Painel
              </>
            )}
          </button>
        </div>
      </div>

      {connectMode && (
        <div className="border-b border-blue-200 bg-blue-50 px-4 py-2 text-xs font-medium text-blue-900">
          {connectSourceId
            ? `Origem selecionada: "${nodeMap.get(connectSourceId)?.label}". Clique agora no conceito de destino.`
            : 'Modo de ligação ativo: clique primeiro no conceito de origem e depois no conceito de destino.'}
        </div>
      )}

      {/* Viewport */}
      <div
        ref={viewportRef}
        className="concept-grid-bg relative w-full overflow-auto"
        style={{ minHeight: '540px' }}
        onClick={() => {
          if (!connectMode) {
            onSelectNode(null);
            onSelectEdge(null);
          }
        }}
      >
        <div
          className="mx-auto"
          style={{
            width: `${Math.round(LOGICAL_WIDTH * effectiveScale)}px`,
            height: `${Math.round(LOGICAL_HEIGHT * effectiveScale)}px`,
          }}
        >
          <div
            ref={containerRef}
            data-testid="concept-map-stage"
            className="relative origin-top-left transition-transform duration-150"
            style={{
              width: `${LOGICAL_WIDTH}px`,
              height: `${LOGICAL_HEIGHT}px`,
              transform: `scale(${effectiveScale})`,
            }}
          >
            {/* SVG Layer for Arrows */}
            <svg
              viewBox={`0 0 ${LOGICAL_WIDTH} ${LOGICAL_HEIGHT}`}
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <defs>
                <marker
                  id="cmap-arrow"
                  viewBox="0 0 10 10"
                  refX="8.5"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#475569" />
                </marker>
                <marker
                  id="cmap-arrow-active"
                  viewBox="0 0 10 10"
                  refX="8.5"
                  refY="5"
                  markerWidth="7.5"
                  markerHeight="7.5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#1d4ed8" />
                </marker>
                <marker
                  id="cmap-arrow-cross"
                  viewBox="0 0 10 10"
                  refX="8.5"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#b45309" />
                </marker>
              </defs>

              {edges.map((edge) => {
                const src = nodeMap.get(edge.sourceId);
                const tgt = nodeMap.get(edge.targetId);
                if (!src || !tgt) return null;

                const hasReverse = edges.some(
                  (other) =>
                    other.sourceId === edge.targetId && other.targetId === edge.sourceId
                );
                const isCross = Boolean(edge.isCrossLink);
                const offset = hasReverse ? 34 : isCross ? 26 : 0;
                const geom = computeEdgeGeometry(src, tgt, offset);

                const isHighlighted = highlightedEdgeIds.has(edge.id);
                const dimmed = hasFocus && !isHighlighted;
                const stroke = isHighlighted
                  ? '#1d4ed8'
                  : isCross
                  ? '#b45309'
                  : '#64748b';
                const marker = isHighlighted
                  ? 'url(#cmap-arrow-active)'
                  : isCross
                  ? 'url(#cmap-arrow-cross)'
                  : 'url(#cmap-arrow)';

                return (
                  <path
                    key={edge.id}
                    d={geom.pathD}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={isHighlighted ? 2.4 : 1.65}
                    strokeDasharray={isCross ? '6 4' : undefined}
                    markerEnd={marker}
                    opacity={dimmed ? 0.22 : 1}
                  />
                );
              })}
            </svg>

            {/* Accessible Linking Phrase Buttons on Arrows */}
            {edges.map((edge) => {
              const src = nodeMap.get(edge.sourceId);
              const tgt = nodeMap.get(edge.targetId);
              if (!src || !tgt) return null;

              const hasReverse = edges.some(
                (other) =>
                  other.sourceId === edge.targetId && other.targetId === edge.sourceId
              );
              const isCross = Boolean(edge.isCrossLink);
              const offset = hasReverse ? 34 : isCross ? 26 : 0;
              const geom = computeEdgeGeometry(src, tgt, offset);
              const isHighlighted = highlightedEdgeIds.has(edge.id);
              const dimmed = hasFocus && !isHighlighted;
              const phrase = edge.linkingPhrase.trim() || 'ligado a';

              return (
                <button
                  key={`label-${edge.id}`}
                  type="button"
                  aria-label={`Proposição: ${src.label} ${phrase} ${tgt.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEdge(edge.id);
                  }}
                  style={{
                    left: `${geom.labelX}px`,
                    top: `${geom.labelY}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute z-10 rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-opacity cursor-pointer whitespace-nowrap ${
                    isHighlighted
                      ? 'border-blue-700 bg-blue-50 text-blue-900 shadow-xs'
                      : isCross
                      ? 'border-amber-300 bg-amber-50/95 text-amber-900 hover:border-amber-500'
                      : 'border-slate-200 bg-white/95 text-slate-700 hover:border-slate-400'
                  } ${dimmed ? 'opacity-25' : 'opacity-100'}`}
                >
                  {phrase}
                </button>
              );
            })}

            {/* Concept Boxes ("Caixinhas") */}
            {nodes.map((node) => {
              const w = node.width ?? DEFAULT_NODE_WIDTH;
              const h = node.height ?? DEFAULT_NODE_HEIGHT;
              const meta = CATEGORY_META[node.category];
              const isSelected = selectedNodeId === node.id;
              const isConnectSource = connectSourceId === node.id;
              const isHighlighted = highlightedNodeIds.has(node.id);
              const dimmed = hasFocus && !isHighlighted && !connectMode;

              return (
                <button
                  key={node.id}
                  type="button"
                  aria-label={`Conceito ${node.label} (${meta.label})`}
                  aria-pressed={isSelected}
                  onPointerDown={(e) => handlePointerDownNode(e, node)}
                  onPointerMove={handlePointerMoveNode}
                  onPointerUp={(e) => handlePointerUpNode(e, node.id)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    left: `${node.x - w / 2}px`,
                    top: `${node.y - h / 2}px`,
                    width: `${w}px`,
                    minHeight: `${h}px`,
                  }}
                  className={`absolute z-20 flex flex-col items-center justify-center rounded-xl border px-2.5 py-1.5 text-center shadow-xs transition-opacity select-none ${
                    connectMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
                  } ${meta.boxBg} ${
                    isConnectSource
                      ? 'border-blue-700 ring-2 ring-blue-600/35'
                      : isSelected
                      ? meta.selectedBorder
                      : `${meta.boxBorder} hover:border-slate-500`
                  } ${dimmed ? 'opacity-30' : 'opacity-100'}`}
                >
                  <span className={`text-[10px] font-semibold tracking-wide ${meta.accentText}`}>
                    {meta.label}
                  </span>
                  <span className="mt-0.5 text-[12.5px] font-bold leading-tight text-slate-900">
                    {node.label}
                  </span>
                  {node.notation && (
                    <span className="mt-0.5 font-mono text-[10.5px] text-slate-600 truncate max-w-full">
                      {node.notation}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quiet Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-3">
          <span>Clique em qualquer caixinha ou seta para inspecionar</span>
          <span aria-hidden="true">·</span>
          <span>Seta contínua: relação hierárquica</span>
          <span aria-hidden="true">·</span>
          <span className="text-amber-800 font-medium">Seta tracejada: ligação cruzada</span>
        </div>
        <span className="font-mono text-[11px] text-slate-500 tabular-nums">
          {nodes.length} conceitos · {edges.length} proposições
        </span>
      </div>
    </section>
  );
}
