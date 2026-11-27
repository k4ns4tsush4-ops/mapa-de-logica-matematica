import React, { useRef } from 'react';
import { Download, FileJson, Printer, RotateCcw, Upload } from 'lucide-react';
import { ExtractedProposition } from '../logic/conceptMapModel';

interface TheoryAndExportProps {
  propositions: ExtractedProposition[];
  importError: string | null;
  onSelectEdge: (edgeId: string) => void;
  onDownloadSvg: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onPrint: () => void;
  onResetCurrentPreset: () => void;
}

export function TheoryAndExport({
  propositions,
  importError,
  onSelectEdge,
  onDownloadSvg,
  onExportJson,
  onImportJson,
  onPrint,
  onResetCurrentPreset,
}: TheoryAndExportProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-14 pt-6">
      {/* Rede Proposicional Section */}
      <section
        id="rede-proposicional"
        className="rounded-xl border border-slate-200 bg-white p-6 md:p-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-semibold text-blue-700">
              Leitura Não-Linear · Unidades Semânticas
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-slate-900">
              Rede Proposicional Completa do Mapa
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-slate-600">
            Diferente de um texto linear, o mapa permite iniciar por qualquer ramo. Abaixo estão todas as proposições formadas por dois conceitos unidos por uma frase explicativa.
          </p>
        </div>

        {propositions.length === 0 ? (
          <p className="mt-6 text-sm text-slate-600">
            Este mapa ainda não possui proposições conectadas. Utilize &quot;Conectar Conceitos&quot; no palco acima para criar suas primeiras ligações.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {propositions.map((prop, index) => (
              <button
                key={prop.id}
                type="button"
                onClick={() => {
                  onSelectEdge(prop.id);
                  document.getElementById('mapa-completo')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-left hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono tabular-nums font-semibold">
                    Proposição {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{prop.isCrossLink ? 'Ligação cruzada' : 'Hierárquica'}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-800">
                  <strong className="text-slate-900">{prop.sourceLabel}</strong>{' '}
                  <span className="font-medium text-blue-700">{prop.linkingPhrase}</span>{' '}
                  <strong className="text-slate-900">{prop.targetLabel}</strong>.
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Fundamentos Teóricos (Novak, Ausubel, Gava/Menezes/Cury, Condori) */}
      <section id="fundamentos" className="space-y-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold text-blue-700">
            Base Pedagógica Aplicada à Lógica Matemática
          </p>
          <h2 className="mt-1 font-display text-2xl md:text-3xl font-bold text-slate-900">
            Por que Mapas Conceituais em Lógica Matemática?
          </h2>
          <p className="mt-2 text-sm md:text-base leading-relaxed text-slate-600">
            Em Lógica Matemática, símbolos como <span className="font-mono">¬, ∧, →, ∀</span> só ganham sentido duradouro quando conectados em uma estrutura explícita de significados.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <article className="rounded-xl border border-slate-200 bg-white p-6 space-y-2.5">
            <h3 className="text-base font-bold text-slate-900">
              01. Aprendizagem Significativa (Ausubel, 1968)
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              Novos conteúdos são fixados quando se ancoram em conceitos já conhecidos. Ao ligar &quot;Proposição&quot; à &quot;Tabela-Verdade&quot;, o estudante transforma regras isoladas em compreensão estrutural.
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-6 space-y-2.5">
            <h3 className="text-base font-bold text-slate-900">
              02. Unidade Semântica de Novak (1970 / 2008)
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              Um mapa conceitual não é apenas um fluxograma visual: cada seta precisa carregar uma frase de ligação explicando a relação conceitual para formar uma proposição legível.
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-6 space-y-2.5">
            <h3 className="text-base font-bold text-slate-900">
              03. Criação pelo Estudante (Condori &amp; Gava et al.)
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              Como destaca Luciano O. Condori, o maior ganho didático ocorre quando o aluno constrói e revisa seu próprio mapa, traçando caminhos não-lineares entre sintaxe, semântica e dedução.
            </p>
          </article>
        </div>
      </section>

      {/* Exportar & Entregar */}
      <section
        id="exportar"
        className="rounded-xl border border-slate-200 bg-white p-6 md:p-8 no-print"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <p className="text-xs font-semibold text-blue-700">
              Exportação e Compartilhamento
            </p>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Salve seu mapa para entregar ou continuar depois
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              Todas as edições ficam salvas automaticamente no navegador. Exporte em SVG vetorial para inserir no trabalho da disciplina ou em JSON para reabrir em outro computador.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onDownloadSvg}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Baixar SVG
            </button>

            <button
              type="button"
              onClick={onExportJson}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileJson className="h-4 w-4" aria-hidden="true" />
              Exportar JSON
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Importar JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              aria-label="Importar arquivo JSON do mapa conceitual"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImportJson(file);
                  e.target.value = '';
                }
              }}
            />

            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Imprimir / PDF
            </button>

            <button
              type="button"
              onClick={onResetCurrentPreset}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Restaurar Modelo
            </button>
          </div>
        </div>

        {importError && (
          <p role="alert" className="mt-4 text-xs font-medium text-red-700">
            {importError}
          </p>
        )}
      </section>

      <footer className="border-t border-slate-200 py-6 text-xs text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 no-print">
        <span>
          LógicaMap · Mapas Conceituais em Lógica Matemática (Novak, Ausubel, Gava/Menezes/Cury &amp; Condori)
        </span>
        <span>Compatível com deploy estático na Vercel</span>
      </footer>
    </div>
  );
}
