import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Utensils, ShoppingBag, Plus, Check, Trash2, 
  Sparkles, Coffee, Sun, Moon, Apple 
} from 'lucide-react';
import { getTodayDateString, formatDateToBrazilian } from '../../services/storage';
import { GroceryCategory, MealCategory } from '../../types';

export const NutritionView: React.FC = () => {
  const { 
    data, 
    addMealLog, 
    addGroceryItem, 
    toggleGroceryItem, 
    deleteGroceryItem, 
    clearCompletedGroceries 
  } = useApp();

  const todayStr = getTodayDateString();
  const [activeSection, setActiveSection] = useState<'meals' | 'groceries'>('meals');

  // Meal form state
  const [mealCategory, setMealCategory] = useState<MealCategory>('Café da manhã');
  const [mealDescription, setMealDescription] = useState('');
  const [howIFelt, setHowIFelt] = useState('Leve e com energia');

  // Grocery form state
  const [groceryName, setGroceryName] = useState('');
  const [groceryCategory, setGroceryCategory] = useState<GroceryCategory>('Hortifruti');

  const todayMeals = (data.singleMeals || []).filter((m) => m.date === todayStr);

  const handleSaveMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealDescription.trim()) return;

    addMealLog({
      date: todayStr,
      category: mealCategory,
      description: mealDescription.trim(),
      howIFelt
    });

    setMealDescription('');
  };

  const handleAddGrocery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groceryName.trim()) return;

    addGroceryItem({
      name: groceryName.trim(),
      category: groceryCategory,
      completed: false
    });

    setGroceryName('');
  };

  const groceryCategories: GroceryCategory[] = [
    'Hortifruti', 'Mercearia', 'Geladeira & Laticínios', 'Proteínas', 'Padaria', 'Limpeza & Casa', 'Outros'
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              Alimentação & Compras
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Comer com presença, carinho com seu corpo e organização do lar.
            </p>
          </div>
        </div>

        <div className="flex items-center p-1 rounded-2xl bg-stone-100 dark:bg-stone-800 text-xs">
          <button
            onClick={() => setActiveSection('meals')}
            className={`px-4 py-1.5 rounded-xl font-medium transition ${
              activeSection === 'meals' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500'
            }`}
          >
            Refeições de Hoje
          </button>
          <button
            onClick={() => setActiveSection('groceries')}
            className={`px-4 py-1.5 rounded-xl font-medium transition ${
              activeSection === 'groceries' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500'
            }`}
          >
            Lista de Mercado ({(data.groceries || []).filter((g) => !g.completed).length})
          </button>
        </div>
      </div>

      {/* 1. MEALS SECTION */}
      {activeSection === 'meals' && (
        <div className="space-y-6">
          {/* Add meal card */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
              Registrar Refeição de Hoje 🥗
            </h3>

            <form onSubmit={handleSaveMeal} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-stone-700 dark:text-stone-300">
                    Qual refeição?
                  </label>
                  <select
                    value={mealCategory}
                    onChange={(e) => setMealCategory(e.target.value as MealCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                  >
                    <option value="Café da manhã">☕ Café da manhã</option>
                    <option value="Almoço">🍲 Almoço</option>
                    <option value="Lanche">🥪 Lanche da tarde</option>
                    <option value="Jantar">🥗 Jantar</option>
                    <option value="Ceia / Outro">🍵 Ceia / Outro</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-stone-700 dark:text-stone-300">
                    Como me senti após comer?
                  </label>
                  <select
                    value={howIFelt}
                    onChange={(e) => setHowIFelt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                  >
                    <option value="Leve e com energia">✨ Leve e com energia</option>
                    <option value="Satisfeita e em paz">🌿 Satisfeita e em paz</option>
                    <option value="Um pouco pesada">😴 Um pouco pesada / sonolenta</option>
                    <option value="Comi com pressa">⏰ Comi na correria</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  O que você comeu?
                </label>
                <input
                  type="text"
                  required
                  value={mealDescription}
                  onChange={(e) => setMealDescription(e.target.value)}
                  placeholder="Ex: Tapioca com ovos mexidos, café com leite e mamão picado..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Salvar refeição</span>
                </button>
              </div>
            </form>
          </div>

          {/* Today Meals List */}
          <div className="space-y-3">
            <h4 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
              Registros de Hoje ({todayMeals.length})
            </h4>

            {todayMeals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {todayMeals.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-1 text-xs sm:text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 dark:text-stone-100 font-serif">
                        {m.category}
                      </span>
                      {m.howIFelt && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 font-medium">
                          {m.howIFelt}
                        </span>
                      )}
                    </div>
                    <p className="text-stone-600 dark:text-stone-300">
                      {m.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic py-6 text-center">
                Nenhuma refeição registrada hoje. Coma no seu ritmo e sem culpa.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 2. GROCERIES SECTION */}
      {activeSection === 'groceries' && (
        <div className="space-y-6">
          {/* Add item form */}
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <form onSubmit={handleAddGrocery} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                value={groceryName}
                onChange={(e) => setGroceryName(e.target.value)}
                placeholder="Ex: Bananas maduras, Azeite de oliva, Aveia em flocos..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
              />
              <select
                value={groceryCategory}
                onChange={(e) => setGroceryCategory(e.target.value as GroceryCategory)}
                className="px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none"
              >
                {groceryCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar</span>
              </button>
            </form>
          </div>

          {/* Grocery list grouped by category */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
                Itens na Lista
              </h3>
              {data.groceries.some((g) => g.completed) && (
                <button
                  onClick={clearCompletedGroceries}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Limpar comprados
                </button>
              )}
            </div>

            <div className="space-y-3">
              {groceryCategories.map((cat) => {
                const catItems = data.groceries.filter((g) => g.category === cat);
                if (catItems.length === 0) return null;

                return (
                  <div
                    key={cat}
                    className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-2"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                      {cat} ({catItems.length})
                    </span>

                    <div className="space-y-1.5">
                      {catItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-850 transition"
                        >
                          <div
                            onClick={() => toggleGroceryItem(item.id)}
                            className="flex items-center gap-2.5 cursor-pointer truncate flex-1"
                          >
                            <div className={`w-4 h-4 rounded-md flex items-center justify-center ${
                              item.completed ? 'bg-emerald-600 text-white' : 'border border-stone-300'
                            }`}>
                              {item.completed && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className={`text-xs sm:text-sm truncate ${
                              item.completed ? 'line-through text-stone-400' : 'text-stone-800 dark:text-stone-200 font-medium'
                            }`}>
                              {item.name}
                            </span>
                          </div>

                          <button
                            onClick={() => deleteGroceryItem(item.id)}
                            className="p-1 text-stone-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
