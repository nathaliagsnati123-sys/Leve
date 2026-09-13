import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  BookOpen, Heart, Sparkles, Image, Plus, Calendar, 
  Trash2, Smile, Feather, Check, Camera,
  CheckCircle2, TrendingUp, Bookmark, Shield, FileText
} from 'lucide-react';
import { getTodayDateString, formatDateToBrazilian } from '../../services/storage';
import { JournalEntry, Memory } from '../../types';

export const JournalView: React.FC = () => {
  const { data, saveJournalEntry, addMemory, deleteMemory, showToast } = useApp();
  const { treatmentPreference: authPref } = useAuth();
  const pref = authPref || data.user?.treatmentPreference;
  const isMale = pref === 'masculino';
  const todayStr = getTodayDateString();

  const [activeTab, setActiveTab] = useState<'daily' | 'history' | 'memories'>('daily');
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Current entry in view/edit
  const entry: JournalEntry = data.journal[selectedDate] || {
    date: selectedDate,
    gratitude: ['', '', ''],
    goodThings: ['', '', ''],
    specialMoment: '',
    doneForMe: '',
    mindDump: '',
    dayInOneWord: ''
  };

  const [gratitude1, setGratitude1] = useState(entry.gratitude[0] || '');
  const [gratitude2, setGratitude2] = useState(entry.gratitude[1] || '');
  const [gratitude3, setGratitude3] = useState(entry.gratitude[2] || '');

  const [good1, setGood1] = useState(entry.goodThings[0] || '');
  const [good2, setGood2] = useState(entry.goodThings[1] || '');
  const [good3, setGood3] = useState(entry.goodThings[2] || '');

  const [specialMoment, setSpecialMoment] = useState(entry.specialMoment || '');
  const [doneForMe, setDoneForMe] = useState(entry.doneForMe || '');
  const [mindDump, setMindDump] = useState(entry.mindDump || '');
  const [dayInOneWord, setDayInOneWord] = useState(entry.dayInOneWord || '');

  // Memory form
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [memoryTitle, setMemoryTitle] = useState('');
  const [memoryText, setMemoryText] = useState('');
  const [memoryDate, setMemoryDate] = useState(todayStr);
  const [memoryImage, setMemoryImage] = useState('');

  const handleSaveDaily = () => {
    saveJournalEntry({
      date: selectedDate,
      gratitude: [gratitude1, gratitude2, gratitude3],
      goodThings: [good1, good2, good3],
      specialMoment,
      doneForMe,
      mindDump,
      dayInOneWord
    });
    showToast(isMale ? 'Diário de gratidão salvo com sucesso!' : 'Caderno salvo com sucesso! 🤍');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMemoryImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryTitle.trim()) return;

    addMemory({
      title: memoryTitle.trim(),
      date: memoryDate,
      text: memoryText.trim(),
      imageUrl: memoryImage || undefined
    });

    setIsMemoryModalOpen(false);
    setMemoryTitle('');
    setMemoryText('');
    setMemoryImage('');
  };

  const allJournalDates = Object.keys(data.journal || {}).sort().reverse();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${
            isMale 
              ? 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700' 
              : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
          }`}>
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              {isMale ? 'Diário de Gratidão' : 'Meu Caderno & Gratidão'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              {isMale 
                ? 'Registro de gratidão diária, foco mental, conquistas e reflexão pessoal.' 
                : 'Um refúgio para guardar sentimentos bons, momentos especiais e clareza mental.'}
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 rounded-2xl bg-stone-100 dark:bg-stone-800 text-xs">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
              activeTab === 'daily' 
                ? isMale 
                  ? 'bg-[#1F3A34] text-white shadow-xs' 
                  : 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' 
                : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
            }`}
          >
            {isMale ? 'Registro de Hoje' : 'Diário de Hoje'}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
              activeTab === 'history' 
                ? isMale 
                  ? 'bg-[#1F3A34] text-white shadow-xs' 
                  : 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' 
                : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
            }`}
          >
            Histórico ({allJournalDates.length})
          </button>
          <button
            onClick={() => setActiveTab('memories')}
            className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
              activeTab === 'memories' 
                ? isMale 
                  ? 'bg-[#1F3A34] text-white shadow-xs' 
                  : 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' 
                : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
            }`}
          >
            {isMale ? `Memórias & Conquistas (${(data.memories || []).length})` : `Memórias Felizes (${(data.memories || []).length})`}
          </button>
        </div>
      </div>

      {/* 1. DAILY JOURNAL TAB */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Day in One Word banner */}
          <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isMale 
              ? 'bg-stone-50/90 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700' 
              : 'bg-gradient-to-r from-amber-50/70 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200/60 dark:border-amber-900/40'
          }`}>
            <div>
              <span className={`text-xs uppercase tracking-wider font-bold ${
                isMale ? 'text-stone-800 dark:text-stone-200' : 'text-amber-800 dark:text-amber-300'
              }`}>
                {isMale ? 'Palavra do dia' : 'Meu dia em uma palavra'}
              </span>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {isMale 
                  ? 'Qual palavra melhor sintetiza sua postura ou foco de hoje?' 
                  : 'Se você tivesse que resumir a energia de hoje em uma só palavra?'}
              </p>
            </div>
            <input
              type="text"
              value={dayInOneWord}
              onChange={(e) => setDayInOneWord(e.target.value)}
              placeholder={isMale ? 'Ex: Foco, Progresso, Gratidão...' : 'Ex: Paz, Recomeço, Gratidão...'}
              className={`px-4 py-2 rounded-xl bg-white dark:bg-stone-800 border ${
                isMale 
                  ? 'border-stone-300 dark:border-stone-600 focus:ring-stone-400' 
                  : 'border-amber-300 dark:border-amber-700 focus:ring-amber-500/50'
              } text-stone-900 dark:text-stone-100 text-sm font-semibold focus:outline-none focus:ring-2 sm:w-60 text-center`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 3 Coisas pelas quais tenho gratidão */}
            <div className={`bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border ${
              isMale ? 'border-stone-200 dark:border-stone-800' : 'border-stone-200/80 dark:border-stone-800'
            } shadow-xs space-y-3`}>
              <div className="flex items-center gap-2">
                {isMale ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                ) : (
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-400" />
                )}
                <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
                  {isMale ? '3 motivos pelos quais sou grato' : '3 coisas pelas quais tenho gratidão 🤍'}
                </h3>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={gratitude1}
                  onChange={(e) => setGratitude1(e.target.value)}
                  placeholder={isMale ? '1. Sou grato por...' : '1. Gratidão por...'}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 ${
                    isMale ? 'focus:ring-emerald-700/40 focus:border-emerald-700' : 'focus:ring-emerald-600/50'
                  }`}
                />
                <input
                  type="text"
                  value={gratitude2}
                  onChange={(e) => setGratitude2(e.target.value)}
                  placeholder={isMale ? '2. Sou grato por...' : '2. Gratidão por...'}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 ${
                    isMale ? 'focus:ring-emerald-700/40 focus:border-emerald-700' : 'focus:ring-emerald-600/50'
                  }`}
                />
                <input
                  type="text"
                  value={gratitude3}
                  onChange={(e) => setGratitude3(e.target.value)}
                  placeholder={isMale ? '3. Sou grato por...' : '3. Gratidão por...'}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 ${
                    isMale ? 'focus:ring-emerald-700/40 focus:border-emerald-700' : 'focus:ring-emerald-600/50'
                  }`}
                />
              </div>
            </div>

            {/* 3 Coisas boas que aconteceram hoje */}
            <div className={`bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border ${
              isMale ? 'border-stone-200 dark:border-stone-800' : 'border-stone-200/80 dark:border-stone-800'
            } shadow-xs space-y-3`}>
              <div className="flex items-center gap-2">
                {isMale ? (
                  <TrendingUp className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-500" />
                )}
                <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
                  {isMale ? '3 fatos positivos ou vitórias de hoje' : '3 coisas boas de hoje ✨'}
                </h3>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={good1}
                  onChange={(e) => setGood1(e.target.value)}
                  placeholder={isMale ? '1. Uma vitória ou meta cumprida...' : '1. Uma vitória ou sorriso...'}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 ${
                    isMale ? 'focus:ring-emerald-700/40 focus:border-emerald-700' : 'focus:ring-emerald-600/50'
                  }`}
                />
                <input
                  type="text"
                  value={good2}
                  onChange={(e) => setGood2(e.target.value)}
                  placeholder={isMale ? '2. Algo positivo que produzi ou vivenciei...' : '2. Algo que me alegrou...'}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 ${
                    isMale ? 'focus:ring-emerald-700/40 focus:border-emerald-700' : 'focus:ring-emerald-600/50'
                  }`}
                />
                <input
                  type="text"
                  value={good3}
                  onChange={(e) => setGood3(e.target.value)}
                  placeholder={isMale ? '3. Uma conversa produtiva ou momento de tranquilidade...' : '3. Uma conversa gostosa...'}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 ${
                    isMale ? 'focus:ring-emerald-700/40 focus:border-emerald-700' : 'focus:ring-emerald-600/50'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* O momento mais especial */}
            <div className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                {isMale ? (
                  <Bookmark className="w-4 h-4 text-stone-700 dark:text-stone-300" />
                ) : null}
                <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
                  {isMale ? 'Momento mais marcante do dia' : 'O momento mais especial do dia 🌟'}
                </h3>
              </div>
              <textarea
                rows={3}
                value={specialMoment}
                onChange={(e) => setSpecialMoment(e.target.value)}
                placeholder={isMale ? 'O melhor momento ou aprendizado principal do dia de hoje...' : 'Aquele instante que merecia ser congelado no tempo...'}
                className="w-full p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 resize-none"
              />
            </div>

            {/* O que fiz por mim hoje */}
            <div className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                {isMale ? (
                  <Shield className="w-4 h-4 text-stone-700 dark:text-stone-300" />
                ) : null}
                <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
                  {isMale ? 'O que fiz por mim hoje' : 'O que fiz por mim hoje 🌿'}
                </h3>
              </div>
              <textarea
                rows={3}
                value={doneForMe}
                onChange={(e) => setDoneForMe(e.target.value)}
                placeholder={isMale ? 'Treinei firme, descansei a mente, mantive a disciplina, me alimentei com qualidade...' : 'Parei 10 minutos, comi com calma, cuidei da minha pele, descansei...'}
                className="w-full p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 resize-none"
              />
            </div>
          </div>

          {/* Desabafo livre */}
          <div className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isMale ? (
                  <FileText className="w-4 h-4 text-stone-700 dark:text-stone-300" />
                ) : null}
                <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
                  {isMale ? 'Reflexão livre / Registro mental' : 'Desabafo livre / Tirar da mente 📝'}
                </h3>
              </div>
              <span className="text-xs text-stone-400">Totalmente privado no seu aparelho</span>
            </div>
            <textarea
              rows={5}
              value={mindDump}
              onChange={(e) => setMindDump(e.target.value)}
              placeholder={isMale ? 'Escreva com total sinceridade. Pensamentos soltos, ideias, reflexões do dia e planos...' : 'Escreva como você está se sentindo de verdade. Sem filtros, sem julgamentos...'}
              className="w-full p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 leading-relaxed resize-none"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveDaily}
              className="px-6 py-3 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] text-xs sm:text-sm font-semibold transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isMale ? 'Salvar Diário de Hoje' : 'Salvar Caderno de Hoje'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
              {isMale ? 'Registros anteriores do diário' : 'Páginas passadas do seu caderno'}
            </h3>

            {allJournalDates.length > 0 ? (
              <div className="space-y-3">
                {allJournalDates.map((dateKey) => {
                  const j = data.journal[dateKey];
                  return (
                    <div
                      key={dateKey}
                      className="p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 pb-2">
                        <span className="font-serif font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                          {formatDateToBrazilian(dateKey)}
                        </span>
                        {j.dayInOneWord && (
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isMale 
                              ? 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200' 
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          }`}>
                            "{j.dayInOneWord}"
                          </span>
                        )}
                      </div>

                      {j.gratitude.some(Boolean) && (
                        <div className="text-xs text-stone-600 dark:text-stone-300 space-y-0.5">
                          <p className="font-semibold text-stone-800 dark:text-stone-200">
                            {isMale ? 'Motivos de gratidão:' : 'Gratidão:'}
                          </p>
                          {j.gratitude.filter(Boolean).map((g, idx) => (
                            <p key={idx} className="pl-2 italic">• {g}</p>
                          ))}
                        </div>
                      )}

                      {j.specialMoment && (
                        <div className="text-xs text-stone-600 dark:text-stone-300 pt-1">
                          <p className="font-semibold text-stone-800 dark:text-stone-200">
                            {isMale ? 'Momento marcante:' : 'Momento especial:'}
                          </p>
                          <p className="pl-2 italic">{j.specialMoment}</p>
                        </div>
                      )}

                      {j.mindDump && (
                        <div className="text-xs text-stone-600 dark:text-stone-300 pt-1">
                          <p className="font-semibold text-stone-800 dark:text-stone-200">
                            {isMale ? 'Reflexões e notas:' : 'Anotações:'}
                          </p>
                          <p className="pl-2 whitespace-pre-wrap">{j.mindDump}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic py-8 text-center">
                {isMale 
                  ? 'Você ainda não salvou nenhum registro no diário. Comece registrando o seu dia de hoje!' 
                  : 'Você ainda não salvou nenhuma página do caderno. Comece registrando seu dia de hoje!'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 3. MEMORIES TAB */}
      {activeTab === 'memories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                {isMale ? 'Registro de Memórias & Conquistas' : 'Álbum de Memórias Felizes 🌸'}
              </h3>
              <p className="text-xs text-stone-400">
                {isMale 
                  ? 'Guarde registros de momentos importantes, fotos e conquistas para acompanhar sua trajetória.' 
                  : 'Guarde lembranças boas para revisitar quando precisar de um abraço na alma.'}
              </p>
            </div>
            <button
              onClick={() => setIsMemoryModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isMale ? 'Novo registro' : 'Nova memória'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(data.memories || []).map((mem) => (
              <div
                key={mem.id}
                className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs overflow-hidden flex flex-col justify-between"
              >
                {mem.imageUrl && (
                  <div className="h-44 w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
                    <img
                      src={mem.imageUrl}
                      alt={mem.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-stone-400 font-medium">
                      {formatDateToBrazilian(mem.date)}
                    </span>
                    <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                      {mem.title}
                    </h4>
                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                      {mem.text}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-end">
                    <button
                      onClick={() => {
                        deleteMemory(mem.id);
                      }}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title={isMale ? 'Excluir registro' : 'Excluir memória'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(!data.memories || data.memories.length === 0) && (
            <p className="text-xs text-stone-400 italic py-8 text-center">
              {isMale 
                ? 'Nenhum registro salvo ainda. Guarde fotos e momentos de conquista para acompanhar sua evolução.' 
                : 'Nenhuma memória salva ainda. Guarde fotos e momentos felizes para revisitar sempre! 🌸'}
            </p>
          )}

          {/* New Memory Modal */}
          {isMemoryModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
              <div className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4 my-8 text-stone-900 dark:text-stone-100">
                <h3 className="font-serif text-lg font-bold">
                  {isMale ? 'Registrar Nova Memória / Conquista' : 'Guardar Nova Memória'}
                </h3>
                <form onSubmit={handleAddMemory} className="space-y-3 text-xs sm:text-sm">
                  <div className="space-y-1">
                    <label className="font-medium text-stone-700 dark:text-stone-300">
                      {isMale ? 'Título da memória / conquista' : 'Título do momento'}
                    </label>
                    <input
                      type="text"
                      required
                      value={memoryTitle}
                      onChange={(e) => setMemoryTitle(e.target.value)}
                      placeholder={isMale ? 'Ex: Conquista profissional, viagem marcante, encontro com amigos...' : 'Ex: Tarde de café com a vó, Pôr do sol no parque...'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-stone-700 dark:text-stone-300">Data</label>
                    <input
                      type="date"
                      required
                      value={memoryDate}
                      onChange={(e) => setMemoryDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-stone-700 dark:text-stone-300">
                      {isMale ? 'Detalhes ou reflexão' : 'O que aconteceu?'}
                    </label>
                    <textarea
                      rows={3}
                      value={memoryText}
                      onChange={(e) => setMemoryText(e.target.value)}
                      placeholder={isMale ? 'Descreva os detalhes, o contexto, conquistas e significado...' : 'Descreva as risadas, os detalhes, os sentimentos...'}
                      className="w-full p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Foto opcional</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full text-xs text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                  </div>

                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMemoryModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold cursor-pointer"
                    >
                      {isMale ? 'Salvar Registro' : 'Guardar Memória'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
