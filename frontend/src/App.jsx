import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [auth, setAuth] = useState({
    token: 'demo-token',
    user: { name: 'Demo Partner', email: 'demo@example.com' }
  });
  const [view, setView] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ revenue: 0, expenses: 0, profit: 0, categoryTotals: {} });
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [insight, setInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'Sales',
    type: 'income',
    date: new Date().toISOString().slice(0, 10)
  });


  const [investmentAmount, setInvestmentAmount] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'copilot', text: "Hi! I'm your Apex AI Copilot. Ask me questions about your revenue, expenses, net profit, profit margin, investments, categories, or transaction totals!" }
  ]);
  const [chatTyping, setChatTyping] = useState(false);

  useEffect(() => {
    const randomAmount = Math.floor(Math.random() * (45000 - 15000 + 1)) + 15000 + 0.85;
    setInvestmentAmount(randomAmount);
  }, []);

  // Theme support
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Transaction list filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const fetchData = async (token) => {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [txnRes, summaryRes, trendRes] = await Promise.all([
        fetch(`${API_URL}/transactions`, { headers }),
        fetch(`${API_URL}/analytics/summary`, { headers }),
        fetch(`${API_URL}/analytics/monthly-trends`, { headers }),
      ]);

      if (txnRes.ok) setTransactions(await txnRes.json());
      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (trendRes.ok) setMonthlyTrends(await trendRes.json());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  };

  useEffect(() => {
    if (auth.token) {
      fetchData(auth.token);
    }
  }, [auth.token]);



  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!auth.token) return;
    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ ...form, amount: Number(form.amount), date: new Date(form.date).toISOString() }),
      });
      if (response.ok) {
        setForm({ description: '', amount: '', category: 'Sales', type: 'income', date: new Date().toISOString().slice(0, 10) });
        fetchData(auth.token);
      }
    } catch (err) {
      alert('Failed to submit transaction');
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!auth.token) return;
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      const response = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (response.ok) {
        fetchData(auth.token);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete transaction');
      }
    } catch (err) {
      alert('Network error. Failed to delete transaction.');
    }
  };

  const handleGetInsight = async () => {
    if (!auth.token) return;
    setLoadingInsight(true);
    setInsight('');
    try {
      const response = await fetch(`${API_URL}/ai-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ data: { summary, transactions, monthlyTrends } }),
      });
      const data = await response.json();
      setInsight(data.insight || '');
    } catch (err) {
      setInsight('Failed to retrieve AI insights. Please check connection and try again.');
    } finally {
      setLoadingInsight(false);
    }
  };

  const handleCopy = () => {
    if (!insight) return;
    navigator.clipboard.writeText(insight);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendChatMessage = async (userText) => {
    if (!userText.trim()) return;

    const newMsg = { sender: 'user', text: userText };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
    setChatTyping(true);

    const query = userText.toLowerCase();
    let reply = '';

    setTimeout(async () => {
      try {
        if (query.includes('revenue') || query.includes('sales')) {
          reply = `Your gross revenue is **$${summary.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}**. This represents total incoming funds.`;
        } else if (query.includes('expense') || query.includes('cost') || query.includes('spend')) {
          reply = `Your operating expenses are **$${summary.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}**. You can review categories in the transactions tab.`;
        } else if (query.includes('profit margin') || query.includes('margin')) {
          reply = `Your net profit margin is **${profitMargin}%** (calculated as net profit divided by gross revenue).`;
        } else if (query.includes('profit') || query.includes('income')) {
          reply = `Your net profit is **$${summary.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}**. This is your gross revenue minus operating expenses.`;
        } else if (query.includes('investment') || query.includes('capital') || query.includes('asset')) {
          reply = `Your total capital investments stand at **$${investmentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}**. This includes simulated dynamic asset holdings showing a **+8.4%** valuation increase.`;
        } else if (query.includes('category') || query.includes('distribution')) {
          if (categories.length === 0) {
            reply = `No category statistics are currently loaded.`;
          } else {
            const list = categories.map(([cat, val]) => `* **${cat}**: $${val.toLocaleString()}`).join('\n');
            reply = `Here is your category distribution:\n\n${list}`;
          }
        } else if (query.includes('transaction') || query.includes('history') || query.includes('ledger') || query.includes('recent')) {
          if (transactions.length === 0) {
            reply = `There are no transactions recorded in your ledger.`;
          } else {
            const list = transactions.slice(0, 5).map(t => `* **${t.description}** (${t.category}): ${t.type === 'income' ? '+' : '-'}$${t.amount}`).join('\n');
            reply = `Here are your 5 most recent transactions:\n\n${list}`;
          }
        } else {
          try {
            const response = await fetch(`${API_URL}/ai-insights`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
              body: JSON.stringify({
                data: {
                  summary: { ...summary, investments: investmentAmount },
                  transactions,
                  monthlyTrends,
                  query: userText
                }
              }),
            });
            const data = await response.json();
            reply = data.insight || 'No response generated.';
          } catch (err) {
            reply = 'I encountered a connection error. Here is a quick recommendation instead:\n\n* Keep operating costs under 35% of revenue.\n* Diversify sales categories to optimize margins.\n* Leverage dynamic investments to improve capital buffer.';
          }
        }
      } catch (err) {
        reply = 'Sorry, I failed to process that request. Let me know if you want me to analyze something else.';
      } finally {
        setChatMessages((prev) => [...prev, { sender: 'copilot', text: reply }]);
        setChatTyping(false);
        setTimeout(() => {
          const chatEl = document.getElementById('copilot-chat-messages');
          if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
        }, 50);
      }
    }, 800);
  };

  const categories = useMemo(() => Object.entries(summary.categoryTotals || {}), [summary.categoryTotals]);

  const investmentData = useMemo(() => {
    const allocations = [
      { name: 'Equities', share: 0.40, returnRate: 0.102 },
      { name: 'Real Estate', share: 0.30, returnRate: 0.075 },
      { name: 'Bonds', share: 0.20, returnRate: 0.042 },
      { name: 'Crypto', share: 0.10, returnRate: 0.123 }
    ];
    
    return allocations.map(asset => {
      const principal = Number((investmentAmount * asset.share).toFixed(2));
      const returns = Number((principal * asset.returnRate).toFixed(2));
      const totalValue = Number((principal + returns).toFixed(2));
      return {
        asset: asset.name,
        principal: principal,
        returns: returns,
        totalValue: totalValue,
        rate: (asset.returnRate * 100).toFixed(1)
      };
    });
  }, [investmentAmount]);
  
  const chartData = useMemo(() => {
    return monthlyTrends.map((item) => ({
      month: item.month,
      income: Number(item.income || 0),
      expense: Number(item.expense || 0),
    }));
  }, [monthlyTrends]);

  const pieData = useMemo(() => {
    return categories.map(([name, value]) => ({ name, value }));
  }, [categories]);

  const uniqueCategories = useMemo(() => {
    const cats = transactions.map(t => t.category).filter(Boolean);
    return ['all', ...Array.from(new Set(cats))];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch =
        t.description?.toLowerCase().includes(filterSearch.toLowerCase()) ||
        t.category?.toLowerCase().includes(filterSearch.toLowerCase());
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, filterSearch, filterType, filterCategory]);

  const profitMargin = useMemo(() => {
    return summary.revenue > 0 ? ((summary.profit / summary.revenue) * 100).toFixed(1) : '0.0';
  }, [summary.revenue, summary.profit]);

  const formattedDate = useMemo(() => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString(undefined, options);
  }, []);

  const colors = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];



  const parseInlineMarkdown = (text) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index}>{part}</strong>;
      }
      return part;
    });
  };

  const renderFormattedInsight = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        const depth = (trimmed.match(/^#+/) || [''])[0].length;
        const content = trimmed.replace(/^#+\s*/, '');
        const HeaderTag = `h${Math.min(depth + 2, 6)}`;
        return <HeaderTag key={idx}>{parseInlineMarkdown(content)}</HeaderTag>;
      }
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const content = trimmed.replace(/^[-*]\s*/, '');
        return <li key={idx}>{parseInlineMarkdown(content)}</li>;
      }
      const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        const content = numMatch[2];
        return <li key={idx} style={{ listStyleType: 'decimal' }}>{parseInlineMarkdown(content)}</li>;
      }
      if (trimmed === '') {
        return <div key={idx} style={{ height: '8px' }} />;
      }
      return <p key={idx}>{parseInlineMarkdown(trimmed)}</p>;
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{label}</p>
          {payload.map((pld, index) => (
            <p key={index} className={`intro ${pld.dataKey}`}>
              <span className="dot" style={{ backgroundColor: pld.color, display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', marginRight: '8px' }}></span>
              {pld.name}: <strong>${Number(pld.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Inline SVGs for elegant look
  const icons = {
    dashboard: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" />
        <rect x="14" y="3" width="7" height="5" />
        <rect x="14" y="12" width="7" height="9" />
        <rect x="3" y="16" width="7" height="5" />
      </svg>
    ),
    transactions: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
    insights: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    ),
    logout: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
      </svg>
    ),
    sun: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
    moon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
    revenue: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    expenses: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
    profit: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    plus: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    sparkles: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />
      </svg>
    ),
    copy: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    ),
    check: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    trash: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    ),
    userIcon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    mailIcon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    lockIcon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    )
  };



  // Get user initials for avatar
  const userInitials = auth.user?.name
    ? auth.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>▲</span> Apex Copilot
        </div>
        
        <div className="sidebar-profile">
          <div className="profile-avatar">{userInitials}</div>
          <div className="profile-info">
            <span className="profile-name">{auth.user?.name || 'User'}</span>
            <span className="profile-role">Business Partner</span>
          </div>
        </div>

        <nav>
          <button
            className={view === 'dashboard' ? 'nav active' : 'nav'}
            onClick={() => setView('dashboard')}
          >
            {icons.dashboard} Dashboard
          </button>
          <button
            className={view === 'transactions' ? 'nav active' : 'nav'}
            onClick={() => setView('transactions')}
          >
            {icons.transactions} Transactions
          </button>
          <button
            className={view === 'insights' ? 'nav active' : 'nav'}
            onClick={() => setView('insights')}
          >
            {icons.insights} AI Insights
          </button>
        </nav>
        <div className="demo-mode-badge" style={{ marginTop: 'auto', textAlign: 'center', padding: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
          ⚡ Demo Mode Active
        </div>
      </aside>

      <main className="content">
        {view === 'dashboard' && (
          <>
            <section className="topbar">
              <div>
                <h2>Business Overview</h2>
              </div>
              <div className="topbar-right">
                <div className="welcome-section">
                  <span className="welcome">Welcome back, <strong>{auth.user?.name}</strong></span>
                  <span className="date-indicator">{formattedDate}</span>
                </div>
                <button
                  className="theme-toggle-btn"
                  onClick={toggleTheme}
                  title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                  {theme === 'light' ? icons.moon : icons.sun}
                </button>
              </div>
            </section>
            
            <section className="kpis">
              <div className="card kpi-card">
                <div className="kpi-details">
                  <span>Gross Revenue</span>
                  <strong>${summary.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  <div className="kpi-meta trend-up">
                    <span>▲ +12% from last month</span>
                  </div>
                </div>
                <div className="kpi-icon">{icons.revenue}</div>
              </div>
              
              <div className="card kpi-card">
                <div className="kpi-details">
                  <span>Operating Expenses</span>
                  <strong>${summary.expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  <div className="kpi-meta trend-down">
                    <span>▼ -3% from last month</span>
                  </div>
                </div>
                <div className="kpi-icon">{icons.expenses}</div>
              </div>
              
              <div className="card kpi-card">
                <div className="kpi-details">
                  <span>Net Profit</span>
                  <strong>${summary.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  <div className="kpi-meta trend-info">
                    <span>⚡ Profit Margin: {profitMargin}%</span>
                  </div>
                </div>
                <div className="kpi-icon">{icons.profit}</div>
              </div>

              <div className="card kpi-card">
                <div className="kpi-details">
                  <span>Total Investments</span>
                  <strong>${investmentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  <div className="kpi-meta trend-up">
                    <span>📈 +8.4% asset valuation</span>
                  </div>
                </div>
                <div className="kpi-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
              </div>
            </section>

            <section className="charts-grid">
              <div className="card large">
                <h3>Financial Performance & Monthly Trends</h3>
                <div className="chart-card">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.85}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.85}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                      <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} />
                      <Bar dataKey="income" fill="url(#colorIncome)" radius={[6, 6, 0, 0]} name="Income" />
                      <Bar dataKey="expense" fill="url(#colorExpense)" radius={[6, 6, 0, 0]} name="Expense" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="card">
                <h3>Category Distribution</h3>
                <div className="chart-card small">
                  {pieData.length === 0 ? (
                    <div className="empty-state">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                      <p>No transaction data available</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} style={{ outline: 'none' }} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Total Amount']} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </section>
          </>
        )}

        {view === 'transactions' && (
          <>
            <section className="topbar">
              <h2>Transactions Ledger</h2>
              <button className="theme-toggle-btn" onClick={toggleTheme}>
                {theme === 'light' ? icons.moon : icons.sun}
              </button>
            </section>

            <div className="transaction-grid">
              <section className="card form-card">
                <h3>Add New Transaction</h3>
                <form onSubmit={handleTransactionSubmit} className="transaction-form">
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      placeholder="e.g. Server Hosting"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <input
                      placeholder="e.g. Sales, Utilities, Software"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="submit-btn">{icons.plus} Save Transaction</button>
                </form>
              </section>

              <section className="card">
                <div className="transaction-list-header">
                  <h3>Transaction History</h3>
                </div>

                <div className="toolbar">
                  <div className="search-wrapper">
                    <span className="search-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </span>
                    <input
                      placeholder="Search transactions..."
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                    />
                  </div>

                  <select
                    className="filter-select"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>

                  <select
                    className="filter-select"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {uniqueCategories.filter(c => c !== 'all').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="transaction-list">
                  {filteredTransactions.length === 0 ? (
                    <div className="empty-state">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                        <line x1="9" y1="11" x2="15" y2="11" />
                      </svg>
                      <p>No transactions match your filters</p>
                    </div>
                  ) : (
                    filteredTransactions.map((transaction) => {
                      const isIncome = transaction.type === 'income';
                      const dateObj = new Date(transaction.date);
                      const formattedTxDate = dateObj.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      });

                      // Select background based on category name for tags
                      let catColorIndex = 0;
                      if (transaction.category) {
                        const charSum = transaction.category.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                        catColorIndex = charSum % colors.length;
                      }
                      const badgeStyle = {
                        backgroundColor: `${colors[catColorIndex]}15`,
                        color: colors[catColorIndex],
                        border: `1px solid ${colors[catColorIndex]}30`
                      };

                      return (
                        <div key={transaction._id} className="transaction-item">
                          <div className="txn-left">
                            <div className={`txn-icon ${isIncome ? 'income' : 'expense'}`}>
                              {isIncome ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="18 15 12 9 6 15" />
                                </svg>
                              ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              )}
                            </div>
                            <div className="txn-details">
                              <span className="txn-desc">{transaction.description}</span>
                              <span className="txn-date">{formattedTxDate}</span>
                            </div>
                          </div>

                          <div className="txn-right">
                            <span className="category-badge" style={badgeStyle}>
                              {transaction.category}
                            </span>
                            <strong className={`txn-amount ${isIncome ? 'income' : 'expense'}`}>
                              {isIncome ? '+' : '-'}${Number(transaction.amount).toFixed(2)}
                            </strong>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteTransaction(transaction._id)}
                              title="Delete Transaction"
                            >
                              {icons.trash}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>
          </>
        )}

        {view === 'insights' && (
          <>
            <section className="topbar">
              <h2>AI Business Consultant</h2>
              <button className="theme-toggle-btn" onClick={toggleTheme}>
                {theme === 'light' ? icons.moon : icons.sun}
              </button>
            </section>

            <div className="insights-grid">
              <section className="card insights-card">
                <h3>AI-Generated Insights</h3>
                <button
                  className="insight-button"
                  onClick={handleGetInsight}
                  disabled={loadingInsight}
                >
                  {icons.sparkles} {loadingInsight ? 'Consulting Copilot...' : 'Generate Strategic Insights'}
                </button>

                {loadingInsight && (
                  <div className="insights-content-wrapper">
                    <div className="insights-skeleton">
                      <div className="skeleton-row title"></div>
                      <div className="skeleton-row desc-1"></div>
                      <div className="skeleton-row desc-2"></div>
                      <div className="skeleton-row desc-3"></div>
                      <div className="skeleton-row desc-4"></div>
                    </div>
                  </div>
                )}

                {!loadingInsight && insight && (
                  <div className="insights-content-wrapper">
                    <div className="insight-toolbar">
                      <button
                        className="btn-copy"
                        onClick={handleCopy}
                        title="Copy to clipboard"
                      >
                        {copied ? icons.check : icons.copy}
                      </button>
                    </div>
                    <div className="insights-md">
                      {renderFormattedInsight(insight)}
                    </div>
                  </div>
                )}

                {!loadingInsight && !insight && (
                  <div className="empty-state" style={{ border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                    </svg>
                    <p style={{ marginTop: '12px' }}>Click the button above to analyze your transactions, revenue streams, and generate tactical recommendations.</p>
                  </div>
                )}
              </section>

              <section className="card investment-chart-card">
                <h3>Investment & Returns Portfolio</h3>
                <div className="investment-chart-wrapper" style={{ height: '300px', width: '100%', marginTop: '16px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={investmentData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.85}/>
                          <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.25}/>
                        </linearGradient>
                        <linearGradient id="colorTotalValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-secondary)" stopOpacity={0.85}/>
                          <stop offset="95%" stopColor="var(--accent-secondary)" stopOpacity={0.25}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                      <XAxis dataKey="asset" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }} />
                      <Bar dataKey="principal" fill="url(#colorPrincipal)" radius={[4, 4, 0, 0]} name="Principal" />
                      <Bar dataKey="totalValue" fill="url(#colorTotalValue)" radius={[4, 4, 0, 0]} name="Total Value" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="investment-breakdown" style={{ marginTop: '24px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Portfolio Breakdown</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {investmentData.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', padding: '8px 12px', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors[idx % colors.length] }} />
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.asset}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({item.rate}%)</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>${item.totalValue.toLocaleString()}</div>
                          <div style={{ color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 500 }}>+${item.returns.toLocaleString()} profit</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      {/* Floating AI Copilot Chat Widget */}
      <div className="copilot-widget">
        {!chatOpen ? (
          <button className="copilot-trigger" onClick={() => setChatOpen(true)} title="Open AI Copilot">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M12 7v4" />
              <path d="M10 9h4" />
            </svg>
          </button>
        ) : (
          <div className="copilot-window">
            <div className="copilot-header">
              <div className="copilot-title-area">
                <div className="copilot-status"></div>
                <span className="copilot-title">Apex AI Copilot</span>
              </div>
              <button className="btn-close-chat" onClick={() => setChatOpen(false)} title="Close Chat">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <div className="copilot-messages" id="copilot-chat-messages">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`message ${msg.sender}`}>
                  {msg.sender === 'copilot' ? renderFormattedInsight(msg.text) : msg.text}
                </div>
              ))}
              {chatTyping && (
                <div className="chat-typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              )}
            </div>

            <div className="copilot-chips">
              <button type="button" className="chip" onClick={() => handleSendChatMessage("What is my revenue?")}>
                Revenue?
              </button>
              <button type="button" className="chip" onClick={() => handleSendChatMessage("What is my profit margin?")}>
                Profit Margin?
              </button>
              <button type="button" className="chip" onClick={() => handleSendChatMessage("Explain my investments?")}>
                Investments?
              </button>
              <button type="button" className="chip" onClick={() => handleSendChatMessage("List recent transactions?")}>
                Recent Transactions?
              </button>
            </div>

            <form 
              className="copilot-input-area"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage(chatInput);
              }}
            >
              <input
                placeholder="Ask me anything..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatTyping}
              />
              <button type="submit" className="btn-send-chat" disabled={!chatInput.trim() || chatTyping}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
