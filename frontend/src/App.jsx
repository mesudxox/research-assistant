import React, { useState, useEffect } from 'react';
import logo from './assets/xox-logo.png'; 
import { Flame, Bell, Trash2, CheckCircle } from 'lucide-react'; 
import xoxApi from './assets/api';

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
const [selectedId, setSelectedId] = useState([]);
const [editingId, setEditingId] = useState(null);
const [tempTarget, setTempTarget] = useState("");
const [filterHot, setFilterHot] = useState(false);
const [deletingId, setDeletingId] = useState(null);
const [showNotifPanel, setShowNotifPanel] = useState(false);
const [notifications, setNotifications] = useState([
{ id: 101, text: "Welcome to XOX Tracker Premium.", type: "system", time: "Now", read: false },
{ id: 102, text: "Logitech G502 is nearing your target price!", type: "alert", time: "2h ago", read: true }
]);

const [compLeft, setCompLeft] = useState([]);
const [compRight, setCompRight] = useState([]);
const [userName, setUserName] = useState(localStorage.getItem('xox_user_name') || '');
const [isFirstTime, setIsFirstTime] = useState(!localStorage.getItem('xox_user_name'));
const handleDelete = async (productId) => {
setHistory(prev => prev.filter(item => String(item.id) !== String(productId)));
if (String(selectedId) === String(productId)) {
setSelectedId(null);
}

try {
await xoxApi.deleteProduct(productId);
addNotification("Entry Purged", "system");
} catch (err) {
console.error("Sync error:", err);
addNotification("Database Sync Error", "alert");
}
};

useEffect(() => {
const loadDatabaseContent = async () => {
try {
const data = await xoxApi.fetchHistory();
if (data && data.length > 0) {
const formattedData = data.map(item => ({
...item,
history: item.history || [item.price], 
dates: item.dates || [new Date(item.created_at || Date.now()).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})]
}));
setHistory(formattedData);
setSelectedId(formattedData[0].id);
}
} catch (err) {
console.error("Failed to load history:", err);
}
};
loadDatabaseContent();
}, []);

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
if (isNaN(newTarget) || newTarget <= 0) {
setEditingId(null);
return;
}

try {
await xoxApi.updateTarget(id, newTarget);
setHistory(prev => prev.map(item => 
item.id === id ? { ...item, target_price: newTarget } : item
));
setEditingId(null);
setTempTarget("");
addNotification("Target synced to database", "system");
} catch (err) {
console.error("Target Update Error:", err);
addNotification("Database Sync Failed", "alert");
}
};
const handleScrape = async (e) => {
e.preventDefault();
if (!url) return;
setLoading(true);
try {
const response = await xoxApi.scrapeProduct(url, selectedSite);
if (response && response.status === "success") {
const freshData = await xoxApi.fetchHistory();
if (freshData) {
setHistory([...freshData]);
const newItem = freshData.find(item => item.product_url.includes(url.split('?')[0])) || freshData[0];
if (newItem) setSelectedId(newItem.id);
}
setUrl(""); 
setView('dashboard');
addNotification("Market Sync Complete", "system");
}
} catch (err) {
addNotification("Scrape failed to sync", "alert");
} finally {
setLoading(false);
}
};
const calculateProbability = (item) => {
if (!item || !item.price || !item.target_price) return 0;

const currentPrice = parseFloat(item.price);
const target = parseFloat(item.target_price);
if (currentPrice <= target) return 99; 

const diff = currentPrice - target;
const progress = Math.max(0, 100 - (diff / target) * 100);
return Math.round(Math.min(progress, 95));
};
const displayedHistory = Array.isArray(history) 
? (filterHot 
? [...history].reverse().filter(item => item.price <= (item.target_price || 0)) 
: [...history].reverse())
: [];

const active = (history && history.length > 0) 
? (history.find(p => p.id === selectedId) || history[0]) 
: null;
const leftItem = history?.find(p => p.id === compLeft) || history?.[0] || null;
const rightItem = history?.find(p => p.id === compRight) || history?.[1] || history?.[0] || null;

const activeHistory = active?.history || [];
const activeTarget = active?.target_price || 0;

const allPoints = [...activeHistory, activeTarget].filter(p => typeof p === 'number' && p > 0);

const minPrice = allPoints.length ? Math.min(...allPoints) * 0.9 : 0;
const maxPrice = allPoints.length ? Math.max(...allPoints) * 1.1 : 100;
const range = (maxPrice - minPrice) || 1;

const handleOnboarding = (e) => {
e.preventDefault();
const usernameInput = e.currentTarget.elements.username;
const nameValue = usernameInput ? usernameInput.value : "";

if (nameValue.trim()) {
localStorage.setItem('xox_user_name', nameValue);
setUserName(nameValue);
setIsFirstTime(false);
}
};

if (isFirstTime) {
return (
<div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans text-white">
<div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
<img 
src={logo} 
alt="" 
className="w-[150%] max-w-none opacity-[0.03] grayscale brightness-200 scale-150 rotate-[-12deg] select-none"
style={{ filter: 'drop-shadow(0 0 100px rgba(6, 182, 212, 0.2))' }}
/>
</div>

<div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[150px] rounded-full" />
<div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full" />

<div className="max-w-md w-full relative z-10">
<div className="bg-white/[0.01] backdrop-blur-3xl border border-white/5 p-12 rounded-[60px] shadow-2xl text-center">

<div className="mb-12 space-y-2">
<p className="text-[10px] font-black uppercase tracking-[0.8em] text-cyan-500/80 animate-pulse">
System v1.0
</p>
<h1 className="text-7xl font-black tracking-[-0.05em] italic leading-none py-2">
X<span className="text-cyan-400">O</span>X
</h1>

<div className="flex flex-col items-center gap-1">
<div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
<h2 className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400">
Price Tracking <span className="text-white">Platform</span>
</h2>
<p className="text-[8px] font-medium uppercase tracking-[0.2em] text-gray-600">
Real-time market surveillance & automation
</p>
</div>
</div>

<form onSubmit={handleOnboarding} className="space-y-8">
<div className="relative group">
<input
name="username"
required
autoFocus
placeholder="ENTER SYSTEM NAME"
className="w-full bg-transparent border-b border-white/10 py-4 text-white text-center font-bold text-xl focus:outline-none focus:border-cyan-400 transition-all uppercase tracking-[0.3em] placeholder:text-gray-800 placeholder:text-[10px]"
/>
</div>

<button 
type="submit" 
className="w-full relative group overflow-hidden rounded-2xl bg-white py-5 transition-all hover:scale-[1.02] active:scale-95"
>
<span className="relative z-10 text-black font-black uppercase tracking-widest text-xs">
Initialize Session
</span>
<div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
</button>
</form>

<p className="mt-8 text-[8px] font-bold text-gray-700 uppercase tracking-[0.4em]">
Secure Price Surveillance System
</p>
</div>
</div>
</div>
);
}

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
<div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-[10px] shadow-lg text-white">
{userName ? userName.charAt(0).toUpperCase() : 'X'}
</div>
<span className="text-[10px] font-black text-gray-200 uppercase tracking-widest">
{userName || "GUEST"}
</span>
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
<h2 className="text-2xl font-black text-white uppercase tracking-tighter max-w-md truncate">{active?.title || "No Product Selected"}</h2>
</div>
<div className="text-right">
<span className="text-[10px] font-bold text-rose-500 block mb-1 uppercase tracking-tighter">Target Price</span>
<span className="text-3xl font-black text-rose-500">{active?.target_price || 0} TL</span>
</div>
</div>
<div className="flex-1 relative flex items-end justify-between px-6 pb-12 z-10">
<div className="absolute left-0 right-0 border-t-2 border-dashed border-rose-500/30 z-0 transition-all duration-500" style={{ bottom: `${((active?.target_price - minPrice) / range) * 100 + 10}%` }}></div>
{active ? (
(() => {
const historyData = active?.history || [];
const target = active?.target_price || 0;
const allPoints = [...historyData, target].filter(p => typeof p === 'number' && p > 0);

if (allPoints.length === 0) {
return <div className="h-full flex items-center justify-center text-gray-600 text-[10px] uppercase font-black">Waiting for Data...</div>;
}

const minVal = Math.min(...allPoints) * 0.95; 
const maxVal = Math.max(...allPoints) * 1.05; 
const priceRange = maxVal - minVal || 1;

return historyData.map((price, i) => {
const barHeight = ((price - minVal) / priceRange) * 100;

return (
<div key={`${i}-${price}-${active.id}`} className="flex flex-col items-center gap-2 group/bar h-full justify-end relative">
<div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-1 rounded-md opacity-0 group-hover/bar:opacity-100 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap shadow-[0_0_20px_rgba(255,255,255,0.4)] translate-y-2 group-hover/bar:translate-y-0">
{price} TL
</div>

<div 
className="w-8 rounded-t-md transition-all duration-300 cursor-crosshair
bg-gradient-to-t from-cyan-500/40 to-cyan-300
border-x border-t border-cyan-300/50
shadow-[0_0_15px_rgba(34,211,238,0.1)]
group-hover/bar:to-white group-hover/bar:shadow-[0_0_25px_rgba(34,211,238,0.5)] 
group-hover/bar:-translate-y-1"
style={{ height: `${Math.max(barHeight, 15)}%` }}
/>

<span className="text-[8px] text-gray-400 uppercase font-bold tracking-tighter group-hover/bar:text-white transition-colors">
{active?.dates?.[i] || 'Now'}
</span>
</div>
);
});
})()
) : (
<div className="flex flex-col items-center justify-center h-full w-full gap-4">
<div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-800 animate-spin" />
<p className="text-gray-700 font-black uppercase text-[10px] tracking-[0.3em]">
Initialize Engine to View Analysis
</p>
</div>
)}
</div>
</section>

<section className="lg:col-span-4 flex flex-col gap-4 h-[550px] overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:rgba(34,211,238,0.2)_transparent] [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-white/[0.02] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-500/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-cyan-500/50">
<div className="flex items-center gap-3 mb-1 px-2">
<div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_#22d3ee]"></div>
<h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Live Inventory Feed</h3>
</div>

{filterHot && (
<div className="px-5 py-2 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-[9px] font-black text-orange-500 uppercase tracking-widest text-center animate-in slide-in-from-top-2">
Showing Hot Deals Only
</div>
)}

{displayedHistory.map((item) => (
<div
key={item.id}
onClick={() => setSelectedId(item.id)}
className={`p-5 rounded-[32px] cursor-pointer transition-all duration-300 border group relative overflow-hidden transform active:scale-[0.99] ${
selectedId === item.id
? 'bg-white/[0.06] border-cyan-500/40 shadow-[0_0_30px_-10px_rgba(6,182,212,0.25)]'
: 'bg-[#0D0E10] border-white/5 hover:border-white/20'
}`}
>
{selectedId === item.id && (
<div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 shadow-[2px_0_10px_rgba(6,182,212,0.5)]"></div>
)}

<div className="flex justify-between items-start mb-3">
<div className="flex flex-col min-w-0 max-w-[70%]">
<span className="text-[10px] font-bold uppercase tracking-tight text-gray-400 truncate group-hover:text-white transition-colors">
{item.title}
</span>
<span className="mt-1.5 w-fit text-[7px] font-black px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-tighter">
{item.platform || "TRACKED"}
</span>
</div>
<span className="text-sm font-black text-white tracking-tighter shrink-0">
{item.price} <span className="text-[9px] text-gray-500 font-bold ml-0.5">TL</span>
</span>
</div>

{selectedId === item.id && (
<div className="pt-4 border-t border-white/5 space-y-4 animate-in slide-in-from-top-2 duration-300">
<div className="aspect-video bg-black/60 rounded-[24px] border border-white/10 flex flex-col items-center justify-center overflow-hidden relative group/img">
{item.screenshot ? (
<img
src={`http://localhost:8000/static/${item.screenshot}`}
alt={item.title}
className="w-full h-full object-cover opacity-75 group-hover/img:opacity-100 transition-opacity duration-500"
onError={(e) => {
e.target.style.display = 'none';
e.target.nextSibling.style.display = 'block';
}}
/>
) : null}
<span className="text-[9px] font-black uppercase text-gray-700 hidden">Preview Unavailable</span>
{!item.screenshot && <span className="text-[9px] font-black uppercase text-gray-600 tracking-widest animate-pulse">Processing...</span>}
</div>

<div className="flex justify-between items-center bg-black/40 p-3 rounded-2xl border border-white/5">
<span className="text-[8px] font-black text-gray-500 uppercase tracking-wider">Target Threshold</span>
{editingId === item.id ? (
<input
autoFocus
className="bg-transparent text-rose-500 font-black text-xs outline-none w-20 text-right border-b border-rose-500/30 pb-0.5 focus:border-rose-500"
value={tempTarget}
onChange={(e) => setTempTarget(e.target.value)}
onBlur={() => handleUpdateTarget(item.id)}
onKeyDown={(e) => e.key === 'Enter' && handleUpdateTarget(item.id)}
/>
) : (
<span className="text-xs font-black text-rose-500 tracking-tight">{item.target_price} TL</span>
)}
</div>

<div className="grid grid-cols-3 gap-2">
<button
onClick={(e) => {
e.stopPropagation();
setEditingId(item.id);
setTempTarget(item.target_price);
}}
className="py-2.5 bg-white/5 hover:bg-white/10 text-white text-[8px] font-black uppercase rounded-xl border border-white/10 transition-all"
>
{editingId === item.id ? "Confirm" : "Config"}
</button>
<button
onClick={(e) => {
e.stopPropagation();
const actualUrl = item.product_url || item.url;
if (actualUrl) {
const finalUrl = actualUrl.startsWith('http') ? actualUrl : `https://${actualUrl}`;
window.open(finalUrl, '_blank', 'noopener,noreferrer');
} else {
addNotification("Link data missing from server", "alert");
}
}}
className="py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[8px] font-black uppercase rounded-xl border border-cyan-500/20 transition-all flex items-center justify-center"
>
Source
</button>
<button
onClick={(e) => {
e.stopPropagation();
setDeletingId(item.id);
}}
className="py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[8px] font-black uppercase rounded-xl border border-rose-500/20 transition-all"
>
Purge
</button>
</div>
</div>
)}
</div>
))}
</section>
</div>
)}

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
<div className="text-6xl font-black mb-10">{item?.price || 0} <span className="text-lg text-gray-500 uppercase tracking-widest ml-2">TL</span></div>
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
<div className="text-center mb-16">
<h2 className="text-6xl font-black uppercase italic tracking-tighter mb-4">
Protocol <span className="text-cyan-400">Manual</span>
</h2>
<p className="text-gray-500 text-xs font-bold uppercase tracking-[0.4em]">Master the XOX Tracker Engine</p>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div className="bg-white/5 p-8 rounded-[40px] border border-white/10 hover:border-cyan-500/30 transition-all group">
<div className="w-12 h-12 rounded-2xl bg-cyan-500 flex items-center justify-center text-black font-black mb-6 shadow-[0_0_20px_rgba(34,211,238,0.4)]">01</div>
<h3 className="text-lg font-black uppercase mb-3 text-white">Initialize Tracking</h3>
<p className="text-gray-400 text-xs leading-relaxed">
Paste any product URL from <span className="text-orange-500 font-bold">Trendyol</span> or <span className="text-yellow-500 font-bold">Amazon</span>. 
Our Selenium engine bypasses bot detection to fetch real-time data directly to your dashboard.
</p>
</div>

<div className="bg-white/5 p-8 rounded-[40px] border border-white/10 hover:border-rose-500/30 transition-all group">
<div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center text-black font-black mb-6 shadow-[0_0_20px_rgba(244,63,94,0.4)]">02</div>
<h3 className="text-lg font-black uppercase mb-3 text-white">Set Price Floors</h3>
<p className="text-gray-400 text-xs leading-relaxed">
Click <span className="text-white font-bold">Edit Target</span> to set your buy-in price. 
The system highlights deals in <span className="text-orange-500 font-bold">ORANGE</span> and sends an alert when they hit the "Hot" threshold.
</p>
</div>

<div className="bg-white/5 p-8 rounded-[40px] border border-white/10 hover:border-blue-500/30 transition-all group">
<div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-black font-black mb-6 shadow-[0_0_20px_rgba(59,130,246,0.4)]">03</div>
<h3 className="text-lg font-black uppercase mb-3 text-white">Market Clash</h3>
<p className="text-gray-400 text-xs leading-relaxed">
Navigate to <span className="text-cyan-400 font-bold">Compare</span> to pit products against each other. 
Our algorithm calculates the "Drop Probability" based on historical volatility.
</p>
</div>

<div className="bg-white/5 p-8 rounded-[40px] border border-white/10 hover:border-emerald-500/30 transition-all group">
<div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-black font-black mb-6 shadow-[0_0_20px_rgba(16,185,129,0.4)]">04</div>
<h3 className="text-lg font-black uppercase mb-3 text-white">Visual Assets</h3>
<p className="text-gray-400 text-xs leading-relaxed">
Every scan saves a screenshot. 
you can use this visual proof to verify prices before buying anything.
</p>
</div>
</div>

<div className="mt-12 bg-gradient-to-r from-cyan-500/10 to-transparent p-8 rounded-[40px] border border-cyan-500/20 text-center">
<p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">System Status: Optimal</p>
<p className="text-gray-500 text-[9px] mt-2 italic">Running on antiX Linux Environment with FastAPI/React Hybrid Bridge</p>
</div>
</section>
)}
{view === 'dashboard' && (
<footer className="relative mt-20 pb-16 overflow-hidden">
<div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

<div className="max-w-6xl mx-auto px-6 pt-20">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-10">
<div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
{[
{ 
label: "Market Delta", 
val: history.length > 0 ? `${(history.filter(i => (i.current_price || i.price) < (i.initial_price)).length / history.length * 100).toFixed(0)}%` : "0%",
sub: "Price Drop Ratio",
color: "text-emerald-400" 
},
{ label: "Sync Latency", val: "142ms", sub: "FastAPI Response", color: "text-cyan-400" },
{ label: "Session Load", val: `${(history.length * 0.4).toFixed(1)}MB`, sub: "Active Cache", color: "text-orange-500" },
{ label: "Engine Identity", val: "XOX-v2", sub: "Stable Build", color: "text-white" }
].map((stat, i) => (
<div key={i} className="bg-[#0D0E10] border border-white/5 p-6 rounded-[32px] shadow-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-all">
<p className="text-[7px] font-black uppercase tracking-[0.3em] text-gray-600 mb-3">{stat.label}</p>
<div className="flex items-baseline gap-2">
<p className={`text-xl font-black tracking-tighter ${stat.color}`}>{stat.val}</p>
<div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse opacity-50"></div>
</div>
<p className="text-[8px] font-bold text-gray-500 uppercase mt-1 tracking-widest">{stat.sub}</p>
</div>
))}
</div>

<div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[40px] p-8 flex flex-col justify-center space-y-4">
<h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-2 text-center">Market Access</h4>
<div className="grid grid-cols-2 gap-3">
<a href="https://www.trendyol.com" target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-all group">
<span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Trendyol</span>
<span className="text-[8px] text-orange-500/60 uppercase font-bold">Visit Market</span>
</a>
<a href="https://www.amazon.com.tr" target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 transition-all group">
<span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Amazon AZ</span>
<span className="text-[8px] text-yellow-500/60 uppercase font-bold">Visit Market</span>
</a>
</div>
</div>
</div>

<div className="w-full bg-white/[0.01] border-y border-white/5 py-4 mb-16 overflow-hidden flex whitespace-nowrap group">
<div className="flex animate-[marquee_40s_linear_infinite] gap-16 items-center group-hover:[animation-play-state:paused]">
{[...history, ...history].map((item, i) => (
<div key={i} className="flex items-center gap-4">
<span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase text-white ${item.platform === 'amazon' ? 'bg-yellow-600' : 'bg-orange-600'}`}>
{item.platform}
</span>
<span className="text-[10px] font-bold text-gray-300 truncate max-w-[200px]">{item.product_name || item.title}</span>
<span className="text-[10px] font-black text-cyan-400">{item.current_price || item.price} TL</span>
<div className="w-1 h-1 rounded-full bg-white/10"></div>
</div>
))}
{history.length === 0 && (
<p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em] w-full text-center py-2">Awaiting Live Market Feed...</p>
)}
</div>
</div>

<div className="flex flex-col md:flex-row justify-between items-start gap-12 border-t border-white/5 pt-12">
<div className="max-w-sm space-y-4">
<h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">System Mission</h4>
<p className="text-[10px] text-gray-500 font-medium leading-relaxed uppercase tracking-wider">
Advanced price surveillance engine optimized for low-latency market analysis and automated data retrieval across global retailers.
</p>
</div>

<div className="grid grid-cols-2 gap-12">
<div className="space-y-4">
<h5 className="text-[10px] font-black text-white uppercase tracking-widest underline decoration-cyan-500 underline-offset-8 mb-6">Contact</h5>
<a href="https://github.com/mesudxox" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors group">
<span className="text-[11px] font-bold tracking-tight">GITHUB: @mesudxox</span>
<span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
</a>
</div>
<div className="space-y-4">
<h5 className="text-[10px] font-black text-white uppercase tracking-widest underline decoration-gray-700 underline-offset-8 mb-6">Network</h5>
<ul className="space-y-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
<li className="hover:text-white cursor-pointer transition-colors">Internal Docs</li>
<li className="hover:text-white cursor-pointer transition-colors">API Endpoint</li>
</ul>
</div>
</div>
</div>

<div className="mt-16 flex justify-between items-center text-[8px] font-black uppercase tracking-[0.4em] text-gray-800">
<p>© 2026 Mesudxox Architecture • All Rights Reserved</p>
<div className="flex items-center gap-2">
<div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
<span className="text-gray-700 tracking-[0.2em]">Live Global Cluster</span>
</div>
</div>
</div>

<style>{`
@keyframes marquee {
0% { transform: translateX(0); }
100% { transform: translateX(-50%); }
}
`}</style>
</footer>
)}

{deletingId && (
<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
<div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setDeletingId(null)} />
<div className="relative bg-[#0d0e10] border border-rose-500/30 p-8 rounded-[40px] max-w-sm w-full shadow-[0_0_80px_-20px_rgba(244,63,94,0.4)] animate-in zoom-in-95 duration-300">
<div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-6 mx-auto border border-rose-500/20">
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
<path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
</svg>
</div>
<h3 className="text-2xl font-black text-white text-center mb-2 uppercase tracking-tight">Purge Item?</h3>
<p className="text-gray-500 text-center text-[10px] font-bold uppercase tracking-widest mb-8 leading-relaxed">
This action is permanent and will wipe all price history records.
</p>
<div className="grid grid-cols-2 gap-4">
<button 
onClick={() => setDeletingId(null)}
className="py-4 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase rounded-2xl border border-white/10 transition-all"
>
Cancel
</button>
<button 
onClick={() => {
handleDelete(deletingId);
setDeletingId(null);
}}
className="py-4 bg-rose-500 text-white text-[10px] font-black uppercase rounded-2xl shadow-xl shadow-rose-500/30 hover:bg-rose-600 transition-all"
>
Confirm
</button>
</div>
</div>
</div>
)}
</main>
</div>
);
}

export default App;

