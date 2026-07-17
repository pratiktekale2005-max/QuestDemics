import React, { useEffect, useState } from 'react';
import { useAppStore, type ShopItem } from '../store';
import { ShoppingBag, BookOpen, Map, HelpCircle, Eye, Lock } from 'lucide-react';
import HologramFrame from '../components/HologramFrame';

export default function Shop() {
  const { user, shopItems, purchases, fetchShopItems, buyShopItem, fetchPurchases } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [buyingId, setBuyingId] = useState<number | null>(null);

  useEffect(() => {
    fetchShopItems();
    fetchPurchases();
  }, [fetchShopItems, fetchPurchases]);

  const categories = [
    { name: 'All Items', value: 'ALL', icon: ShoppingBag },
    { name: 'Cheat Sheets', value: 'CHEAT_SHEET', icon: BookOpen },
    { name: 'Concept Maps', value: 'MIND_MAP', icon: Map },
    { name: 'Interview Hints', value: 'HINTS', icon: HelpCircle },
  ];

  const filteredItems = activeCategory === 'ALL'
    ? shopItems
    : shopItems.filter(item => item.category === activeCategory);

  const isPurchased = (itemId: number) => {
    return purchases.some(p => p.id === itemId);
  };

  const handlePurchase = async (itemId: number) => {
    setBuyingId(itemId);
    try {
      await buyShopItem(itemId);
    } finally {
      setBuyingId(null);
    }
  };

  const parseItemContent = (item: ShopItem) => {
    try {
      const parsed = JSON.parse(item.content_data);
      return parsed.data || parsed;
    } catch {
      return item.content_data;
    }
  };

  return (
    <HologramFrame maxWidth="max-w-6xl">
      <div className="space-y-6 font-mono pb-16 text-cyan-100">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-extrabold uppercase tracking-widest text-white flex items-center gap-2 drop-shadow-[0_0_8px_#00e5ff]">
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
              <span>System Shop</span>
            </h1>
            <p className="text-[10px] text-cyan-500/70 uppercase tracking-wider mt-1">Deduct gold from reserve to unlock elite concept archives.</p>
          </div>
          <div className="holo-panel px-4 py-2 rounded-sm flex items-center gap-3 shadow-[0_0_10px_rgba(0,229,255,0.1)]">
            <span className="text-[9px] text-gray-550 uppercase">Reserve Gold</span>
            <span className="text-base font-bold text-cyan-400">{user?.gold || 0} G</span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-cyan-500/20 pb-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-cyan-950/40 text-cyan-400 border-cyan-500/50 shadow-[0_0_8px_rgba(0,229,255,0.15)]'
                    : 'bg-transparent text-gray-400 border-transparent hover:text-white hover:bg-cyan-950/20'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Grid of Items */}
        {filteredItems.length === 0 ? (
          <div className="text-center p-12 holo-panel rounded-sm text-cyan-550/40 italic">
            No shop items found in database logs.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const owned = isPurchased(item.id);
              const canAfford = (user?.gold || 0) >= item.cost_gold;
              return (
                <div 
                  key={item.id} 
                  className={`holo-panel rounded-sm transition-all flex flex-col justify-between overflow-hidden relative ${
                    owned 
                      ? 'border-cyan-500/50 shadow-[0_0_12px_rgba(0,229,255,0.1)]' 
                      : 'hover:border-cyan-500/40'
                  }`}
                >
                  {/* Category tag */}
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-slate-950/80 text-[7px] font-bold text-cyan-500/60 uppercase tracking-widest border border-cyan-500/20">
                    {item.category.replace('_', ' ')}
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-extrabold text-sm text-white uppercase tracking-wider pr-16 leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-400 leading-normal min-h-[48px]">
                      {item.description}
                    </p>
                  </div>

                  <div className="p-4 border-t border-cyan-500/20 bg-cyan-950/10 flex items-center justify-between gap-4">
                    {owned ? (
                      <>
                        <span className="text-[9px] font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Unlocked
                        </span>
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/30 hover:bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400 text-[10px] font-bold uppercase tracking-wider text-cyan-400 rounded-sm transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open Archive</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-col">
                          <span className="text-[8px] text-gray-550 uppercase">Intake Cost</span>
                          <span className="text-sm font-bold text-cyan-400 font-mono">{item.cost_gold} G</span>
                        </div>
                        
                        <button
                          disabled={!canAfford || buyingId !== null}
                          onClick={() => handlePurchase(item.id)}
                          className={`flex items-center gap-1.5 px-4 py-2 border rounded-sm text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
                            canAfford
                              ? 'bg-cyan-500 hover:bg-cyan-400 border-cyan-400 text-slate-950 hover:scale-[1.02] shadow-[0_0_8px_rgba(0,229,255,0.3)]'
                              : 'bg-transparent border-red-950/40 text-red-500 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          {buyingId === item.id ? (
                            <div className="animate-spin h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full" />
                          ) : canAfford ? (
                            <ShoppingBag className="w-3.5 h-3.5 text-slate-950" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-red-500" />
                          )}
                          <span>{buyingId === item.id ? 'Acquiring...' : canAfford ? 'Purchase' : 'Locked'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Content Viewer Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="holo-panel holo-panel-brackets rounded-sm w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-4 border-b border-cyan-500/30 bg-slate-950 flex justify-between items-center">
                <div>
                  <span className="text-[8px] text-cyan-400 uppercase tracking-widest block font-bold">UNLOCKED ARCHIVE // SYSTEM LOG</span>
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mt-0.5">{selectedItem.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-500 hover:text-white font-extrabold text-xs cursor-pointer uppercase font-mono tracking-widest border border-cyan-500/20 px-2.5 py-1 rounded bg-cyan-950/10"
                >
                  Close
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="p-6 max-h-[60vh] overflow-y-auto text-xs text-gray-300 leading-relaxed space-y-4 select-text">
                <div className="whitespace-pre-wrap font-mono">
                  {parseItemContent(selectedItem)}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-cyan-500/20 bg-slate-950/40 flex justify-end">
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 border border-cyan-500/30 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/40 text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </HologramFrame>
  );
}
