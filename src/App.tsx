import { useEffect, useMemo, useState } from 'react';
import { TopBar } from './components/TopBar';
import { ConceptMapCanvas } from './components/ConceptMapCanvas';
import { ConceptDeck, DeckTab } from './components/ConceptDeck';
import { TheoryAndExport } from './components/TheoryAndExport';
import { LOGIC_PRESETS } from './data/logicPresets';
import {
  ConceptCategory,
  ConceptEdge,
  ConceptMapDocument,
  ConceptNode,
  analyzeConceptMap,
  extractPropositions,
  findOpenNodePosition,
  serializeMapToSvg,
  validateEdgeInput,
  validateNodeInput,
} from './logic/conceptMapModel';

const STORAGE_KEY = 'logicamap_documents_v2';

function loadSavedMaps(): Record<string, ConceptMapDocument> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ConceptMapDocument>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export default function App() {
  const [savedMaps, setSavedMaps] = useState<Record<string, ConceptMapDocument>>(() =>
    loadSavedMaps()
  );
  const [activePresetId, setActivePresetId] = useState<string>(LOGIC_PRESETS[0].id);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [branchFilter, setBranchFilter] = useState<ConceptCategory | 'all'>('all');
  const [deckOpen, setDeckOpen] = useState(false);
  const [deckTab, setDeckTab] = useState<DeckTab>('inspetor');

  const [connectMode, setConnectMode] = useState(false);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);

  const [showAddNodeForm, setShowAddNodeForm] = useState(false);
  const [showAddEdgeForm, setShowAddEdgeForm] = useState(false);
  const [prefilledSourceId, setPrefilledSourceId] = useState('');
  const [prefilledTargetId, setPrefilledTargetId] = useState('');

  const [labFormula, setLabFormula] = useState('(p → q) ↔ (¬q → ¬p)');
  const [importError, setImportError] = useState<string | null>(null);

  const activePresetDefault = useMemo(
    () => LOGIC_PRESETS.find((p) => p.id === activePresetId) ?? LOGIC_PRESETS[0],
    [activePresetId]
  );

  const activeDoc: ConceptMapDocument = useMemo(
    () => savedMaps[activePresetId] ?? activePresetDefault,
    [savedMaps, activePresetId, activePresetDefault]
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedMaps));
    } catch {
      // Ignore storage quota errors cleanly
    }
  }, [savedMaps]);

  const updateActiveDoc = (
    updater: (doc: ConceptMapDocument) => ConceptMapDocument
  ) => {
    setSavedMaps((prev) => {
      const current = prev[activePresetId] ?? activePresetDefault;
      return {
        ...prev,
        [activePresetId]: updater(current),
      };
    });
  };

  const propositions = useMemo(
    () => extractPropositions(activeDoc.nodes, activeDoc.edges),
    [activeDoc.nodes, activeDoc.edges]
  );

  const analysis = useMemo(
    () => analyzeConceptMap(activeDoc.nodes, activeDoc.edges),
    [activeDoc.nodes, activeDoc.edges]
  );

  const selectedNode = useMemo(
    () => activeDoc.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [activeDoc.nodes, selectedNodeId]
  );

  const selectedEdge = useMemo(
    () => activeDoc.edges.find((e) => e.id === selectedEdgeId) ?? null,
    [activeDoc.edges, selectedEdgeId]
  );

  const handleSelectPreset = (presetId: string) => {
    setActivePresetId(presetId);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setBranchFilter('all');
    setConnectMode(false);
    setConnectSourceId(null);
    setShowAddNodeForm(false);
    setShowAddEdgeForm(false);
    if (presetId === 'em-branco') {
      setDeckOpen(true);
      setDeckTab('inspetor');
      setShowAddNodeForm(true);
    }
  };

  const handleSelectNode = (nodeId: string | null) => {
    if (connectMode && nodeId) {
      if (!connectSourceId) {
        setConnectSourceId(nodeId);
        return;
      }
      if (connectSourceId === nodeId) {
        setConnectSourceId(null);
        return;
      }
      setPrefilledSourceId(connectSourceId);
      setPrefilledTargetId(nodeId);
      setConnectMode(false);
      setConnectSourceId(null);
      setDeckOpen(true);
      setDeckTab('inspetor');
      setShowAddEdgeForm(true);
      setShowAddNodeForm(false);
      return;
    }

    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    if (nodeId) {
      setBranchFilter('all');
      setDeckOpen(true);
      setDeckTab('inspetor');
      setShowAddNodeForm(false);
      setShowAddEdgeForm(false);
    }
  };

  const handleSelectEdge = (edgeId: string | null) => {
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
    if (edgeId) {
      setBranchFilter('all');
      setDeckOpen(true);
      setDeckTab('inspetor');
      setShowAddNodeForm(false);
      setShowAddEdgeForm(false);
    }
  };

  const handleMoveNode = (nodeId: string, x: number, y: number) => {
    updateActiveDoc((doc) => ({
      ...doc,
      nodes: doc.nodes.map((n) => (n.id === nodeId ? { ...n, x, y } : n)),
    }));
  };

  const handleAddNode = (input: {
    label: string;
    category: ConceptCategory;
    notation: string;
    definition: string;
    formula: string;
  }): string | null => {
    const check = validateNodeInput(input.label, activeDoc.nodes);
    if (!check.valid) {
      return check.error ?? 'Conceito inválido.';
    }
    const id = `n-${Date.now()}`;
    const pos = findOpenNodePosition(activeDoc.nodes);
    const newNode: ConceptNode = {
      id,
      label: input.label.trim(),
      category: input.category,
      x: pos.x,
      y: pos.y,
      notation: input.notation.trim() || undefined,
      definition:
        input.definition.trim() ||
        'Conceito criado no mapa de Lógica Matemática.',
      formula: input.formula.trim() || undefined,
    };

    updateActiveDoc((doc) => ({
      ...doc,
      nodes: [...doc.nodes, newNode],
    }));
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
    return null;
  };

  const handleUpdateNode = (
    id: string,
    updates: Partial<
      Pick<ConceptNode, 'label' | 'category' | 'notation' | 'definition' | 'formula'>
    >
  ): string | null => {
    if (typeof updates.label === 'string') {
      const check = validateNodeInput(updates.label, activeDoc.nodes, id);
      if (!check.valid) return check.error ?? 'Título inválido.';
    }
    updateActiveDoc((doc) => ({
      ...doc,
      nodes: doc.nodes.map((n) =>
        n.id === id
          ? {
              ...n,
              ...updates,
              label: updates.label !== undefined ? updates.label.trim() : n.label,
              notation:
                updates.notation !== undefined
                  ? updates.notation.trim() || undefined
                  : n.notation,
              definition:
                updates.definition !== undefined
                  ? updates.definition.trim() || n.definition
                  : n.definition,
            }
          : n
      ),
    }));
    return null;
  };

  const handleDeleteNode = (id: string) => {
    updateActiveDoc((doc) => ({
      ...doc,
      nodes: doc.nodes.filter((n) => n.id !== id),
      edges: doc.edges.filter((e) => e.sourceId !== id && e.targetId !== id),
    }));
    if (selectedNodeId === id) {
      setSelectedNodeId(null);
    }
  };

  const handleAddEdge = (input: {
    sourceId: string;
    targetId: string;
    linkingPhrase: string;
    isCrossLink: boolean;
  }): string | null => {
    const check = validateEdgeInput(
      input.sourceId,
      input.targetId,
      input.linkingPhrase,
      activeDoc.edges
    );
    if (!check.valid) {
      return check.error ?? 'Ligação inválida.';
    }
    const id = `e-${Date.now()}`;
    const newEdge: ConceptEdge = {
      id,
      sourceId: input.sourceId,
      targetId: input.targetId,
      linkingPhrase: input.linkingPhrase.trim(),
      isCrossLink: input.isCrossLink,
    };
    updateActiveDoc((doc) => ({
      ...doc,
      edges: [...doc.edges, newEdge],
    }));
    setSelectedEdgeId(id);
    setSelectedNodeId(null);
    return null;
  };

  const handleUpdateEdge = (id: string, linkingPhrase: string): string | null => {
    const edge = activeDoc.edges.find((e) => e.id === id);
    if (!edge) return 'Ligação não encontrada.';
    const check = validateEdgeInput(
      edge.sourceId,
      edge.targetId,
      linkingPhrase,
      activeDoc.edges,
      id
    );
    if (!check.valid) return check.error ?? 'Frase de ligação inválida.';
    updateActiveDoc((doc) => ({
      ...doc,
      edges: doc.edges.map((e) =>
        e.id === id ? { ...e, linkingPhrase: linkingPhrase.trim() } : e
      ),
    }));
    return null;
  };

  const handleDeleteEdge = (id: string) => {
    updateActiveDoc((doc) => ({
      ...doc,
      edges: doc.edges.filter((e) => e.id !== id),
    }));
    if (selectedEdgeId === id) {
      setSelectedEdgeId(null);
    }
  };

  const handleResetCurrentPreset = () => {
    setSavedMaps((prev) => {
      const next = { ...prev };
      delete next[activePresetId];
      return next;
    });
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setBranchFilter('all');
  };

  const triggerDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSvg = () => {
    const svg = serializeMapToSvg(activeDoc);
    triggerDownload(
      `mapa-conceitual-${activeDoc.id}.svg`,
      svg,
      'image/svg+xml;charset=utf-8'
    );
  };

  const handleExportJson = () => {
    triggerDownload(
      `mapa-conceitual-${activeDoc.id}.json`,
      JSON.stringify(activeDoc, null, 2),
      'application/json;charset=utf-8'
    );
  };

  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<ConceptMapDocument>;
      if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
        setImportError(
          'Arquivo JSON inválido: precisa conter listas "nodes" e "edges".'
        );
        return;
      }
      setImportError(null);
      updateActiveDoc((doc) => ({
        ...doc,
        title:
          typeof parsed.title === 'string' && parsed.title.trim()
            ? parsed.title
            : doc.title,
        focusQuestion:
          typeof parsed.focusQuestion === 'string' && parsed.focusQuestion.trim()
            ? parsed.focusQuestion
            : doc.focusQuestion,
        nodes: parsed.nodes!,
        edges: parsed.edges!,
      }));
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    } catch {
      setImportError('Não foi possível ler o arquivo JSON selecionado.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar onDownloadSvg={handleDownloadSvg} />

      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 py-6 md:py-7 space-y-6">
        {/* Map Title & View Switcher */}
        <section id="mapa-completo" className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-blue-700">Lógica Matemática</span>
                <span aria-hidden="true">·</span>
                <span>Rede Proposicional de Novak</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {analysis.conceptCount} conceitos · {analysis.propositionCount} proposições ·{' '}
                  {analysis.crossLinkCount} ligações cruzadas
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
                {activeDoc.title}
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="font-semibold text-slate-800">Questão focal:</strong>{' '}
                {activeDoc.focusQuestion}
              </p>
            </div>

            {/* Map Views / Sub-maps */}
            <div
              role="group"
              aria-label="Visualizações e recortes do mapa"
              className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shrink-0 no-print"
            >
              {LOGIC_PRESETS.map((preset) => {
                const isActive = preset.id === activePresetId;
                const shortTitle =
                  preset.id === 'mapa-completo'
                    ? 'Mapa Completo'
                    : preset.id === 'conectivos'
                    ? 'Conectivos & Tabela'
                    : preset.id === 'inferencia'
                    ? 'Inferência & Regras'
                    : 'Criar do Zero';
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {shortTitle}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Centerpiece Map Stage + Optional Contextual Side Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className={deckOpen ? 'lg:col-span-8' : 'lg:col-span-12'}>
              <ConceptMapCanvas
                nodes={activeDoc.nodes}
                edges={activeDoc.edges}
                selectedNodeId={selectedNodeId}
                selectedEdgeId={selectedEdgeId}
                branchFilter={branchFilter}
                onChangeBranchFilter={(cat) => {
                  setBranchFilter(cat);
                  setSelectedNodeId(null);
                  setSelectedEdgeId(null);
                }}
                connectMode={connectMode}
                connectSourceId={connectSourceId}
                deckOpen={deckOpen}
                onToggleDeck={() => setDeckOpen((prev) => !prev)}
                onOpenTruthLab={() => {
                  setDeckOpen(true);
                  setDeckTab('tabela');
                }}
                onSelectNode={handleSelectNode}
                onSelectEdge={handleSelectEdge}
                onMoveNode={handleMoveNode}
                onToggleConnectMode={() => {
                  setConnectMode((prev) => !prev);
                  setConnectSourceId(null);
                }}
                onResetLayout={handleResetCurrentPreset}
                onOpenAddConcept={() => {
                  setDeckOpen(true);
                  setDeckTab('inspetor');
                  setShowAddNodeForm(true);
                  setShowAddEdgeForm(false);
                }}
              />
            </div>

            {deckOpen && (
              <div className="lg:col-span-4">
                <ConceptDeck
                  activeTab={deckTab}
                  onTabChange={setDeckTab}
                  nodes={activeDoc.nodes}
                  edges={activeDoc.edges}
                  propositions={propositions}
                  analysis={analysis}
                  selectedNode={selectedNode}
                  selectedEdge={selectedEdge}
                  onSelectNode={(id) => handleSelectNode(id)}
                  onSelectEdge={(id) => handleSelectEdge(id)}
                  showAddNodeForm={showAddNodeForm}
                  onSetShowAddNodeForm={setShowAddNodeForm}
                  showAddEdgeForm={showAddEdgeForm}
                  onSetShowAddEdgeForm={setShowAddEdgeForm}
                  prefilledSourceId={prefilledSourceId}
                  prefilledTargetId={prefilledTargetId}
                  onAddNode={handleAddNode}
                  onUpdateNode={handleUpdateNode}
                  onDeleteNode={handleDeleteNode}
                  onAddEdge={handleAddEdge}
                  onUpdateEdge={handleUpdateEdge}
                  onDeleteEdge={handleDeleteEdge}
                  labFormula={labFormula}
                  onChangeLabFormula={setLabFormula}
                  onClose={() => setDeckOpen(false)}
                />
              </div>
            )}
          </div>
        </section>

        <TheoryAndExport
          propositions={propositions}
          importError={importError}
          onSelectEdge={(edgeId) => handleSelectEdge(edgeId)}
          onDownloadSvg={handleDownloadSvg}
          onExportJson={handleExportJson}
          onImportJson={handleImportJson}
          onPrint={() => window.print()}
          onResetCurrentPreset={handleResetCurrentPreset}
        />
      </main>
    </div>
  );
}
