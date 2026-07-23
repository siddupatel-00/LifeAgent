import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  Sparkles, TrendingUp, Calendar, BookOpen, Bot, DollarSign, 
  CheckCircle2, ArrowRight, XCircle, ShieldCheck, Mail, User, 
  Send, Plus, Clock, Award, Trash2, ChevronRight, LogIn, ExternalLink,
  Sun, Moon, Monitor, ChevronDown, Lock, Phone, AtSign, Activity, Zap, Check, X,
  Dumbbell, Moon as SleepIcon, BarChart3, PieChart, Flame, Heart, Target, Filter,
  Home, LayoutDashboard, LogOut, Sliders, Settings, Save, Bell, Shield, PenTool, MessageSquare, Sidebar as SidebarIcon, FileText, Unlock, Smile
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [themeMode, setThemeMode] = useState('light'); // 'dark', 'light', 'pc'
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeDropdownRef = useRef(null);

  // Sync initial page with URL pathname (/dashboard, /waitlist, /contact, or /)
  const [currentPage, setCurrentPage] = useState(() => {
    const path = window.location.pathname;
    const isAuth = !!localStorage.getItem('token');
    
    if (path.includes('/dashboard')) return isAuth ? 'dashboard' : 'auth';
    if (path.includes('/auth')) return 'auth';
    if (path.includes('/waitlist')) return 'waitlist';
    if (path.includes('/contact')) return 'contact';
    return 'landing';
  });

  // Helper to change page and URL address bar simultaneously
  const navigate = (page, path) => {
    setCurrentPage(page);
    window.history.pushState({}, '', path);
  };

  // Handle browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const isAuth = !!localStorage.getItem('token');
      
      if (path.includes('/dashboard')) setCurrentPage(isAuth ? 'dashboard' : 'auth');
      else if (path.includes('/auth')) setCurrentPage('auth');
      else if (path.includes('/waitlist')) setCurrentPage('waitlist');
      else if (path.includes('/contact')) setCurrentPage('contact');
      else setCurrentPage('landing');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Cycling text index for hero animation
  const cycleOptions = ["Money & Spendings", "Study & Pomodoros", "Daily Schedule & AI"];
  const [cycleIdx, setCycleIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCycleIdx(prev => (prev + 1) % cycleOptions.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  // Form state for Waitlist Only
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  // Dashboard state & Global Timeframe Filter
  const [activeTab, setActiveTab] = useState('ai'); // 'ai', 'habits', 'finance', 'body', 'sleep', 'analytics', 'settings'
  const [timeRange, setTimeRange] = useState('today'); // 'today', '3d', '7d', '14d', '25d', '30d', '1m', '3m', '6m', '12m', 'lifetime'
  const [isTimeMenuOpen, setIsTimeMenuOpen] = useState(false);
  const timeDropdownRef = useRef(null);

  // User Profile & Settings State
  const [userProfile, setUserProfile] = useState({
    name: '',
    handle: '',
    email: '',
    aiTone: 'Analytical & Direct',
    morningAudit: true,
    smartAlerts: true,
    currency: '$'
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authForm, setAuthForm] = useState({ name: '', handle: '', email: '', password: '', phone: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setIsAuthenticated(true);
      setUserProfile(prev => ({
        ...prev,
        name: data.user.name || '',
        email: data.user.email || '',
        handle: data.user.handle || '',
      }));
      setAuthForm({ name: '', handle: '', email: '', password: '', phone: '' });
      navigate('dashboard', '/dashboard');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setIsAuthenticated(false);
    setUserProfile({ name: '', handle: '', email: '', aiTone: 'Analytical & Direct', morningAudit: true, smartAlerts: true });
    navigate('landing', '/');
  };

  const timeOptions = [
    { id: 'today', label: 'Today' },
    { id: '3d', label: 'Last 3 Days' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '14d', label: 'Last 14 Days' },
    { id: '25d', label: 'Last 25 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: '1m', label: '1 Month' },
    { id: '3m', label: '3 Months' },
    { id: '6m', label: '6 Months' },
    { id: '12m', label: '12 Months' },
    { id: 'lifetime', label: 'Lifetime' }
  ];

  // 1) AI Chat state with Autonomous Executive Engine
  const [aiMessages, setAiMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [aiName, setAiName] = useState('AI');
  const mainAiChatScrollRef = useRef(null);
  const sideAiChatScrollRef = useRef(null);

  // Auto-scroll ONLY inside the AI chat box containers whenever new messages arrive (does not scroll website/window)
  useEffect(() => {
    if (mainAiChatScrollRef.current) {
      mainAiChatScrollRef.current.scrollTo({
        top: mainAiChatScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
    if (sideAiChatScrollRef.current) {
      sideAiChatScrollRef.current.scrollTo({
        top: sideAiChatScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [aiMessages]);

  // 2) Habit Tracker state
  // Habits state with exact daily tracking items: Gym, Study, Code, DSA Problems
  const [habits, setHabits] = useState([]);
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [newHabitData, setNewHabitData] = useState({ title: '', category: 'Coding', target: '' });
  const [newTodayItemData, setNewTodayItemData] = useState({ title: '', category: 'Coding', time: '10:00 AM' });
  const [isAddTodayItemOpen, setIsAddTodayItemOpen] = useState(false);
  const [todayItems, setTodayItems] = useState([]);

  // 3) Finance state
  const [transactions, setTransactions] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState('spend');

  // 4) Body & Gym state
  const [workouts, setWorkouts] = useState([]);
  const [bodyStats, setBodyStats] = useState({ currentWeight: '', targetWeight: '', dailyProtein: '', hydration: '' });

  // 5) Sleep state
  const [sleepLogs, setSleepLogs] = useState([]);

  // 6) Notes & Diary state (with AI sharing permissions)
  const [notesList, setNotesList] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(1);
  const [isFloatingDiaryOpen, setIsFloatingDiaryOpen] = useState(false);
  const [floatingDiaryContent, setFloatingDiaryContent] = useState("");
  const [floatingDiaryShare, setFloatingDiaryShare] = useState(true);
  const [trashNotes, setTrashNotes] = useState([]);
  const [notesViewMode, setNotesViewMode] = useState('active'); // 'active' | 'trash'

  // Auto-clean trash: if note deleted from trash -> permanently deleted; else in 49 days automatically purged
  useEffect(() => {
    if (trashNotes.length > 0) {
      const now = Date.now();
      const fortyNineDaysMs = 49 * 24 * 60 * 60 * 1000;
      const validNotes = trashNotes.filter(note => (now - (note.deletedAt || now)) <= fortyNineDaysMs);
      if (validNotes.length !== trashNotes.length) {
        setTrashNotes(validNotes);
      }
    }
  }, [trashNotes]);

  // 7) Persistent Side Personal AI Assistant Panel state
  const [isAiSidePanelOpen, setIsAiSidePanelOpen] = useState(true);

  // 8) Calendar state
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarSubTab, setCalendarSubTab] = useState('this_month');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  // 9) AI API Keys (persisted in localStorage)
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [groqApiKey, setGroqApiKey] = useState(() => localStorage.getItem('groq_api_key') || '');
  const [aiProvider, setAiProvider] = useState(() => localStorage.getItem('ai_provider') || 'gemini');
  const [aiLoading, setAiLoading] = useState(false);

  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const habitsRes = await fetch('/api/habits', { headers });
      if (habitsRes.ok) {
        const hData = await habitsRes.json();
        setHabits(hData.map(h => ({ id: h.id, title: h.label, category: h.category, streak: h.streak, checkedToday: !!h.checked_today })));
      }

      const todayRes = await fetch('/api/today', { headers });
      if (todayRes.ok) {
        const tData = await todayRes.json();
        setTodayItems(tData.map(t => ({ id: t.id, time: t.time, label: t.label, category: t.category, checked: !!t.checked })));
      }

      const txRes = await fetch('/api/transactions', { headers });
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.map(t => ({ id: t.id, title: t.title, amount: t.amount, type: t.type, date: t.date })));
      }
      
      const settingsRes = await fetch('/api/settings', { headers });
      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        if (sData) {
          setUserProfile(prev => ({ ...prev, ...sData, currency: sData.currency || '$' }));
          if (sData.gemini_api_key) {
            setGeminiApiKey(sData.gemini_api_key);
            localStorage.setItem('gemini_api_key', sData.gemini_api_key);
          }
          if (sData.groq_api_key) {
            setGroqApiKey(sData.groq_api_key);
            localStorage.setItem('groq_api_key', sData.groq_api_key);
          }
          if (sData.ai_provider) {
            setAiProvider(sData.ai_provider);
            localStorage.setItem('ai_provider', sData.ai_provider);
          }
          if (sData.ai_name) setAiName(sData.ai_name);
        }
      }

      const chatRes = await fetch('/api/chat', { headers });
      if (chatRes.ok) {
        const cData = await chatRes.json();
        setAiMessages(cData.map(c => ({ id: c.id, sender: c.sender, text: c.text, time: c.time })));
      }

      const calRes = await fetch('/api/calendar', { headers });
      if (calRes.ok) {
        const calData = await calRes.json();
        setCalendarEvents(calData.map(c => ({ id: c.id, title: c.title, date: c.date, color: c.color })));
      }
      
      const notesRes = await fetch('/api/notes', { headers });
      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotesList(notesData.filter(n => !n.is_trashed).map(n => ({ id: n.id, title: n.title, content: n.content, category: n.category, date: n.date, shareWithAi: !!n.share_with_ai })));
        setTrashNotes(notesData.filter(n => !!n.is_trashed).map(n => ({ id: n.id, title: n.title, content: n.content, category: n.category, date: n.date, shareWithAi: !!n.share_with_ai })));
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  };

  const handleUpdateNoteDb = async (note) => {
    if (!token || !note.id) return;
    try {
      await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id: note.id, title: note.title, content: note.content, share_with_ai: note.shareWithAi, is_trashed: note.is_trashed, deleted_at: note.deletedAt })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNoteDb = async (title, content, shareWithAi, callback) => {
    if (!token) return;
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, content, share_with_ai: shareWithAi })
      });
      if (res.ok) {
        const newNote = await res.json();
        callback({ ...newNote, shareWithAi: !!newNote.share_with_ai });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTodayDb = async (id, checked) => {
    if (!token || !id) return;
    try {
      await fetch('/api/today', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id, checked })
      });
    } catch(e) {}
  };

  const handleUpdateHabitDb = async (id, streak, checked_today) => {
    if (!token || !id) return;
    try {
      await fetch('/api/habits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id, streak, checked_today })
      });
    } catch(e) {}
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (geminiApiKey) localStorage.setItem('gemini_api_key', geminiApiKey);
    if (groqApiKey) localStorage.setItem('groq_api_key', groqApiKey);
    localStorage.setItem('ai_provider', aiProvider);
  }, [geminiApiKey, groqApiKey, aiProvider]);

  // Universal sync helpers between Today routine and Daily Works (habits)
  const handleToggleTodayItem = (targetId) => {
    setTodayItems(prev => prev.map(i => {
      if (i.id !== targetId) return i;
      const nextChecked = !i.checked;
      
      // Sync corresponding habits (Daily Works)
      setHabits(prevHabits => prevHabits.map(h => {
        let newStreak = h.streak;
        let newChecked = h.checkedToday;
        let updated = false;
        
        if (i.category === 'Body & Gym' && h.category.includes('Body & Gym')) { newChecked = nextChecked; newStreak = nextChecked ? h.streak + 1 : Math.max(0, h.streak - 1); updated = true; }
        else if (i.category === 'Study' && h.category.includes('Study')) { newChecked = nextChecked; newStreak = nextChecked ? h.streak + 1 : Math.max(0, h.streak - 1); updated = true; }
        else if (i.category === 'Coding' && (h.category.includes('Coding') || h.category.includes('DSA'))) { newChecked = nextChecked; newStreak = nextChecked ? h.streak + 1 : Math.max(0, h.streak - 1); updated = true; }
        
        if (updated) handleUpdateHabitDb(h.id, newStreak, newChecked);
        return updated ? { ...h, checkedToday: newChecked, streak: newStreak } : h;
      }));

      handleUpdateTodayDb(i.id, nextChecked);
      return { ...i, checked: nextChecked };
    }));
  };

  const handleToggleAllToday = () => {
    const allAreChecked = todayItems.every(i => i.checked);
    const targetState = !allAreChecked;
    setTodayItems(prev => prev.map(i => {
      handleUpdateTodayDb(i.id, targetState);
      return { ...i, checked: targetState };
    }));
    setHabits(prevHabits => prevHabits.map(h => {
      const newStreak = targetState ? h.streak + (h.checkedToday ? 0 : 1) : Math.max(0, h.streak - 1);
      handleUpdateHabitDb(h.id, newStreak, targetState);
      return { ...h, checkedToday: targetState, streak: newStreak };
    }));
  };

  const handleToggleHabitItem = (targetHabitId) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== targetHabitId) return h;
      const nextChecked = !h.checkedToday;
      const newStreak = nextChecked ? h.streak + 1 : Math.max(0, h.streak - 1);
      
      // Sync corresponding todayItem
      setTodayItems(prevToday => prevToday.map(ti => {
        let updated = false;
        if (h.category.includes('Body & Gym') && ti.category === 'Body & Gym') updated = true;
        else if (h.category.includes('Study') && ti.category === 'Study') updated = true;
        else if ((h.category.includes('Coding') || h.category.includes('DSA')) && ti.category === 'Coding') updated = true;
        
        if (updated) handleUpdateTodayDb(ti.id, nextChecked);
        return updated ? { ...ti, checked: nextChecked } : ti;
      }));

      handleUpdateHabitDb(h.id, newStreak, nextChecked);
      return { ...h, checkedToday: nextChecked, streak: newStreak };
    }));
  };

  // Handle PC/System vs explicit Dark/Light mode
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'pc') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', isSystemDark ? 'dark' : 'light');
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e) => root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      root.setAttribute('data-theme', themeMode);
    }
  }, [themeMode]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target)) {
        setIsThemeMenuOpen(false);
      }
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(e.target)) {
        setIsTimeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!waitlistEmail.trim() || !waitlistName.trim()) return;
    
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: waitlistName, email: waitlistEmail })
      });
      
      if (response.ok) {
        setWaitlistSuccess(true);
      } else {
        const errorData = await response.json();
        console.error('Waitlist error:', errorData.error);
        alert(errorData.error || 'Failed to join waitlist. Please try again.');
      }
    } catch (err) {
      console.error('Network error during waitlist submission:', err);
      alert('Network error. Please try again later.');
    }
  };

  const handleStartTrial = () => {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    navigate('dashboard', '/dashboard');
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (token) {
      try {
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ ...userProfile, ai_name: aiName, gemini_api_key: geminiApiKey, groq_api_key: groqApiKey, ai_provider: aiProvider, currency: userProfile.currency })
        });
      } catch (err) {
        console.error('Settings save failed:', err);
      }
    }
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleSendAi = async (e, customText = null) => {
    e?.preventDefault();
    const textToProcess = customText || inputMessage;
    if (!textToProcess.trim() || aiLoading) return;
    
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgText = textToProcess;
    const newMsg = { id: Date.now(), sender: 'user', text: userMsgText, time: nowTime };
    
    setAiMessages(prev => [...prev, newMsg]);
    if (!customText) setInputMessage('');

    if (aiProvider === 'gemini' && !geminiApiKey) {
      const fallbackReply = "Please provide your Gemini API key in the settings to use the AI Assistant.";
      const aiMsg = { id: Date.now() + 1, sender: 'ai', text: fallbackReply, time: nowTime };
      setAiMessages(prev => [...prev, aiMsg]);
      return;
    }

    if (aiProvider === 'groq' && !groqApiKey) {
      const fallbackReply = "Please provide your Groq API key in the settings to use the AI Assistant.";
      const aiMsg = { id: Date.now() + 1, sender: 'ai', text: fallbackReply, time: nowTime };
      setAiMessages(prev => [...prev, aiMsg]);
      return;
    }

    setAiLoading(true);
    setAiMessages(prev => [...prev, { id: 'loading', sender: 'ai', text: 'Thinking...', time: nowTime }]);
    
    try {
      const systemPrompt = `
        You are an autonomous AI assistant in a personal dashboard.
        User's calendar events: ${JSON.stringify(calendarEvents)}
        User's habits/todayItems: ${JSON.stringify(todayItems)}
        User's transactions summary: ${JSON.stringify(transactions)}
        
        If the user asks to add an event to the calendar, respond with an optional JSON block:
        [CALENDAR_EVENT]{"title":"...","date":"YYYY-MM-DD","endDate":"YYYY-MM-DD or null","color":"#hex"}[/CALENDAR_EVENT]
        Make the color a valid hex code (e.g. #3b82f6 for blue, #ef4444 for red).
        Provide a helpful text response as well.
      `;
      
      let responseText = "";

      if (aiProvider === 'groq') {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama3-70b-8192",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMsgText }
            ]
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        responseText = data.choices[0].message.content;
      } else {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"];
        let result = null;
        let lastErr = null;
        for (const mName of modelsToTry) {
          try {
            const model = genAI.getGenerativeModel({ model: mName });
            result = await model.generateContent(`${systemPrompt}\n\nUser: ${userMsgText}`);
            if (result) break;
          } catch (err) {
            lastErr = err;
          }
        }
        if (!result && lastErr) throw lastErr;
        responseText = result.response.text();
      }
      
      // Parse calendar event
      const eventMatch = responseText.match(/\[CALENDAR_EVENT\](.*?)\[\/CALENDAR_EVENT\]/s);
      let finalReply = responseText;
      
      if (eventMatch && eventMatch[1]) {
        try {
          const eventData = JSON.parse(eventMatch[1]);
          setCalendarEvents(prev => [...prev, { id: Date.now(), ...eventData }]);
          finalReply = finalReply.replace(eventMatch[0], '').trim();
        } catch (err) {
          console.error("Failed to parse calendar event JSON", err);
        }
      }
      
      const aiMsg = { id: Date.now() + 1, sender: 'ai', text: finalReply, time: nowTime };
      setAiMessages(prev => prev.map(m => m.id === 'loading' ? aiMsg : m));
      
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify([newMsg, aiMsg])
      }).catch(err => console.error(err));
      
    } catch (error) {
      console.error("AI API Error:", error);
      const aiMsg = { id: Date.now() + 1, sender: 'ai', text: `Error calling API: ${error.message}`, time: nowTime };
      setAiMessages(prev => prev.map(m => m.id === 'loading' ? aiMsg : m));
      
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify([newMsg, aiMsg])
      }).catch(err => console.error(err));
    } finally {
      setAiLoading(false);
    }
  };

  const addTransaction = async (e) => {
    e.preventDefault();
    if (!newTitle || !newAmount) return;
    
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle, amount: parseFloat(newAmount), type: newType })
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(prev => [
          {
            id: data.id,
            title: data.title,
            amount: data.amount,
            type: data.type,
            category: data.type === 'spend' ? 'Personal' : 'Income',
            date: new Date().toISOString().split('T')[0]
          },
          ...prev
        ]);
        setNewTitle('');
        setNewAmount('');
      }
    } catch(err) {
      console.error(err);
    }
  };

  const fragmentedApps = [
    { code: 'EX', name: 'Money Spending Tracker', sub: 'Expense & Budgeting tool', cost: '$4/mo' },
    { code: 'PR', name: 'Progress & Habit App', sub: 'Daily streaks & logs', cost: '$2/mo' },
    { code: 'AI', name: 'AI Chat Assistant', sub: 'Personal bot & tips', cost: '$15/mo' },
    { code: 'PO', name: 'Pomodoro Focus Timer', sub: 'Study timer & goals', cost: '$3/mo' },
    { code: 'CA', name: 'Separate Calendar Tool', sub: 'Schedule management', cost: '$5/mo' },
    { code: 'AN', name: 'Personal Analytics App', sub: 'Graphs & reports', cost: '$4/mo' },
  ];

  return (
    <div className={currentPage === 'dashboard' ? '' : 'container'} style={currentPage === 'dashboard' ? { minHeight: '100vh', background: 'var(--bg-main)' } : { paddingBottom: '60px' }}>
      
      {/* STOREFRONT NAVIGATION BAR (Only visible on non-dashboard pages) */}
      {currentPage !== 'dashboard' && (
        <nav className="nav-bar">
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
            onClick={() => navigate('landing', '/')}
          >
            <div style={{
              background: 'var(--accent-blue)',
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
            }}>
              <Sparkles size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                LIFE <span className="serif-italic">AGENT</span>
              </h1>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>All-in-One Personal & Personal AI Assistant</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="theme-dropdown" ref={themeDropdownRef}>
              <button 
                className="theme-toggle-btn"
                style={{ padding: '8px 12px', borderRadius: '40px' }}
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                title="Change Theme Mode"
              >
                {themeMode === 'dark' && <Moon size={18} />}
                {themeMode === 'light' && <Sun size={18} />}
                {themeMode === 'pc' && <Monitor size={18} />}
                <ChevronDown size={14} style={{ transform: isThemeMenuOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
              </button>

              {isThemeMenuOpen && (
                <div className="theme-dropdown-menu">
                  <button 
                    className={`theme-dropdown-item ${themeMode === 'dark' ? 'active' : ''}`}
                    onClick={() => { setThemeMode('dark'); setIsThemeMenuOpen(false); }}
                  >
                    <Moon size={14} /> Dark Mode
                  </button>
                  <button 
                    className={`theme-dropdown-item ${themeMode === 'light' ? 'active' : ''}`}
                    onClick={() => { setThemeMode('light'); setIsThemeMenuOpen(false); }}
                  >
                    <Sun size={14} /> Light Mode
                  </button>
                  <button 
                    className={`theme-dropdown-item ${themeMode === 'pc' ? 'active' : ''}`}
                    onClick={() => { setThemeMode('pc'); setIsThemeMenuOpen(false); }}
                  >
                    <Monitor size={14} /> PC / System
                  </button>
                </div>
              )}
            </div>

            <button 
              className="blue-btn" 
              style={{ padding: '9px 22px', fontSize: '0.9rem' }}
              onClick={() => { setWaitlistSuccess(false); navigate('waitlist', '/waitlist'); }}
            >
              Sign Up <ArrowRight size={16} />
            </button>
          </div>
        </nav>
      )}

      {/* LANDING PAGE (Storefront at /) */}
      {currentPage === 'landing' && (
        <main>
          <section className="animate-entrance" style={{ textAlign: 'center', padding: '60px 0 70px' }}>
            <div className="badge" style={{ padding: '6px 16px', borderRadius: '50px', marginBottom: '32px' }}>
              <div className="pulse-dot-container"><div className="pulse-dot-ring"></div><div className="pulse-dot-core"></div></div>
              <span>ALL-IN-ONE PERSONAL & AI WORKSPACE</span>
            </div>

            <h2 style={{ fontSize: '3.8rem', fontWeight: 900, lineHeight: 1.12, letterSpacing: '-1.5px', marginBottom: '28px' }}>
              One clean storefront for your<br />
              <span key={cycleIdx} className="cycle-text" style={{ minWidth: '380px', display: 'inline-block' }}>
                {cycleOptions[cycleIdx]}
              </span>
            </h2>

            <p style={{ maxWidth: '680px', margin: '0 auto 36px', fontSize: '1.25rem', color: 'var(--text-muted)', lineHeight: 1.65, fontWeight: 400 }}>
              Replace dozens of fragmented trackers with one unified command center. Seamlessly monitor your money flow, master deep work study streaks, and let an intelligent AI companion audit your daily schedule—all inside a distraction-free workspace.
            </p>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '36px' }}>
              <button className="blue-btn" style={{ fontSize: '1.15rem', padding: '16px 42px' }} onClick={() => { setWaitlistSuccess(false); navigate('waitlist', '/waitlist'); }}>
                Join VIP Waitlist <ArrowRight size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span className="pill-tag"><Check size={14} color="var(--accent-blue)" /> 0% Commission & Extra Fees</span>
              <span className="pill-tag"><Check size={14} color="var(--accent-blue)" /> Instant Early Access Priority</span>
              <span className="pill-tag"><Check size={14} color="var(--accent-blue)" /> Built-in Personal AI Assistant</span>
            </div>
          </section>

          <section className="animate-entrance delay-1" style={{ marginBottom: '80px' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '12px' }}>
                Why pay for 6+ separate apps?
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem' }}>
                The average person pays $21+ across fragmented tools. LifeAgent replaces all of them.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '32px', alignItems: 'stretch' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', alignContent: 'center' }}>
                {fragmentedApps.map((app, i) => (
                  <div 
                    key={i} 
                    className="glass-card motion-card" 
                    style={{ 
                      padding: '16px', position: 'relative', background: 'var(--bg-main)', 
                      border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' 
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: '8px', right: '8px',
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: 'rgba(255, 82, 82, 0.2)', color: '#ff5252',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem'
                    }}>
                      <X size={12} />
                    </div>

                    <div style={{
                      width: '38px', height: '38px', borderRadius: '10px',
                      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-muted)'
                    }}>
                      {app.code}
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>{app.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{app.sub} • <span style={{ color: '#ff5252', fontWeight: 600 }}>{app.cost}</span></div>
                    </div>
                  </div>
                ))}

                <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Total spent separately: <strong style={{ color: '#ff5252', textDecoration: 'line-through' }}>$21+ / Month ($250+/year)</strong>
                </div>
              </div>

              <div className="glass-card motion-card" style={{ padding: '36px', border: '2px solid var(--accent-blue)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'var(--bg-card)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <span className="badge" style={{ marginBottom: 0 }}>● LifeAgent</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)' }}>ALL-IN-ONE SOLUTION</span>
                  </div>

                  <h4 style={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1.25, marginBottom: '24px', letterSpacing: '-0.5px' }}>
                    Everything you need,<br />
                    <span className="serif-italic">one subscription.</span>
                  </h4>

                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '14px', listStyle: 'none', marginBottom: '32px' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.98rem' }}>
                      <CheckCircle2 color="var(--accent-blue)" size={20} /> Full Money Spending & Earning Analytics
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.98rem' }}>
                      <CheckCircle2 color="var(--accent-blue)" size={20} /> Deep Work Pomodoro & Study Tracker
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.98rem' }}>
                      <CheckCircle2 color="var(--accent-blue)" size={20} /> Built-in Personal AI Assistant
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.98rem' }}>
                      <CheckCircle2 color="var(--accent-blue)" size={20} /> Body, Gym & Sleep Quality Analytics
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.98rem' }}>
                      <CheckCircle2 color="var(--accent-blue)" size={20} /> Clean Black, White & Focus Blue Core
                    </li>
                  </ul>
                </div>

                <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Avg. cost vs paying separately:</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
                      <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-blue)' }}>ONLY $4 <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-main)' }}>/ month</span></span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ff5252', textDecoration: 'line-through' }}>$21+/mo</span>
                    </div>
                  </div>

                  <button className="blue-btn" style={{ padding: '14px 28px' }} onClick={() => { setWaitlistSuccess(false); navigate('waitlist', '/waitlist'); }}>
                    Join Waitlist →
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="animate-entrance delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '80px' }}>
            <div className="glass-card motion-card" style={{ padding: '28px' }}>
              <div style={{ background: 'var(--accent-blue-dim)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <DollarSign size={24} color="var(--accent-blue)" />
              </div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '10px' }}>Money Spending Tracker</h4>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                Log every dollar earned and spent across daily, monthly, and lifetime timeframes with clear analytics.
              </p>
            </div>

            <div className="glass-card motion-card" style={{ padding: '28px' }}>
              <div style={{ background: 'var(--accent-blue-dim)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <BookOpen size={24} color="var(--accent-blue)" />
              </div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '10px' }}>Study & Habit Mastery</h4>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                Track study pomodoros, gym routines, and sleep progress across 11 customized timeframe filters.
              </p>
            </div>

            <div className="glass-card motion-card" style={{ padding: '28px' }}>
              <div style={{ background: 'var(--accent-blue-dim)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Bot size={24} color="var(--accent-blue)" />
              </div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '10px' }}>Autonomous AI Companion</h4>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                A smart built-in assistant that chats with you, audits your progress, and answers questions live.
              </p>
            </div>
          </section>

          <div className="glass-card animate-entrance delay-3" style={{ padding: '50px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '14px', letterSpacing: '-0.5px' }}>Ready for your minimalist Command Center?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '28px', fontSize: '1.1rem' }}>
              Be the first to access our unified workspace when we launch.
            </p>
            <button className="blue-btn" style={{ fontSize: '1.1rem', padding: '16px 36px' }} onClick={() => { setWaitlistSuccess(false); navigate('waitlist', '/waitlist'); }}>
              Join Waitlist Now <ArrowRight size={18} />
            </button>
          </div>
        </main>
      )}

      {/* JOIN WAITLIST PAGE (At /waitlist) */}
      {currentPage === 'waitlist' && (
        <main className="animate-entrance" style={{ maxWidth: '520px', margin: '50px auto' }}>
          <div className="glass-card" style={{ padding: '48px', position: 'relative', border: '2px solid var(--accent-blue)', textAlign: 'center' }}>
            <div style={{ background: 'var(--accent-blue-dim)', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Sparkles size={32} color="var(--accent-blue)" />
            </div>

            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '10px', letterSpacing: '-0.5px' }}>
              Join the VIP Waitlist
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '32px', lineHeight: 1.6 }}>
              Enter your email address below to show your interest in our all-in-one personal progress app and secure early VIP access.
            </p>

            {!waitlistSuccess ? (
              <form onSubmit={handleWaitlistSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Your Name *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder="Enter your name..."
                      value={waitlistName} 
                      onChange={(e) => setWaitlistName(e.target.value)} 
                      required
                      style={{ 
                        width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', 
                        border: '1px solid var(--border-color)', background: 'var(--bg-main)', 
                        color: 'var(--text-main)', fontSize: '1.05rem', outline: 'none' 
                      }}
                    />
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Email Address *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="email" 
                      placeholder="Enter your email address..."
                      value={waitlistEmail} 
                      onChange={(e) => setWaitlistEmail(e.target.value)} 
                      required
                      style={{ 
                        width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', 
                        border: '1px solid var(--border-color)', background: 'var(--bg-main)', 
                        color: 'var(--text-main)', fontSize: '1.05rem', outline: 'none' 
                      }}
                    />
                  </div>
                </div>

                <button type="submit" className="blue-btn" style={{ justifyContent: 'center', padding: '18px', fontSize: '1.15rem', marginTop: '6px' }}>
                  Join Waitlist Now <ArrowRight size={20} />
                </button>
              </form>
            ) : (
              <div style={{ padding: '24px', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid var(--accent-blue)', borderRadius: '16px', textAlign: 'center' }}>
                <CheckCircle2 color="var(--accent-blue)" size={52} style={{ margin: '0 auto 14px' }} />
                <h4 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-blue)', marginBottom: '8px' }}>
                  You're on the VIP List!
                </h4>
                <p style={{ color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.6 }}>
                  We have saved <strong>{waitlistEmail}</strong> directly into our waitlist database. We will notify you the moment early access invites open up!
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button className="secondary-btn" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} onClick={() => navigate('landing', '/')}>
                    Back to Storefront Landing
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* CONTACT US PAGE (At /contact) */}
      {currentPage === 'contact' && (
        <main className="animate-entrance" style={{ maxWidth: '700px', margin: '40px auto' }}>
          <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ background: 'var(--accent-blue-dim)', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Mail size={32} color="var(--accent-blue)" />
            </div>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>
              Contact & Connect With Me
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '36px', fontSize: '1.1rem', lineHeight: 1.6 }}>
              LifeAgent is personal software built with passion. If anyone is interested, they can buy or reach out directly via X (formerly Twitter).
            </p>

            <div className="glass-card" style={{ padding: '28px', background: 'var(--bg-main)', border: '1px solid var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left' }}>
                <div style={{ background: 'var(--accent-blue)', color: '#fff', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.4rem' }}>
                  𝕏
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Official Creator X Account</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-blue)' }}>@Zenitsu_T7</div>
                </div>
              </div>
              <a 
                href="https://twitter.com/Zenitsu_T7" 
                target="_blank" 
                rel="noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <button className="blue-btn" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                  Follow / Message <ExternalLink size={16} />
                </button>
              </a>
            </div>

            <div style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              <h5 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '8px' }}>Direct Support & Custom Licensing</h5>
              <p>For custom inquiries, feature requests, or enterprise licensing beyond the $4/mo all-in-one tier, drop a direct message on X to <strong>@Zenitsu_T7</strong>. We reply within 24 hours!</p>
            </div>
          </div>
        </main>
      )}

      {/* AUTHENTICATION PAGE (At /auth) */}
      {currentPage === 'auth' && (
        <main className="animate-entrance" style={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', padding: '40px', borderRadius: '24px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '440px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{
                background: 'var(--accent-blue)', width: '48px', height: '48px', borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
              }}>
                <Lock size={24} color="#fff" />
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '8px' }}>
                {authMode === 'login' ? 'Sign in to access your AI workspace.' : 'Sign up to get your Personal AI Assistant.'}
              </p>
            </div>

            {authError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={18} /> {authError}
              </div>
            )}

            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {authMode === 'signup' && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Full Name</label>
                    <input type="text" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }} placeholder="John Doe" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Handle / Username</label>
                    <input type="text" value={authForm.handle} onChange={e => setAuthForm({...authForm, handle: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }} placeholder="@johndoe" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Phone (Optional)</label>
                    <input type="tel" value={authForm.phone} onChange={e => setAuthForm({...authForm, phone: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }} placeholder="+1 234 567 890" />
                  </div>
                </>
              )}
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Email Address</label>
                <input type="email" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }} placeholder="you@example.com" />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Password</label>
                <input type="password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }} placeholder="••••••••" />
              </div>

              <button type="submit" className="blue-btn" disabled={authLoading} style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '8px', opacity: authLoading ? 0.7 : 1 }}>
                {authLoading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }} 
                style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                {authMode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </div>
        </main>
      )}

      {/* MERABAAZAR / LINEAR INSPIRED 2-COLUMN SIDEBAR WORKSPACE DASHBOARD (At /dashboard) */}
      {currentPage === 'dashboard' && (
        <div className="animate-entrance" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-main)' }}>
          
          {/* FIXED / STICKY LEFT SIDEBAR THAT NEVER SCROLLS */}
          <aside style={{
            width: '240px',
            height: '100vh',
            position: 'sticky',
            top: 0,
            borderRight: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flexShrink: 0,
            overflowY: 'auto',
            zIndex: 50
          }}>
            <div>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '24px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', cursor: 'pointer' }}
                onClick={() => navigate('landing', '/')}
              >
                <div style={{ background: 'var(--accent-blue)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} color="#fff" />
                </div>
                <h1 style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.5px' }}>
                  life<span style={{ fontWeight: 400 }}>agent</span>
                </h1>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  onClick={() => setActiveTab('ai')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: '12px', border: 'none',
                    background: activeTab === 'ai' ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
                    color: activeTab === 'ai' ? 'var(--accent-blue)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'ai' ? 700 : 500, cursor: 'pointer',
                    fontSize: '0.92rem', transition: 'all 0.2s', textAlign: 'left'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Bot size={18} /> {aiName} Mode
                  </span>
                  <span style={{ background: 'var(--accent-blue)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '20px' }}>NEW</span>
                </button>

                <button 
                  onClick={() => setActiveTab('today')}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: 'none',
                    background: activeTab === 'today' ? 'var(--accent-blue)' : 'transparent',
                    color: activeTab === 'today' ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.95rem', fontWeight: activeTab === 'today' ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                  }}
                >
                  <Clock size={18} /> Today
                </button>

                <button 
                onClick={() => setActiveTab('habits')}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: 'none',
                  background: activeTab === 'habits' ? 'var(--accent-blue)' : 'transparent',
                  color: activeTab === 'habits' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.95rem', fontWeight: activeTab === 'habits' ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                }}
              >
                <CheckCircle2 size={18} /> Daily Works
              </button>

                <button
                  onClick={() => setActiveTab('notes')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '12px', border: 'none',
                    background: activeTab === 'notes' ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
                    color: activeTab === 'notes' ? 'var(--accent-blue)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'notes' ? 700 : 500, cursor: 'pointer',
                    fontSize: '0.92rem', transition: 'all 0.2s', textAlign: 'left'
                  }}
                >
                  <BookOpen size={18} /> Notes & Diary
                </button>

                <button
                  onClick={() => setActiveTab('calendar')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '12px', border: 'none',
                    background: activeTab === 'calendar' ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
                    color: activeTab === 'calendar' ? 'var(--accent-blue)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'calendar' ? 700 : 500, cursor: 'pointer',
                    fontSize: '0.92rem', transition: 'all 0.2s', textAlign: 'left'
                  }}
                >
                  <Calendar size={18} /> Calendar
                </button>

                <button
                  onClick={() => setActiveTab('finance')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '12px', border: 'none',
                    background: activeTab === 'finance' ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
                    color: activeTab === 'finance' ? 'var(--accent-blue)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'finance' ? 700 : 500, cursor: 'pointer',
                    fontSize: '0.92rem', transition: 'all 0.2s', textAlign: 'left'
                  }}
                >
                  <DollarSign size={18} /> Money Tracking
                </button>

                <button
                  onClick={() => setActiveTab('body')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '12px', border: 'none',
                    background: activeTab === 'body' ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
                    color: activeTab === 'body' ? 'var(--accent-blue)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'body' ? 700 : 500, cursor: 'pointer',
                    fontSize: '0.92rem', transition: 'all 0.2s', textAlign: 'left'
                  }}
                >
                  <Dumbbell size={18} /> Body & Gym
                </button>

                <button
                  onClick={() => setActiveTab('sleep')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '12px', border: 'none',
                    background: activeTab === 'sleep' ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
                    color: activeTab === 'sleep' ? 'var(--accent-blue)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'sleep' ? 700 : 500, cursor: 'pointer',
                    fontSize: '0.92rem', transition: 'all 0.2s', textAlign: 'left'
                  }}
                >
                  <SleepIcon size={18} /> Sleep Quality
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '12px', border: 'none',
                    background: activeTab === 'analytics' ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
                    color: activeTab === 'analytics' ? 'var(--accent-blue)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'analytics' ? 700 : 500, cursor: 'pointer',
                    fontSize: '0.92rem', transition: 'all 0.2s', textAlign: 'left'
                  }}
                >
                  <BarChart3 size={18} /> Analytics Hub
                </button>

              </div>
            </div>

            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              {/* Settings Tab inside the bottom place where LifeAgent v2.4 was */}
              <button
                onClick={() => setActiveTab('settings')}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px', borderRadius: '12px', border: 'none',
                  background: activeTab === 'settings' ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
                  color: activeTab === 'settings' ? 'var(--accent-blue)' : 'var(--text-muted)',
                  fontWeight: activeTab === 'settings' ? 700 : 500, cursor: 'pointer',
                  fontSize: '0.95rem', transition: 'all 0.2s', textAlign: 'left'
                }}
              >
                <Settings size={18} /> Settings & Profile
              </button>
            </div>
          </aside>

          {/* MAIN RIGHT AREA (MeraBaazar layout without Verified Pro, Live, or top Log Out) */}
          <section style={{ flex: 1, height: '100vh', padding: '32px 48px', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                {activeTab === 'today' ? (
                  <>
                    <h2 style={{ fontSize: '1.9rem', fontWeight: 900, letterSpacing: '-0.5px' }}>
                      Hey {userProfile.handle ? `@${userProfile.handle.replace('@', '')}` : (userProfile.name ? userProfile.name.split(' ')[0] : 'User')} – welcome!
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                      Unified workspace and real-time trackers for your daily performance.
                    </p>
                  </>
                ) : (
                  <h2 style={{ fontSize: '1.9rem', fontWeight: 900, letterSpacing: '-0.5px', color: 'var(--text-main)' }}>
                    {activeTab === 'gym' ? 'Body & Gym' : 
                     activeTab === 'sleep' ? 'Sleep & Recovery' : 
                     activeTab === 'finance' ? 'Finance & Money' : 
                     activeTab === 'notes' ? 'Notes & Diary' : 
                     activeTab === 'calendar' ? 'Calendar' :
                     activeTab === 'settings' ? 'Settings' : 'Dashboard'}
                  </h2>
                )}
              </div>

              {!isAiSidePanelOpen && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {activeTab !== 'ai' && (
                    <button
                      onClick={() => setIsAiSidePanelOpen(!isAiSidePanelOpen)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', borderRadius: '30px',
                        background: isAiSidePanelOpen ? 'var(--accent-blue)' : 'var(--bg-card)',
                        color: isAiSidePanelOpen ? '#fff' : 'var(--text-main)',
                        border: `1px solid ${isAiSidePanelOpen ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                        fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: isAiSidePanelOpen ? '0 0 16px rgba(59,130,246,0.35)' : 'none'
                      }}
                      title="Toggle Persistent AI Side Panel"
                    >
                      <Bot size={16} /> AI
                    </button>
                  )}

                  <div style={{ position: 'relative' }}>
                    <button 
                      className="theme-toggle-btn"
                      style={{ padding: '8px 14px', borderRadius: '30px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                      onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                      title="Change Theme Mode"
                    >
                      {themeMode === 'dark' && <Moon size={16} />}
                      {themeMode === 'light' && <Sun size={16} />}
                      {themeMode === 'pc' && <Monitor size={16} />}
                      <ChevronDown size={14} style={{ transform: isThemeMenuOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                    </button>

                    {isThemeMenuOpen && (
                      <div className="theme-dropdown-menu" style={{ right: 0, left: 'auto', minWidth: '150px' }}>
                        <button 
                          className={`theme-dropdown-item ${themeMode === 'dark' ? 'active' : ''}`}
                          onClick={() => { setThemeMode('dark'); setIsThemeMenuOpen(false); }}
                        >
                          <Moon size={14} /> Dark Mode
                        </button>
                        <button 
                          className={`theme-dropdown-item ${themeMode === 'light' ? 'active' : ''}`}
                          onClick={() => { setThemeMode('light'); setIsThemeMenuOpen(false); }}
                        >
                          <Sun size={14} /> Light Mode
                        </button>
                        <button 
                          className={`theme-dropdown-item ${themeMode === 'pc' ? 'active' : ''}`}
                          onClick={() => { setThemeMode('pc'); setIsThemeMenuOpen(false); }}
                        >
                          <Monitor size={14} /> PC / System
                        </button>
                      </div>
                    )}
                  </div>

                  <span 
                    onClick={() => setActiveTab('settings')}
                    style={{ 
                      fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', 
                      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                      padding: '8px 16px', borderRadius: '30px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                    }}
                  >
                    <User size={16} color="var(--accent-blue)" /> {userProfile.handle}
                  </span>
                </div>
              )}
            </div>

            {/* Timeframe Dropdown Selector (Hide when on Settings or AI Chat tab) */}
            {(activeTab === 'today' || activeTab === 'finance') && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', ref: timeDropdownRef, position: 'relative' }} ref={timeDropdownRef}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Active Timeframe:</span>
                    
                    <button
                      onClick={() => setIsTimeMenuOpen(!isTimeMenuOpen)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 18px', borderRadius: '30px', border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)', color: 'var(--text-main)',
                        fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transition: 'all 0.2s'
                      }}
                    >
                      <Calendar size={16} color="var(--accent-blue)" />
                      <span>{timeOptions.find(o => o.id === timeRange)?.label || 'Today'}</span>
                      <ChevronDown size={14} style={{ transform: isTimeMenuOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                    </button>

                    {isTimeMenuOpen && (
                      <div className="theme-dropdown-menu" style={{ left: '110px', right: 'auto', top: '100%', marginTop: '6px', minWidth: '180px', maxHeight: '300px', overflowY: 'auto', zIndex: 100 }}>
                        {timeOptions.map((opt) => (
                          <button
                            key={opt.id}
                            className={`theme-dropdown-item ${timeRange === opt.id ? 'active' : ''}`}
                            onClick={() => { setTimeRange(opt.id); setIsTimeMenuOpen(false); }}
                            style={{ fontWeight: timeRange === opt.id ? 800 : 500 }}
                          >
                            <Calendar size={14} /> {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Showing live audited metrics across 4 core pillars
                  </div>
                </div>
              </>
            )}

            {/* TAB CONTENT HOUSING BOX */}
            <div className="glass-card" style={{ padding: '32px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              
              {/* 0) TODAY DAILY ROUTINE & HABITS CHECKLIST (Ultra-neat & clean UI) */}
              {activeTab === 'today' && (
                <div className="animate-entrance">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', gap: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.55rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Clock size={24} color="var(--accent-blue)" /> Today's Routine & Schedule
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>Neat, minimalist 1-click progress tracking for your required daily pillars</p>
                    </div>
                    <button 
                      className="blue-btn"
                      onClick={handleToggleAllToday}
                      style={{ padding: '12px 20px', fontSize: '0.9rem', flexShrink: 0, whiteSpace: 'nowrap' }}
                    >
                      <Check size={18} /> Tick All Today
                    </button>
                  </div>

                  {/* Clean Top Progress Bar */}
                  <div style={{ background: 'var(--bg-main)', padding: '18px 24px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 800, marginBottom: '8px' }}>
                        <span>DAILY CHECKLIST PROGRESS</span>
                        <span style={{ color: 'var(--accent-blue)' }}>{todayItems.filter(i => i.checked).length} of {todayItems.length} Routine Items Checked</span>
                      </div>
                      <div style={{ width: '100%', height: '10px', background: 'var(--bg-card)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <div style={{
                          width: `${(todayItems.filter(i => i.checked).length / (todayItems.length || 1)) * 100}%`,
                          height: '100%',
                          background: 'var(--accent-blue)',
                          boxShadow: '0 0 12px rgba(59,130,246,0.4)',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Clean List of Today Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {todayItems.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px dashed var(--border-color)' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>No routine items scheduled for today.</p>
                      </div>
                    ) : (
                      todayItems.map(item => (
                        <div 
                          key={item.id} 
                        onClick={() => handleToggleTodayItem(item.id)}
                        style={{
                          background: item.checked ? 'var(--accent-blue-dim)' : 'var(--bg-main)',
                          padding: '20px 24px',
                          borderRadius: '16px',
                          border: `1px solid ${item.checked ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          userSelect: 'none',
                          boxShadow: item.checked ? '0 4px 16px rgba(59,130,246,0.12)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                          <span style={{ 
                            fontSize: '0.8rem', fontWeight: 800, color: item.checked ? 'var(--accent-blue)' : 'var(--text-muted)',
                            background: 'var(--bg-card)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', minWidth: '110px', textAlign: 'center'
                          }}>
                            {item.time}
                          </span>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? 'var(--text-main)' : 'var(--text-main)' }}>
                                {item.title}
                              </h4>
                              <span className="pill-tag" style={{ background: 'var(--bg-card)', fontSize: '0.7rem', padding: '2px 8px' }}>
                                {item.category}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              {item.checked ? 'Checked & verified for today ✓' : 'Pending completion today • Click anywhere to tick'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTodayItem(item.id);
                          }}
                          style={{
                            padding: '12px 22px',
                            borderRadius: '12px',
                            border: `1px solid ${item.checked ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                            background: item.checked ? 'var(--accent-blue)' : 'var(--bg-card)',
                            color: item.checked ? '#fff' : 'var(--text-main)',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            flexShrink: 0,
                            boxShadow: item.checked ? '0 0 16px rgba(59,130,246,0.35)' : 'none'
                          }}
                        >
                          <CheckCircle2 size={18} color={item.checked ? "#fff" : "var(--accent-blue)"} />
                          {item.checked ? 'Checked Today ✓' : 'Tick Today Progress'}
                        </button>
                      </div>
                    ))
                    )}
                  </div>

                  {/* Add Routine Item Button */}
                  <div style={{ marginTop: '16px' }}>
                    <button 
                      className="blue-btn" 
                      onClick={() => setIsAddTodayItemOpen(!isAddTodayItemOpen)}
                      style={{ padding: '10px 18px', fontSize: '0.85rem' }}
                    >
                      <Plus size={16} /> {isAddTodayItemOpen ? 'Close Form' : 'Add Routine Item'}
                    </button>
                  </div>

                  {/* Add Routine Item Form */}
                  {isAddTodayItemOpen && (
                    <div className="animate-entrance" style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '16px', border: '1px solid var(--accent-blue)', marginTop: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Routine Title</label>
                          <input 
                            type="text" 
                            placeholder="e.g., Morning Run"
                            value={newTodayItemData.title}
                            onChange={(e) => setNewTodayItemData({ ...newTodayItemData, title: e.target.value })}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Category</label>
                          <select 
                            value={newTodayItemData.category}
                            onChange={(e) => setNewTodayItemData({ ...newTodayItemData, category: e.target.value })}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                          >
                            <option value="Health">Health</option>
                            <option value="Work">Work</option>
                            <option value="Study">Study</option>
                            <option value="Coding">Coding</option>
                            <option value="Personal">Personal</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Time (optional)</label>
                          <input 
                            type="text" 
                            placeholder="e.g., 07:00 AM"
                            value={newTodayItemData.time}
                            onChange={(e) => setNewTodayItemData({ ...newTodayItemData, time: e.target.value })}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                          />
                        </div>
                        <button 
                          className="blue-btn"
                          onClick={async () => {
                            if (!newTodayItemData.title.trim()) return alert('Please enter a title');
                            try {
                              const res = await fetch('/api/today', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({
                                  label: newTodayItemData.title.trim(),
                                  category: newTodayItemData.category,
                                  time: newTodayItemData.time.trim()
                                })
                              });
                              if (res.ok) {
                                const data = await res.json();
                                setTodayItems([...todayItems, { id: data.id, label: data.label, category: data.category, time: data.time, checked: false }]);
                                setNewTodayItemData({ title: '', category: 'Coding', time: '10:00 AM' });
                                setIsAddTodayItemOpen(false);
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          style={{ padding: '10px 18px', height: '39px', fontSize: '0.85rem' }}
                        >
                          <Plus size={16} /> Add
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TODAY'S DAILY DIARY & QUICK NOTES SECTION */}
                  <div style={{ marginTop: '36px', background: 'var(--bg-main)', padding: '24px 28px', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BookOpen size={20} color="var(--accent-blue)" />
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Today's Daily Diary & Personal Notes</h4>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#22c55e', cursor: 'pointer', background: 'rgba(34, 197, 94, 0.1)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                        <input 
                          type="checkbox" 
                          checked={floatingDiaryShare}
                          onChange={(e) => setFloatingDiaryShare(e.target.checked)}
                          style={{ accentColor: '#22c55e', cursor: 'pointer' }}
                        />
                        <span>🤖 Shared with Personal AI Assistant (Memory Active)</span>
                      </label>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                      Jot down your daily thoughts, highlights, or feelings. When shared with AI, your agent remembers and references this in real-time chats!
                    </p>
                    <textarea 
                      rows={3}
                      value={floatingDiaryContent}
                      onChange={(e) => setFloatingDiaryContent(e.target.value)}
                      placeholder="Save your notes..."
                      style={{ width: '100%', padding: '16px 18px', borderRadius: '14px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem', lineHeight: '1.6', outline: 'none', resize: 'vertical' }}
                    />
                  </div>

                </div>
              )}

              {/* 1) AI CHAT MODE */}
              {activeTab === 'ai' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', height: 'calc(100vh - 160px)' }}>
                  
                  {/* LEFT PANE: LIVE AI CHAT INTERACTION */}
                  <div style={{ background: 'var(--bg-main)', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.1rem', boxShadow: '0 0 16px rgba(59,130,246,0.4)' }}>
                          <Bot size={22} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>{aiName} <span style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%' }}></span></h4>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Full Real-Time Account Access & Alarm Engine Active</span>
                        </div>
                      </div>
                      <span className="pill-tag" style={{ background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)', borderColor: 'var(--accent-blue)' }}>● Real-Time Database Sync</span>
                    </div>

                    <div ref={mainAiChatScrollRef} style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      {aiMessages.map((msg, idx) => (
                        <div key={msg.id || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            maxWidth: '85%', padding: '16px 20px', borderRadius: '18px',
                            background: msg.sender === 'user' ? 'var(--accent-blue)' : 'var(--bg-card)',
                            color: msg.sender === 'user' ? '#fff' : 'var(--text-main)',
                            border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '0.93rem', lineHeight: 1.6, whiteSpace: 'pre-line'
                          }}>
                            {msg.text}
                          </div>
                          {msg.time && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px', padding: '0 6px' }}>{msg.time}</span>}
                        </div>
                      ))}
                    </div>

                    {/* Quick Trigger Pill Prompts */}
                    <div style={{ padding: '12px 24px', background: 'var(--bg-main)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                      <button 
                        onClick={() => handleSendAi(null, "Tell my today performance against my live schedule right now!")}
                        style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--accent-blue)', background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        ⚡ Tell My Today Performance (Live Audit)
                      </button>

                      <button 
                        onClick={() => handleSendAi(null, "Show my 7:00 AM Gym Schedule Briefing & Itinerary")}
                        style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        📅 7:00 AM Gym Briefing
                      </button>

                      <button 
                        onClick={() => handleSendAi(null, "Verify Pournami & Amavasya Wardrobe Rules")}
                        style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        🌕 Moon Cycle Wardrobe Protocol
                      </button>
                    </div>

                    <form onSubmit={handleSendAi} style={{ padding: '16px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
                      <input 
                        type="text" 
                        placeholder="Ask Agent to compare today vs yesterday, check time, or create tasks..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        style={{ flex: 1, padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '0.95rem' }}
                      />
                      <button type="submit" className="blue-btn" style={{ padding: '0 24px' }}>
                        <Send size={18} /> Send
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* 2) HABITS & PROGRESS TRACKER (Redesigned with Graphs & AI Suggestions) */}
              {activeTab === 'habits' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Daily Works • Daily Mastery</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>Daily tracking and real-time AI streak curves for: <strong style={{ color: 'var(--accent-blue)' }}>{timeOptions.find(o => o.id === timeRange)?.label || 'Today'}</strong></p>
                    </div>
                    <button 
                      className="blue-btn" 
                      onClick={() => setIsAddHabitModalOpen(!isAddHabitModalOpen)}
                      style={{ padding: '12px 22px', fontSize: '0.92rem' }}
                    >
                      <Plus size={18} /> {isAddHabitModalOpen ? 'Close Form' : 'Add Pillar / Daily Item'}
                    </button>
                  </div>

                  {/* INLINE ADD NEW PILLAR / DAILY ITEM FORM */}
                  {isAddHabitModalOpen && (
                    <div className="animate-entrance" style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '18px', border: '1px solid var(--accent-blue)', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.15)', marginBottom: '28px' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)' }}>
                        <Plus size={18} /> Create New Daily Progress Item
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: '14px', alignItems: 'flex-end' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Item Title / Habit Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g., System Design Architecture or Meditation"
                            value={newHabitData.title}
                            onChange={(e) => setNewHabitData({ ...newHabitData, title: e.target.value })}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Pillar / Category</label>
                          <select 
                            value={newHabitData.category}
                            onChange={(e) => setNewHabitData({ ...newHabitData, category: e.target.value })}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.92rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                          >
                            <option value="Coding">Coding Pillar</option>
                            <option value="Study">Study Pillar</option>
                            <option value="DSA & Algorithms">DSA & Algorithms</option>
                            <option value="Body & Gym">Body & Gym</option>
                            <option value="Money">Money Pillar</option>
                            <option value="Deep Focus">Deep Focus</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Daily Goal / Target</label>
                          <input 
                            type="text" 
                            placeholder="e.g., 45 mins/day or 2 problems"
                            value={newHabitData.target}
                            onChange={(e) => setNewHabitData({ ...newHabitData, target: e.target.value })}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                          />
                        </div>

                        <button 
                          className="blue-btn"
                          onClick={async () => {
                            if (!newHabitData.title.trim()) {
                              alert('Please enter a title for your daily item.');
                              return;
                            }
                            
                            try {
                              const res = await fetch('/api/habits', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({
                                  label: newHabitData.title.trim(),
                                  category: newHabitData.category
                                })
                              });
                              if (res.ok) {
                                const data = await res.json();
                                const newItem = {
                                  id: data.id,
                                  title: data.label,
                                  category: data.category,
                                  target: newHabitData.target.trim() || '30 mins/day',
                                  streak: 0,
                                  completionRate: 100,
                                  checkedToday: false
                                };
                                setHabits([newItem, ...habits]);
                                setNewHabitData({ title: '', category: 'Coding', target: '' });
                                setIsAddHabitModalOpen(false);
                              } else {
                                console.error('Failed to create habit');
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          style={{ padding: '13px 24px', height: '46px' }}
                        >
                          <Plus size={18} /> Add to Progress
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FULL-WIDTH TODAY INTENSITY GRAPH (Empty State) */}
                  <div style={{ background: 'var(--bg-main)', padding: '24px 32px', borderRadius: '18px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>TODAY'S INTENSITY & PROGRESS CURVE</span>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '2px' }}>
                          {Math.round((habits.filter(h => h.checkedToday).length / (habits.length || 1)) * 100)}% Complete <span style={{ fontSize: '0.85rem', color: '#22c55e', fontWeight: 700 }}>● Live Sync</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '6px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', fontWeight: 600 }}>
                          {habits.filter(h => h.checkedToday).length} of {habits.length} Pillars Ticked
                        </span>
                      </div>
                    </div>

                    {habits.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '30px', background: 'var(--bg-card)', borderRadius: '14px', border: '1px dashed var(--border-color)' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>No daily works added yet. Add a pillar to see your progress curve.</p>
                      </div>
                    )}
                  </div>

                  {/* GRID OF HABIT CARDS WITH ACTIVITY PILL HEATMAPS */}
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px' }}>Your Daily Items & 7-Day Activity Matrix</h4>
                  
                  {habits.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      No pillars exist yet.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
                      {habits.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => handleToggleHabitItem(item.id)}
                        className="motion-card" 
                        style={{ 
                          background: item.checkedToday ? 'var(--accent-blue-dim)' : 'var(--bg-main)', 
                          padding: '22px', borderRadius: '16px', 
                          border: `1px solid ${item.checkedToday ? 'var(--accent-blue)' : 'var(--border-color)'}`, 
                          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                          cursor: 'pointer', userSelect: 'none'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span className="pill-tag" style={{ background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', fontWeight: 700 }}>
                              {item.category} Pillar
                            </span>
                            <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Flame size={16} /> {item.streak} Day Streak
                            </span>
                          </div>

                          <h5 style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '6px', textDecoration: item.checkedToday ? 'line-through' : 'none' }}>{item.title}</h5>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Daily Goal: <strong style={{ color: 'var(--text-main)' }}>{item.target}</strong></p>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>7-Day Activity Heatmap:</span>
                            <span style={{ color: 'var(--accent-blue)' }}>{item.completionRate}% Consistency</span>
                          </div>

                          {/* 7-Day Activity Pill Heatmap */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '16px' }}>
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayLetter, dIdx) => {
                              const isCompleted = dIdx === 6 ? item.checkedToday : dIdx !== 2;
                              return (
                                <div key={dIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                  <div style={{
                                    width: '100%',
                                    height: '24px',
                                    borderRadius: '6px',
                                    background: isCompleted ? 'var(--accent-blue)' : 'var(--bg-card)',
                                    border: `1px solid ${isCompleted ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s'
                                  }}>
                                    {isCompleted && <Check size={12} color="#fff" />}
                                  </div>
                                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>{dayLetter}</span>
                                </div>
                              );
                            })}
                          </div>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleHabitItem(item.id);
                            }}
                            style={{
                              width: '100%', padding: '12px', borderRadius: '12px',
                              border: `1px solid ${item.checkedToday ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                              background: item.checkedToday ? 'var(--accent-blue)' : 'var(--bg-card)',
                              color: item.checkedToday ? '#fff' : 'var(--text-main)',
                              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                              boxShadow: item.checkedToday ? '0 0 16px rgba(59,130,246,0.35)' : 'none'
                            }}
                          >
                            <CheckCircle2 size={18} color={item.checkedToday ? "#fff" : "var(--accent-blue)"} />
                            {item.checkedToday ? "Completed Today ✓" : "Quick Check-In Today"}
                          </button>
                        </div>
                      </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2.5) CALENDAR TAB */}
              {activeTab === 'calendar' && (
                <div className="animate-entrance">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.55rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Calendar size={24} color="var(--accent-blue)" /> Universal Calendar
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
                        Manage your events, meetings, and deadlines. Let your AI know what's coming up.
                      </p>
                    </div>
                    <button 
                      className="blue-btn" 
                      onClick={async () => {
                        const title = window.prompt("Enter new event title:");
                        if (!title) return;
                        const date = selectedCalendarDate || new Date().toISOString().split('T')[0];
                        try {
                          const res = await fetch('/api/calendar', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ title, date, color: '#3b82f6' })
                          });
                          if (res.ok) {
                            const newEvent = await res.json();
                            setCalendarEvents([...calendarEvents, newEvent]);
                          }
                        } catch (e) {
                          console.error('Failed to add event:', e);
                        }
                      }}
                      style={{ padding: '12px 22px', fontSize: '0.92rem' }}
                    >
                      <Plus size={18} /> Add Event
                    </button>
                  </div>

                  {/* Sub-tabs */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {['This Week', 'Next Week', 'This Month', 'Next Month', 'This Year'].map(tab => {
                      const tabKey = tab.toLowerCase().replace(' ', '_');
                      const isActive = calendarSubTab === tabKey;
                      return (
                        <button
                          key={tabKey}
                          onClick={() => setCalendarSubTab(tabKey)}
                          style={{
                            padding: '8px 16px', borderRadius: '50px', border: 'none',
                            background: isActive ? 'var(--accent-blue)' : 'var(--bg-card)',
                            color: isActive ? '#fff' : 'var(--text-muted)',
                            fontWeight: isActive ? 700 : 500, cursor: 'pointer',
                            fontSize: '0.85rem', transition: 'all 0.2s', whiteSpace: 'nowrap'
                          }}
                        >
                          {tab}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', minHeight: '460px' }}>
                    {/* Left: Mini Calendar Grid */}
                    <div style={{ background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)', padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>July 2026</h4>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}>&lt;</button>
                          <button style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}>&gt;</button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '8px' }}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                          <div key={d} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{d}</div>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' }}>
                        {Array.from({ length: 31 }, (_, i) => {
                          const date = i + 1;
                          const dateStr = `2026-07-${date.toString().padStart(2, '0')}`;
                          const dayEvents = calendarEvents.filter(e => e.date === dateStr);
                          const isSelected = selectedCalendarDate === dateStr;
                          return (
                            <div 
                              key={i} 
                              onClick={() => setSelectedCalendarDate(dateStr)}
                              style={{ 
                                padding: '10px 0', 
                                borderRadius: '10px', 
                                background: isSelected ? 'var(--accent-blue)' : 'var(--bg-main)', 
                                color: isSelected ? '#fff' : 'var(--text-main)',
                                cursor: 'pointer',
                                position: 'relative',
                                fontWeight: isSelected ? 800 : 500,
                                fontSize: '0.9rem',
                                border: '1px solid var(--border-color)'
                              }}
                            >
                              {date}
                              {dayEvents.length > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', position: 'absolute', bottom: '4px', left: 0, right: 0 }}>
                                  {dayEvents.slice(0, 3).map((e, idx) => (
                                    <div key={idx} style={{ width: '4px', height: '4px', borderRadius: '50%', background: isSelected ? '#fff' : e.color || 'var(--accent-blue)' }} />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Right: Event List */}
                    <div style={{ background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)', padding: '24px' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>
                        {selectedCalendarDate ? `Events for ${selectedCalendarDate}` : 'Upcoming Events'}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {calendarEvents
                          .filter(e => !selectedCalendarDate || e.date === selectedCalendarDate)
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map(e => (
                          <div key={e.id} style={{ padding: '12px 16px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)', borderLeft: `4px solid ${e.color || 'var(--accent-blue)'}`, position: 'relative' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>{e.date}</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{e.title}</div>
                            <button 
                              onClick={async () => {
                                if (window.confirm('Delete this event?')) {
                                  try {
                                    const res = await fetch('/api/calendar', {
                                      method: 'DELETE',
                                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                      body: JSON.stringify({ id: e.id })
                                    });
                                    if (res.ok) setCalendarEvents(calendarEvents.filter(ev => ev.id !== e.id));
                                  } catch(err) { console.error(err); }
                                }
                              }}
                              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#ff5252', cursor: 'pointer', padding: '4px' }}
                              title="Delete Event"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        {calendarEvents.filter(e => !selectedCalendarDate || e.date === selectedCalendarDate).length === 0 && (
                          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', background: 'var(--bg-main)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                            No events found.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2.5) NOTES & DIARY TAB (With Personal AI Assistant Permission Sharing) */}
              {activeTab === 'notes' && (
                <div className="animate-entrance">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.55rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BookOpen size={24} color="var(--accent-blue)" /> Notes & Personal Diary
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
                        Create daily logs, 2026 master goals, and wishlists. Toggle AI sharing to give your agent context during chats!
                      </p>
                    </div>
                    <button 
                      className="blue-btn" 
                      onClick={() => {
                        const newNote = {
                          id: Date.now(),
                          title: '📝 New Personal Note & Diary Entry',
                          category: 'General',
                          content: 'Type your daily reflection, thoughts, or goals here...',
                          date: new Date().toISOString().split('T')[0],
                          shareWithAi: true
                        };
                        setNotesList([newNote, ...notesList]);
                        setActiveNoteId(newNote.id);
                      }}
                      style={{ padding: '12px 22px', fontSize: '0.92rem' }}
                    >
                      <Plus size={18} /> New Diary Page / Note
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', minHeight: '460px' }}>
                    {/* LEFT NOTEBOOK LIST / TRASH VIEW SWITCHER */}
                    <div style={{ background: 'var(--bg-main)', borderRadius: '18px', border: '1px solid var(--border-color)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                        <button
                          onClick={() => setNotesViewMode('active')}
                          style={{
                            flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
                            background: notesViewMode === 'active' ? 'var(--accent-blue)' : 'transparent',
                            color: notesViewMode === 'active' ? '#fff' : 'var(--text-muted)',
                            fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          📖 Active ({notesList.length})
                        </button>
                        <button
                          onClick={() => setNotesViewMode('trash')}
                          style={{
                            flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
                            background: notesViewMode === 'trash' ? 'rgba(239, 68, 68, 0.18)' : 'transparent',
                            color: notesViewMode === 'trash' ? '#ef4444' : 'var(--text-muted)',
                            fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          🗑️ Trash ({trashNotes.length})
                        </button>
                      </div>

                      {notesViewMode === 'active' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                          {notesList.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                              No notes yet. Click + to add one.
                            </div>
                          ) : (
                            notesList.map(note => (
                              <div
                                key={note.id}
                                onClick={() => setActiveNoteId(note.id)}
                                style={{
                                  padding: '14px 16px',
                                  borderRadius: '14px',
                                  background: activeNoteId === note.id ? 'var(--accent-blue)' : 'var(--bg-card)',
                                  color: activeNoteId === note.id ? '#fff' : 'var(--text-main)',
                                  border: `1px solid ${activeNoteId === note.id ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  display: 'flex', flexDirection: 'column', gap: '6px'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 800, background: activeNoteId === note.id ? 'rgba(255,255,255,0.2)' : 'var(--bg-main)', padding: '2px 8px', borderRadius: '8px' }}>
                                    {note.category}
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {note.shareWithAi && (
                                      <span title="Shared with AI Agent" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', background: activeNoteId === note.id ? 'rgba(255,255,255,0.25)' : 'rgba(34,197,94,0.15)', color: activeNoteId === note.id ? '#fff' : '#22c55e', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                                        🤖 AI Shared
                                      </span>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTrashNotes([{ ...note, deletedAt: Date.now() }, ...trashNotes]);
                                        const next = notesList.filter(n => n.id !== note.id);
                                        setNotesList(next);
                                        if (activeNoteId === note.id && next.length > 0) setActiveNoteId(next[0].id);
                                      }}
                                      style={{ background: 'transparent', border: 'none', color: activeNoteId === note.id ? '#fff' : '#ef4444', cursor: 'pointer', padding: '2px', opacity: 0.8 }}
                                      title="Move to Trash (Kept for 49 days)"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </div>
                                <h5 style={{ fontSize: '0.96rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {note.title}
                                </h5>
                                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                  Last updated: {note.date}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4', background: 'rgba(239, 68, 68, 0.08)', padding: '10px', borderRadius: '10px', border: '1px dashed rgba(239, 68, 68, 0.3)' }}>
                            🗑️ **Trash Bin:** Items here are permanently deleted after **49 days**, or if deleted directly from here.
                          </div>
                          {trashNotes.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              Trash is currently empty.
                            </div>
                          ) : (
                            trashNotes.map(tNote => {
                              const daysLeft = Math.max(0, 49 - Math.floor((Date.now() - (tNote.deletedAt || Date.now())) / (1000 * 60 * 60 * 24)));
                              return (
                                <div
                                  key={tNote.id}
                                  onClick={() => setActiveNoteId(tNote.id)}
                                  style={{
                                    padding: '14px 16px', borderRadius: '14px',
                                    background: activeNoteId === tNote.id ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-card)',
                                    border: `1px solid ${activeNoteId === tNote.id ? '#ef4444' : 'var(--border-color)'}`,
                                    cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 800 }}>
                                      ⏳ {daysLeft} days until deletion
                                    </span>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setNotesList([tNote, ...notesList]);
                                          setTrashNotes(trashNotes.filter(n => n.id !== tNote.id));
                                          setActiveNoteId(tNote.id);
                                          setNotesViewMode('active');
                                        }}
                                        style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                                        title="Restore Note to Active"
                                      >
                                        ♻️ Restore
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setTrashNotes(trashNotes.filter(n => n.id !== tNote.id));
                                        }}
                                        style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                                        title="Permanently Delete Now"
                                      >
                                        ❌ Delete
                                      </button>
                                    </div>
                                  </div>
                                  <h5 style={{ fontSize: '0.94rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>
                                    {tNote.title}
                                  </h5>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* RIGHT NOTE CONTENT EDITOR */}
                    {(() => {
                      const currentList = notesViewMode === 'active' ? notesList : trashNotes;
                      const currentNote = currentList.find(n => n.id === activeNoteId) || currentList[0];
                      if (!currentNote) {
                        return (
                          <div style={{ background: 'var(--bg-main)', borderRadius: '18px', border: '1px solid var(--border-color)', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '12px' }}>
                            <BookOpen size={40} opacity={0.4} />
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No Note Selected</h4>
                            <p style={{ fontSize: '0.85rem' }}>Select a note from the left panel or click "+ New Diary Page / Note".</p>
                          </div>
                        );
                      }
                      return (
                        <div style={{ background: 'var(--bg-main)', borderRadius: '18px', border: '1px solid var(--border-color)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                            <div style={{ flex: 1, minWidth: '240px' }}>
                              <input
                                type="text"
                                disabled={notesViewMode === 'trash'}
                                value={currentNote.title}
                                onChange={(e) => {
                                  if (notesViewMode === 'active') {
                                    setNotesList(notesList.map(n => n.id === currentNote.id ? { ...n, title: e.target.value, date: new Date().toISOString().split('T')[0] } : n));
                                  }
                                }}
                                onBlur={() => handleUpdateNoteDb(currentNote)}
                                style={{ width: '100%', fontSize: '1.3rem', fontWeight: 800, background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none' }}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                              {notesViewMode === 'active' ? (
                                <>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: currentNote.shareWithAi ? '#22c55e' : 'var(--text-muted)', cursor: 'pointer', background: currentNote.shareWithAi ? 'rgba(34, 197, 94, 0.12)' : 'var(--bg-card)', padding: '8px 16px', borderRadius: '20px', border: `1px solid ${currentNote.shareWithAi ? 'rgba(34, 197, 94, 0.4)' : 'var(--border-color)'}`, transition: 'all 0.2s' }}>
                                    <input
                                      type="checkbox"
                                      checked={currentNote.shareWithAi}
                                      onChange={(e) => {
                                        const nextState = e.target.checked;
                                        setNotesList(notesList.map(n => n.id === currentNote.id ? { ...n, shareWithAi: nextState } : n));
                                        handleUpdateNoteDb({ ...currentNote, shareWithAi: nextState });
                                      }}
                                      style={{ accentColor: '#22c55e', cursor: 'pointer', width: '16px', height: '16px' }}
                                    />
                                    <span>{currentNote.shareWithAi ? '🤖 Shared with Personal AI Assistant (Allowed)' : '🔒 Private Note (AI Blocked)'}</span>
                                  </label>

                                  <button
                                    onClick={() => {
                                      const trashedNote = { ...currentNote, deletedAt: Date.now(), is_trashed: 1 };
                                      setTrashNotes([trashedNote, ...trashNotes]);
                                      const nextList = notesList.filter(n => n.id !== currentNote.id);
                                      setNotesList(nextList);
                                      handleUpdateNoteDb(trashedNote);
                                      if (nextList.length > 0) {
                                        setActiveNoteId(nextList[0].id);
                                      } else {
                                        setActiveNoteId(null);
                                      }
                                    }}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '6px',
                                      padding: '8px 14px', borderRadius: '20px',
                                      background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444',
                                      border: '1px solid rgba(239, 68, 68, 0.3)',
                                      fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                                      transition: 'all 0.2s'
                                    }}
                                    title="Move this note to Trash"
                                  >
                                    <Trash2 size={16} /> Delete Note
                                  </button>
                                </>
                              ) : (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button
                                    onClick={() => {
                                      const restoredNote = { ...currentNote, is_trashed: 0, deletedAt: null };
                                      setNotesList([restoredNote, ...notesList]);
                                      setTrashNotes(trashNotes.filter(n => n.id !== currentNote.id));
                                      setActiveNoteId(currentNote.id);
                                      setNotesViewMode('active');
                                      handleUpdateNoteDb(restoredNote);
                                    }}
                                    className="blue-btn"
                                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                                  >
                                    ♻️ Restore Note
                                  </button>
                                  <button
                                    onClick={async () => {
                                      setTrashNotes(trashNotes.filter(n => n.id !== currentNote.id));
                                      try {
                                        await fetch('/api/notes', {
                                          method: 'DELETE',
                                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                          body: JSON.stringify({ id: currentNote.id })
                                        });
                                      } catch(e){}
                                    }}
                                    style={{ padding: '8px 16px', borderRadius: '20px', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                                  >
                                    ❌ Permanently Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <textarea
                            disabled={notesViewMode === 'trash'}
                            value={currentNote.content}
                            onChange={(e) => {
                              if (notesViewMode === 'active') {
                                setNotesList(notesList.map(n => n.id === currentNote.id ? { ...n, content: e.target.value, date: new Date().toISOString().split('T')[0] } : n));
                              }
                            }}
                            onBlur={() => handleUpdateNoteDb(currentNote)}
                            placeholder="Write your diary entry, personal reflection, or goals..."
                            style={{ flex: 1, width: '100%', minHeight: '280px', padding: '18px', borderRadius: '14px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '1rem', lineHeight: '1.6', outline: 'none', resize: 'none', opacity: notesViewMode === 'trash' ? 0.7 : 1 }}
                          />

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            <span>{notesViewMode === 'active' ? '💡 Tip: Any note with "🤖 Shared with Personal AI Assistant" checked can be queried directly in your AI Assistant!' : '🗑️ Viewing note in Trash. Restore it to edit or keep permanently.'}</span>
                            <span style={{ fontWeight: 700, color: notesViewMode === 'active' ? 'var(--accent-blue)' : '#ef4444' }}>{notesViewMode === 'active' ? 'Auto-Saved ✓' : 'In Trash Bin'}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* 3) MONEY TRACKING */}
              {activeTab === 'finance' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px' }}>Transactions ({timeOptions.find(o => o.id === timeRange)?.label})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {transactions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px dashed var(--border-color)' }}>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>No transactions recorded yet.</p>
                        </div>
                      ) : (
                        transactions.map(item => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '1rem' }}>{item.title}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.category} • {item.date}</div>
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: item.type === 'earn' ? 'var(--accent-blue)' : 'var(--text-main)' }}>
                              {item.type === 'earn' ? '+' : '-'}{userProfile.currency || '$'}{item.amount}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', height: 'fit-content' }}>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>Add Transaction</h4>
                    <form onSubmit={addTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Type</label>
                        <select value={newType} onChange={(e) => setNewType(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                          <option value="spend">Spending (-)</option>
                          <option value="earn">Earning (+)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Description</label>
                        <input type="text" placeholder="e.g. Server usage..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Amount ({userProfile.currency || '$'})</label>
                        <input type="number" placeholder="0.00" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
                      </div>
                      <button type="submit" className="blue-btn" style={{ justifyContent: 'center', marginTop: '6px' }}><Plus size={18} /> Record Entry</button>
                    </form>
                  </div>
                </div>
              )}

              {/* 4) BODY & GYM */}
              {activeTab === 'body' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '28px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px' }}>Body & Gym Workouts ({timeOptions.find(o => o.id === timeRange)?.label})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {workouts.map(w => (
                        <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{w.exercise}</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>Duration: {w.duration} • Intensity: <strong style={{ color: 'var(--text-main)' }}>{w.intensity}</strong> • {w.date}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{w.caloriesBurned} kcal</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Burned</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', height: 'fit-content' }}>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>Vitals & Nutrition</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Body Weight</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '4px' }}>{bodyStats.currentWeight}</div>
                      </div>
                      <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily Protein Target</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '4px' }}>{bodyStats.dailyProtein}</div>
                      </div>
                      <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hydration Level</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '4px' }}>{bodyStats.hydration}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5) SLEEP & RECOVERY */}
              {activeTab === 'sleep' && (
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>Sleep Quality & Phase Analysis ({timeOptions.find(o => o.id === timeRange)?.label})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {sleepLogs.map(s => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                        <div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{s.date} — {s.totalHours} Hours Total</div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>Deep Sleep: <strong style={{ color: 'var(--text-main)' }}>{s.deepSleep}</strong> • REM Sleep: <strong style={{ color: 'var(--text-main)' }}>{s.remSleep}</strong></div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{s.qualityScore}%</span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Circadian Score</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6) MASTER ANALYTICS HUB */}
              {activeTab === 'analytics' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
                    <div className="glass-card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '12px' }}>
                        <CheckCircle2 size={16} /> OVERALL CONSISTENCY
                      </div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: '8px' }}>{habits.length > 0 ? Math.round((habits.filter(h => h.checkedToday).length / habits.length) * 100) : 0}%</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                        - No data yet
                      </div>
                    </div>

                    <div className="glass-card" style={{ padding: '24px', background: 'var(--bg-card)', border: '2px solid var(--accent-blue)', boxShadow: '0 0 25px rgba(59, 130, 246, 0.15)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-blue)', letterSpacing: '0.5px', marginBottom: '12px' }}>
                        <DollarSign size={16} /> NET MONEY SAVINGS
                      </div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-blue)', letterSpacing: '-1px', marginBottom: '8px' }}>${transactions.reduce((acc, t) => acc + (t.type === 'earn' ? t.amount : -t.amount), 0)}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                        - No data yet
                      </div>
                    </div>

                    <div className="glass-card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '12px' }}>
                        <SleepIcon size={16} /> SLEEP & RECOVERY
                      </div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: '8px' }}>0 <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>/ 100</span></div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                        - No data yet
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Comparative Performance Graphs</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>Visual trajectory and trend curves for timeframe: <strong style={{ color: 'var(--accent-blue)' }}>{timeOptions.find(o => o.id === timeRange)?.label}</strong></p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--text-muted)' }}>
                        <Activity size={24} color="var(--text-muted)" />
                      </div>
                    </div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>Not enough data collected</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Your performance graphs will generate automatically once you start logging your daily habits and spending.</p>
                  </div>
                </div>
              )}

              {/* 7) SETTINGS & PROFILE (General, AI Agent features, and Log Out at bottom) */}
              {activeTab === 'settings' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>General Settings & Preferences</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Customize your personal profile details, AI agent behavior, and workspace rules.</p>
                    </div>
                    {settingsSaved && (
                      <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={16} /> Saved Successfully
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    
                    {/* SECTION 1: General Profile Details */}
                    <div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)' }}>
                        <User size={18} /> General Profile Details
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Full Name</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Your primary display name inside the dashboard.</div>
                          </div>
                          <input 
                            type="text" 
                            value={userProfile.name} 
                            onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })} 
                            style={{ width: '320px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Handle / Username</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Your unique public handle shown in the header.</div>
                          </div>
                          <input 
                            type="text" 
                            value={userProfile.handle} 
                            onChange={(e) => setUserProfile({ ...userProfile, handle: e.target.value })} 
                            style={{ width: '320px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Email Address</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Used for account notifications and VIP early access alerts.</div>
                          </div>
                          <input 
                            type="email" 
                            value={userProfile.email} 
                            onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })} 
                            style={{ width: '320px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Currency Preference</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Choose your default currency for the Money Tracker.</div>
                          </div>
                          <select 
                            value={userProfile.currency || '$'} 
                            onChange={(e) => setUserProfile({ ...userProfile, currency: e.target.value })} 
                            style={{ width: '320px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 600, outline: 'none', appearance: 'none' }}
                          >
                            <option value="$">Dollar ($)</option>
                            <option value="₹">Rupee (₹)</option>
                            <option value="€">Euro (€)</option>
                            <option value="£">Pound (£)</option>
                          </select>
                        </div>

                      </div>
                    </div>

                    {/* SECTION 2: AI Agent & Features */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)' }}>
                        <Bot size={18} /> Personal AI Assistant Features
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>AI Assistant Name</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Customize what your AI friend is called across your entire dashboard (default: AI).</div>
                          </div>
                          <input 
                            type="text" 
                            value={aiName} 
                            placeholder="e.g. AI Friend"
                            onChange={(e) => setAiName(e.target.value || 'AI')} 
                            style={{ width: '320px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Preferred AI Provider</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Choose which AI brain powers your dashboard assistant.</div>
                          </div>
                          <select 
                            value={aiProvider} 
                            onChange={(e) => setAiProvider(e.target.value)} 
                            style={{ width: '320px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 600, outline: 'none', appearance: 'none' }}
                          >
                            <option value="gemini">Google Gemini</option>
                            <option value="groq">Groq (Llama 3)</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Gemini API Key</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Enter your free Google Gemini API key to enable real AI responses. Get one at aistudio.google.com</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input 
                              type="password" 
                              value={geminiApiKey} 
                              placeholder="AIzaSy..."
                              onChange={(e) => setGeminiApiKey(e.target.value)} 
                              style={{ width: '320px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
                            />
                            {geminiApiKey && <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.85rem' }}>● Connected</span>}
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Groq API Key</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Enter your free Groq API key for ultra-fast Llama 3 responses. Get one at console.groq.com</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input 
                              type="password" 
                              value={groqApiKey} 
                              placeholder="gsk_..."
                              onChange={(e) => setGroqApiKey(e.target.value)} 
                              style={{ width: '320px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
                            />
                            {groqApiKey && <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.85rem' }}>● Connected</span>}
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Daily Morning Audit Summary</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>AI automatically generates a schedule & spendings audit every morning at 7:00 AM.</div>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={userProfile.morningAudit} 
                            onChange={(e) => setUserProfile({ ...userProfile, morningAudit: e.target.checked })}
                            style={{ width: '22px', height: '22px', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Real-Time Smart Streak Alerts</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Notify instantly when a study pomodoro or gym habit streak is about to expire.</div>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={userProfile.smartAlerts} 
                            onChange={(e) => setUserProfile({ ...userProfile, smartAlerts: e.target.checked })}
                            style={{ width: '22px', height: '22px', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Personal AI Assistant Tone & Personality</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Choose how strict, encouraging, or concise the AI audits your metrics.</div>
                          </div>
                          <select 
                            value={userProfile.aiTone}
                            onChange={(e) => setUserProfile({ ...userProfile, aiTone: e.target.value })}
                            style={{ width: '320px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.92rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                          >
                            <option value="Analytical & Direct">Analytical & Direct</option>
                            <option value="Encouraging & Supportive">Encouraging & Supportive</option>
                            <option value="Minimalist Executive">Minimalist Executive</option>
                          </select>
                        </div>

                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                      <button type="submit" className="blue-btn" style={{ padding: '14px 28px' }}>
                        <Save size={18} /> Save Changes
                      </button>
                    </div>

                  </form>

                  {/* DOWN BELOW: LOGOUT OPTION AS REQUESTED */}
                  <div style={{ marginTop: '48px', borderTop: '2px dashed var(--border-color)', paddingTop: '32px' }}>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ef4444', marginBottom: '8px' }}>
                      Account Session
                    </h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
                      Logging out will close your active dashboard session and return you to the public storefront.
                    </p>
                    <button 
                      onClick={() => navigate('landing', '/')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '14px 24px', borderRadius: '14px',
                        border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <LogOut size={18} /> Log Out of LifeAgent
                    </button>
                  </div>

                  {/* LIFEAGENT V2.4 FOOTER INSIDE SETTINGS */}
                  <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, opacity: 0.8 }}>
                    LifeAgent v2.4 • Pro Edition
                  </div>

                </div>
              )}

            </div>

          </section>

          {/* PERSISTENT SIDE-BY-SIDE AI COACH PANEL (Always accessible across any tab) */}
          {isAiSidePanelOpen && activeTab !== 'ai' && (
            <aside className="animate-entrance" style={{ width: '370px', height: '100vh', background: 'var(--bg-main)', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ padding: '20px 24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-blue)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Bot size={18} /> {aiName}
                  </h4>
                </div>
                <button 
                  onClick={() => setIsAiSidePanelOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div ref={sideAiChatScrollRef} style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {aiMessages.map(msg => (
                  <div 
                    key={msg.id} 
                    style={{ 
                      alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '90%',
                      background: msg.sender === 'user' ? 'var(--accent-blue)' : 'var(--bg-card)',
                      color: msg.sender === 'user' ? '#fff' : 'var(--text-main)',
                      padding: '14px 16px',
                      borderRadius: '16px',
                      border: msg.sender === 'ai' ? '1px solid var(--border-color)' : 'none',
                      fontSize: '0.88rem',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-line',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendAi} style={{ padding: '16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Chat anywhere, ask about diary..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  style={{ flex: 1, padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '0.88rem' }}
                />
                <button type="submit" className="blue-btn" style={{ padding: '0 16px' }}>
                  <Send size={16} />
                </button>
              </form>
            </aside>
          )}

          {/* FLOATING FRIENDLY DIARY / QUICK NOTE BUTTON ON BOTTOM RIGHT (ONLY IN TODAY TAB) */}
          {activeTab === 'today' && (
            <div style={{ position: 'fixed', bottom: '28px', right: isAiSidePanelOpen && activeTab !== 'ai' ? '395px' : '32px', zIndex: 1000, transition: 'right 0.3s ease' }}>
              {isFloatingDiaryOpen && (
                <div className="animate-entrance" style={{ position: 'absolute', bottom: '64px', right: 0, width: '360px', background: 'var(--bg-card)', padding: '22px', borderRadius: '20px', border: '1px solid var(--accent-blue)', boxShadow: '0 12px 40px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                      <BookOpen size={18} /> Quick Diary & Notes
                    </div>
                    <button onClick={() => setIsFloatingDiaryOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <X size={18} />
                    </button>
                  </div>

                  <textarea 
                    rows={4}
                    value={floatingDiaryContent}
                    onChange={(e) => setFloatingDiaryContent(e.target.value)}
                    placeholder="Save your notes..."
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.92rem', outline: 'none', resize: 'none' }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#22c55e', fontWeight: 700, cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={floatingDiaryShare}
                        onChange={(e) => setFloatingDiaryShare(e.target.checked)}
                        style={{ accentColor: '#22c55e' }}
                      />
                      <span>🤖 Shared with AI</span>
                    </label>
                    <button 
                      onClick={() => {
                        const titleStr = `📖 Diary Entry (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
                        handleCreateNoteDb(titleStr, floatingDiaryContent, floatingDiaryShare, (newNote) => {
                          setNotesList([newNote, ...notesList]);
                          setIsFloatingDiaryOpen(false);
                          confetti({ particleCount: 35, spread: 60, origin: { y: 0.85 } });
                        });
                      }}
                      className="blue-btn" 
                      style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                    >
                      Save Note ✓
                    </button>
                  </div>
                </div>
              )}

              <button 
                onClick={() => setIsFloatingDiaryOpen(!isFloatingDiaryOpen)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '60px', height: '60px', borderRadius: '50%',
                  background: 'var(--accent-blue)', color: '#fff',
                  border: 'none',
                  cursor: 'pointer', boxShadow: '0 8px 24px rgba(59,130,246,0.45)',
                  transition: 'all 0.2s transform',
                  padding: 0
                }}
                title="Open Quick Diary & Notes"
              >
                <PenTool size={26} />
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
