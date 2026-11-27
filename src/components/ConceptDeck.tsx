import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Network,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  CATEGORY_META,
  ConceptCategory,
  ConceptEdge,
  ConceptMapAnalysis,
  ConceptNode,
  ExtractedProposition,
} from '../logic/conceptMapModel';
import {
  TruthTableResult,
  generateTruthTable,
} from '../logic/propositionalLogic';

export type DeckTab = 'inspetor' | 'proposicoes' | 'tabela';

interface ConceptDeckProps {
  activeTab: DeckTab;
  onTabChange: (tab: DeckTab) => void;
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  propositions: ExtractedProposition[];
  analysis: ConceptMapAnalysis;
  selectedNode: ConceptNode | null;
  selectedEdge: ConceptEdge | null;
  onSelectNode: (id: string) => void;
  onSelectEdge: (id: string) => void;
  showAddNodeForm: boolean;
  onSetShowAddNodeForm: (open: boolean) => void;
  showAddEdgeForm: boolean;
  onSetShowAddEdgeForm: (open: boolean) => void;
  prefilledSourceId: string;
  prefilledTargetId: string;
  onAddNode: (input: {
    label: string;
    category: ConceptCategory;
    notation: string;
    definition: string;
    formula: string;
  }) => string | null;
  onUpdateNode: (
    id: string,
    updates: Partial<Pick<ConceptNode, 'label' | 'category' | 'notation' | 'definition' | 'formula'>>
  ) => string | null;
  onDeleteNode: (id: string) => void;
  onAddEdge: (input: {
    sourceId: string;
    targetId: string;
    linkingPhrase: string;
    isCrossLink: boolean;
  }) => string | null;
  onUpdateEdge: (id: string, linkingPhrase: string) => string | null;
  onDeleteEdge: (id: string) => void;
  labFormula: string;
  onChangeLabFormula: (formula: string) => void;
  onClose?: () => void;
}

const QUICK_FORMULAS = [
  { label: 'Condicional', expr: 'p → q' },
  { label: 'Modus Ponens', expr: '((p → q) ∧ p) → q' },
  { label: 'De Morgan', expr: '¬(p ∧ q) ↔ (¬p ∨ ¬q)' },
  { label: 'Contrapositiva', expr: '(p → q) ↔ (¬q → ¬p)' },
  { label: 'Contradição', expr: 'p ∧ ¬p' },
];

export function ConceptDeck({
  activeTab,
  onTabChange,
  nodes,
  edges,
  propositions,
  analysis,
  selectedNode,
  selectedEdge,
  onSelectNode,
  onSelectEdge,
  showAddNodeForm,
  onSetShowAddNodeForm,
  showAddEdgeForm,
  onSetShowAddEdgeForm,
  prefilledSourceId,
  prefilledTargetId,
  onAddNode,
  onUpdateNode,
  onDeleteNode,
  onAddEdge,
  onUpdateEdge,
  onDeleteEdge,
  labFormula,
  onChangeLabFormula,
  onClose,
}: ConceptDeckProps) {
  // Add concept state
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState<ConceptCategory>('fundamento');
  const [newNotation, setNewNotation] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [newFormula, setNewFormula] = useState('');
  const [nodeFormError, setNodeFormError] = useState<string | null>(null);

  // Add edge state
  const [edgeSourceId, setEdgeSourceId] = useState(prefilledSourceId);
  const [edgeTargetId, setEdgeTargetId] = useState(prefilledTargetId);
  const [edgePhrase, setEdgePhrase] = useState('');
  const [edgeCross, setEdgeCross] = useState(false);
  const [edgeFormError, setEdgeFormError] = useState<string | null>(null);

  // Edit existing node/edge state
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editNodeLabel, setEditNodeLabel] = useState('');
  const [editNodeDef, setEditNodeDef] = useState('');
  const [editNodeNotation, setEditNodeNotation] = useState('');
  const [editNodeError, setEditNodeError] = useState<string | null>(null);

  const [editEdgePhrase, setEditEdgePhrase] = useState('');
  const [editEdgeError, setEditEdgeError] = useState<string | null>(null);

  // Propositions filter
  const [propQuery, setPropQuery] = useState('');

  useEffect(() => {
    if (prefilledSourceId) setEdgeSourceId(prefilledSourceId);
  }, [prefilledSourceId]);

  useEffect(() => {
    if (prefilledTargetId) setEdgeTargetId(prefilledTargetId);
  }, [prefilledTargetId]);

  useEffect(() => {
    setEditingNodeId(null);
    setEditNodeError(null);
  }, [selectedNode?.id]);

  useEffect(() => {
    if (selectedEdge) {
      setEditEdgePhrase(selectedEdge.linkingPhrase);
      setEditEdgeError(null);
    }
  }, [selectedEdge]);

  // Compute truth table safely
  let truthResult: TruthTableResult | null = null;
  let truthError: string | null = null;
  try {
    truthResult = generateTruthTable(labFormula);
  } catch (err) {
    truthError = err instanceof Error ? err.message : 'Fórmula inválida.';
  }

  const handleSubmitNewNode = (e: React.FormEvent) => {
    e.preventDefault();
    const err = onAddNode({
      label: newLabel,
      category: newCategory,
      notation: newNotation,
      definition: newDefinition,
      formula: newFormula,
    });
    if (err) {
      setNodeFormError(err);
      return;
    }
    setNodeFormError(null);
    setNewLabel('');
    setNewNotation('');
    setNewDefinition('');
    setNewFormula('');
    onSetShowAddNodeForm(false);
  };

  const handleSubmitNewEdge = (e: React.FormEvent) => {
    e.preventDefault();
    const srcId = edgeSourceId || nodes[0]?.id || '';
    const tgtId = edgeTargetId || nodes[1]?.id || '';
    const err = onAddEdge({
      sourceId: srcId,
      targetId: tgtId,
      linkingPhrase: edgePhrase,
      isCrossLink: edgeCross,
    });
    if (err) {
      setEdgeFormError(err);
      return;
    }
    setEdgeFormError(null);
    setEdgePhrase('');
    setEdgeCross(false);
    onSetShowAddEdgeForm(false);
  };

  const handleSaveNodeEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode) return;
    const err = onUpdateNode(selectedNode.id, {
      label: editNodeLabel,
      definition: editNodeDef,
      notation: editNodeNotation,
    });
    if (err) {
      setEditNodeError(err);
      return;
    }
    setEditNodeError(null);
    setEditingNodeId(null);
  };

  const handleSaveEdgeEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEdge) return;
    const err = onUpdateEdge(selectedEdge.id, editEdgePhrase);
    if (err) {
      setEditEdgeError(err);
      return;
    }
    setEditEdgeError(null);
  };

  const filteredProps = propositions.filter((p) => {
    const q = propQuery.trim().toLowerCase();
    if (!q) return true;
    return p.sentence.toLowerCase().includes(q);
  });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <aside
      aria-label="Painel conceitual e laboratório lógico"
      className="flex h-full flex-col rounded-xl border border-slate-200 bg-white overflow-hidden"
    >
      {/* Tab Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 p-1">
        <div
          role="tablist"
          aria-label="Ferramentas do mapa"
          className="grid flex-1 grid-cols-3 gap-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'inspetor'}
            onClick={() => onTabChange('inspetor')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'inspetor'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            Inspetor
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'proposicoes'}
            onClick={() => onTabChange('proposicoes')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'proposicoes'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Network className="h-3.5 w-3.5" aria-hidden="true" />
            Proposições
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'tabela'}
            onClick={() => onTabChange('tabela')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'tabela'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
            Tabela
          </button>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel lateral"
            className="rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 cursor-pointer whitespace-nowrap shrink-0"
          >
            Fechar
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ maxHeight: '72vh' }}>
        {activeTab === 'inspetor' && (
          <>
            {/* Quick Creation Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  onSetShowAddNodeForm(!showAddNodeForm);
                  onSetShowAddEdgeForm(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Novo Conceito
              </button>
              <button
                type="button"
                onClick={() => {
                  onSetShowAddEdgeForm(!showAddEdgeForm);
                  onSetShowAddNodeForm(false);
                }}
                disabled={nodes.length < 2}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                Nova Ligação
              </button>
            </div>

            {/* Add Node Form */}
            {showAddNodeForm && (
              <form
                onSubmit={handleSubmitNewNode}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Criar Conceito</h3>
                  <button
                    type="button"
                    onClick={() => {
                      onSetShowAddNodeForm(false);
                      setNodeFormError(null);
                    }}
                    className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>

                <div>
                  <label
                    htmlFor="new-concept-label"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Nome do conceito
                  </label>
                  <input
                    id="new-concept-label"
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Ex.: Silogismo Disjuntivo"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="new-concept-cat"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Ramo da Lógica
                    </label>
                    <select
                      id="new-concept-cat"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as ConceptCategory)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                    >
                      <option value="fundamento">Fundamento</option>
                      <option value="conectivo">Conectivo</option>
                      <option value="semantica">Semântica</option>
                      <option value="inferencia">Inferência</option>
                      <option value="predicado">Predicado</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="new-concept-notation"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Notação simbólica
                    </label>
                    <input
                      id="new-concept-notation"
                      type="text"
                      value={newNotation}
                      onChange={(e) => setNewNotation(e.target.value)}
                      placeholder="Ex.: p ∨ q, ¬p ⊢ q"
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="new-concept-def"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Definição em Lógica Matemática
                  </label>
                  <textarea
                    id="new-concept-def"
                    rows={2}
                    value={newDefinition}
                    onChange={(e) => setNewDefinition(e.target.value)}
                    placeholder="Descreva o conceito de forma objetiva..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-concept-formula"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Fórmula para Tabela-Verdade (opcional)
                  </label>
                  <input
                    id="new-concept-formula"
                    type="text"
                    value={newFormula}
                    onChange={(e) => setNewFormula(e.target.value)}
                    placeholder="Ex.: ((p ∨ q) ∧ ¬p) → q"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                {nodeFormError && (
                  <p role="alert" className="text-xs font-medium text-red-700">
                    {nodeFormError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  Adicionar ao Mapa
                </button>
              </form>
            )}

            {/* Add Edge Form */}
            {showAddEdgeForm && (
              <form
                onSubmit={handleSubmitNewEdge}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Nova Proposição (Ligação)
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      onSetShowAddEdgeForm(false);
                      setEdgeFormError(null);
                    }}
                    className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>

                <div>
                  <label
                    htmlFor="edge-source-select"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Conceito de origem
                  </label>
                  <select
                    id="edge-source-select"
                    value={edgeSourceId || nodes[0]?.id || ''}
                    onChange={(e) => setEdgeSourceId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="edge-phrase-input"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Frase de ligação (sobre a seta)
                  </label>
                  <input
                    id="edge-phrase-input"
                    type="text"
                    value={edgePhrase}
                    onChange={(e) => setEdgePhrase(e.target.value)}
                    placeholder="Ex.: implica logicamente em"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edge-target-select"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Conceito de destino
                  </label>
                  <select
                    id="edge-target-select"
                    value={edgeTargetId || nodes[1]?.id || ''}
                    onChange={(e) => setEdgeTargetId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={edgeCross}
                    onChange={(e) => setEdgeCross(e.target.checked)}
                    className="rounded border-slate-300 text-blue-700"
                  />
                  Marcar como ligação cruzada entre ramos
                </label>

                {edgeFormError && (
                  <p role="alert" className="text-xs font-medium text-red-700">
                    {edgeFormError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  Conectar Conceitos
                </button>
              </form>
            )}

            {/* Selected Concept Details */}
            {selectedNode ? (
              <div className="space-y-4 border-t border-slate-200 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className={`font-semibold ${CATEGORY_META[selectedNode.category].accentText}`}>
                        {CATEGORY_META[selectedNode.category].label}
                      </span>
                      {selectedNode.notation && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-slate-700">{selectedNode.notation}</span>
                        </>
                      )}
                    </div>
                    <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
                      {selectedNode.label}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label={`Editar conceito ${selectedNode.label}`}
                      onClick={() => {
                        setEditingNodeId(selectedNode.id);
                        setEditNodeLabel(selectedNode.label);
                        setEditNodeDef(selectedNode.definition);
                        setEditNodeNotation(selectedNode.notation ?? '');
                      }}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Excluir conceito ${selectedNode.label}`}
                      onClick={() => onDeleteNode(selectedNode.id)}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {editingNodeId === selectedNode.id ? (
                  <form onSubmit={handleSaveNodeEdit} className="space-y-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div>
                      <label htmlFor="edit-node-label" className="block text-xs font-semibold text-slate-700 mb-1">
                        Título
                      </label>
                      <input
                        id="edit-node-label"
                        type="text"
                        value={editNodeLabel}
                        onChange={(e) => setEditNodeLabel(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-node-notation" className="block text-xs font-semibold text-slate-700 mb-1">
                        Notação
                      </label>
                      <input
                        id="edit-node-notation"
                        type="text"
                        value={editNodeNotation}
                        onChange={(e) => setEditNodeNotation(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-node-def" className="block text-xs font-semibold text-slate-700 mb-1">
                        Definição
                      </label>
                      <textarea
                        id="edit-node-def"
                        rows={3}
                        value={editNodeDef}
                        onChange={(e) => setEditNodeDef(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                    {editNodeError && (
                      <p role="alert" className="text-xs font-medium text-red-700">
                        {editNodeError}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 cursor-pointer"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingNodeId(null)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed text-slate-700">
                      {selectedNode.definition}
                    </p>
                    {selectedNode.example && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <span className="block text-xs font-semibold text-slate-500">
                          Exemplo formal
                        </span>
                        <p className="mt-1 text-xs leading-relaxed text-slate-800">
                          {selectedNode.example}
                        </p>
                      </div>
                    )}
                    {selectedNode.formula && (
                      <button
                        type="button"
                        onClick={() => {
                          onChangeLabFormula(selectedNode.formula!);
                          onTabChange('tabela');
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
                        Testar <span className="font-mono">{selectedNode.formula}</span> na Tabela-Verdade
                      </button>
                    )}
                  </>
                )}

                {/* Related Propositions */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-800">
                    Proposições conectadas a este conceito
                  </h4>
                  {edges.filter(
                    (e) => e.sourceId === selectedNode.id || e.targetId === selectedNode.id
                  ).length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Nenhuma ligação ainda. Use &quot;Conectar Conceitos&quot; para formar uma proposição.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {edges
                        .filter(
                          (e) =>
                            e.sourceId === selectedNode.id || e.targetId === selectedNode.id
                        )
                        .map((edge) => {
                          const src = nodeMap.get(edge.sourceId);
                          const tgt = nodeMap.get(edge.targetId);
                          if (!src || !tgt) return null;
                          return (
                            <li key={edge.id}>
                              <button
                                type="button"
                                onClick={() => onSelectEdge(edge.id)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-700 hover:border-blue-400 hover:bg-blue-50/40 transition-colors cursor-pointer"
                              >
                                <span className="font-semibold text-slate-900">{src.label}</span>{' '}
                                <span className="text-blue-700 font-medium">
                                  {edge.linkingPhrase}
                                </span>{' '}
                                <span className="font-semibold text-slate-900">{tgt.label}</span>
                              </button>
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </div>
              </div>
            ) : selectedEdge ? (
              <div className="space-y-4 border-t border-slate-200 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-blue-700">
                      Unidade Semântica Selecionada
                    </span>
                    <p className="mt-1 text-sm font-medium leading-relaxed text-slate-900">
                      <strong>{nodeMap.get(selectedEdge.sourceId)?.label}</strong>{' '}
                      <span className="text-blue-700">{selectedEdge.linkingPhrase}</span>{' '}
                      <strong>{nodeMap.get(selectedEdge.targetId)?.label}</strong>.
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Excluir ligação selecionada"
                    onClick={() => onDeleteEdge(selectedEdge.id)}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-700 cursor-pointer shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>

                <form onSubmit={handleSaveEdgeEdit} className="space-y-2.5">
                  <label
                    htmlFor="edit-edge-phrase"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Editar frase de ligação
                  </label>
                  <input
                    id="edit-edge-phrase"
                    type="text"
                    value={editEdgePhrase}
                    onChange={(e) => setEditEdgePhrase(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  {editEdgeError && (
                    <p role="alert" className="text-xs font-medium text-red-700">
                      {editEdgeError}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
                  >
                    Atualizar Frase
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Diagnóstico da Rede Proposicional
                </h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <span className="block font-mono text-lg font-bold text-slate-900 tabular-nums">
                      {analysis.conceptCount}
                    </span>
                    <span className="text-[11px] text-slate-600">Conceitos</span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <span className="block font-mono text-lg font-bold text-slate-900 tabular-nums">
                      {analysis.propositionCount}
                    </span>
                    <span className="text-[11px] text-slate-600">Proposições</span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <span className="block font-mono text-lg font-bold text-amber-800 tabular-nums">
                      {analysis.crossLinkCount}
                    </span>
                    <span className="text-[11px] text-slate-600">Cruzadas</span>
                  </div>
                </div>
                <ul className="space-y-2 pt-1">
                  {analysis.qualityHints.map((hint, idx) => (
                    <li
                      key={idx}
                      className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-xs leading-relaxed text-slate-700"
                    >
                      {hint}
                    </li>
                  ))}
                </ul>

                {nodes.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-slate-800">
                      Conceitos em destaque
                    </h4>
                    <div className="grid grid-cols-1 gap-1.5">
                      {nodes.slice(0, 4).map((node) => (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => onSelectNode(node.id)}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs hover:border-blue-400 hover:bg-blue-50/40 transition-colors cursor-pointer"
                        >
                          <span className="font-semibold text-slate-900">
                            {node.label}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {node.notation ?? CATEGORY_META[node.category].label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'proposicoes' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Leitura em Rede Proposicional
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Cada seta forma uma proposição (unidade semântica): dois conceitos ligados por uma expressão explicativa com sentido de leitura.
              </p>
            </div>

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400"
                aria-hidden="true"
              />
              <label htmlFor="prop-search" className="sr-only">
                Filtrar proposições
              </label>
              <input
                id="prop-search"
                type="text"
                value={propQuery}
                onChange={(e) => setPropQuery(e.target.value)}
                placeholder="Filtrar proposições do mapa..."
                className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            {filteredProps.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                Nenhuma proposição encontrada. Conecte dois conceitos no mapa para formar uma unidade semântica.
              </p>
            ) : (
              <ol className="space-y-2">
                {filteredProps.map((prop, index) => {
                  const isActive = selectedEdge?.id === prop.id;
                  return (
                    <li key={prop.id}>
                      <button
                        type="button"
                        onClick={() => onSelectEdge(prop.id)}
                        className={`w-full rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                          isActive
                            ? 'border-blue-700 bg-blue-50/70'
                            : 'border-slate-200 bg-white hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                          <span className="font-mono tabular-nums">
                            {String(index + 1).padStart(2, '0')}.
                          </span>
                          <span>
                            {prop.isCrossLink ? 'Ligação cruzada' : 'Ligação hierárquica'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-800">
                          <span className="font-semibold text-slate-900">
                            {prop.sourceLabel}
                          </span>{' '}
                          <span className="font-medium text-blue-700">
                            {prop.linkingPhrase}
                          </span>{' '}
                          <span className="font-semibold text-slate-900">
                            {prop.targetLabel}
                          </span>
                          .
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        )}

        {activeTab === 'tabela' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Laboratório de Tabela-Verdade
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Teste fórmulas proposicionais para verificar tautologias, contradições, contingências e regras de inferência.
              </p>
            </div>

            <div>
              <label
                htmlFor="logic-formula-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Expressão proposicional
              </label>
              <input
                id="logic-formula-input"
                type="text"
                value={labFormula}
                onChange={(e) => onChangeLabFormula(e.target.value)}
                placeholder="Ex.: (p → q) ↔ (¬q → ¬p)"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            {/* Symbol Keypad */}
            <div className="flex flex-wrap gap-1.5" aria-label="Teclado de símbolos lógicos">
              {['p', 'q', 'r', '¬', '∧', '∨', '⊻', '→', '↔', '(', ')'].map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => onChangeLabFormula(labFormula + sym)}
                  className="rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-800 hover:bg-slate-200 cursor-pointer"
                >
                  {sym}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onChangeLabFormula('')}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Limpar
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_FORMULAS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onChangeLabFormula(item.expr)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:border-blue-400 hover:text-blue-800 cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {truthError && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800"
              >
                {truthError}
              </div>
            )}

            {truthResult && (
              <div className="space-y-3">
                {/* Semantic Classification Banner (explicit text + icon, never hue-only) */}
                <div
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-xs ${
                    truthResult.classification === 'Tautologia'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                      : truthResult.classification === 'Contradição'
                      ? 'border-red-300 bg-red-50 text-red-900'
                      : 'border-amber-300 bg-amber-50 text-amber-900'
                  }`}
                >
                  <span className="font-bold">
                    Classificação: {truthResult.classification}
                  </span>
                  <span className="font-mono tabular-nums font-semibold">
                    {truthResult.trueCount}/{truthResult.totalRows} V
                  </span>
                </div>

                {/* Truth Table */}
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full border-collapse text-center font-mono text-xs tabular-nums">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                        {truthResult.variables.map((v) => (
                          <th key={v} className="px-3 py-2 font-semibold">
                            {v}
                          </th>
                        ))}
                        <th className="border-l border-slate-200 px-3 py-2 font-bold text-slate-900">
                          {truthResult.normalizedFormula}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {truthResult.rows.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-slate-100 last:border-b-0 odd:bg-white even:bg-slate-50/40"
                        >
                          {truthResult.variables.map((v) => (
                            <td
                              key={v}
                              className={`px-3 py-1.5 font-medium ${
                                row.assignment[v] ? 'text-slate-900' : 'text-slate-500'
                              }`}
                            >
                              {row.assignment[v] ? 'V' : 'F'}
                            </td>
                          ))}
                          <td
                            className={`border-l border-slate-200 px-3 py-1.5 font-bold ${
                              row.result
                                ? 'bg-emerald-50/60 text-emerald-800'
                                : 'bg-red-50/60 text-red-800'
                            }`}
                          >
                            {row.result ? 'V' : 'F'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
