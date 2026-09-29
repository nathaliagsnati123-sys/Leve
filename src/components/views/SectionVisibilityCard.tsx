import React, { useState, useEffect } from 'react';
import { useApp, ActiveTab } from '../../context/AppContext';
import { getAvailableSections, isSectionHidden, AppSectionDefinition } from '../../utils/sections';
import { normalizeTreatmentPreference } from '../../utils/treatment';
import { 
  SlidersHorizontal, EyeOff, RotateCcw, Check, 
  Info, ChevronDown, CheckCircle2, ShieldCheck, Save
} from 'lucide-react';

export const SectionVisibilityCard: React.FC = () => {
  const { data, updateUser, showToast } = useApp();
  const currentHiddenSections = (data.user?.hiddenSections || []) as ActiveTab[];
  const treatmentPreference = data.user?.treatmentPreference;
  const pref = normalizeTreatmentPreference(treatmentPreference);

  const [isOpen, setIsOpen] = useState(true);
  const [activeGroupFilter, setActiveGroupFilter] = useState<'all' | 'principal' | 'wellness' | 'management'>('all');
  const [stagedHidden, setStagedHidden] = useState<ActiveTab[]>(() => currentHiddenSections);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setStagedHidden(currentHiddenSections);
  }, [currentHiddenSections]);

  const availableSections = getAvailableSections(treatmentPreference);
  const totalCustomizable = availableSections.filter(s => s.canHide).length;
  const hiddenCount = availableSections.filter(s => s.canHide && stagedHidden.includes(s.id)).length;
  const visibleCount = totalCustomizable - hiddenCount;

  const hasUnsavedChanges = JSON.stringify([...stagedHidden].sort()) !== JSON.stringify([...currentHiddenSections].sort());

  const handleToggle = (sec: AppSectionDefinition) => {
    if (!sec.canHide) return;
    setSavedSuccess(false);
    setStagedHidden(prev => {
      if (prev.includes(sec.id)) {
        return prev.filter(id => id !== sec.id);
      } else {
        return [...prev, sec.id];
      }
    });
  };

  const handleReset = () => {
    setStagedHidden([]);
    setSavedSuccess(false);
  };

  const handleSaveSections = () => {
    updateUser({ hiddenSections: stagedHidden });
    try {
      localStorage.setItem('leve_hidden_sections', JSON.stringify(stagedHidden));
    } catch {}
    setSavedSuccess(true);
    showToast('Personalização de seções salva com sucesso! ✨', 'success');
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3500);
  };

  const groups: { key: 'principal' | 'wellness' | 'management'; label: string; badge: string }[] = [
    { key: 'principal', label: 'Principal', badge: 'Rotina & Foco' },
    { key: 'wellness', label: 'Corpo & Cuidado', badge: 'Saúde & Bem-estar' },
    { key: 'management', label: 'Controle & Avanço', badge: 'Finanças & Métricas' }
  ];

  return (
    <div 
      id="section-visibility-box"
      className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs transition-all duration-200 overflow-hidden"
    >
      {/* Caixinha Clicável Principal */}
      <button
        type="button"
        id="toggle-sections-collapsible-btn"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-stone-50/80 dark:hover:bg-stone-850/50 transition select-none"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
                Personalizar Seções do Menu & Meu Dia
              </h3>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                hiddenCount > 0 
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
              }`}>
                {hiddenCount > 0 ? `${hiddenCount} oculta${hiddenCount > 1 ? 's' : ''}` : 'Todas ativas'}
              </span>
              {hasUnsavedChanges && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 animate-pulse">
                  Alterações não salvas
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
              Escolha quais seções você quer exibir ou ocultar no menu e no painel inicial
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hidden sm:inline">
            {isOpen ? 'Recolher' : 'Personalizar seções'}
          </span>
          <div className={`p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* Conteúdo Expandido com todas as seções */}
      {isOpen && (
        <div className="px-5 pb-6 sm:px-6 sm:pb-7 pt-4 border-t border-stone-100 dark:border-stone-800/80 space-y-5 animate-in fade-in duration-200">
          {/* Subheader, Ações e Botão de Salvar Alterações */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/70 dark:bg-stone-850/60 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-800">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                Selecione o que você quer ver no aplicativo:
              </span>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {visibleCount} de {totalCustomizable} seções ativas. Depois de marcar ou desmarcar, clique no botão para salvar.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-xs font-semibold transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Todas</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveSections}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
                    <span>Salvo!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Salvar Alterações das Seções</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {pref === 'masculino' && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/70 dark:border-cyan-800/50 text-xs text-cyan-900 dark:text-cyan-200">
              <ShieldCheck className="w-4 h-4 text-cyan-700 dark:text-cyan-400 shrink-0" />
              <span>
                <strong>Modo Masculino ativado:</strong> recursos específicos como Ciclo Menstrual já estão ocultados automaticamente.
              </span>
            </div>
          )}

          {/* Abas de Filtro de Categoria */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-2xl overflow-x-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => setActiveGroupFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeGroupFilter === 'all'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Todas ({availableSections.length})
            </button>
            {groups.map(g => (
              <button
                key={g.key}
                type="button"
                onClick={() => setActiveGroupFilter(g.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeGroupFilter === g.key
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Lista de Seções */}
          <div className="space-y-5">
            {groups
              .filter(g => activeGroupFilter === 'all' || activeGroupFilter === g.key)
              .map(group => {
                const groupSections = availableSections.filter(s => s.group === group.key);
                if (groupSections.length === 0) return null;

                return (
                  <div key={group.key} className="space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                        {group.label}
                      </span>
                      <span className="text-[10px] font-medium text-stone-400 dark:text-stone-500">
                        {group.badge}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {groupSections.map(sec => {
                        const Icon = sec.icon;
                        const isHidden = stagedHidden.includes(sec.id);
                        const isPermanent = !sec.canHide;

                        return (
                          <div
                            key={sec.id}
                            id={`section-toggle-card-${sec.id}`}
                            onClick={() => !isPermanent && handleToggle(sec)}
                            className={`p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 select-none ${
                              isPermanent
                                ? 'bg-stone-50/80 dark:bg-stone-850/80 border-stone-200/60 dark:border-stone-800 opacity-90'
                                : isHidden
                                ? 'bg-stone-50/40 dark:bg-stone-900/40 border-stone-200/60 dark:border-stone-800/60 opacity-60 hover:opacity-85 hover:border-stone-300 dark:hover:border-stone-700 cursor-pointer'
                                : 'bg-stone-50/90 dark:bg-stone-800/70 border-stone-200 dark:border-stone-700 hover:bg-stone-100/80 dark:hover:bg-stone-750 cursor-pointer shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className={`p-2 rounded-xl shrink-0 transition ${
                                isPermanent
                                  ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                  : isHidden
                                  ? 'bg-stone-200/70 dark:bg-stone-800 text-stone-400 dark:text-stone-500'
                                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>

                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-xs sm:text-sm font-semibold truncate ${
                                    isHidden 
                                      ? 'text-stone-500 dark:text-stone-400 line-through decoration-stone-400/60' 
                                      : 'text-stone-900 dark:text-stone-100'
                                  }`}>
                                    {sec.label}
                                  </span>
                                  {sec.badge && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800">
                                      {sec.badge}
                                    </span>
                                  )}
                                  {isPermanent && (
                                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-stone-200/70 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                                      Início
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug line-clamp-2">
                                  {sec.description}
                                </p>
                              </div>
                            </div>

                            {/* Interruptor / Switch */}
                            <div className="shrink-0 pt-0.5">
                              {isPermanent ? (
                                <span className="text-[10px] font-medium text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-lg">
                                  Fixo
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggle(sec);
                                  }}
                                  aria-label={isHidden ? `Exibir ${sec.label}` : `Ocultar ${sec.label}`}
                                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 ${
                                    !isHidden ? 'bg-[#1F3A34]' : 'bg-stone-300 dark:bg-stone-700'
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[10px] ${
                                      !isHidden ? 'translate-x-5 text-emerald-800' : 'translate-x-0 text-stone-400'
                                    }`}
                                  >
                                    {!isHidden ? (
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    ) : (
                                      <EyeOff className="w-2.5 h-2.5" />
                                    )}
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Rodapé com botão dedicado de Salvar Alterações */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Nenhum dado é perdido ao ocultar uma seção. Você pode reexibir quando quiser.</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveSections}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F3A34] hover:bg-[#162a26] text-white text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
                    <span>Alterações Salvas com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Salvar Alterações das Seções</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
