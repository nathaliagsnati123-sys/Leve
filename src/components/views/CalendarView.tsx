import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, 
  Clock, Check, CheckCircle2, List, Grid3X3, Columns 
} from 'lucide-react';
import { getTodayDateString, formatDateToBrazilian } from '../../services/storage';
import { Task } from '../../types';

export const CalendarView: React.FC = () => {
  const { data, toggleTaskCompleted, openNewTaskModal, openEditTaskModal } = useApp();
  const todayStr = getTodayDateString();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(todayStr);
  };

  // Month grid calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Domingo
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Days array
  const calendarDays: { dayNumber: number; dateStr: string; isCurrentMonth: boolean }[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    const prevMonthDays = new Date(year, month, 0).getDate();
    const day = prevMonthDays - firstDayOfMonth + i + 1;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({ dayNumber: day, dateStr, isCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({ dayNumber: day, dateStr, isCurrentMonth: true });
  }

  // Week days calculation (selected date's week)
  const currentSelectedObj = new Date(selectedDate + 'T12:00:00');
  const dayOfWeek = currentSelectedObj.getDay(); // 0 = Sunday
  const weekStart = new Date(currentSelectedObj);
  weekStart.setDate(currentSelectedObj.getDate() - dayOfWeek);

  const weekDays: { dateStr: string; dayName: string; dayNum: number }[] = [];
  const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    weekDays.push({
      dateStr: dStr,
      dayName: weekDayNames[i],
      dayNum: d.getDate()
    });
  }

  // Tasks for selected date
  const selectedDateTasks = data.tasks.filter((t) => t.date === selectedDate);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#1F3A34] text-emerald-200">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
              {monthNames[month]} de {year}
            </h1>
            <p className="text-xs text-stone-400">
              Planejamento visual de tarefas e compromissos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`p-1.5 rounded-lg flex items-center gap-1 font-medium transition ${
                viewMode === 'month' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500'
              }`}
              title="Visão Mensal"
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="hidden sm:inline">Mês</span>
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`p-1.5 rounded-lg flex items-center gap-1 font-medium transition ${
                viewMode === 'week' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500'
              }`}
              title="Visão Semanal"
            >
              <Columns className="w-4 h-4" />
              <span className="hidden sm:inline">Semana</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg flex items-center gap-1 font-medium transition ${
                viewMode === 'list' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500'
              }`}
              title="Visão Lista"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 transition"
            >
              Hoje
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={openNewTaskModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] text-xs font-semibold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova tarefa</span>
          </button>
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase tracking-wider text-stone-400">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((cd, idx) => {
              const isToday = cd.dateStr === todayStr;
              const isSelected = cd.dateStr === selectedDate;
              const dayTasks = data.tasks.filter((t) => t.date === cd.dateStr);
              const pendingCount = dayTasks.filter((t) => !t.completed).length;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(cd.dateStr)}
                  className={`min-h-[70px] sm:min-h-[85px] p-2 rounded-2xl border text-left flex flex-col justify-between transition ${
                    isSelected
                      ? 'ring-2 ring-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700'
                      : isToday
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700'
                      : cd.isCurrentMonth
                      ? 'bg-stone-50/50 dark:bg-stone-800/40 border-stone-200/70 dark:border-stone-700/60 hover:bg-stone-100 dark:hover:bg-stone-800'
                      : 'bg-transparent border-transparent opacity-30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs sm:text-sm font-semibold ${
                      isToday ? 'text-amber-700 dark:text-amber-400 font-bold' : 'text-stone-700 dark:text-stone-300'
                    }`}>
                      {cd.dayNumber}
                    </span>
                    {pendingCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-[9px] font-bold text-white flex items-center justify-center">
                        {pendingCount}
                      </span>
                    )}
                  </div>

                  {/* Task mini dots */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {dayTasks.slice(0, 3).map((t) => (
                      <span
                        key={t.id}
                        className={`w-1.5 h-1.5 rounded-full ${
                          t.completed ? 'bg-stone-400' : 'bg-emerald-500'
                        }`}
                        title={t.title}
                      />
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-[9px] text-stone-400 leading-none">+{dayTasks.length - 3}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((wd) => {
              const isToday = wd.dateStr === todayStr;
              const isSelected = wd.dateStr === selectedDate;
              const dayTasks = data.tasks.filter((t) => t.date === wd.dateStr);

              return (
                <div
                  key={wd.dateStr}
                  onClick={() => setSelectedDate(wd.dateStr)}
                  className={`p-3 rounded-2xl border cursor-pointer transition min-h-[160px] flex flex-col justify-between ${
                    isSelected
                      ? 'ring-2 ring-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-300'
                      : isToday
                      ? 'border-amber-300 bg-amber-50/30'
                      : 'border-stone-200 dark:border-stone-700 bg-stone-50/40 dark:bg-stone-800/40 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      {wd.dayName}
                    </span>
                    <span className={`text-sm font-bold ${isToday ? 'text-amber-600' : 'text-stone-900 dark:text-stone-100'}`}>
                      {wd.dayNum}
                    </span>
                  </div>

                  <div className="space-y-1.5 my-2 overflow-y-auto max-h-36">
                    {dayTasks.map((t) => (
                      <div
                        key={t.id}
                        className={`text-[11px] p-1.5 rounded-lg truncate ${
                          t.completed
                            ? 'bg-stone-100 dark:bg-stone-700 text-stone-400 line-through'
                            : 'bg-white dark:bg-stone-700/80 text-stone-800 dark:text-stone-200 shadow-xs'
                        }`}
                      >
                        {t.title}
                      </div>
                    ))}
                  </div>

                  <span className="text-[10px] text-stone-400 text-right">
                    {dayTasks.length} {dayTasks.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <h2 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
            Próximos Compromissos & Tarefas
          </h2>
          <div className="space-y-2">
            {data.tasks
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
                >
                  <div className="flex items-center gap-3 truncate flex-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskCompleted(t.id);
                      }}
                      className="p-2 -m-2 touch-manipulation flex items-center justify-center min-w-[40px] min-h-[40px] flex-shrink-0"
                      aria-label={t.completed ? "Desmarcar tarefa" : "Marcar tarefa como concluída"}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                          t.completed ? 'bg-emerald-600 text-white' : 'border-2 border-stone-300 dark:border-stone-600'
                        }`}
                      >
                        {t.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                    <div className="truncate flex-1">
                      <p className={`text-xs sm:text-sm font-medium ${t.completed ? 'line-through text-stone-400' : ''}`}>
                        {t.title}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {formatDateToBrazilian(t.date)} {t.time ? `às ${t.time}` : ''} • {t.category}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => openEditTaskModal(t)}
                    className="text-xs text-stone-400 hover:text-stone-700 px-2 py-1 rounded"
                  >
                    Editar
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* SELECTED DATE DETAILS DRAWER / PANEL */}
      <div className="bg-stone-50 dark:bg-stone-850 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
              Tarefas de {formatDateToBrazilian(selectedDate)}
            </h3>
            <p className="text-xs text-stone-400">
              {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'tarefa' : 'tarefas'} agendada(s)
            </p>
          </div>
          <button
            onClick={openNewTaskModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar neste dia</span>
          </button>
        </div>

        {selectedDateTasks.length > 0 ? (
          <div className="space-y-2">
            {selectedDateTasks.map((t) => (
              <div
                key={t.id}
                className="p-3 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 truncate flex-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskCompleted(t.id);
                    }}
                    className="p-2 -m-2 touch-manipulation flex items-center justify-center min-w-[40px] min-h-[40px] flex-shrink-0"
                    aria-label={t.completed ? "Desmarcar tarefa" : "Marcar tarefa como concluída"}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                        t.completed ? 'bg-emerald-600 text-white' : 'border-2 border-stone-300 dark:border-stone-600'
                      }`}
                    >
                      {t.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                  <div className="truncate flex-1">
                    <p className={`text-xs sm:text-sm font-medium ${t.completed ? 'line-through text-stone-400' : ''}`}>
                      {t.title}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {t.category} {t.time ? `• ${t.time}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openEditTaskModal(t)}
                  className="text-xs text-stone-400 hover:text-stone-700"
                >
                  Editar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-400 italic py-2">
            Nenhuma tarefa cadastrada para esta data.
          </p>
        )}
      </div>
    </div>
  );
};
