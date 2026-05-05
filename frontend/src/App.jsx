import React, { useState, useEffect } from 'react';
import logo from './assets/xox-logo.png'; 

// Pre-defined data to keep the UI beautiful without hitting the CPU
const MOCK_HISTORY = [
  { id: 1, title: "Logitech G502 Hero Mouse", price: 1450, time: "14:30", trend: "down", screenshot: null },
  { id: 2, title: "Apple iPhone 15 Pro 256GB", price: 74999, time: "10:15", trend: "up", screenshot: null },
  { id: 3, title: "SteelSeries Apex Pro TKL", price: 5200, time: "09:45", trend: "neutral", screenshot: null },
  { id: 4, title: "Sony WH-1000XM5 Headphones", price: 12300, time: "Yesterday", trend: "down", screenshot: null },
];

const PLATFORMS = [
  { id: 'trendyol', label: 'TR', color: 'bg-orange-500' },
  { id: 'amazon', label: 'AZ', color: 'bg-yellow-500' },
  { id: 'hepsiburada', label: 'HB', color: 'bg-orange-600' },
  { id: 'alibaba', label: 'AL', color: 'bg-red-600' }
];

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSite, setSelectedSite] = useState('trendyol');
  const [showMenu, setShowMenu] = useState(false);
  const [history, setHistory] = useState(MOCK_HISTORY);

  const handleScrape = (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);

    setTimeout(() => {
      const newEntry = {
        id: Date.now(),
        title: `Scraped Product from ${selectedSite.toUpperCase()}`,
        price: Math.floor(Math.random() * 5000) + 500,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        trend: Math.random() > 0.5 ? "up" : "down",
        screenshot: null
      };

      setHistory(prev => [newEntry, ...prev]);
      setLoading(false);
      setUrl('');
    }, 1200); 
  };

  return (
    <div className="min-h-screen bg-[#0a0b0c] flex flex-col items-center p-12 font-sans text-white selection:bg-cyan-500/30">
      
      <header className="w-full max-w-6xl mb-16">
        <div className="flex items-center justify-between">
          
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.15)] bg-black">
              <img src={logo} alt="XOX Logo" className="w-full h-full object-cover scale-110" />
            </div>
            <div className="hidden md:flex flex-col">
              <h1 className="text-xl font-black text-white uppercase tracking-tighter leading-none">
                XOX <span className="text-cyan-400">Tracker</span>
              </h1>
              <p className="text-[9px] text-gray-500 font-bold tracking-[0.3em] mt-1 uppercase">Smart Market Analysis</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-10 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            <a href="#" className="text-cyan-400 border-b-2 border-cyan-400 pb-1">Dashboard</a>
            <a href="#" className="hover:text-white transition-colors">History</a>
            <a href="#" className="hover:text-white transition-colors">Compare</a>
            <a href="#" className="hover:text-white transition-colors">About</a>
          </nav>

          <div className="flex items-center gap-4">
            <button className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">🔥</button>
            <button className="p-3 bg-white/5 rounded-2xl border border-white/10 relative hover:bg-white/10 group">
              🔔 <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse group-hover:bg-cyan-400"></span>
            </button>
            <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
            <div className="flex items-center gap-3 bg-white/5 p-1 pr-4 rounded-full border border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-[10px] shadow-lg">M</div>
              <span className="text-[10px] font-bold text-gray-300">MESUD</span>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <form onSubmit={handleScrape} className="w-full max-w-3xl relative flex items-center group">
            <div className="absolute inset-0 bg-cyan-500/5 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            <input
              type="text"
              className="w-full pl-8 pr-32 py-5 bg-white/5 backdrop-blur-xl rounded-[28px] border border-white/10 outline-none text-white placeholder-gray-600 focus:border-cyan-500/40 transition-all shadow-2xl relative z-10"
              placeholder={`Paste ${selectedSite} product link...`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />

            <div className="absolute right-2 flex items-center gap-2 z-20">
              {showMenu && (
                <div className="absolute right-14 flex items-center animate-in slide-in-from-right-4 fade-in duration-300">
                  <div className="mr-2 pr-10 pl-4 py-3 bg-[#16171a] backdrop-blur-2xl rounded-l-[40px] border-y border-l border-white/10 shadow-[-15px_0_30px_rgba(0,0,0,0.5)] flex items-row gap-2">
                    {PLATFORMS.map((site) => (
                      <button 
                        key={site.id}
                        type="button"
                        onClick={() => { setSelectedSite(site.id); setShowMenu(false); }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[8px] font-bold transition-all transform hover:scale-110 ${
                          selectedSite === site.id ? `${site.color} text-white` : 'bg-white/5 text-gray-500 hover:bg-white/10'
                        }`}
                      >
                        {site.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button 
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] font-black text-cyan-400 hover:bg-white/20 transition-all"
              >
                {PLATFORMS.find(p => p.id === selectedSite)?.label}
              </button>

              <button className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg hover:bg-blue-500 hover:shadow-blue-500/20 transition-all active:scale-90">
                {loading ? <span className="animate-spin text-xs">⏳</span> : '🔍'}
              </button>
            </div>
          </form>
        </div>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        
<section className="lg:col-span-2 bg-white/5 backdrop-blur-md rounded-[40px] p-8 border border-white/10 h-[450px] flex flex-col">
   <div className="flex items-center justify-between mb-8">
     <h3 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Live Market Flux</h3>
     <div className="flex gap-2">
       <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
       <span className="text-[8px] text-cyan-400 font-bold uppercase tracking-widest">Active Monitoring</span>
     </div>
   </div>
   
   <div className="flex items-end justify-between h-64 gap-4 pb-4 px-4">
      {history.slice(0, 10).reverse().map((item, i) => {
        const maxPrice = Math.max(...history.map(h => h.price));
        const relativeHeight = (item.price / maxPrice) * 100;

        return (
          <div key={item.id} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1 bg-cyan-500/20 px-2 py-1 rounded text-[8px] font-mono text-cyan-400">
              {item.price} TL
            </div>
            
            <div 
              style={{ height: `${Math.max(relativeHeight, 15)}%` }} 
              className={`w-full rounded-t-2xl transition-all duration-1000 ease-out shadow-[0_-10px_20px_rgba(34,211,238,0.1)]
                ${item.trend === 'down' ? 'bg-gradient-to-t from-cyan-500/60 to-cyan-400/10 border-t border-cyan-400/40' : 'bg-gradient-to-t from-blue-600/60 to-blue-500/10 border-t border-blue-400/40'}`}
            ></div>
            
            <span className="text-[7px] text-gray-600 font-bold uppercase truncate w-full text-center">
              {item.title.split(' ')[0]}
            </span>
          </div>
        );
      })}
   </div>
   
   <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center">
     <p className="text-gray-600 text-[10px] font-bold tracking-[0.4em] uppercase">
       Analysis: {history.length} Points Detected
     </p>
     <div className="flex gap-4">
        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-cyan-500/60 rounded-sm"></div><span className="text-[8px] text-gray-500 uppercase">Low</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-600/60 rounded-sm"></div><span className="text-[8px] text-gray-500 uppercase">High</span></div>
     </div>
   </div>
</section>

        <section className="bg-[#111214] backdrop-blur-md rounded-[40px] p-6 border border-white/10 flex flex-col">
          <h3 className="text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-8 flex items-center gap-2">
            Recent Activity <span className="px-2 py-0.5 bg-white/5 rounded-full text-[8px]">{history.length}</span>
          </h3>
          
          <div className="space-y-6 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {history.map((item) => (
              <div key={item.id} className="flex items-center justify-between group cursor-pointer hover:bg-white/[0.03] p-3 rounded-2xl transition-all border border-transparent hover:border-white/5">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 group-hover:border-cyan-500/30 transition-colors">
                    {item.screenshot ? (
                      <img src={`http://localhost:8000/static/${item.screenshot}`} className="w-full h-full object-cover" alt="Product" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-lg opacity-40 group-hover:scale-110 transition-transform">📦</div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-300 truncate w-24 uppercase group-hover:text-white transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[8px] text-gray-600 font-mono mt-1 uppercase">{item.time}</span>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-sm font-black text-cyan-400 leading-none">{item.price} TL</span>
                  <span className={`text-[7px] font-bold mt-1 tracking-tighter ${item.trend === 'down' ? 'text-emerald-500' : item.trend === 'up' ? 'text-rose-500' : 'text-gray-600'}`}>
                    {item.trend === 'down' ? '▼ PRICE DROP' : item.trend === 'up' ? '▲ INCREASE' : '• STABLE'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-auto w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] font-bold uppercase tracking-widest transition-all border border-white/5 mt-8">
            View Full History
          </button>
        </section>
      </main>

      <footer className="mt-16 text-[9px] text-gray-600 font-bold uppercase tracking-[0.5em]">
        Built by Mesudxox• AntiX Linux Optimized
      </footer>
    </div>
  );
}

export default App;