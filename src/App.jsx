import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Bell, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  X,
  ArrowUpRight,
  ArrowDownRight,
  Mail,
  Flame,
  Globe,
  Zap,
  Clock,
  BarChart3,
  Wifi,
  WifiOff,
  Layers,
  ChevronLeft,
  ChevronRight,
  Wallet,
  ArrowUpDown,
  Activity
} from 'lucide-react';

/**
 * UTILITY: Simple SVG Sparkline Chart
 */
const Sparkline = ({ data, color, width = 120, height = 40 }) => {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const pathD = data.map((val, i) => {
    const x = i * step;
    const y = height - ((val - min) / range) * height;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// --- MOCK DATA GENERATOR ---
const generateMockData = (page) => {
  const baseCoins = [
    { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', price: 64230, cap: 1200000000000 },
    { id: 'ethereum', symbol: 'eth', name: 'Ethereum', price: 3450, cap: 400000000000 },
    { id: 'solana', symbol: 'sol', name: 'Solana', price: 145, cap: 65000000000 },
    { id: 'bnb', symbol: 'bnb', name: 'BNB', price: 590, cap: 87000000000 },
    { id: 'ripple', symbol: 'xrp', name: 'XRP', price: 0.62, cap: 34000000000 },
    { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', price: 0.16, cap: 23000000000 },
    { id: 'cardano', symbol: 'ada', name: 'Cardano', price: 0.45, cap: 16000000000 },
    { id: 'avalanche', symbol: 'avax', name: 'Avalanche', price: 35, cap: 13000000000 },
    { id: 'shiba-inu', symbol: 'shib', name: 'Shiba Inu', price: 0.000025, cap: 14000000000 },
    { id: 'polkadot', symbol: 'dot', name: 'Polkadot', price: 7.20, cap: 10000000000 },
  ];

  const extendedCoins = [...baseCoins];
  // Generate more variants to ensure we can show 75+ items in demo mode
  for (let i = 0; i < 75; i++) {
    extendedCoins.push({
      id: `coin-${i}`,
      symbol: `alt${i}`,
      name: `AltCoin ${i + 1}`,
      price: Math.random() * 100,
      cap: Math.random() * 1000000000
    });
  }

  return extendedCoins.map((coin, index) => {
    const isPositive = Math.random() > 0.4;
    return {
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: `https://ui-avatars.com/api/?name=${coin.name}&background=random&color=fff&size=64`,
      current_price: coin.price,
      market_cap: coin.cap,
      price_change_percentage_24h: (Math.random() * 10) * (isPositive ? 1 : -1),
      price_change_percentage_1h_in_currency: (Math.random() * 2) * (Math.random() > 0.5 ? 1 : -1),
      sparkline_in_7d: { 
        price: Array.from({ length: 20 }, () => coin.price * (0.9 + Math.random() * 0.2)) 
      }
    };
  });
};

const MOCK_COINS = generateMockData(1);

// --- TABS CONFIGURATION ---
const TABS = [
  { id: 'all', label: 'All Assets', icon: Layers },
  { id: 'top', label: 'Top', icon: BarChart3 },
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'most_visited', label: 'Most Visited', icon: TrendingUp },
  { id: 'new', label: 'New', icon: Clock },
  { id: 'gainers', label: 'Gainers', icon: Zap },
  { id: 'losers', label: 'Losers', icon: TrendingDown },
  { id: 'rwa', label: 'Real-World Assets', icon: Globe },
];

export default function CryptoTracker() {
  // --- STATE ---
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); 
  const [usingMockData, setUsingMockData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [secondsUntilUpdate, setSecondsUntilUpdate] = useState(15);
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'market_cap', direction: 'desc' });

  // Portfolio State (Persisted in LocalStorage)
  const [holdings, setHoldings] = useState(() => {
    const saved = localStorage.getItem('crypto_holdings');
    return saved ? JSON.parse(saved) : {};
  });

  // Alerts State
  const [alerts, setAlerts] = useState([]); 
  const [notifications, setNotifications] = useState([]); 
  const [showAddAlert, setShowAddAlert] = useState(false);
  
  // Form State for new alert
  const [newAlertCoin, setNewAlertCoin] = useState(''); 
  const [newAlertPrice, setNewAlertPrice] = useState('');
  const [newAlertCondition, setNewAlertCondition] = useState('above');

  // --- EFFECTS ---
  
  // Save holdings whenever they change
  useEffect(() => {
    localStorage.setItem('crypto_holdings', JSON.stringify(holdings));
  }, [holdings]);

  // Fetch API
  const fetchPrices = async () => {
    setLoading(true);
    try {
      const isAll = activeTab === 'all';
      const pageToFetch = isAll ? currentPage : 1;
      const perPage = isAll ? '50' : '20'; // Default, overridden in switch

      let params = new URLSearchParams({
        vs_currency: 'usd',
        per_page: perPage,
        page: pageToFetch.toString(),
        sparkline: 'true',
        price_change_percentage: '1h,24h,7d',
        order: 'market_cap_desc' 
      });

      switch (activeTab) {
        case 'trending': 
          params.set('order', 'gecko_desc'); 
          break;
        case 'most_visited': 
          params.set('order', 'volume_desc'); 
          params.set('per_page', '75'); 
          break;
        case 'new': 
          params.set('order', 'id_desc'); 
          params.set('per_page', '75');
          break;
        case 'rwa': 
          params.set('category', 'real-world-assets'); 
          params.set('per_page', '75');
          break;
        case 'gainers': 
          params.set('per_page', '75'); 
          break;
        case 'losers': 
          params.set('per_page', '75'); 
          break;
        default: 
          params.set('order', 'market_cap_desc');
      }

      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?${params.toString()}`
      );
      
      if (!response.ok) throw new Error("Rate limit or API error");
      
      let data = await response.json();

      if (activeTab === 'gainers') {
        data = data.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
      }
      
      if (activeTab === 'losers') {
        data = data.sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
      }

      setCoins(data);
      setUsingMockData(false);
      setLastUpdated(new Date());
      checkAlerts(data, alerts); 
    } catch (error) {
      console.warn("API Failed, switching to demo mode:", error);
      const demoData = generateMockData(currentPage);
      
      if (activeTab === 'losers') {
         demoData.sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
      } else if (activeTab === 'gainers') {
         demoData.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
      }
      
      setCoins(demoData);
      setUsingMockData(true);
      setLastUpdated(new Date());
      checkAlerts(demoData, alerts);
    } finally {
      setLoading(false);
    }
  };

  // Real-time Update Effect (15s polling)
  useEffect(() => {
    // Initial fetch
    fetchPrices();
    setSecondsUntilUpdate(15);

    // Fetch Interval
    const fetchInterval = setInterval(() => {
      fetchPrices();
      setSecondsUntilUpdate(15);
    }, 15000); // 15 seconds

    // Countdown UI Interval
    const countdownInterval = setInterval(() => {
      setSecondsUntilUpdate(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(countdownInterval);
    };
  }, [activeTab, currentPage]); 

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // --- SORTING LOGIC ---
  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedCoins = useMemo(() => {
    let sortableItems = [...coins];
    
    // Filter first
    sortableItems = sortableItems.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;

        // Custom Sort Keys
        if (sortConfig.key === 'holdings') {
          aValue = holdings[a.id] || 0;
          bValue = holdings[b.id] || 0;
        } else if (sortConfig.key === 'holdings_value') {
          aValue = (holdings[a.id] || 0) * a.current_price;
          bValue = (holdings[b.id] || 0) * b.current_price;
        } else {
          // Standard Keys
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        // Handle nulls
        if (aValue === null || aValue === undefined) aValue = -Infinity;
        if (bValue === null || bValue === undefined) bValue = -Infinity;

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [coins, sortConfig, searchTerm, holdings]);

  // --- HANDLERS ---
  const updateHoldings = (coinId, value) => {
    const num = parseFloat(value);
    setHoldings(prev => ({
      ...prev,
      [coinId]: isNaN(num) ? 0 : num
    }));
  };

  const checkAlerts = (currentCoins, currentAlerts) => {
    const newNotifications = [];
    const updatedAlerts = currentAlerts.map(alert => {
      const coin = currentCoins.find(c => c.id === alert.coinId);
      if (!coin) return alert;

      let isTriggered = false;
      if (alert.condition === 'above' && coin.current_price > alert.targetPrice) isTriggered = true;
      if (alert.condition === 'below' && coin.current_price < alert.targetPrice) isTriggered = true;

      if (isTriggered && !alert.triggered) {
        newNotifications.push({
          id: Date.now() + Math.random(),
          title: `Price Alert: ${coin.name}`,
          message: `${coin.symbol.toUpperCase()} is now ${alert.condition} $${alert.targetPrice.toLocaleString()}`,
          time: new Date(),
          type: 'success'
        });
        return { ...alert, triggered: true };
      } else if (!isTriggered && alert.triggered) {
        return { ...alert, triggered: false };
      }
      return alert;
    });

    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev]);
      setAlerts(updatedAlerts);
    }
  };

  const handleAddAlert = (e) => {
    e.preventDefault();
    if (!newAlertCoin || !newAlertPrice) return;
    const selectedCoin = coins.find(c => c.id === newAlertCoin);
    if (!selectedCoin) return;
    const newAlert = {
      id: Date.now(),
      coinId: selectedCoin.id,
      coinName: selectedCoin.name,
      coinSymbol: selectedCoin.symbol,
      targetPrice: parseFloat(newAlertPrice),
      condition: newAlertCondition,
      triggered: false
    };
    setAlerts(prev => [...prev, newAlert]);
    setShowAddAlert(false);
    setNewAlertPrice('');
    setNewAlertCoin('');
    checkAlerts(coins, [...alerts, newAlert]);
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  // --- RENDER HELPERS ---
  const formatCurrency = (val) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const formatPercentage = (val) => {
    if (val === null || val === undefined) return '-';
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
  };

  const getChangeColor = (val) => {
    if (val === null || val === undefined) return 'text-slate-400';
    return val >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-50" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUpRight className="w-3 h-3 text-indigo-400" />
      : <ArrowDownRight className="w-3 h-3 text-indigo-400" />;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-20 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <TrendingUp className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              CryptoTon
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            
            {/* Live Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border bg-indigo-900/30 border-indigo-500/50 text-indigo-300">
               <Activity className="w-3 h-3 animate-pulse text-green-400" />
               <span className="hidden sm:inline">Live Update:</span>
               <span className="font-mono font-bold text-white w-4">{secondsUntilUpdate}s</span>
            </div>

            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${usingMockData ? 'bg-amber-900/30 border-amber-700 text-amber-500' : 'bg-green-900/30 border-green-700 text-green-500'}`}>
              {usingMockData ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
              {usingMockData ? 'Demo Mode' : 'Connected'}
            </div>
            
            <button 
              onClick={() => { fetchPrices(); setSecondsUntilUpdate(15); }} 
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{loading ? 'Updating...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Top Section: Alerts & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bell className="text-indigo-400 w-5 h-5" />
                <h2 className="font-semibold text-lg">Price Alerts</h2>
              </div>
              <button 
                onClick={() => setShowAddAlert(!showAddAlert)}
                className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md transition-colors"
              >
                + New Alert
              </button>
            </div>

            {showAddAlert && (
              <form onSubmit={handleAddAlert} className="p-4 bg-slate-700/50 border-b border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-in fade-in slide-in-from-top-4">
                <div className="md:col-span-1">
                  <label className="block text-xs text-slate-400 mb-1">Select Coin</label>
                  <select 
                    value={newAlertCoin}
                    onChange={(e) => setNewAlertCoin(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  >
                    <option value="">Choose...</option>
                    {coins.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.symbol.toUpperCase()})</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs text-slate-400 mb-1">Condition</label>
                  <select 
                    value={newAlertCondition}
                    onChange={(e) => setNewAlertCondition(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="above">Goes Above</option>
                    <option value="below">Goes Below</option>
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs text-slate-400 mb-1">Target Price ($)</label>
                  <input 
                    type="number" 
                    step="any"
                    value={newAlertPrice}
                    onChange={(e) => setNewAlertPrice(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded text-sm font-medium transition-colors h-[38px]"
                >
                  Set Alert
                </button>
              </form>
            )}

            <div className="p-0">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <p>No active alerts. Set a price threshold to get notified.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {alerts.map(alert => (
                    <div key={alert.id} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${alert.triggered ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
                        <div>
                          <span className="font-bold text-white">{alert.coinSymbol.toUpperCase()}</span>
                          <span className="text-slate-400 mx-2">{alert.condition === 'above' ? '>' : '<'}</span>
                          <span className="font-mono text-indigo-300">${alert.targetPrice.toLocaleString()}</span>
                        </div>
                      </div>
                      <button onClick={() => removeAlert(alert.id)} className="text-slate-500 hover:text-red-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden flex flex-col h-[300px] lg:h-auto">
            <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex items-center gap-2">
              <Mail className="text-cyan-400 w-5 h-5" />
              <h2 className="font-semibold text-lg">Alert Log</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="text-center text-slate-500 mt-10">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No notifications yet.</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="bg-slate-700/50 border-l-4 border-green-500 p-3 rounded text-sm animate-in slide-in-from-right-2">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-green-400">{n.title}</span>
                      <span className="text-xs text-slate-500">{n.time.toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Market Data Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
          
          <div className="p-5 border-b border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold">Market Overview</h2>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search coins..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="border-b border-slate-700 overflow-x-auto">
            <div className="flex min-w-max px-4">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-all
                      ${isActive 
                        ? 'border-indigo-500 text-indigo-400' 
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'}
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Asset</th>
                  
                  {/* Clickable Price Header */}
                  <th 
                    className="p-4 font-medium text-right cursor-pointer hover:text-white transition-colors group"
                    onClick={() => handleSort('current_price')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Price <SortIcon columnKey="current_price" />
                    </div>
                  </th>
                  
                  {/* Clickable 1h % Header */}
                  <th 
                    className="p-4 font-medium text-right w-32 cursor-pointer hover:text-white transition-colors group"
                    onClick={() => handleSort('price_change_percentage_1h_in_currency')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      1h % <SortIcon columnKey="price_change_percentage_1h_in_currency" />
                    </div>
                  </th>
                  
                  {/* Clickable 24h % Header */}
                  <th 
                    className="p-4 font-medium text-right w-32 cursor-pointer hover:text-white transition-colors group"
                    onClick={() => handleSort('price_change_percentage_24h')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      24h % <SortIcon columnKey="price_change_percentage_24h" />
                    </div>
                  </th>
                  
                  {/* Clickable Market Cap Header */}
                  <th 
                    className="p-4 font-medium text-right hidden md:table-cell cursor-pointer hover:text-white transition-colors group"
                    onClick={() => handleSort('market_cap')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Market Cap <SortIcon columnKey="market_cap" />
                    </div>
                  </th>

                  <th className="p-4 font-medium hidden md:table-cell">Last 7 Days</th>
                  
                  {/* New Holdings Column */}
                  <th 
                     className="p-4 font-medium text-right cursor-pointer hover:text-white transition-colors group"
                     onClick={() => handleSort('holdings')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Holdings <SortIcon columnKey="holdings" />
                    </div>
                  </th>
                  
                  {/* New Personal Value Column */}
                  <th 
                    className="p-4 font-medium text-right cursor-pointer hover:text-white transition-colors group"
                    onClick={() => handleSort('holdings_value')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Your Value <SortIcon columnKey="holdings_value" />
                    </div>
                  </th>

                  <th className="p-4 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 text-sm">
                {loading && coins.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-slate-500">Loading market data...</td>
                  </tr>
                ) : sortedCoins.map((coin) => {
                  const isPositive = coin.price_change_percentage_24h >= 0;
                  const oneHourChange = coin.price_change_percentage_1h_in_currency;
                  const userHolding = holdings[coin.id] || 0;
                  const userValue = userHolding * coin.current_price;
                  
                  return (
                    <tr key={coin.id} className="hover:bg-slate-700/20 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                          <div>
                            <div className="font-bold text-white">{coin.name}</div>
                            <div className="text-xs text-slate-500 uppercase">{coin.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono font-medium text-base">
                        {formatCurrency(coin.current_price)}
                      </td>
                      <td className={`p-4 text-right font-medium ${getChangeColor(oneHourChange)}`}>
                        {formatPercentage(oneHourChange)}
                      </td>
                      <td className={`p-4 text-right font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        <div className="flex items-center justify-end gap-1">
                          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {formatPercentage(coin.price_change_percentage_24h)}
                        </div>
                      </td>
                      <td className="p-4 text-right text-slate-400 hidden md:table-cell">
                        {formatCurrency(coin.market_cap)}
                      </td>
                      <td className="p-4 hidden md:table-cell w-40">
                        <Sparkline 
                          data={coin.sparkline_in_7d?.price} 
                          color={isPositive ? '#4ade80' : '#f87171'} 
                        />
                      </td>

                      {/* Holdings Input */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 group/edit">
                          <input 
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0"
                            value={holdings[coin.id] === 0 ? '' : holdings[coin.id]}
                            onChange={(e) => updateHoldings(coin.id, e.target.value)}
                            className="w-20 bg-transparent border-b border-transparent hover:border-slate-500 focus:border-indigo-500 focus:bg-slate-800 text-right outline-none transition-all placeholder-slate-700 text-slate-300 focus:text-white"
                          />
                        </div>
                      </td>

                      {/* Calculated Value */}
                      <td className="p-4 text-right font-mono text-indigo-300">
                        {userValue > 0 ? formatCurrency(userValue) : '-'}
                      </td>

                      <td className="p-4 text-center">
                        <button 
                          onClick={() => {
                            setNewAlertCoin(coin.id);
                            setNewAlertPrice(coin.current_price);
                            setShowAddAlert(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-400 transition-colors"
                          title="Set Alert"
                        >
                          <Bell className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {sortedCoins.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-500">
              No coins found matching "{searchTerm}"
            </div>
          )}

          {activeTab === 'all' && (
            <div className="p-4 border-t border-slate-700 flex justify-between items-center bg-slate-800/50">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-slate-400 text-sm">
                Page <span className="text-white font-bold">{currentPage}</span>
              </span>
              <button 
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="p-4 border-t border-slate-700 text-xs text-slate-500 flex justify-between">
            <span>Data provided by CoinGecko API</span>
            <span>Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '-'}</span>
          </div>
        </div>

      </main>
    </div>
  );
}
