import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  HeartHandshake, Sparkles, Plus, Check, Heart, 
  BookOpen, Clock, Calendar, CheckCircle2, Trash2, X 
} from 'lucide-react';
import { SCRIPTURE_VERSES } from '../../services/quotesAndVerses';
import { getTodayDateString, formatDateToBrazilian } from '../../services/storage';
import { Prayer, Devotional, PrayerCategory } from '../../types';

export const SpiritualityView: React.FC = () => {
  const { 
    data, 
    setIsFiveMinGodOpen, 
    addPrayer, 
    updatePrayer, 
    deletePrayer,
    addDevotional,
    showToast 
  } = useApp();

  const todayStr = getTodayDateString();
  const dayIndex = new Date().getDate() % SCRIPTURE_VERSES.length;
  const dailyVerse = SCRIPTURE_VERSES[dayIndex];

  const [activeTab, setActiveTab] = useState<'prayers' | 'devotional' | 'history'>('prayers');

  // Prayer Modal
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);
  const [prayerContent, setPrayerContent] = useState('');
  const [prayerCategory, setPrayerCategory] = useState<PrayerCategory>('Família');

  // Answered prayer modal
  const [answeringPrayer, setAnsweringPrayer] = useState<Prayer | null>(null);
  const [testimony, setTestimony] = useState('');

  // Devotional form
  const [devotionalPassage, setDevotionalPassage] = useState('');
  const [devotionalLearned, setDevotionalLearned] = useState('');
  const [devotionalApply, setDevotionalApply] = useState('');

  const handleSavePrayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerContent.trim()) return;

    addPrayer({
      content: prayerContent.trim(),
      category: prayerCategory,
      date: todayStr,
      answered: false
    });

    setIsPrayerModalOpen(false);
    setPrayerContent('');
  };

  const handleSaveAnswered = () => {
    if (!answeringPrayer) return;
    updatePrayer({
      ...answeringPrayer,
      answered: true,
      answeredDate: todayStr,
      testimony: testimony.trim() || undefined
    });
    setAnsweringPrayer(null);
    setTestimony('');
    showToast('Oração marcada como respondida! Glória a Deus! ✨');
  };

  const handleSaveDevotional = (e: React.FormEvent) => {
    e.preventDefault();
    if (!devotionalPassage.trim()) return;

    addDevotional({
      date: todayStr,
      passage: devotionalPassage.trim(),
      whatILearned: devotionalLearned.trim(),
      howToApply: devotionalApply.trim()
    });

    setDevotionalPassage('');
    setDevotionalLearned('');
    setDevotionalApply('');
    showToast('Devocional salvo no seu histórico! 📖');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#1C332C] via-[#224037] to-[#152621] text-white p-6 sm:p-8 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🕊️</span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-emerald-50">
                Fé & Momento com Deus
              </h1>
            </div>
            <p className="font-serif italic text-emerald-100/90 text-sm sm:text-base max-w-xl leading-relaxed">
              "{dailyVerse.verse}"
            </p>
            <p className="text-[11px] uppercase tracking-widest text-emerald-300 font-semibold">
              — {dailyVerse.reference}
            </p>
          </div>

          <button
            onClick={() => setIsFiveMinGodOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-emerald-950 hover:bg-emerald-50 text-xs sm:text-sm font-semibold transition shadow-md self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <span>5 Minutos com Deus</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
        <button
          onClick={() => setActiveTab('prayers')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeTab === 'prayers'
              ? 'bg-[#1F3A34] text-white'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          Caderno de Orações ({(data.prayers || []).length})
        </button>
        <button
          onClick={() => setActiveTab('devotional')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeTab === 'devotional'
              ? 'bg-[#1F3A34] text-white'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          Devocional & Leitura ({(data.devotionals || []).length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeTab === 'history'
              ? 'bg-[#1F3A34] text-white'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          Momentos com Deus ({(data.fiveMinuteSessions || []).length})
        </button>
      </div>

      {/* 1. CADERNO DE ORAÇÕES */}
      {activeTab === 'prayers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                Meus Clamores e Agradecimentos
              </h3>
              <p className="text-xs text-stone-400">
                Guarde cada pedido no altar. Deus ouve cada sussurro do seu coração.
              </p>
            </div>
            <button
              onClick={() => setIsPrayerModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova oração</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.prayers.map((prayer) => (
              <div
                key={prayer.id}
                className={`p-5 rounded-3xl border transition flex flex-col justify-between space-y-3 ${
                  prayer.answered
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40'
                    : 'bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {prayer.category}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {formatDateToBrazilian(prayer.date)}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 font-serif leading-relaxed">
                    "{prayer.content}"
                  </p>

                  {prayer.answered && prayer.testimony && (
                    <div className="p-3 rounded-2xl bg-amber-100/60 dark:bg-amber-900/40 text-amber-950 dark:text-amber-200 text-xs italic space-y-1">
                      <span className="font-semibold not-italic text-[10px] uppercase tracking-wider block text-amber-800 dark:text-amber-300">
                        Testemunho da resposta ✨
                      </span>
                      "{prayer.testimony}"
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                  {prayer.answered ? (
                    <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Respondida em {prayer.answeredDate ? formatDateToBrazilian(prayer.answeredDate) : 'paz'}</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => setAnsweringPrayer(prayer)}
                      className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                    >
                      Marcar como respondida ✨
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (window.confirm('Excluir esta oração?')) deletePrayer(prayer.id);
                    }}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg"
                    title="Excluir oração"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* New Prayer Modal */}
          {isPrayerModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
              <div className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4 my-8 text-stone-900 dark:text-stone-100">
                <h3 className="font-serif text-lg font-bold">Colocar em Oração 🙏</h3>
                <form onSubmit={handleSavePrayer} className="space-y-3 text-xs sm:text-sm">
                  <div className="space-y-1">
                    <label className="font-medium text-stone-700 dark:text-stone-300">Motivo</label>
                    <select
                      value={prayerCategory}
                      onChange={(e) => setPrayerCategory(e.target.value as PrayerCategory)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                    >
                      <option value="Família">Família</option>
                      <option value="Saúde">Saúde</option>
                      <option value="Gratidão">Gratidão</option>
                      <option value="Decisão">Decisão / Direcionamento</option>
                      <option value="Paz">Paz interior</option>
                      <option value="Trabalho">Trabalho / Projetos</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-stone-700 dark:text-stone-300">
                      Sua oração
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={prayerContent}
                      onChange={(e) => setPrayerContent(e.target.value)}
                      placeholder="Senhor, coloco diante de Ti..."
                      className="w-full p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 resize-none"
                    />
                  </div>

                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPrayerModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold"
                    >
                      Guardar em Oração
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Answered Prayer Modal */}
          {answeringPrayer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
              <div className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4 my-8 text-stone-900 dark:text-stone-100">
                <h3 className="font-serif text-lg font-bold">Oração Respondida ✨</h3>
                <p className="text-xs text-stone-500">
                  Como Deus agiu nessa situação? Deixe registrado como memorial de fé.
                </p>
                <textarea
                  rows={4}
                  value={testimony}
                  onChange={(e) => setTestimony(e.target.value)}
                  placeholder="Escreva como foi a resposta ou o que você sentiu..."
                  className="w-full p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setAnsweringPrayer(null)}
                    className="px-4 py-2 text-xs text-stone-500 hover:text-stone-700"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleSaveAnswered}
                    className="px-5 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 text-xs font-semibold"
                  >
                    Registrar Resposta
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. DEVOCIONAL & LEITURA */}
      {activeTab === 'devotional' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
              Registrar Devocional de Hoje 📖
            </h3>

            <form onSubmit={handleSaveDevotional} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  Passagem Bíblica lida
                </label>
                <input
                  type="text"
                  required
                  value={devotionalPassage}
                  onChange={(e) => setDevotionalPassage(e.target.value)}
                  placeholder="Ex: Salmos 23 ou Filipenses 4:6-7..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  O que aprendi hoje?
                </label>
                <textarea
                  rows={3}
                  value={devotionalLearned}
                  onChange={(e) => setDevotionalLearned(e.target.value)}
                  placeholder="A mensagem principal que tocou meu coração..."
                  className="w-full p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  O que posso aplicar na minha vida prática?
                </label>
                <textarea
                  rows={3}
                  value={devotionalApply}
                  onChange={(e) => setDevotionalApply(e.target.value)}
                  placeholder="Uma atitude, pensamento ou mudança concreta..."
                  className="w-full p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold"
                >
                  Salvar Devocional
                </button>
              </div>
            </form>
          </div>

          {/* Devotionals History */}
          <div className="space-y-3">
            <h4 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
              Devocionais Anteriores
            </h4>
            {(data.devotionals || []).map((dev) => (
              <div
                key={dev.id}
                className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-2 text-xs sm:text-sm"
              >
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 font-serif">
                    {dev.passage}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {formatDateToBrazilian(dev.date)}
                  </span>
                </div>
                {dev.whatILearned && (
                  <p className="text-stone-700 dark:text-stone-300">
                    <strong>Aprendizado:</strong> {dev.whatILearned}
                  </p>
                )}
                {dev.howToApply && (
                  <p className="text-stone-700 dark:text-stone-300">
                    <strong>Aplicação prática:</strong> {dev.howToApply}
                  </p>
                )}
              </div>
            ))}
            {(!data.devotionals || data.devotionals.length === 0) && (
              <p className="text-xs text-stone-400 italic py-4 text-center">
                Nenhum devocional registrado ainda. Que tal ler um trecho hoje? 🌿
              </p>
            )}
          </div>
        </div>
      )}

      {/* 3. 5 MINUTOS COM DEUS HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
              Histórico dos 5 Minutos com Deus
            </h3>
            <button
              onClick={() => setIsFiveMinGodOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#1F3A34] text-white text-xs font-semibold hover:bg-[#162A25]"
            >
              Iniciar novo momento
            </button>
          </div>

          {(data.fiveMinuteSessions || []).length > 0 ? (
            <div className="space-y-3">
              {(data.fiveMinuteSessions || []).map((session) => (
                <div
                  key={session.id}
                  className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-2 text-xs sm:text-sm"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                    <span className="font-bold text-emerald-900 dark:text-emerald-300">
                      🕊️ {formatDateToBrazilian(session.date)}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {session.scriptureReference}
                    </span>
                  </div>

                  {session.gratitude && (
                    <p className="text-stone-600 dark:text-stone-300">
                      <strong>🤍 Gratidão:</strong> {session.gratitude}
                    </p>
                  )}
                  {session.surrender && (
                    <p className="text-stone-600 dark:text-stone-300">
                      <strong>🙏 Entrega:</strong> {session.surrender}
                    </p>
                  )}
                  {session.petition && (
                    <p className="text-stone-600 dark:text-stone-300">
                      <strong>🌱 Pedido:</strong> {session.petition}
                    </p>
                  )}
                  {session.reflection && (
                    <p className="text-stone-600 dark:text-stone-300 italic">
                      <strong>📖 Reflexão:</strong> "{session.reflection}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 italic py-8 text-center">
              Nenhum momento com Deus registrado ainda. Clique no botão acima para viver essa pausa abençoada.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
