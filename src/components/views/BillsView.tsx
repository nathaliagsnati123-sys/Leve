import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Receipt, Plus, Check, Trash2, TrendingUp, 
  ArrowDownRight, ArrowUpRight, Wallet, 
  Sparkles, Calendar, DollarSign, X, CheckCircle2,
  PieChart, ShieldCheck
} from 'lucide-react';
import { formatDateToBrazilian, getTodayDateString } from '../../services/storage';
import { Bill, BillCategory, Income, IncomeCategory } from '../../types';

export const BillsView: React.FC = () => {
  const { 
    data, 
    addBill, 
    toggleBillPaid, 
    deleteBill, 
    addIncome, 
    toggleIncomeReceived, 
    deleteIncome, 
    showToast 
  } = useApp();
  
  const todayStr = getTodayDateString();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'bills' | 'incomes' | 'summary'>('bills');

  // Filter state
  const [billFilter, setBillFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [incomeFilter, setIncomeFilter] = useState<'all' | 'received' | 'pending'>('all');

  // New Bill Modal State
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDueDate, setBillDueDate] = useState(todayStr);
  const [billCategory, setBillCategory] = useState<BillCategory>('Contas básicas');

  // New Income Modal State
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeDescription, setIncomeDescription] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDate, setIncomeDate] = useState(todayStr);
  const [incomeCategory, setIncomeCategory] = useState<IncomeCategory>('Salário');
  const [incomeReceived, setIncomeReceived] = useState(true);
  const [incomeNotes, setIncomeNotes] = useState('');

  // Financial calculations
  const billsList = data.bills || [];
  const incomesList = data.incomes || [];

  const totalBillsAmount = billsList.reduce((acc, b) => acc + (b.amount || 0), 0);
  const totalBillsPaid = billsList.filter((b) => b.paid).reduce((acc, b) => acc + (b.amount || 0), 0);
  const totalBillsPending = billsList.filter((b) => !b.paid).reduce((acc, b) => acc + (b.amount || 0), 0);

  const totalIncomesAmount = incomesList.reduce((acc, i) => acc + (i.amount || 0), 0);
  const totalIncomesReceived = incomesList.filter((i) => i.received).reduce((acc, i) => acc + (i.amount || 0), 0);
  const totalIncomesPending = incomesList.filter((i) => !i.received).reduce((acc, i) => acc + (i.amount || 0), 0);

  // Projected balance: total income - total bills
  const projectedBalance = totalIncomesAmount - totalBillsAmount;
  // Current available balance: already received income - already paid bills
  const currentPocketBalance = totalIncomesReceived - totalBillsPaid;
  // Remaining after paying all pending bills from received income
  const netRemainingAfterPending = totalIncomesReceived - totalBillsPending;

  // Percentage of income committed to bills
  const commitmentRatio = totalIncomesAmount > 0 
    ? Math.min(Math.round((totalBillsAmount / totalIncomesAmount) * 100), 100) 
    : 0;

  const billCategories: BillCategory[] = [
    'Moradia', 'Contas básicas', 'Cartão / Bancos', 'Assinaturas / Lazer', 'Educação', 'Saúde', 'Casa', 'Estudos', 'Outros'
  ];

  const incomeCategories: IncomeCategory[] = [
    'Salário', 'Freelance / Serviços', 'Vendas', 'Renda Extra', 'Investimentos / Rendimentos', 'Presente / Benefício', 'Outros'
  ];

  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(billAmount.replace(',', '.'));
    if (!billName.trim() || isNaN(val) || val <= 0) return;

    addBill({
      name: billName.trim(),
      amount: val,
      dueDate: billDueDate,
      category: billCategory,
      paid: false,
      status: 'pendente'
    });

    setIsBillModalOpen(false);
    setBillName('');
    setBillAmount('');
  };

  const handleSaveIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(incomeAmount.replace(',', '.'));
    if (!incomeDescription.trim() || isNaN(val) || val <= 0) return;

    addIncome({
      description: incomeDescription.trim(),
      amount: val,
      date: incomeDate,
      category: incomeCategory,
      received: incomeReceived,
      notes: incomeNotes.trim() || undefined
    });

    setIsIncomeModalOpen(false);
    setIncomeDescription('');
    setIncomeAmount('');
    setIncomeNotes('');
    setIncomeReceived(true);
  };

  // Filtered lists
  const filteredBills = billsList.filter((b) => {
    if (billFilter === 'paid') return b.paid;
    if (billFilter === 'pending') return !b.paid;
    if (billFilter === 'overdue') return !b.paid && b.dueDate < todayStr;
    return true;
  }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const filteredIncomes = incomesList.filter((i) => {
    if (incomeFilter === 'received') return i.received;
    if (incomeFilter === 'pending') return !i.received;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              Contas & Organização Financeira
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Registre suas receitas, acompanhe seus boletos e saiba exatamente o que sobra para você.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-add-income"
            onClick={() => setIsIncomeModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold transition shadow-xs"
          >
            <TrendingUp className="w-4 h-4" />
            <span>+ Registrar Ganho</span>
          </button>

          <button
            id="btn-add-bill"
            onClick={() => setIsBillModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-xs sm:text-sm font-semibold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nova Conta</span>
          </button>
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Incomes */}
        <div className="p-5 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Total de Entradas / Ganhos
            </span>
            <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-serif text-emerald-950 dark:text-emerald-100 mt-2">
            R$ {totalIncomesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-emerald-700 dark:text-emerald-300">
            <span>R$ {totalIncomesReceived.toFixed(2)} já recebido</span>
            {totalIncomesPending > 0 && (
              <span className="text-[11px] bg-emerald-200/60 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full font-medium">
                +R$ {totalIncomesPending.toFixed(2)} a receber
              </span>
            )}
          </div>
        </div>

        {/* Total Bills */}
        <div className="p-5 rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Total de Contas / Saídas
            </span>
            <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-serif text-amber-950 dark:text-amber-100 mt-2">
            R$ {totalBillsAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-amber-800 dark:text-amber-300">
            <span>R$ {totalBillsPaid.toFixed(2)} pagas</span>
            <span className="font-semibold text-amber-900 dark:text-amber-200">
              • R$ {totalBillsPending.toFixed(2)} a pagar
            </span>
          </div>
        </div>

        {/* Projected Net Balance */}
        <div className={`p-5 rounded-3xl border shadow-xs relative overflow-hidden ${
          projectedBalance >= 0
            ? 'bg-stone-50 dark:bg-stone-900/80 border-stone-200/80 dark:border-stone-800'
            : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/60'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Saldo Previsto (Sobra)
            </span>
            <div className={`p-1.5 rounded-xl ${
              projectedBalance >= 0 
                ? 'bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300' 
                : 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300'
            }`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold font-serif mt-2 ${
            projectedBalance >= 0 
              ? 'text-emerald-700 dark:text-emerald-400' 
              : 'text-rose-600 dark:text-rose-400'
          }`}>
            {projectedBalance >= 0 ? '+' : ''}R$ {projectedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {projectedBalance >= 0 ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                ✨ Suas receitas cobrem todas as contas cadastradas!
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                ⚠️ Contas superam a renda cadastrada em R$ {Math.abs(projectedBalance).toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar of Budget Commitment */}
      {totalIncomesAmount > 0 && (
        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold text-stone-700 dark:text-stone-300">
              Comprometimento da Renda
            </span>
            <span className="text-stone-500 dark:text-stone-400 font-medium">
              {commitmentRatio}% da sua renda está alocada para contas ({billsList.filter((b) => b.paid).length} de {billsList.length} contas quitadas)
            </span>
          </div>
          <div className="w-full bg-stone-100 dark:bg-stone-800 h-3 rounded-full overflow-hidden flex">
            <div 
              className="bg-emerald-600 transition-all duration-300"
              style={{ width: `${totalIncomesAmount > 0 ? Math.min((totalBillsPaid / totalIncomesAmount) * 100, 100) : 0}%` }}
              title={`Pago: R$ ${totalBillsPaid.toFixed(2)}`}
            />
            <div 
              className="bg-amber-400 transition-all duration-300"
              style={{ width: `${totalIncomesAmount > 0 ? Math.min((totalBillsPending / totalIncomesAmount) * 100, 100) : 0}%` }}
              title={`Pendente: R$ ${totalBillsPending.toFixed(2)}`}
            />
          </div>
          <div className="flex items-center gap-4 text-[11px] text-stone-500 dark:text-stone-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              Pago (R$ {totalBillsPaid.toFixed(2)})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Pendente (R$ {totalBillsPending.toFixed(2)})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-200 dark:bg-stone-700" />
              Livre / Poupança (R$ {Math.max(projectedBalance, 0).toFixed(2)})
            </span>
          </div>
        </div>
      )}

      {/* Navigation tabs between Contas, Entradas, and Balanço */}
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
        <div className="flex items-center gap-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-2xl">
          <button
            id="tab-bills"
            onClick={() => setActiveTab('bills')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'bills'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Contas a Pagar ({billsList.length})
          </button>

          <button
            id="tab-incomes"
            onClick={() => setActiveTab('incomes')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'incomes'
                ? 'bg-white dark:bg-stone-700 text-emerald-900 dark:text-emerald-200 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Ganhos & Receitas ({incomesList.length})
          </button>

          <button
            id="tab-summary"
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'summary'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Visão Geral
          </button>
        </div>

        {activeTab === 'bills' && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500">
            {(['all', 'pending', 'paid', 'overdue'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setBillFilter(filter)}
                className={`px-2.5 py-1 rounded-lg transition capitalize ${
                  billFilter === filter
                    ? 'bg-[#1F3A34] text-white font-medium'
                    : 'hover:bg-stone-200 dark:hover:bg-stone-800'
                }`}
              >
                {filter === 'all' ? 'Todas' : filter === 'pending' ? 'A Pagar' : filter === 'paid' ? 'Pagas' : 'Vencidas'}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'incomes' && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500">
            {(['all', 'received', 'pending'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setIncomeFilter(filter)}
                className={`px-2.5 py-1 rounded-lg transition capitalize ${
                  incomeFilter === filter
                    ? 'bg-emerald-700 text-white font-medium'
                    : 'hover:bg-stone-200 dark:hover:bg-stone-800'
                }`}
              >
                {filter === 'all' ? 'Todas' : filter === 'received' ? 'Já Recebidas' : 'A Receber'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: CONTAS A PAGAR */}
      {activeTab === 'bills' && (
        <div className="space-y-3">
          {filteredBills.length > 0 ? (
            <div className="space-y-2.5">
              {filteredBills.map((b) => {
                const isOverdue = !b.paid && b.dueDate < todayStr;
                const isToday = !b.paid && b.dueDate === todayStr;

                return (
                  <div
                    key={b.id}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      b.paid
                        ? 'bg-stone-50/60 dark:bg-stone-900/40 border-stone-200/60 dark:border-stone-800 text-stone-400'
                        : isOverdue
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 text-stone-900 dark:text-stone-100'
                        : isToday
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60 text-stone-900 dark:text-stone-100'
                        : 'bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800 text-stone-900 dark:text-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <button
                        onClick={() => toggleBillPaid(b.id)}
                        className={`w-6 h-6 rounded-xl flex items-center justify-center transition flex-shrink-0 ${
                          b.paid
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'border-2 border-stone-300 dark:border-stone-600 hover:border-emerald-500'
                        }`}
                        title={b.paid ? 'Marcar como pendente' : 'Marcar como paga'}
                      >
                        {b.paid && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs sm:text-sm font-semibold truncate ${b.paid ? 'line-through text-stone-400 dark:text-stone-500' : ''}`}>
                            {b.name}
                          </p>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500">
                            {b.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                          <span>Vence em {formatDateToBrazilian(b.dueDate)}</span>
                          {isOverdue && (
                            <span className="text-rose-600 font-bold text-[10px] px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950/60">
                              Vencida!
                            </span>
                          )}
                          {isToday && (
                            <span className="text-amber-600 font-bold text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60">
                              Vence hoje!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`font-serif font-bold text-sm sm:text-base ${b.paid ? 'line-through text-stone-400 dark:text-stone-500' : 'text-stone-900 dark:text-stone-100'}`}>
                        R$ {b.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>

                      <button
                        onClick={() => {
                          if (window.confirm(`Excluir conta "${b.name}"?`)) deleteBill(b.id);
                        }}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800">
              <p className="text-xs sm:text-sm text-stone-400 italic">
                Nenhuma conta encontrada com este filtro. Anote seus compromissos para manter a cabeça descansada! 🌿
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GANHOS & RECEITAS */}
      {activeTab === 'incomes' && (
        <div className="space-y-3">
          {filteredIncomes.length > 0 ? (
            <div className="space-y-2.5">
              {filteredIncomes.map((inc) => (
                <div
                  key={inc.id}
                  className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    inc.received
                      ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/50'
                      : 'bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <button
                      onClick={() => toggleIncomeReceived(inc.id)}
                      className={`w-6 h-6 rounded-xl flex items-center justify-center transition flex-shrink-0 ${
                        inc.received
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'border-2 border-stone-300 dark:border-stone-600 hover:border-emerald-500'
                      }`}
                      title={inc.received ? 'Marcar como a receber' : 'Marcar como recebido'}
                    >
                      {inc.received && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm font-semibold truncate text-stone-900 dark:text-stone-100">
                          {inc.description}
                        </p>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-medium">
                          {inc.category}
                        </span>
                        {inc.received ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-200/70 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold">
                            Recebido
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-medium">
                            A Receber
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                        <span>Data: {formatDateToBrazilian(inc.date)}</span>
                        {inc.notes && (
                          <span className="truncate italic">• {inc.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-serif font-bold text-sm sm:text-base text-emerald-700 dark:text-emerald-400">
                      + R$ {inc.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>

                    <button
                      onClick={() => {
                        if (window.confirm(`Excluir recebimento "${inc.description}"?`)) deleteIncome(inc.id);
                      }}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800">
              <p className="text-xs sm:text-sm text-stone-400 italic">
                Nenhum valor recebido registrado ainda. Clique em "+ Registrar Ganho" para anotar seu salário, vendas ou rendas extras! 💵
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VISÃO GERAL & DETALHES DE EQUILÍBRIO */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Detailed Balance Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                Resumo do Seu Equilíbrio Financeiro
              </h3>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-stone-800/60">
                <span className="text-stone-500 dark:text-stone-400">Total de Entradas Previstas:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  + R$ {totalIncomesAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-stone-800/60">
                <span className="text-stone-500 dark:text-stone-400">Total de Contas e Obrigações:</span>
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  - R$ {totalBillsAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-stone-200 dark:border-stone-700 text-sm sm:text-base font-bold">
                <span className="text-stone-800 dark:text-stone-200">Saldo Livre Previsto:</span>
                <span className={projectedBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}>
                  R$ {projectedBalance.toFixed(2)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F6F7F4] dark:bg-stone-800/60 text-xs text-stone-600 dark:text-stone-300 space-y-1 mt-3">
                <p className="font-semibold text-stone-800 dark:text-stone-100">💡 Dica LEVE para sua paz financeira:</p>
                <p>
                  Quando todas as contas têm dia e destino definidos, a ansiedade com dinheiro diminui. Reserve uma pequena quantia do seu saldo livre para criar uma reserva de serenidade.
                </p>
              </div>
            </div>
          </div>

          {/* Breakdown by Bill Categories */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
              <PieChart className="w-5 h-5 text-indigo-600" />
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                Onde seu dinheiro está indo
              </h3>
            </div>

            {billsList.length > 0 ? (
              <div className="space-y-2.5">
                {billCategories.map((cat) => {
                  const catBills = billsList.filter((b) => b.category === cat);
                  if (catBills.length === 0) return null;
                  const catTotal = catBills.reduce((acc, b) => acc + (b.amount || 0), 0);
                  const catPercentage = totalBillsAmount > 0 ? Math.round((catTotal / totalBillsAmount) * 100) : 0;

                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-stone-700 dark:text-stone-300">{cat}</span>
                        <span className="text-stone-500">
                          R$ {catTotal.toFixed(2)} ({catPercentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#1F3A34] dark:bg-emerald-600 h-full rounded-full transition-all"
                          style={{ width: `${catPercentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic py-6 text-center">
                Cadastre suas primeiras contas para visualizar a distribuição por categoria.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal: New Bill */}
      {isBillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4 my-8 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-700" />
                <h3 className="font-serif text-lg font-bold">Adicionar Conta / Boleto</h3>
              </div>
              <button
                onClick={() => setIsBillModalOpen(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 bg-stone-100 dark:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBill} className="space-y-3.5 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  Nome da conta ou compromisso
                </label>
                <input
                  type="text"
                  required
                  value={billName}
                  onChange={(e) => setBillName(e.target.value)}
                  placeholder="Ex: Aluguel, Internet Fibra, Cartão de Crédito..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-stone-700 dark:text-stone-300">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-stone-700 dark:text-stone-300">Vencimento</label>
                  <input
                    type="date"
                    required
                    value={billDueDate}
                    onChange={(e) => setBillDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">Categoria</label>
                <select
                  value={billCategory}
                  onChange={(e) => setBillCategory(e.target.value as BillCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                >
                  {billCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBillModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold"
                >
                  Salvar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Income / Recebimento */}
      {isIncomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4 my-8 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="font-serif text-lg font-bold">Registrar Ganho / Receita</h3>
              </div>
              <button
                onClick={() => setIsIncomeModalOpen(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 bg-stone-100 dark:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIncome} className="space-y-3.5 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  Origem ou Descrição do Valor
                </label>
                <input
                  type="text"
                  required
                  value={incomeDescription}
                  onChange={(e) => setIncomeDescription(e.target.value)}
                  placeholder="Ex: Salário mensal, Projeto Freelance, Venda de desapegos..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-stone-700 dark:text-stone-300">Valor Recebido (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-stone-700 dark:text-stone-300">Data do Recebimento</label>
                  <input
                    type="date"
                    required
                    value={incomeDate}
                    onChange={(e) => setIncomeDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">Categoria</label>
                <select
                  value={incomeCategory}
                  onChange={(e) => setIncomeCategory(e.target.value as IncomeCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                >
                  {incomeCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">Observação (Opcional)</label>
                <input
                  type="text"
                  value={incomeNotes}
                  onChange={(e) => setIncomeNotes(e.target.value)}
                  placeholder="Ex: Caiu no Nubank, Pix de cliente..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="income-received"
                  checked={incomeReceived}
                  onChange={(e) => setIncomeReceived(e.target.checked)}
                  className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-600 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="income-received" className="text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                  Este valor já caiu na conta (Recebido)
                </label>
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsIncomeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                >
                  Salvar Ganho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
