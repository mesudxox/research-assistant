import React, { useState, useEffect } from 'react';
import logo from './assets/xox-logo.png'; 
import { Flame, Bell, Trash2, CheckCircle } from 'lucide-react'; 
import xoxApi from './api';

const MOCK_HISTORY = [
  { 
    id: 1, 
    title: "Logitech G502 Hero Mouse", 
    price: 1450, 
    initialPrice: 1600,
    targetPrice: 1400, 
    history: [1600, 1550, 1500, 1450],
    dates: ["May 01", "May 02", "May 03", "May 04"],
    platform: "TRENDYOL"
  },
  { 
    id: 2, 
    title: "Apple iPhone 15 Pro 256GB", 
    price: 74999, 
    initialPrice: 72000,
    targetPrice: 70000,
    history: [72000, 73500, 75000, 74999], 
    dates: ["May 01", "May 02", "May 03", "May 04"],
    platform: "AMAZON"
  }
];

const PLATFORMS = [
  { id: 'trendyol', label: 'TR', color: 'bg-orange-500' },
  { id: 'amazon', label: 'AZ', color: 'bg-yellow-500' },
  { id: 'hepsiburada', label: 'HB', color: 'bg-orange-600' },
  { id: 'alibaba', label: 'AL', color: 'bg-red-600' }
];

function App() {
  const [view, setView] = useState('dashboard'); 
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSite, setSelectedSite] = useState('trendyol');
  const [showMenu, setShowMenu] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState(MOCK_HISTORY[0].id);
  const [editingId, setEditingId] = useState(null);
  const [tempTarget, setTempTarget] = useState("");
  const [filterHot, setFilterHot] = useState(false);
  
  // --- NOTIFICATION STATES ---
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 101, text: "Welcome to XOX Tracker Premium.", type: "system", time: "Now", read: false },
    { id: 102, text: "Logitech G502 is nearing your target price!", type: "alert", time: "2h ago", read: true }
  ]);

  const [compLeft, setCompLeft] = useState(MOCK_HISTORY[0].id);
  const [compRight, setCompRight] = useState(MOCK_HISTORY[1].id);

  useEffect(() => {
  const loadDatabaseContent = async () => {
    const data = await xoxApi.fetchHistory();
    if (data && data.length > 0) {
      setHistory(data);
      setSelectedId(data[0].id);
    }
  };
  loadDatabaseContent();
}, []);

  // --- NOTIFICATION LOGIC (BACKEND COMPATIBLE) ---
  const addNotification = (text, type = "alert") => {
    const newNotif = {
      id: Date.now(),
      text,
      type,
      time: "Just now",
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleUpdateTarget = async (id) => {
  const newTarget = parseFloat(tempTarget);
  if (isNaN(newTarget)) return;

  try {
    // Save to SQLite
    await xoxApi.updateTarget(id, newTarget);
    
    // Update local UI
    setHistory(prev => prev.map(item => item.id === id ? { ...item, targetPrice: newTarget } : item));
    setEditingId(null);
    setTempTarget("");
    addNotification("Target price synced to database", "system");
  } catch (err) {
    addNotification("Failed to save target", "alert");
  }
};
// REWRITE WITH THIS
const handleScrape = async (e) => {
  e.preventDefault();
  if (!url) return;
  
  setLoading(true);
  try {
    // 1. Call your FastAPI through the bridge
    const newItem = await xoxApi.scrapeProduct(url, selectedSite);
    
    // 2. Prepare the data for your Chart
    const formattedItem = {
      ...newItem,
      history: [newItem.price], // Backend gives current price
      dates: [new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric'})]
    };
    
    // 3. Update the UI state
    setHistory(prev => [formattedItem, ...prev]);
    setSelectedId(newItem.id);
    setView('dashboard');
    addNotification(`Tracked: ${newItem.title}`, "system");
  } catch (err) {
    addNotification("Backend Error: " + err.message, "alert");
  } finally {
    setLoading(false);
    setUrl('');
  }
};

  const calculateProbability = (item) => {
    const diff = item.price - item.target_price;
    if (diff <= 0) return 5;
    const range = item.initialPrice - item.target_price;
    return Math.round(Math.min(Math.max(((diff / range) * 100), 10), 95));
  };

  const displayedHistory = filterHot 
    ? history.filter(item => (item.price - item.target_price) <= (item.target_price * 0.1)) 
    : history;

  const active = history.find(p => p.id === selectedId) || history[0];
  const leftItem = history.find(p => p.id === compLeft) || history[0];
  const rightItem = history.find(p => p.id === compRight) || history[1];

  const maxPrice = Math.max(...active.history, active.targetPrice) * 1.1;
  const minPrice = Math.min(...active.history, active.targetPrice) * 0.9;
  const range = maxPrice - minPrice;

  return (
    <div className="min-h-screen bg-[#0a0b0c] flex flex-col items-center p-12 font-sans text-white selection:bg-cyan-500/30">
      
      <header className="w-full max-w-6xl mb-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.15)] bg-black">
              <img src={logo} alt="XOX Logo" className="w-full h-full object-cover scale-110" />
            </div>
            <div className="hidden md:flex flex-col">
              <h1 className="text-xl font-black text-white uppercase tracking-tighter leading-none">XOX <span className="text-cyan-400">Tracker</span></h1>
              <p className="text-[9px] text-gray-500 font-bold tracking-[0.3em] mt-1 uppercase">Smart Market Analysis</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-10 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            <button onClick={() => setView('dashboard')} className={`${view === 'dashboard' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'hover:text-white'} pb-1 transition-all`}>Dashboard</button>
            <button onClick={() => setView('history')} className={`${view === 'history' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'hover:text-white'} pb-1 transition-all`}>History</button>
            <button onClick={() => setView('compare')} className={`${view === 'compare' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'hover:text-white'} pb-1 transition-all`}>Compare</button>
            <button onClick={() => setView('help')} className={`${view === 'help' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'hover:text-white'} pb-1 transition-all`}>Help</button>
          </nav>

          <div className="flex items-center gap-4 relative">
            {/* HOT BUTTON - DASHBOARD ONLY */}
            {view === 'dashboard' && (
              <button 
                onClick={() => setFilterHot(!filterHot)}
                className={`p-3 rounded-2xl border transition-all duration-300 flex items-center justify-center ${
                  filterHot ? 'bg-orange-500/20 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)] text-orange-500' : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400'
                }`}
              >
                <Flame size={18} className={filterHot ? "animate-pulse fill-orange-500" : ""} />
              </button>
            )}

            {/* NOTIFICATION BUTTON */}
            <div className="relative">
              <button 
                onClick={() => { setShowNotifPanel(!showNotifPanel); if(!showNotifPanel) markAllAsRead(); }}
                className={`p-3 rounded-2xl border transition-all relative group ${
                  showNotifPanel ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400'
                }`}
              >
                <Bell size={18} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                )}
              </button>

              {/* NOTIFICATION PANEL */}
              {showNotifPanel && (
                <div className="absolute top-16 right-0 w-80 bg-[#111214] border border-white/10 rounded-[32px] shadow-2xl z-[100] p-6 animate-in slide-in-from-top-4 overflow-hidden">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Notifications</h4>
                    <button onClick={() => setNotifications([])} className="text-gray-600 hover:text-rose-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                    {notifications.length > 0 ? notifications.map(n => (
                      <div key={n.id} className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${n.type === 'alert' ? 'bg-orange-500' : 'bg-cyan-500'}`}></div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-300 leading-tight">{n.text}</p>
                            <span className="text-[8px] text-gray-600 font-black uppercase mt-2 block">{n.time}</span>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="py-12 text-center">
                        <CheckCircle size={24} className="mx-auto text-gray-800 mb-3" />
                        <p className="text-[9px] font-black uppercase text-gray-700 tracking-widest">Feed is Empty</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
            <div className="flex items-center gap-3 bg-white/5 p-1 pr-4 rounded-full border border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-[10px] shadow-lg">M</div>
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">MESUD</span>
            </div>
          </div>
        </div>

        {view === 'dashboard' && (
          <div className="mt-12 flex justify-center animate-in fade-in duration-500">
            <form onSubmit={handleScrape} className="w-full max-w-3xl relative flex items-center group">
              <input type="text" className="w-full pl-8 pr-32 py-5 bg-white/5 backdrop-blur-xl rounded-[28px] border border-white/10 outline-none text-white placeholder-gray-600 focus:border-cyan-500/40 transition-all shadow-2xl relative z-10" placeholder={`Analyze price for ${selectedSite}...`} value={url} onChange={(e) => setUrl(e.target.value)} />
              <div className="absolute right-2 flex items-center gap-2 z-20">
                <div className="relative flex items-center">
                   {showMenu && (
                     <div className="absolute right-full mr-2 flex items-center gap-2 animate-in slide-in-from-right-4 fade-in duration-300">
                       {PLATFORMS.filter(p => p.id !== selectedSite).map((p, i) => (
                         <button key={p.id} type="button" onClick={() => { setSelectedSite(p.id); setShowMenu(false); }} className="w-9 h-9 rounded-full bg-[#111214] border border-white/10 flex items-center justify-center text-[8px] font-black uppercase text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all hover:scale-110 shadow-xl" style={{ animationDelay: `${i * 50}ms` }}>{p.label}</button>
                       ))}
                     </div>
                   )}
                   <button type="button" onClick={() => setShowMenu(!showMenu)} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-[10px] font-black uppercase transition-all shadow-lg z-30 ${showMenu ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'}`}>{PLATFORMS.find(p => p.id === selectedSite)?.label}</button>
                </div>
                <button className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg hover:bg-blue-500 transition-all z-30">{loading ? <span className="animate-spin text-xs">⏳</span> : '🔍'}</button>
              </div>
            </form>
          </div>
        )}
      </header>

      <main className="w-full max-w-6xl">
        {view === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 mb-20">
            <section className="lg:col-span-8 bg-white/5 backdrop-blur-md rounded-[40px] p-8 border border-white/10 h-[550px] flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div>
                  <h3 className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-1">Live Trend Analysis</h3>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter max-w-md truncate">{active.title}</h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-rose-500 block mb-1 uppercase tracking-tighter">Target Price</span>
                  <span className="text-3xl font-black text-rose-500">{active.targetPrice} TL</span>
                </div>
              </div>
              <div className="flex-1 relative flex items-end justify-between px-6 pb-12 z-10">
                <div className="absolute left-0 right-0 border-t-2 border-dashed border-rose-500/30 z-0 transition-all duration-500" style={{ bottom: `${((active.targetPrice - minPrice) / range) * 100 + 10}%` }}></div>
                {active.history.map((price, i) => (
                  <div key={i} className="flex-1 group flex flex-col items-center justify-end h-full relative">
                    <div className="mb-2 z-30">
                      <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[8px] font-black px-2 py-1 rounded-md shadow-lg whitespace-nowrap">{price} TL</div>
                    </div>
                    <div style={{ height: `${((price - minPrice) / range) * 75 + 5}%` }} className="w-10 bg-gradient-to-t from-cyan-600/40 to-cyan-400 border-t border-cyan-300/50 rounded-t-xl group-hover:from-cyan-400 cursor-pointer transition-all duration-1000"></div>
                    <span className="text-[7px] mt-4 text-gray-500 font-bold uppercase">{active.dates[i]}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="lg:col-span-4 flex flex-col gap-4 h-[550px] overflow-y-auto custom-scrollbar">
              {filterHot && <div className="px-5 py-2 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-[9px] font-black text-orange-500 uppercase tracking-widest text-center animate-in slide-in-from-top-2">Showing Hot Deals Only</div>}
              {displayedHistory.map((item) => (
  <div 
    key={item.id} 
    onClick={() => setSelectedId(item.id)} 
    className={`p-5 rounded-[32px] cursor-pointer transition-all border transform hover:scale-[1.01] active:scale-[0.99] ${
      selectedId === item.id ? 'bg-white/10 border-cyan-500/40 shadow-2xl' : 'bg-[#111214] border-transparent hover:bg-white/5'
    }`}
  >
    <div className="flex justify-between items-center mb-2">
      <span className="text-[10px] font-bold uppercase truncate w-32">{item.title}</span>
      <span className="text-sm font-black text-white">{item.price} TL</span>
    </div>

    {/* Platform Tag */}
    <div className="flex gap-2 mb-2">
      <span className="text-[7px] font-black px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 uppercase tracking-tighter">
        {item.platform || "TRACKED"}
      </span>
    </div>

    {selectedId === item.id && (
      <div className="pt-4 border-t border-white/5 space-y-4 animate-in slide-in-from-top-2">
        
        {/* DYNAMIC IMAGE FROM FASTAPI */}
        <div className="aspect-video bg-black/60 rounded-2xl border border-white/10 flex flex-col items-center justify-center overflow-hidden relative">
          {item.screenshot ? (
            <img 
              src={`http://localhost:8000/static/${item.screenshot}`} 
              alt={item.title} 
              className="w-full h-full object-cover transition-opacity duration-300"
              onError={(e) => {
                e.target.style.display = 'none'; // Hide broken image
                e.target.nextSibling.style.display = 'block'; // Show text instead
              }}
            />
          ) : null}
          <span className="text-[10px] font-black uppercase text-gray-700 hidden">Preview Unavailable</span>
          {!item.screenshot && <span className="text-[10px] font-black uppercase text-gray-700">Processing...</span>}
        </div>

        {/* TARGET PRICE DISPLAY/INPUT */}
        <div className="flex justify-between items-center bg-black/40 p-3 rounded-2xl border border-white/5">
          <span className="text-[8px] font-black text-gray-500 uppercase">Target</span>
          {editingId === item.id ? (
            <input 
              autoFocus 
              className="bg-transparent text-rose-500 font-black text-xs outline-none w-20 text-right" 
              value={tempTarget} 
              onChange={(e) => setTempTarget(e.target.value)} 
              onBlur={() => handleUpdateTarget(item.id)} 
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateTarget(item.id)} 
            />
          ) : (
            <span className="text-xs font-black text-rose-500">{item.target_price} TL</span>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              setEditingId(item.id); 
              setTempTarget(item.target_price); 
            }} 
            className="py-3 bg-white/5 hover:bg-white/10 text-white text-[8px] font-black uppercase rounded-xl border border-white/10 transition-all"
          >
            {editingId === item.id ? "Confirm" : "Edit Target"}
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); window.open(item.product_url, '_blank'); }}
            className="py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[8px] font-black uppercase rounded-xl border border-cyan-500/20 transition-all"
          >
            Open Link
          </button>
        </div>
      </div>
    )}
  </div>
))}
            </section>
          </div>
        )}

        {/* --- OTHER VIEWS --- */}
        {view === 'history' && (
           <section className="animate-in slide-in-from-bottom-4 pb-20">
            <h2 className="text-4xl font-black uppercase italic mb-8">Full <span className="text-cyan-400">Inventory</span></h2>
            <div className="bg-[#111214] rounded-[40px] border border-white/10 overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-white/[0.02] border-b border-white/5">
                  <tr>
                    <th className="p-6 text-[9px] font-black uppercase text-gray-500">Product</th>
                    <th className="p-6 text-[9px] font-black uppercase text-gray-500">Market</th>
                    <th className="p-6 text-[9px] font-black uppercase text-gray-500">Price</th>
                    <th className="p-6 text-[9px] font-black uppercase text-gray-500">Target</th>
                    <th className="p-6 text-[9px] font-black uppercase text-gray-500 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>{history.map(item => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-6 text-xs font-bold">{item.title}</td>
                    <td className="p-6"><span className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black border border-white/10 uppercase">{item.platform}</span></td>
                    <td className="p-6 text-xs font-black">{item.price} TL</td>
                    <td className="p-6">{editingId === item.id ? <input autoFocus className="bg-white/5 border border-cyan-500/30 rounded p-1 text-xs text-rose-500 font-black outline-none w-20" value={tempTarget} onChange={(e) => setTempTarget(e.target.value)} onBlur={() => handleUpdateTarget(item.id)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateTarget(item.id)} /> : <span className="text-xs font-black text-rose-500">{item.target_price} TL</span>}</td>
                    <td className="p-6 text-right space-x-4">
                      <button onClick={() => { setEditingId(item.id); setTempTarget(item.target_price); }} className="text-gray-500 hover:text-white text-[8px] font-black uppercase">Edit</button>
                      <button onClick={() => {setSelectedId(item.id); setView('dashboard')}} className="text-cyan-400 text-[8px] font-black uppercase">Analyze</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
           </section>
        )}

        {view === 'compare' && (
          <section className="animate-in zoom-in-95 pb-20">
            <h2 className="text-5xl font-black uppercase italic mb-12">Market <span className="text-cyan-400">Clash</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[leftItem, rightItem].map((item, idx) => (
                <div key={idx} className="bg-white/5 rounded-[40px] border border-white/10 p-10 flex flex-col items-center">
                  <select value={idx === 0 ? compLeft : compRight} onChange={(e) => idx === 0 ? setCompLeft(Number(e.target.value)) : setCompRight(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold outline-none text-cyan-400 mb-10">
                    {history.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
                  </select>
                  <div className="text-6xl font-black mb-10">{item.price} <span className="text-lg text-gray-500 uppercase tracking-widest ml-2">TL</span></div>
                  <div className="w-full space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase"><span className="text-gray-500">Drop Probability</span><span className={calculateProbability(item) > 60 ? "text-emerald-400" : "text-rose-500"}>{calculateProbability(item)}%</span></div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${calculateProbability(item) > 60 ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${calculateProbability(item)}%` }}></div></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === 'help' && (
          <section className="animate-in slide-in-from-right-8 duration-700 max-w-4xl mx-auto pb-20">
            <h2 className="text-6xl font-black uppercase italic tracking-tighter mb-12">How to <span className="text-cyan-400">Use</span></h2>
            <div className="space-y-6">
              <div className="bg-white/5 p-10 rounded-[40px] border border-white/10">
                <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black text-xs">01</span> Track & Analyze</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">Paste a product URL from supported markets. XOX Tracker will instantly scrape the price and add it to your live analysis chart.</p>
              </div>
              <div className="bg-white/5 p-10 rounded-[40px] border border-white/10">
                <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black text-xs">02</span> Set Targets</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Use the <span className="text-white font-bold">Edit Target</span> button to set your desired price. The chart will update with a dashed red line.</p>
              </div>
            </div>
          </section>
        )}

        <footer className="border-t border-white/5 pt-20 pb-12 mt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-gray-500">
            <div>
              <h4 className="text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-4">Core Engine</h4>
              <p className="text-xs font-medium">Developed by <span className="text-white">Mesudxox</span>, XOX Tracker ensures absolute price accuracy.</p>
            </div>
            <div>
              <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4">Predictive Clash</h4>
              <p className="text-xs font-medium">Statistical analysis identifies market floors and peak drop probabilities.</p>
            </div>
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
              <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest block mb-2 underline decoration-cyan-500/30 underline-offset-4">v2.0 Premium Build</span>
              <p className="text-[10px] font-bold italic uppercase">"Data Driven Intelligence"</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;