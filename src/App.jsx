import { getApiUrl } from './utils/apiUrl';
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  Sparkles, TrendingUp, Calendar, BookOpen, Bot, DollarSign, 
  CheckCircle2, ArrowRight, XCircle, ShieldCheck, Mail, User, 
  Send, Plus, Clock, Award, Trash2, ChevronRight, LogIn, ExternalLink,
  Sun, Moon, Monitor, ChevronDown, Lock, Phone, AtSign, Activity, Zap, Check, X,
  Dumbbell, Moon as SleepIcon, BarChart3, PieChart, Flame, Heart, Target, Filter, Droplet,
  Home, LayoutDashboard, LogOut, Sliders, Settings, Save, Bell, Shield, PenTool, MessageSquare, Sidebar as SidebarIcon, FileText, Unlock, Smile,
  MoreVertical, List, Menu, History, Edit2, RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import CustomSelect from './components/CustomSelect';
import AnalyticsPanel from './components/AnalyticsPanel';
import SleepTracker from './components/SleepTracker';
import BodyGym from './components/BodyGym';
import MoneyTracker from './components/MoneyTracker';
import SettingsPanel from './components/SettingsPanel';
import CalendarPanel from './components/CalendarPanel';
import ConfirmModal from './components/ConfirmModal';
import Modal from './components/Modal';
import { todayKey, localTimeZone, getWeekDays, isHabitScheduledOnDay, ALL_WEEK_DAYS } from './utils/date';
import WaterReminder from './components/WaterReminder';
import TabErrorBoundary from './components/TabErrorBoundary';

const getFormattedDateTitle = (dateStr) => {
  let targetDate = new Date();
  if (dateStr) {
    if (dateStr instanceof Date) {
      targetDate = dateStr;
    } else if (typeof dateStr === 'string') {
      if (dateStr.includes('-')) {
        const parts = dateStr.split('T')[0].split('-').map(Number);
        if (parts.length === 3 && !parts.some(isNaN)) {
          targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          targetDate = new Date(dateStr);
        }
      } else {
        targetDate = new Date(dateStr);
      }
    } else if (typeof dateStr === 'number') {
      targetDate = new Date(dateStr);
    }
  }
  if (isNaN(targetDate.getTime())) {
    targetDate = new Date();
  }
  const day = targetDate.getDate();
  const month = targetDate.toLocaleDateString('en-US', { month: 'long' });
  const year = targetDate.getFullYear();
  return `📝 ${day} ${month} ${year}`;
};

const TAB_SLUGS = {
  today: '/today',
  ai: '/ai',
  habits: '/habits',
  water: '/water',
  notes: '/notes',
  calendar: '/calendar',
  finance: '/money',
  body: '/body',
  sleep: '/sleep',
  analytics: '/analytics',
  settings: '/settings'
};
const SLUG_TO_TAB = Object.fromEntries(Object.entries(TAB_SLUGS).map(([k, v]) => [v, k]));

const safeStorage = {
  getItem: (key) => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key, val) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, val);
      }
    } catch (e) {}
  },
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {}
  },
  clear: () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (e) {}
  }
};

export default function App() {
  const [themeMode, setThemeMode] = useState(() => safeStorage.getItem('themeMode') || 'pc'); // 'dark', 'light', 'pc'
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeDropdownRef = useRef(null);

  // Sync initial page with URL pathname (/dashboard, /waitlist, /contact, or /)
  const [currentPage, setCurrentPage] = useState(() => {
    const path = window.location.pathname;
    const token = safeStorage.getItem('token');
    const isAuth = !!token;
    
    if (path.includes('/dashboard')) return isAuth ? 'dashboard' : 'auth';
    if (path.includes('/auth') || path.includes('/login')) return isAuth ? 'dashboard' : 'auth';
    if (path.includes('/waitlist')) return 'waitlist';
    if (path.includes('/contact')) return 'contact';
    
    return 'landing';
  });

  // Helper to change page and URL address bar simultaneously
  const navigate = (page, path) => {
    const isAuth = !!safeStorage.getItem('token');
    if (page === 'auth' && isAuth) {
      setCurrentPage('dashboard');
      window.history.pushState({}, '', '/dashboard');
      return;
    }
    setCurrentPage(page);
    window.history.pushState({}, '', path);
  };

  // Handle browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const isAuth = !!safeStorage.getItem('token');
      
      if (path.includes('/dashboard') || SLUG_TO_TAB[path]) {
        if (!isAuth) window.history.replaceState({}, '', '/auth');
        setCurrentPage(isAuth ? 'dashboard' : 'auth');
        if (SLUG_TO_TAB[path] && isAuth) {
          setActiveTabRaw(SLUG_TO_TAB[path]);
        }
      } else if (path.includes('/auth') || path === '/login') {
        setCurrentPage(isAuth ? 'dashboard' : 'auth');
      } else if (path.includes('/waitlist')) {
        setCurrentPage('waitlist');
      } else if (path.includes('/contact')) {
        setCurrentPage('contact');
      } else {
        setCurrentPage('landing');
      }
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

  // Smoothly dismiss initial HTML splash loader once React App is mounted
  useEffect(() => {
    if (window.hideSplash) {
      window.hideSplash();
    }
  }, []);

  // Form state for Waitlist Only
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  // Dashboard state & Global Timeframe Filter
  const [activeTabRaw, setActiveTabRaw] = useState(() => {
    const path = window.location.pathname;
    return SLUG_TO_TAB[path] || 'today';
  });
  const activeTab = activeTabRaw;
  const setActiveTab = (tab) => {
    setActiveTabRaw(tab);
    if (TAB_SLUGS[tab]) {
      window.history.pushState({}, '', TAB_SLUGS[tab]);
    }
  };
  const [previewTab, setPreviewTab] = useState('Money'); // 'Money', 'Sleep', 'Calendar', 'Notes', 'Gym', 'Analytics', 'AI', 'Habits'
  const [timeRange, setTimeRange] = useState('7d'); // 'today', '3d', '7d', '14d', '25d', '30d', '1m', '3m', '6m', '12m', 'lifetime'
  const [isTimeMenuOpen, setIsTimeMenuOpen] = useState(false);
  const timeDropdownRef = useRef(null);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [todayWidgetsConfig, setTodayWidgetsConfig] = useState({ showWorkout: true, showProtein: true, showHydration: true });
  const [isTodayConfigMenuOpen, setIsTodayConfigMenuOpen] = useState(false);
  const todayConfigDropdownRef = useRef(null);
  const PREVIEW_TABS = ['Money', 'Sleep', 'Calendar', 'Notes', 'Gym', 'AI', 'Habits', 'Analytics'];
  const [pauseAutoCycleUntil, setPauseAutoCycleUntil] = useState(0);
  const [isHoveringMockup, setIsHoveringMockup] = useState(false);

  // Auto-cycle landing page preview tabs every 3.5 seconds (pauses 6.5s on click, or while hovering)
  useEffect(() => {
    if (currentPage !== 'landing') return;

    const interval = setInterval(() => {
      if (Date.now() < pauseAutoCycleUntil || isHoveringMockup) return;

      setPreviewTab(prev => {
        const idx = PREVIEW_TABS.indexOf(prev);
        const nextIdx = (idx + 1) % PREVIEW_TABS.length;
        return PREVIEW_TABS[nextIdx];
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [currentPage, pauseAutoCycleUntil, isHoveringMockup]);

  const tabRefs = useRef({});

  // Auto-scroll tab bar so active tab (including AI, Habits, Analytics) is always smoothly in view
  useEffect(() => {
    if (currentPage !== 'landing') return;
    const currentBtn = tabRefs.current[previewTab];
    if (currentBtn && currentBtn.scrollIntoView) {
      currentBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [previewTab, currentPage]);

  const handlePreviewTabClick = (tabId) => {
    setPreviewTab(tabId);
    setPauseAutoCycleUntil(Date.now() + 6500);
  };

  // Scroll swipe-up entrance animation observer for landing page elements
  useEffect(() => {
    if (currentPage !== 'landing') return;

    let observer;
    const timer = setTimeout(() => {
      const observerOptions = {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.08
      };

      observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          } else {
            entry.target.classList.remove('is-revealed');
          }
        });
      }, observerOptions);

      const elements = document.querySelectorAll('.scroll-swipe-up');
      elements.forEach(el => observer.observe(el));
    }, 40);

    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
    };
  }, [currentPage, previewTab]);

  // User Profile & Settings State
  const [userProfile, setUserProfile] = useState({
    name: '',
    handle: '',
    email: '',
    aiTone: 'Analytical & Direct',
    morningAudit: false,
    smartAlerts: false,
    auto_open_ai_sidechat: false,
    currency: '$',
    timezone: localTimeZone()
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!safeStorage.getItem('token'));
  const [token, setToken] = useState(() => safeStorage.getItem('token') || '');
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', or 'forgot'
  const [authForm, setAuthForm] = useState({ name: '', handle: '', email: '', password: '', phone: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Validate session on mount if token exists; log out if account was deleted or token expired
  useEffect(() => {
    if (!token) return;
    fetch(getApiUrl('/api/auth?action=me'), {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => {
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        handleLogout();
      }
    }).catch(() => {});
  }, [token]);

  // Password Reset State
  const [resetStep, setResetStep] = useState(1); // 1: request code, 2: verify code, 3: set new password twice
  const [resetEmailOrHandle, setResetEmailOrHandle] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFinanceForm, setShowFinanceForm] = useState(false);
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [isEditSplitOpen, setIsEditSplitOpen] = useState(false);
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const endpoint = authMode === 'login' 
        ? getApiUrl('/api/auth?action=login') 
        : getApiUrl('/api/auth?action=register');

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      
      let data = null;
      try {
        const text = await res.text();
        if (text && !text.trim().startsWith('<')) {
          data = JSON.parse(text);
        }
      } catch (e) {}

      if (res.ok && data && data.token) {
        const savedThemeMode = safeStorage.getItem('themeMode');
        const savedThemeColor = safeStorage.getItem('themeColor');
        safeStorage.clear();
        if (savedThemeMode) safeStorage.setItem('themeMode', savedThemeMode);
        if (savedThemeColor) safeStorage.setItem('themeColor', savedThemeColor);

        resetLoadedTabs();
        safeStorage.setItem('token', data.token);
        setToken(data.token);
        setIsAuthenticated(true);
        if (data.user && data.user.ai_name) setAiName(data.user.ai_name);
        setAuthForm({ name: '', handle: '', email: '', password: '', phone: '' });
        navigate('dashboard', '/dashboard');
        return;
      }
      
      if (data && data.error) {
        setAuthError(data.error);
        return;
      }

      if (!res.ok) {
        setAuthError(authMode === 'login' ? 'Invalid email or password.' : 'Registration failed. Please try again.');
        return;
      }

      setAuthError('Unexpected server response. Please try again.');
    } catch (err) {
      console.error('Auth fetch error:', err);
      setAuthError(err?.message && !err.message.includes('JSON') ? err.message : 'Unable to connect to authentication server. Please check your internet connection.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setResetSuccessMsg('');
    try {
      const res = await fetch(getApiUrl('/api/auth?action=forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrHandle: resetEmailOrHandle })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Account not found');

      setResetStep(2);
      setResetCode('');
      setResetSuccessMsg(data.message || '✉️ Check your email inbox for the 6-digit reset code. It expires in 15 minutes.');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyResetCode = async (e) => {
    e.preventDefault();
    if (!resetCode.trim()) return setAuthError('Please enter the 6-digit reset code');
    setAuthLoading(true);
    setAuthError('');
    setResetSuccessMsg('');
    try {
      const res = await fetch(getApiUrl('/api/auth?action=verify-reset-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrHandle: resetEmailOrHandle,
          code: resetCode
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid reset code');

      setResetStep(3);
      setResetSuccessMsg('✅ Reset code verified! Set your new password below.');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetNewPassword) return setAuthError('Please enter a new password');
    if (resetNewPassword !== resetConfirmPassword) return setAuthError('Passwords do not match. Please re-enter.');
    setAuthLoading(true);
    setAuthError('');
    setResetSuccessMsg('');
    try {
      const res = await fetch(getApiUrl('/api/auth?action=reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrHandle: resetEmailOrHandle,
          code: resetCode,
          newPassword: resetNewPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setResetSuccessMsg(data.message || 'Password reset successfully!');
      setTimeout(() => {
        setAuthMode('login');
        setResetStep(1);
        setAuthError('');
        setResetSuccessMsg('');
        setResetCode('');
        setResetNewPassword('');
        setResetConfirmPassword('');
      }, 1800);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    // Purge all localStorage data on logout while retaining essential theme options
    resetLoadedTabs();
    const savedThemeMode = safeStorage.getItem('themeMode');
    const savedThemeColor = safeStorage.getItem('themeColor');
    safeStorage.clear();
    if (savedThemeMode) safeStorage.setItem('themeMode', savedThemeMode);
    if (savedThemeColor) safeStorage.setItem('themeColor', savedThemeColor);
    setToken('');
    setIsAuthenticated(false);
    setUserProfile({ name: '', handle: '', email: '', aiTone: 'Analytical & Direct', morningAudit: false, smartAlerts: false, currency: '$', timezone: localTimeZone() });
    navigate('landing', '/');
  };

  const timeOptions = [
    { id: 'today', label: 'Today' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: '1 Month' },
    { id: 'this_year', label: 'This Year' },
    { id: 'custom', label: '📅 Custom Range' },
    { id: 'lifetime', label: 'All Time' }
  ];

  // 1) AI Chat state with Autonomous Executive Engine
  const [aiMessages, setAiMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [aiName, setAiName] = useState('AI');
  const mainAiChatScrollRef = useRef(null);
  const sideAiChatScrollRef = useRef(null);

  // Toast notification state and helper
  const [toast, setToast] = useState({ message: '', type: '', visible: false, isHiding: false });
  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type, visible: true, isHiding: false });
    setTimeout(() => {
      setToast(prev => ({ ...prev, isHiding: true }));
      setTimeout(() => {
        setToast({ message: '', type: '', visible: false, isHiding: false });
      }, 400);
    }, 3000);
  };

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

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

  // Command+J shortcut to toggle AI side panel
  useEffect(() => {
    const handler = (e) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'j') {
        setIsAiSidePanelOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);


  // 2) Habit Tracker state
  // Habits state with exact daily tracking items: Gym, Study, Code, Reading
  const [showHabitHistory, setShowHabitHistory] = useState(false);
  const [habits, setHabits] = useState([]);
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [isEditHabitModalOpen, setIsEditHabitModalOpen] = useState(false);
  const [editingHabitData, setEditingHabitData] = useState(null);
  const [newHabitData, setNewHabitData] = useState({ title: '', category: '', target: '', challengeMode: false, challengeDays: 30, durationMode: 'preset', frequency: 'daily', customDays: ['Mon', 'Wed', 'Fri'], intervalDays: 0, interval_days: 0 });
  const [customPillarInput, setCustomPillarInput] = useState('');
  const [newTodayItemData, setNewTodayItemData] = useState({ title: '', category: 'Coding', time: '10:00 AM' });
  const [isAddTodayItemOpen, setIsAddTodayItemOpen] = useState(false);
  const [todayItems, setTodayItems] = useState([]);
  const [habitCardViews, setHabitCardViews] = useState({}); // { habitId: 'progress' | 'heatmap' }
  const [habitMenuOpen, setHabitMenuOpen] = useState(null); // habitId

  // 3) Finance state
  const [transactions, setTransactions] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState('spend');

  // 4) Body & Gym state
  const [workouts, setWorkouts] = useState([]);
  const [bodyStats, setBodyStats] = useState([]);

  const handleSaveBodyStat = async (updated) => {
    const todayStr = todayKey(userProfile?.timezone);
    const isToday = updated.date === todayStr;
    const payload = {
      weight: Number(updated.weight) || 0,
      target_weight: Number(updated.target_weight) || 0,
      protein: isToday ? (Number(updated.protein) || 0) : 0,
      hydration: Number(updated.hydration) || 0,
      date: todayStr
    };
    if (isToday && updated.id) {
       payload.id = updated.id;
    }
    
    if (token) {
      fetch(getApiUrl('/api/fitness?type=body-stats'), {
        method: payload.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      }).catch(console.error);
    }
    
    setBodyStats(prev => {
       const arr = Array.isArray(prev) ? prev : (prev ? [prev] : []);
       const existingIdx = arr.findIndex(s => s.date === todayStr);
       if (existingIdx >= 0) {
          const next = [...arr];
          next[existingIdx] = { ...next[existingIdx], ...payload };
          return next;
       } else {
          return [{ ...payload, id: payload.id || Date.now() }, ...arr];
       }
    });
  };

  // 5) Sleep state
  const [sleepLogs, setSleepLogs] = useState([]);

  // 6) Notes & Diary state (with AI sharing permissions)
  const [notesList, setNotesList] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
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
      const expired = trashNotes.filter(note => (now - (note.deletedAt || now)) > fortyNineDaysMs);
      if (expired.length > 0) {
        // Permanently delete expired notes from DB
        expired.forEach(note => {
          fetch(getApiUrl('/api/notes'), {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ id: note.id })
          }).catch(err => console.error('Failed to auto-delete expired trash note:', err));
        });
        const validNotes = trashNotes.filter(note => (now - (note.deletedAt || now)) <= fortyNineDaysMs);
        setTrashNotes(validNotes);
      }
    }
  }, [trashNotes]);


  // 7) Persistent Side Personal AI Assistant Panel state
  const [isAiSidePanelOpen, setIsAiSidePanelOpen] = useState(false);

  // Auto-open AI side panel when switching tabs if setting is enabled
  useEffect(() => {
    if (userProfile.auto_open_ai_sidechat === true) {
      if (activeTab !== 'settings' && activeTab !== 'ai') {
        if (window.innerWidth > 768) {
          setIsAiSidePanelOpen(true);
        }
      }
    }
  }, [activeTab, userProfile.auto_open_ai_sidechat]);

  // 8) Calendar state
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarSubTab, setCalendarSubTab] = useState('today');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [isAddEventFormOpen, setIsAddEventFormOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');

  // 9) AI API Keys (loaded from DB via /api/settings)
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState('gemini');
  const [aiLoading, setAiLoading] = useState(false);

  // Lazy Loading & Memory Cache Tracking Flags Ref
  const loadedTabsRef = useRef({
    startup: false,
    body: false,
    finance: false,
    notes: false,
    sleep: false,
    calendar: false,
    ai: false
  });

  const resetLoadedTabs = () => {
    loadedTabsRef.current = {
      startup: false,
      body: false,
      finance: false,
      notes: false,
      sleep: false,
      calendar: false,
      ai: false
    };
  };

  // Request Memoization & In-Flight Tracking Refs
  const isFetchingRef = useRef(false);
  const lastFetchTimestampRef = useRef(0);

  // 1. Initial Startup Data Loader: fetches ONLY essential startup data (/api/settings, /api/today, /api/habits)
  const fetchStartupData = async (force = false) => {
    if (!token) return;
    const now = Date.now();
    if (!force && loadedTabsRef.current.startup && (now - lastFetchTimestampRef.current < 5000)) return;

    isFetchingRef.current = true;
    lastFetchTimestampRef.current = now;

    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const timezone = userProfile?.timezone || localTimeZone();
      const clientDate = todayKey(timezone);

      const [settingsRes, todayRes, habitsRes] = await Promise.all([
        fetch(getApiUrl('/api/settings'), { headers }).catch(e => null),
        fetch(`/api/today?client_date=${clientDate}`, { headers }).catch(e => null),
        fetch(getApiUrl('/api/habits'), { headers }).catch(e => null)
      ]);

      if (settingsRes && settingsRes.ok) {
        const sData = await settingsRes.json();
        if (sData) {
          const userTz = sData.timezone && sData.timezone !== 'UTC' ? sData.timezone : timezone;
          setUserProfile(prev => {
            const next = { ...prev, ...sData, currency: sData.currency || '$', timezone: userTz };
            safeStorage.setItem('cache_userProfile', JSON.stringify(next));
            return next;
          });
          setGeminiApiKey(sData.gemini_api_key || '');
          setGroqApiKey(sData.groq_api_key || '');
          setAiProvider(sData.ai_provider || 'gemini');
          if (sData.ai_name) setAiName(sData.ai_name);
        }
      }

      let todayData = [];
      if (todayRes && todayRes.ok) {
        todayData = await todayRes.json();
        const mappedToday = todayData.map(t => ({ id: t.id, time: t.time, title: t.label, category: t.category, checked: !!t.checked, habitId: t.habit_id || null }));
        setTodayItems(mappedToday);
        safeStorage.setItem('cache_todayItems', JSON.stringify(mappedToday));
      }

      if (habitsRes && habitsRes.ok) {
        const hData = await habitsRes.json();
        const mappedHabits = hData.map(h => ({
          id: h.id, title: h.label, category: h.category, streak: h.streak, target: h.target || '',
          challengeDays: h.challenge_days || 0, startDate: h.start_date || null,
          archived: h.archived === 1, completedAt: h.completed_at || null,
          checkedToday: todayData.some(item => item.habit_id === h.id && !!item.checked),
          pausedUntil: h.paused_until || null,
          frequency: h.frequency || 'daily',
          customDays: h.custom_days || '',
          custom_days: h.custom_days || '',
          intervalDays: h.interval_days || 0,
          interval_days: h.interval_days || 0
        }));
        setHabits(mappedHabits);
        safeStorage.setItem('cache_habits', JSON.stringify(mappedHabits));
      }

      loadedTabsRef.current.startup = true;
    } catch (err) {
      console.error('Failed to fetch startup data:', err);
      if (err?.status === 401 || err?.message?.includes('401')) {
        handleLogout();
      }
    } finally {
      isFetchingRef.current = false;
    }
  };

  // 2. Active Tab Domain Lazy Loaders
  const fetchBodyData = async (force = false) => {
    if (!token) return;
    if (!force && loadedTabsRef.current.body) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [workoutsRes, statsRes] = await Promise.all([
        fetch(getApiUrl('/api/fitness?type=workouts'), { headers }).catch(e => null),
        fetch(getApiUrl('/api/fitness?type=body-stats'), { headers }).catch(e => null)
      ]);

      if (workoutsRes && workoutsRes.ok) {
        const wData = await workoutsRes.json();
        setWorkouts(wData);
        safeStorage.setItem('cache_workouts', JSON.stringify(wData));
      }

      if (statsRes && statsRes.ok) {
        const sData = await statsRes.json();
        setBodyStats(sData);
        safeStorage.setItem('cache_bodyStats', JSON.stringify(sData));
      }
      loadedTabsRef.current.body = true;
    } catch (err) {
      console.error('Failed to fetch body data:', err);
    }
  };

  const fetchFinanceData = async (force = false) => {
    if (!token) return;
    if (!force && loadedTabsRef.current.finance) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [txRes, financeRes] = await Promise.all([
        fetch(getApiUrl('/api/transactions'), { headers }).catch(e => null),
        fetch(getApiUrl('/api/finance'), { headers }).catch(e => null)
      ]);
      const validTxRes = (txRes && txRes.ok) ? txRes : (financeRes && financeRes.ok ? financeRes : null);
      if (validTxRes) {
        const txData = await validTxRes.json();
        const mappedTx = txData.map(t => ({ id: t.id, title: t.title, amount: t.amount, type: t.type, date: t.date }));
        setTransactions(mappedTx);
        safeStorage.setItem('cache_transactions', JSON.stringify(mappedTx));
      }
      loadedTabsRef.current.finance = true;
    } catch (err) {
      console.error('Failed to fetch finance data:', err);
    }
  };

  const fetchNotesData = async (force = false) => {
    if (!token) return;
    if (!force && loadedTabsRef.current.notes) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const notesRes = await fetch(getApiUrl('/api/notes'), { headers }).catch(e => null);
      if (notesRes && notesRes.ok) {
        const notesData = await notesRes.json();
        let activeNotes = notesData.filter(n => !n.is_trashed).map(n => ({ id: n.id, title: n.title, content: n.content, category: n.category, date: n.date, shareWithAi: !!n.share_with_ai }));
        const trashedNotes = notesData.filter(n => !!n.is_trashed).map(n => ({ id: n.id, title: n.title, content: n.content, category: n.category, date: n.date, shareWithAi: !!n.share_with_ai, deletedAt: n.deleted_at ? new Date(n.deleted_at).getTime() : Date.now() }));

        setTrashNotes(trashedNotes);
        safeStorage.setItem('cache_trashNotes', JSON.stringify(trashedNotes));
        setNotesList(activeNotes);
        safeStorage.setItem('cache_notesList', JSON.stringify(activeNotes));
      }
      loadedTabsRef.current.notes = true;
    } catch (err) {
      console.error('Failed to fetch notes data:', err);
    }
  };

  const fetchSleepData = async (force = false) => {
    if (!token) return;
    if (!force && loadedTabsRef.current.sleep) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const sleepRes = await fetch(getApiUrl('/api/sleep'), { headers }).catch(e => null);
      if (sleepRes && sleepRes.ok) {
        const sLogs = await sleepRes.json();
        setSleepLogs(sLogs);
        safeStorage.setItem('cache_sleepLogs', JSON.stringify(sLogs));
      }
      loadedTabsRef.current.sleep = true;
    } catch (err) {
      console.error('Failed to fetch sleep data:', err);
    }
  };

  const fetchCalendarData = async (force = false) => {
    if (!token) return;
    if (!force && loadedTabsRef.current.calendar) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const calRes = await fetch(getApiUrl('/api/calendar'), { headers }).catch(e => null);
      if (calRes && calRes.ok) {
        const calData = await calRes.json();
        const mappedCal = calData.map(c => ({ id: c.id, title: c.title, date: c.date, color: c.color, status: c.status, endDate: c.end_date }));
        setCalendarEvents(mappedCal);
        safeStorage.setItem('cache_calendarEvents', JSON.stringify(mappedCal));
      }
      loadedTabsRef.current.calendar = true;
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
    }
  };

  const fetchAiData = async (force = false) => {
    if (!token) return;
    if (!force && loadedTabsRef.current.ai) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const chatRes = await fetch(getApiUrl('/api/chat'), { headers }).catch(e => null);
      if (chatRes && chatRes.ok) {
        const cData = await chatRes.json();
        const mappedChat = cData.map(c => ({ id: c.id, sender: c.sender, text: c.text, time: c.time }));
        setAiMessages(mappedChat);
        safeStorage.setItem('cache_aiMessages', JSON.stringify(mappedChat));
      }
      loadedTabsRef.current.ai = true;
    } catch (err) {
      console.error('Failed to fetch AI chat data:', err);
    }
  };

  const handleResetAllAccountData = async () => {
    if (!token) return;
    try {
      const res = await fetch(getApiUrl('/api/settings?action=reset-all'), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Clear React state in App.jsx
        setHabits([]);
        setWorkouts([]);
        setBodyStats([]);
        setTransactions([]);
        setNotesList([]);
        setTrashNotes([]);
        setSleepLogs([]);
        setCalendarEvents([]);
        setTodayItems([]);
        setAiMessages([]);
        resetLoadedTabs();

        // Clear localStorage except token, theme, and userProfile cache
        const savedToken = safeStorage.getItem('token');
        const savedThemeMode = safeStorage.getItem('themeMode');
        const savedThemeColor = safeStorage.getItem('themeColor');
        const savedUserProfile = safeStorage.getItem('cache_userProfile');
        safeStorage.clear();
        if (savedToken) safeStorage.setItem('token', savedToken);
        if (savedThemeMode) safeStorage.setItem('themeMode', savedThemeMode);
        if (savedThemeColor) safeStorage.setItem('themeColor', savedThemeColor);
        if (savedUserProfile) safeStorage.setItem('cache_userProfile', savedUserProfile);
        safeStorage.removeItem('water_target_goal');

        // Call showToast('Account reset to fresh start!', 'info')
        showToast('Account reset to fresh start!', 'info');

        // Reload/re-fetch dashboard so the UI updates to 100% clean empty states immediately
        await fetchStartupData(true);
      } else {
        showToast(data.error || 'Failed to reset account data', 'error');
      }
    } catch (err) {
      console.error('Reset account data error:', err);
      showToast('Failed to reset account data', 'error');
    }
  };

  const handleUpdateNoteDb = async (note) => {
    if (!token || !note || !note.id) return;
    try {
      const isTrashed = note.is_trashed !== undefined ? (note.is_trashed ? 1 : 0) : (note.deletedAt ? 1 : 0);
      const deletedAt = isTrashed === 0 ? null : (note.deletedAt ? new Date(note.deletedAt).toISOString() : (note.deleted_at || new Date().toISOString()));

      await fetch(getApiUrl('/api/notes'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          id: note.id,
          title: note.title,
          content: note.content,
          share_with_ai: note.shareWithAi !== undefined ? note.shareWithAi : note.share_with_ai,
          is_trashed: isTrashed,
          deleted_at: deletedAt
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNoteDb = async (title, content, shareWithAi, callback) => {
    if (!token) return;
    try {
      const res = await fetch(getApiUrl('/api/notes'), {
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
      await fetch(getApiUrl('/api/today'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id, checked })
      });
    } catch(e) {}
  };

  const handleUpdateHabitDb = async (id, streak, checked_today, paused_until, archived, completed_at) => {
      if (!token || !id) return;
      try {
        const payload = { id, streak, checked_today, paused_until };
        if (archived !== undefined) payload.archived = archived;
        if (completed_at !== undefined) payload.completed_at = completed_at;
        await fetch(getApiUrl('/api/habits'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      } catch(e) {}
    };

  // Requirement 1: On initial login / app mount when isAuthenticated is true, fetch ONLY essential startup data
  useEffect(() => {
    if (isAuthenticated) {
      fetchStartupData();
    }
  }, [isAuthenticated, token]);

  // Requirement 2: Active Tab Lazy Loading (useEffect watching activeTab)
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    if (activeTab === 'body' || activeTab === 'gym') {
      fetchBodyData();
    } else if (activeTab === 'finance') {
      fetchFinanceData();
    } else if (activeTab === 'notes') {
      fetchNotesData();
    } else if (activeTab === 'sleep') {
      fetchSleepData();
    } else if (activeTab === 'calendar') {
      fetchCalendarData();
    } else if (activeTab === 'ai') {
      fetchAiData();
    } else if (activeTab === 'today' || activeTab === 'habits') {
      fetchStartupData();
    }
  }, [activeTab, isAuthenticated, token]);

  // Reload the startup data after the user's local calendar day changes.
  useEffect(() => {
    if (!isAuthenticated) return;
    const currentDate = () => todayKey(userProfile.timezone);
    let lastDate = currentDate();
    const interval = window.setInterval(() => {
      const nextDate = currentDate();
      if (nextDate !== lastDate) {
        lastDate = nextDate;
        resetLoadedTabs();
        fetchStartupData(true);
      }
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [isAuthenticated, token, userProfile.timezone]);

  // Universal sync helpers between Today routine and Daily Works (habits)
  // Sync is now 1:1 via habitId linkage
  const handleToggleTodayItem = (targetId) => {
    setTodayItems(prev => prev.map(i => {
      if (i.id !== targetId) return i;
      const nextChecked = !i.checked;
      
      // Sync the linked habit by habitId
      if (i.habitId) {
        setHabits(prevHabits => prevHabits.map(h => {
          if (h.id !== i.habitId) return h;
          const newStreak = nextChecked ? h.streak + 1 : Math.max(0, h.streak - 1);
          handleUpdateHabitDb(h.id, newStreak, nextChecked, h.pausedUntil);
          return { ...h, checkedToday: nextChecked, streak: newStreak };
        }));
      }

      handleUpdateTodayDb(i.id, nextChecked);
      return { ...i, checked: nextChecked };
    }));
  };

  const handleToggleAllToday = () => {
    const allAreChecked = todayItems.every(i => i.checked);
    const targetState = !allAreChecked;
    
    // 1. Sync Today Habits
    setTodayItems(prev => prev.map(i => {
      handleUpdateTodayDb(i.id, targetState);
      return { ...i, checked: targetState };
    }));
    setHabits(prevHabits => prevHabits.map(h => {
      const linkedToday = todayItems.find(ti => ti.habitId === h.id);
      if (!linkedToday) return h;
      const newStreak = targetState ? h.streak + (h.checkedToday ? 0 : 1) : Math.max(0, h.streak - 1);
      handleUpdateHabitDb(h.id, newStreak, targetState, h.pausedUntil);
      return { ...h, checkedToday: targetState, streak: newStreak };
    }));

    const todayStr = todayKey(userProfile?.timezone);

    // 2. Mark Today's Gym Workout Split Complete
    if (targetState) {
      const splitList = [];
      const daysEpoch = Math.floor(new Date(todayStr).getTime() / (1000 * 60 * 60 * 24));
      const todaySplitIdx = splitList.length > 0 ? Math.abs(daysEpoch) % splitList.length : 0;
      const currentTitle = (splitList.length > 0 && splitList[todaySplitIdx]) ? (typeof splitList[todaySplitIdx] === 'string' ? splitList[todaySplitIdx] : splitList[todaySplitIdx]?.name) : 'Workout';
      
      const isAlreadyCompleted = (Array.isArray(workouts) ? workouts : []).some(w => w.date === todayStr);
      if (!isAlreadyCompleted) {
        const newWorkout = {
          title: currentTitle,
          category: 'Strength',
          duration_mins: 45,
          calories: 320,
          notes: `Completed scheduled ${currentTitle}`,
          date: todayStr,
          id: Date.now()
        };
        if (token) {
          fetch(getApiUrl('/api/fitness?type=workouts'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(newWorkout)
          }).catch(console.error);
        }
        setWorkouts(prev => [newWorkout, ...(Array.isArray(prev) ? prev : [])]);
      }
    }

    // 3. Mark Protein & Hydration Trackers to 100% Goal Target
    if (targetState) {
      const latestStat = Array.isArray(bodyStats) && bodyStats.length > 0 ? bodyStats[0] : (bodyStats || {});
      const targetW = Number(latestStat?.target_weight) || 0;
      const targetP = Number(latestStat?.target_protein) || 0;
      const proteinGoal = targetP > 0 ? targetP : (targetW > 0 ? Math.round(targetW * 2) : 0);
      const hydrationGoal = Number(latestStat?.hydration) || 3.0;

      const payload = {
        weight: Number(latestStat?.weight) || 0,
        target_weight: targetW,
        protein: proteinGoal,
        target_protein: proteinGoal,
        hydration: hydrationGoal,
        date: todayStr
      };

      if (latestStat?.date === todayStr && latestStat?.id) {
        payload.id = latestStat.id;
      }

      if (token) {
        fetch(getApiUrl('/api/fitness?type=body-stats'), {
          method: payload.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        }).catch(console.error);
      }

      setBodyStats(prev => {
        if (Array.isArray(prev)) {
          const exists = prev.some(s => s.date === todayStr);
          if (exists) return prev.map(s => s.date === todayStr ? { ...s, protein: proteinGoal, hydration: hydrationGoal } : s);
          return [payload, ...prev];
        }
        return { ...prev, protein: proteinGoal, hydration: hydrationGoal };
      });
    }

    showToast?.(targetState ? '🎉 Ticked All Today (Habits, Workout, Protein & Water)!' : 'Unchecked items for today', 'success');
  };

  const handleToggleHabitItem = (targetHabitId) => {
    setHabits(prev => prev.map(h => {
      if (String(h.id) !== String(targetHabitId)) return h;
      const nextChecked = !h.checkedToday;
      const newStreak = nextChecked ? h.streak + 1 : Math.max(0, h.streak - 1);
      
      // Sync linked today item
      setTodayItems(prevToday => {
        const exists = prevToday.some(ti => String(ti.habitId) === String(targetHabitId) || (ti.title && h.title && ti.title.toLowerCase() === h.title.toLowerCase()));
        if (exists) {
          return prevToday.map(ti => {
            if (String(ti.habitId) === String(targetHabitId) || (ti.title && h.title && ti.title.toLowerCase() === h.title.toLowerCase())) {
              handleUpdateTodayDb(ti.id, nextChecked);
              return { ...ti, checked: nextChecked, habitId: targetHabitId };
            }
            return ti;
          });
        }
        if (nextChecked) {
          const newTodayItem = { id: Date.now(), habitId: targetHabitId, title: h.title, category: h.category, checked: true, time: 'Daily' };
          if (token) {
            fetch(getApiUrl('/api/today'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ label: h.title, category: h.category, checked: 1, habit_id: targetHabitId, time: 'Daily', client_date: todayKey(userProfile?.timezone) })
            }).catch(console.error);
          }
          return [...prevToday, newTodayItem];
        }
        return prevToday;
      });

      let isArchived = h.archived;
      let compAt = h.completedAt;
      
      if (nextChecked && h.challengeDays > 0 && h.startDate) {
        const elapsed = Math.floor((new Date() - new Date(h.startDate)) / (1000 * 60 * 60 * 24));
        const daysStr = Math.min(Math.max(elapsed + 1, 1), h.challengeDays);
        if (daysStr >= h.challengeDays) {
          isArchived = true;
          compAt = new Date().toISOString();
        }
      }

      handleUpdateHabitDb(h.id, newStreak, nextChecked, h.pausedUntil, isArchived, compAt);

      if (nextChecked) {
        // Try to parse numeric value from habit target
        const match = h.target ? h.target.match(/\d+/) : null;
        const numValue = match ? match[0] : "1";
        
        fetch(getApiUrl('/api/analytics?type=metrics'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            date: todayKey(),
            metric_type: 'habit',
            metric_name: h.title,
            metric_value: numValue
          })
        }).catch(err => console.error('Failed to log habit metric:', err));

        showToast?.(`🎉 Checked off "${h.title}"! Streak: ${newStreak} days`, 'success');
        if (isArchived && !h.archived) {
          showToast?.(`🏆 Challenge Completed! "${h.title}" moved to History.`, 'success');
        }
      } else {
        showToast?.(`Unchecked "${h.title}"`, 'info');
      }

      return { ...h, checkedToday: nextChecked, streak: newStreak, archived: isArchived, completedAt: compAt };
    }));
  };

  // Delete habit from DB and UI
const handleDeleteHabitDb = async (id) => {
      if (!token) return;
      try {
        await fetch(getApiUrl('/api/habits'), {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ id })
        });
        setHabits(prev => prev.filter(h => h.id !== id));
        // Remove any linked today items
        setTodayItems(prev => prev.filter(ti => ti.habitId !== id));
      } catch (err) {
        console.error('Failed to delete habit:', err);
      }
    };

  // Handle PC/System vs explicit Dark/Light mode
  useEffect(() => {
    const root = document.documentElement;
    safeStorage.setItem('themeMode', themeMode);
    
    if (themeMode === 'pc') {
      const isSystemDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', isSystemDark ? 'dark' : 'light');
      
      if (window.matchMedia) {
        const listener = (e) => root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        media.addEventListener ? media.addEventListener('change', listener) : media.addListener(listener);
        return () => media.removeEventListener ? media.removeEventListener('change', listener) : media.removeListener(listener);
      }
    } else {
      root.setAttribute('data-theme', themeMode);
    }
  }, [themeMode]);

  // Theme Color Sync
  const [themeColor, setThemeColor] = useState(() => {
    return safeStorage.getItem('themeColor') || 'blue';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const newColor = safeStorage.getItem('themeColor') || 'blue';
      if (newColor !== themeColor) {
        setThemeColor(newColor);
        document.documentElement.setAttribute('data-color-theme', newColor);
      }
    };
    
    // Initial set
    document.documentElement.setAttribute('data-color-theme', themeColor);
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [themeColor]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target)) {
        setIsThemeMenuOpen(false);
      }
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(e.target)) {
        setIsTimeMenuOpen(false);
      }
      if (todayConfigDropdownRef.current && !todayConfigDropdownRef.current.contains(e.target)) {
        setIsTodayConfigMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!waitlistEmail.trim() || !waitlistName.trim()) return;
    
    try {
      const response = await fetch(getApiUrl('/api/waitlist'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: waitlistName, email: waitlistEmail })
      });
      
      if (response.ok) {
        setWaitlistSuccess(true);
      } else {
        const errorData = await response.json();
        console.error('Waitlist error:', errorData.error);
        showToast(errorData.error || 'Failed to join waitlist. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Network error during waitlist submission:', err);
      showToast('Network error. Please try again later.', 'error');
    }
  };

  const handleStartTrial = () => {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    if (isAuthenticated) {
      navigate('dashboard', '/dashboard');
    } else {
      navigate('auth', '/auth');
    }
  };

  const handleSaveSettings = (e) => {
    e?.preventDefault();
    setSettingsSaved(true);
    showToast('Settings saved successfully!', 'success');
    setTimeout(() => setSettingsSaved(false), 3000);

    const updatedProfile = { ...userProfile, ai_name: aiName, gemini_api_key: geminiApiKey, groq_api_key: groqApiKey, ai_provider: aiProvider, theme: themeMode, currency: userProfile.currency };
    setUserProfile(updatedProfile);

    if (token) {
      fetch(getApiUrl('/api/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updatedProfile)
      }).catch(err => console.error('Background settings save failed:', err));
    }
  };

  const handleClearAiChat = async () => {
    setAiMessages([]);
    showToast?.('AI Chat history cleared', 'info');
    try {
      if (token) {
        await fetch(getApiUrl('/api/chat'), {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error("Failed to clear chat history", err);
    }
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

    const effectiveProvider = (aiProvider === 'groq' && groqApiKey) ? 'groq' :
                              (aiProvider === 'gemini' && geminiApiKey) ? 'gemini' :
                              groqApiKey ? 'groq' :
                              geminiApiKey ? 'gemini' : null;

    if (!effectiveProvider) {
      const fallbackReply = "Please provide your Gemini or Groq API key in the settings to use the AI Assistant.";
      const aiMsg = { id: Date.now() + 1, sender: 'ai', text: fallbackReply, time: nowTime };
      setAiMessages(prev => [...prev, aiMsg]);
      fetch(getApiUrl('/api/chat'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify([newMsg, aiMsg]) }).catch(err => console.error(err));
      return;
    }

    setAiLoading(true);
    setAiMessages(prev => [...prev, { id: 'loading', sender: 'ai', text: 'Thinking...', time: nowTime }]);
    
    try {
      const todayStr = todayKey(userProfile.timezone);
      const currentYear = new Date().getFullYear();

      const systemPrompt = `
        You are an autonomous AI executive assistant inside the LifeAgent dashboard.
        CRITICAL TIME CONTEXT: Today's current date is ${todayStr} (Year: ${currentYear}).
        ALWAYS calculate dates relative to today's date ${todayStr} and year ${currentYear}.

        User's complete live dashboard data context across ALL pages:
        - User Profile & Settings: ${JSON.stringify(userProfile)} (Currency: ${userProfile.currency || '$'})
        - Calendar Events: ${JSON.stringify(calendarEvents)}
        - Daily Routine & Today Checklist: ${JSON.stringify(todayItems)}
        - Habits Tracker List: ${JSON.stringify(habits)}
        - Money & Transactions: ${JSON.stringify(transactions)}
        - Body & Gym Workouts Logged: ${JSON.stringify(workouts)}
        - Body Stats (Weight, Protein Intake, Hydration Target): ${JSON.stringify(bodyStats)}
        - Sleep Quality & Recovery Logs: ${JSON.stringify(sleepLogs)}
        - Shared Notes & Diary Entries: ${JSON.stringify(notesList.filter(n => n.shareWithAi))}

        CRITICAL RESPONSE INSTRUCTIONS:
        1. Always respond in natural, friendly, human-like chat language.
        2. NEVER print raw JSON code blocks or mention code/tags in your conversational reply to the user.
        3. Do NOT explain your internal JSON tags or output \`\`\`json code blocks. Talk directly and warmly like a personal human assistant!
        4. ONLY output action tags ([ADD_TRANSACTION], [ADD_HABIT], [CALENDAR_EVENT], [ADD_NOTE], [ADD_SLEEP], [ADD_WORKOUT], [ADD_BODY_STATS]) when the user EXPLICITLY COMMANDS you to log, create, add, or record data (e.g. "log my workout 45 mins", "add expense 50").
        5. NEVER output action tags when answering general questions, giving summaries (like "how is my day today"), or giving advice/examples!

        Required Action Tags:
        1. Log Money Spending or Earning:
        [ADD_TRANSACTION]{"title":"Bus Travel","amount":100,"type":"spend","category":"Transport","date":"${todayStr}"}[/ADD_TRANSACTION]
        (For earning use "type":"earn")

        2. Create Habit:
        [ADD_HABIT]{"label":"Drink 2L Water","category":"Health","target":"Daily"}[/ADD_HABIT]

        3. Calendar Event:
        [CALENDAR_EVENT]{"title":"Meeting","date":"${todayStr}","endDate":null,"color":"#3b82f6"}[/CALENDAR_EVENT]

        4. Create Note / Journal Entry:
        [ADD_NOTE]{"title":"Meeting Notes","content":"Discussed project roadmap","category":"General"}[/ADD_NOTE]

        5. Log Sleep Entry:
        [ADD_SLEEP]{"date":"${todayStr}","hours":8,"minutes":0,"sleep_time":"23:00","wake_time":"07:00","quality":"Good","notes":""}[/ADD_SLEEP]

        6. Log Workout / Gym Routine:
        [ADD_WORKOUT]{"title":"Morning Run","category":"Cardio","duration_mins":45,"calories":350,"notes":""}[/ADD_WORKOUT]

        7. Log Body Stats / Weight:
        [ADD_BODY_STATS]{"weight":75,"target_weight":70,"protein":120,"hydration":2.5}[/ADD_BODY_STATS]

        Output the required action tag(s) alongside your natural language text confirmation ONLY when the user explicitly commands a record/add action.
      `;
      
      let responseText = "";

      if (effectiveProvider === 'groq') {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
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
            const model = genAI.getGenerativeModel({ model: mName, systemInstruction: systemPrompt });
            result = await model.generateContent(userMsgText);
            if (result) break;
          } catch (e) {
            lastErr = e;
          }
        }
        if (!result) throw lastErr || new Error("All Gemini models failed.");
        responseText = result.response.text();
      }
      
      let finalReply = responseText;

      // Parse AI Action Tags silently without firing intrusive UI toasts during conversation
      // 1. Parse CALENDAR_EVENT
      const calendarMatches = [...responseText.matchAll(/\[CALENDAR_EVENT\](.*?)\[\/CALENDAR_EVENT\]/gs)];
      if (calendarMatches.length > 0) {
        const newEvents = [];
        for (const match of calendarMatches) {
          try {
            const data = JSON.parse(match[1]);
            const res = await fetch(getApiUrl('/api/calendar'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                title: data.title || 'AI Event',
                date: data.date || todayStr,
                end_date: data.endDate || null,
                color: data.color || '#3b82f6',
                status: 'upcoming'
              })
            });
            if (res.ok) {
              const saved = await res.json();
              newEvents.push(saved);
            }
            finalReply = finalReply.replace(match[0], '').trim();
          } catch (err) {
            console.error("Failed to parse calendar event JSON", err);
          }
        }
        if (newEvents.length > 0) {
          setCalendarEvents(prev => [...newEvents, ...prev]);
        }
      }

      // 2. Parse ADD_HABIT
      const habitMatches = [...responseText.matchAll(/\[ADD_HABIT\](.*?)\[\/ADD_HABIT\]/gs)];
      if (habitMatches.length > 0) {
        const addedHabits = [];
        for (const match of habitMatches) {
          try {
            const data = JSON.parse(match[1]);
            const res = await fetch(getApiUrl('/api/habits'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                label: data.label || 'New Habit',
                category: data.category || 'General',
                target: data.target || 'Daily'
              })
            });
            if (res.ok) {
              const saved = await res.json();
              addedHabits.push(saved);
            }
            finalReply = finalReply.replace(match[0], '').trim();
          } catch (err) {
            console.error("Failed to parse habit JSON", err);
          }
        }
        if (addedHabits.length > 0) {
          setHabits(prev => [...prev, ...addedHabits.map(h => ({
            id: h.id, title: h.label, category: h.category, streak: h.streak, target: h.target || '', checkedToday: false
          }))]);
        }
      }

      // 3. Parse ADD_TRANSACTION
      const txMatches = [...responseText.matchAll(/\[ADD_TRANSACTION\](.*?)\[\/ADD_TRANSACTION\]/gs)];
      if (txMatches.length > 0) {
        for (const match of txMatches) {
          try {
            const data = JSON.parse(match[1]);
            const res = await fetch(getApiUrl('/api/transactions'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                title: data.title || 'Transaction',
                amount: Number(data.amount) || 0,
                type: data.type || 'spend',
                category: data.category || 'General',
                date: data.date || todayStr
              })
            });
            if (res.ok) {
              const saved = await res.json();
              setTransactions(prev => [saved, ...prev]);
            }
            finalReply = finalReply.replace(match[0], '').trim();
          } catch (err) {
            console.error("Failed to parse transaction JSON", err);
          }
        }
      }

      // 4. Parse ADD_NOTE
      const noteMatches = [...responseText.matchAll(/\[ADD_NOTE\](.*?)\[\/ADD_NOTE\]/gs)];
      if (noteMatches.length > 0) {
        for (const match of noteMatches) {
          try {
            const data = JSON.parse(match[1]);
            const res = await fetch(getApiUrl('/api/notes'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                title: data.title || 'AI Note',
                content: data.content || '',
                category: data.category || 'General',
                share_with_ai: true
              })
            });
            if (res.ok) {
              const saved = await res.json();
              setNotesList(prev => [saved, ...prev]);
            }
            finalReply = finalReply.replace(match[0], '').trim();
          } catch (err) {
            console.error("Failed to parse note JSON", err);
          }
        }
      }

      // 5. Parse ADD_SLEEP
      const sleepMatches = [...responseText.matchAll(/\[ADD_SLEEP\](.*?)\[\/ADD_SLEEP\]/gs)];
      if (sleepMatches.length > 0) {
        for (const match of sleepMatches) {
          try {
            const data = JSON.parse(match[1]);
            await fetch(getApiUrl('/api/sleep'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                date: data.date || todayStr,
                hours: Number(data.hours) || 8,
                minutes: Number(data.minutes) || 0,
                sleep_time: data.sleep_time || '23:00',
                wake_time: data.wake_time || '07:00',
                quality: data.quality || 'Good',
                notes: data.notes || ''
              })
            });
            finalReply = finalReply.replace(match[0], '').trim();
          } catch (err) {
            console.error("Failed to parse sleep JSON", err);
          }
        }
      }

      // 6. Parse ADD_WORKOUT
      const workoutMatches = [...responseText.matchAll(/\[ADD_WORKOUT\](.*?)\[\/ADD_WORKOUT\]/gs)];
      if (workoutMatches.length > 0) {
        for (const match of workoutMatches) {
          try {
            const data = JSON.parse(match[1]);
            await fetch(getApiUrl('/api/fitness?type=workouts'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                title: data.title || 'Workout',
                category: data.category || 'General',
                duration_mins: Number(data.duration_mins) || 30,
                calories: Number(data.calories) || 200,
                notes: data.notes || '',
                date: todayStr
              })
            });
            finalReply = finalReply.replace(match[0], '').trim();
          } catch (err) {
            console.error("Failed to parse workout JSON", err);
          }
        }
      }

      // 7. Parse ADD_BODY_STATS
      const bodyMatches = [...responseText.matchAll(/\[ADD_BODY_STATS\](.*?)\[\/ADD_BODY_STATS\]/gs)];
      if (bodyMatches.length > 0) {
        for (const match of bodyMatches) {
          try {
            const data = JSON.parse(match[1]);
            await fetch(getApiUrl('/api/fitness?type=body-stats'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                weight: Number(data.weight) || 0,
                target_weight: Number(data.target_weight) || 0,
                protein: Number(data.protein) || 0,
                hydration: Number(data.hydration) || 0,
                date: todayStr
              })
            });
            finalReply = finalReply.replace(match[0], '').trim();
          } catch (err) {
            console.error("Failed to parse body stats JSON", err);
          }
        }
      }

      // 8. Clean up all residual action tags, markdown code blocks, or raw JSON text from final chat reply
      finalReply = finalReply
        .replace(/\[[A-Z_]+\][\s\S]*?\[\/[A-Z_]+\]/g, '')
        .replace(/```json[\s\S]*?```/gi, '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/\{[\s\S]*?"(title|amount|label|weight)"[\s\S]*?\}/g, '')
        .trim();

      if (!finalReply) {
        finalReply = "Done! I've updated that for you.";
      }
      
      const aiMsg = { id: Date.now() + 1, sender: 'ai', text: finalReply, time: nowTime };
      setAiMessages(prev => prev.map(m => m.id === 'loading' ? aiMsg : m));
      
      fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify([newMsg, aiMsg])
      }).catch(err => console.error(err));
      
    } catch (error) {
      console.error("AI API Error:", error);
      let errorText = `Error calling API: ${error.message}`;
      const errStr = error?.message?.toLowerCase() || '';
      if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('rate limit')) {
        errorText = "I'm temporarily experiencing high traffic right now! ⚡ You can also enter your own free Gemini or Groq API key in Settings & Profile for unlimited instant responses.";
      }
      const aiMsg = { id: Date.now() + 1, sender: 'ai', text: errorText, time: nowTime };
      setAiMessages(prev => prev.map(m => m.id === 'loading' ? aiMsg : m));
      
      fetch(getApiUrl('/api/chat'), {
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
      const res = await fetch(getApiUrl('/api/transactions'), {
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
            date: todayKey(userProfile.timezone)
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
              <Sparkles size={22} color="var(--accent-text)" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                LIFE <span className="serif-italic">AGENT</span>
              </h1>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>Personal AI Life & Growth Companion</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="landing-theme-controls" style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <CustomSelect 
                value={themeColor || 'blue'}
                onChange={(e) => {
                  safeStorage.setItem('themeColor', e.target.value);
                  document.documentElement.setAttribute('data-color-theme', e.target.value);
                  window.dispatchEvent(new Event('storage'));
                }} 
                style={{ padding: '7px 14px', borderRadius: '40px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 600, width: '170px' }}
                options={[
                  { value: "blue", label: "🔵 Classic Blue" },
                  { value: "professional", label: "⚫ Black & White" },
                  { value: "pink", label: "🌸 Vibrant Pink" },
                  { value: "neon", label: "⚡ Neon Tech" },
                  { value: "emerald", label: "🌿 Emerald" }
                ]}
              />

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
            </div>

            {token ? (
              <button 
                className="blue-btn" 
                style={{ padding: '9px 22px', fontSize: '0.9rem' }}
                onClick={() => navigate('dashboard', '/dashboard')}
              >
                Go to Dashboard <ArrowRight size={16} />
              </button>
            ) : (
              <button 
                className="blue-btn" 
                style={{ padding: '9px 22px', fontSize: '0.9rem' }}
                onClick={() => { setWaitlistSuccess(false); navigate('auth', '/auth'); }}
              >
                Sign Up <ArrowRight size={16} />
              </button>
            )}
          </div>
        </nav>
      )}

      {/* LANDING PAGE (Personal AI Operating System at /) */}
      {currentPage === 'landing' && (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
          {/* HERO SECTION */}
          <section className="animate-entrance" style={{ textAlign: 'center', padding: '60px 0 36px' }}>

            <h1 style={{ fontSize: '3.8rem', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2px', marginBottom: '22px', color: 'var(--text-main)' }}>
              Your Life Connected with Your Personal AI Agent
            </h1>

            <p style={{ maxWidth: '780px', margin: '0 auto 36px', fontSize: '1.25rem', color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 400 }}>
              Track your habits, money, sleep, workouts, calendar, notes and daily progress — while your AI understands everything in one place.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '32px' }}>
              <button 
                className="blue-btn" 
                style={{ fontSize: '1.05rem', padding: '14px 36px', borderRadius: '14px', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.35)' }} 
                onClick={() => { setAuthMode('signup'); navigate('auth', '/auth'); }}
              >
                Get Started Free <ArrowRight size={18} />
              </button>
            </div>

          </section>

          {/* INTERACTIVE 80% PRODUCT PREVIEW SECTION */}
          <section className="scroll-swipe-up scroll-delay-1" style={{ margin: '30px auto 80px', width: '100%', maxWidth: '1100px' }}>
            <div 
              onMouseEnter={() => setIsHoveringMockup(true)}
              onMouseLeave={() => setIsHoveringMockup(false)}
              className="glass-card hero-mockup-frame scroll-swipe-up scroll-delay-2" 
            >
              {/* Window Titlebar Header */}
              <div className="hero-mockup-titlebar" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: '1px solid var(--border-color)',
                background: 'rgba(0, 0, 0, 0.25)',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }} />
                  <span style={{ marginLeft: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace', opacity: 0.85 }}>
                    LifeAgent-Dashboard
                  </span>
                </div>

                {/* Interactive Tabs Row */}
                <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', padding: '2px', scrollbarWidth: 'none', position: 'relative' }}>
                  {[
                    { id: 'Money', label: 'Money', icon: DollarSign },
                    { id: 'Sleep', label: 'Sleep', icon: SleepIcon },
                    { id: 'Calendar', label: 'Calendar', icon: Calendar },
                    { id: 'Notes', label: 'Notes', icon: FileText },
                    { id: 'Gym', label: 'Gym', icon: Dumbbell },
                    { id: 'AI', label: 'AI', icon: Bot },
                    { id: 'Habits', label: 'Habits', icon: CheckCircle2 },
                    { id: 'Analytics', label: 'Analytics', icon: BarChart3 },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = previewTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        ref={el => (tabRefs.current[tab.id] = el)}
                        onClick={() => handlePreviewTabClick(tab.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          borderRadius: '10px',
                          fontSize: '0.85rem',
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? '#ffffff' : 'var(--text-muted)',
                          background: isActive ? 'var(--accent-blue)' : 'transparent',
                          boxShadow: isActive ? '0 4px 18px rgba(59, 130, 246, 0.45)' : 'none',
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          zIndex: 2,
                          transition: 'all 0.4s ease',
                          whiteSpace: 'nowrap',
                          transform: isActive ? 'scale(1.03)' : 'scale(1)',
                          flexShrink: 0
                        }}
                      >
                        <Icon size={14} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Display Area */}
              <div className="hero-mockup-body">
                
                {/* 1. MONEY TAB MOCK */}
                {previewTab === 'Money' && (
                  <div className="animate-tab-matter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="hero-grid-responsive">
                      <div className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Monthly Income</div>
                        <div className="hero-stat-amount" style={{ fontSize: '1.7rem', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>+$6,450.00</div>
                        <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>↑ 14% vs last month</div>
                      </div>
                      <div className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Expenses</div>
                        <div className="hero-stat-amount" style={{ fontSize: '1.7rem', fontWeight: 800, color: '#ef4444', marginTop: '6px' }}>-$1,820.40</div>
                        <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>↓ 8% spent vs budget</div>
                      </div>
                      <div className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Net Savings Rate</div>
                        <div className="hero-stat-amount" style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '6px' }}>71.7%</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>+$4,629.60 saved</div>
                      </div>
                    </div>

                    <div className="glass-card" style={{ padding: '20px', borderRadius: '16px' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Recent Transactions & AI Categorization</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                          { title: 'Software Subscription (Autonomous AI & Vercel)', category: 'Tech & Dev', amount: '-$45.00', date: 'Today', type: 'expense' },
                          { title: 'Client Retainer Payment', category: 'Income', amount: '+$3,200.00', date: 'Yesterday', type: 'income' },
                          { title: 'Organic Whole Foods & Grocery', category: 'Health & Food', amount: '-$124.50', date: '2 days ago', type: 'expense' },
                          { title: 'Gym Membership & Recovery', category: 'Fitness', amount: '-$85.00', date: '3 days ago', type: 'expense' },
                        ].slice(0, 3).map((tx, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: tx.type === 'income' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <DollarSign size={16} color={tx.type === 'income' ? '#10b981' : '#ef4444'} />
                              </div>
                              <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{tx.title}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.category} • {tx.date}</div>
                              </div>
                            </div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: tx.type === 'income' ? '#10b981' : 'var(--text-main)' }}>
                              {tx.amount}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. SLEEP TAB MOCK */}
                {previewTab === 'Sleep' && (
                  <div className="animate-tab-matter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'stretch' }}>
                      <div className="glass-card" style={{ padding: '22px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sleep Quality & Duration</span>
                            <span className="pill-tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.75rem', border: 'none' }}>🌟 Excellent</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '14px' }}>
                            <span style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--accent-blue)' }}>8h 15m</span>
                            <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>Avg Duration</span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>Bedtime 11:00 PM — Woke up at 07:15 AM</p>
                        </div>
                        <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--bg-card)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bed Time</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>11:00 PM</div>
                          </div>
                          <div style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--bg-card)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Wake Time</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>07:15 AM</div>
                          </div>
                          <div style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--bg-card)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rating</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>Good</div>
                          </div>
                        </div>
                      </div>

                      <div className="glass-card" style={{ padding: '22px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '4px' }}>Recent Sleep Logs</div>
                        {[
                          { date: 'Today', duration: '8h 15m', quality: '🌟 Excellent', time: '11:00 PM - 07:15 AM' },
                          { date: 'Yesterday', duration: '7h 45m', quality: '😊 Good', time: '11:30 PM - 07:15 AM' },
                          { date: '2 days ago', duration: '8h 00m', quality: '😊 Good', time: '11:00 PM - 07:00 AM' },
                        ].map((log, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                            <div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>{log.duration} • <span style={{ color: '#10b981', fontSize: '0.8rem' }}>{log.quality}</span></div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{log.date} ({log.time})</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. CALENDAR TAB MOCK */}
                {previewTab === 'Calendar' && (
                  <div className="animate-tab-matter" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Upcoming Events & Reminders</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Plan, track, and never miss what matters</div>
                      </div>
                      <div className="pill-tag" style={{ background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)', border: 'none', fontSize: '0.8rem' }}>
                        + Add Event
                      </div>
                    </div>

                    {/* This Week */}
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📅 This Week</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { day: 'Mon, Jul 28', title: '🤖 Attend AI Strategy Meeting', tag: 'Work', color: 'var(--accent-blue)' },
                          { day: 'Wed, Jul 30', title: '🚗 Car Servicing & Oil Change', tag: 'Personal', color: '#f59e0b' },
                          { day: 'Fri, Aug 1', title: '💰 Freelance Invoice Due', tag: 'Finance', color: '#10b981' },
                        ].map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-muted)', width: '90px', flexShrink: 0 }}>
                              {item.day}
                            </div>
                            <div style={{ width: '4px', height: '32px', borderRadius: '2px', background: item.color, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.title}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.tag}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. NOTES TAB MOCK */}
                {previewTab === 'Notes' && (
                  <div className="animate-tab-matter" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div className="glass-card" style={{ padding: '22px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FileText size={18} color="var(--accent-blue)" />
                          <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>Goals of 2026</span>
                        </div>
                        <span className="pill-tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.75rem', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div className="pulse-dot-container"><div className="pulse-dot-ring"></div><div className="pulse-dot-core"></div></div>
                          AI Connected
                        </span>
                      </div>

                      <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.75 }}>
                        <p style={{ marginBottom: '10px' }}>• Earn my first 10k</p>
                        <p style={{ marginBottom: '10px' }}>• Grow business by 3x</p>
                        <p style={{ marginBottom: '10px' }}>• Gift new mobile to mom and new earbuds to dad</p>
                      </div>

                      <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '12px', background: 'var(--accent-blue-dim)', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Sparkles size={16} color="var(--accent-blue)" />
                        <span style={{ fontSize: '0.82rem', color: 'var(--accent-blue-light)', fontWeight: 500 }}>
                          AI Insight: 3 key 2026 milestones logged. Your income and business metrics are tracked live!
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. GYM TAB MOCK */}
                {previewTab === 'Gym' && (
                  <div className="animate-tab-matter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                      <div className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Session</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '4px' }}>Push Workout A</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', marginTop: '4px' }}>55 mins • 485 kcal burned</div>
                      </div>
                      <div className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Session Volume</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '4px' }}>12,450 kg</div>
                        <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>⭐ New Personal Record</div>
                      </div>
                      <div className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Daily Protein Goal</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>168g / 180g</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>93% target complete</div>
                      </div>
                    </div>

                    <div className="glass-card" style={{ padding: '20px', borderRadius: '16px' }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '12px' }}>Exercise Sets & Progress</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                          { name: 'Barbell Bench Press', sets: '4 sets × 8 reps', weight: '100 kg', note: 'PR achieved 🔥' },
                          { name: 'Overhead Shoulder Press', sets: '3 sets × 10 reps', weight: '65 kg', note: 'Clean form' },
                          { name: 'Incline Dumbbell Flyes', sets: '3 sets × 12 reps', weight: '28 kg', note: 'Hypertrophy focus' },
                        ].map((ex, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                            <div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{ex.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ex.sets} • {ex.note}</div>
                            </div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{ex.weight}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. ANALYTICS TAB MOCK */}
                {previewTab === 'Analytics' && (
                  <div className="animate-tab-matter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Habit Consistency</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-blue)', marginTop: '4px' }}>94%</div>
                        <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>24 day active streak</div>
                      </div>
                      <div className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Monthly Income / Savings</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>+$6,450.00</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>71.7% Net Savings Rate</div>
                      </div>
                      <div className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Weekly Deep Work</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#8b5cf6', marginTop: '4px' }}>42.5 hrs</div>
                        <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>↑ 6 hrs vs last week</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                      {/* Executive Telemetry Graph */}
                      <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>30-Day Executive Telemetry</div>
                        <div style={{ display: 'flex', height: '110px', alignItems: 'flex-end', gap: '6px', paddingTop: '10px' }}>
                          {[65, 78, 82, 90, 85, 88, 94, 92, 96, 89, 94, 98].map((val, idx) => (
                            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                              <div style={{ width: '100%', height: `${val}%`, background: idx === 11 ? 'var(--accent-blue)' : 'rgba(59, 130, 246, 0.3)', borderRadius: '6px' }} />
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Habit & Performance Telemetry (Peak at 98%)</div>
                      </div>

                      {/* Money & Cash Flow Graph */}
                      <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>Money & Cash Flow Graph</span>
                          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>+$4,629.60 Saved</span>
                        </div>
                        <div style={{ display: 'flex', height: '110px', alignItems: 'flex-end', gap: '10px', paddingTop: '10px' }}>
                          {[
                            { month: 'Jan', inc: 70, exp: 30 },
                            { month: 'Feb', inc: 80, exp: 35 },
                            { month: 'Mar', inc: 85, exp: 40 },
                            { month: 'Apr', inc: 75, exp: 32 },
                            { month: 'May', inc: 92, exp: 38 },
                            { month: 'Jun', inc: 100, exp: 42 },
                          ].map((m, idx) => (
                            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                              <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', width: '100%', height: '100%' }}>
                                <div style={{ flex: 1, height: `${m.inc}%`, background: '#10b981', borderRadius: '4px 4px 0 0' }} />
                                <div style={{ flex: 1, height: `${m.exp}%`, background: '#ff5252', borderRadius: '4px 4px 0 0', opacity: 0.8 }} />
                              </div>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{m.month}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Monthly Income (Green) vs Expenses (Red)</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. AI TAB MOCK */}
                {previewTab === 'AI' && (
                  <div className="animate-tab-matter" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="glass-card" style={{ padding: '18px', borderRadius: '16px', background: 'var(--bg-card)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Bot size={16} color="var(--accent-text)" />
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Personal AI Assistant</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ alignSelf: 'flex-end', background: 'var(--accent-blue)', color: 'var(--accent-text)', padding: '10px 14px', borderRadius: '14px 14px 2px 14px', fontSize: '0.88rem', maxWidth: '80%' }}>
                          Audit my day: check sleep recovery, push workout volume, and remaining daily budget.
                        </div>
                        <div style={{ alignSelf: 'flex-start', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '14px', borderRadius: '14px 14px 14px 2px', fontSize: '0.88rem', maxWidth: '90%', lineHeight: 1.6 }}>
                          <p style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--accent-blue-light)' }}>🤖 Executive Daily Audit:</p>
                          <p>• <strong>Sleep</strong>: 8h 12m (94% optimal score) — Excellent recovery state.</p>
                          <p>• <strong>Gym</strong>: Push Workout A logged with 12,450 kg volume (Bench PR set!).</p>
                          <p>• <strong>Money</strong>: Spent $18.50 today — $26.50 under your daily budget.</p>
                          <p style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>💡 Everything is tracking on schedule for your weekly goals!</p>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                      <Bot size={16} color="var(--text-muted)" />
                      <input type="text" readOnly value="Ask AI to log expense, track workout, or optimize schedule... (⌘K)" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', width: '100%', outline: 'none' }} />
                      <button className="blue-btn" style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '8px' }}>Send</button>
                    </div>
                  </div>
                )}

                {/* 8. HABITS TAB MOCK */}
                {previewTab === 'Habits' && (
                  <div className="animate-tab-matter" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Daily Habit Checklist</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>4 of 5 Habits Completed Today (80%)</div>
                      </div>
                      <div className="pill-tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'none', fontSize: '0.8rem' }}>
                        🔥 24 Day Streak Active
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        { title: 'Morning Sunlight & Hydration Protocol', category: 'Health', streak: '28 day streak', checked: true },
                        { title: 'Coding / DSA', category: 'Productivity', streak: '44 day streak', checked: true },
                        { title: 'Push Day', category: 'Fitness', streak: '12 day streak', checked: true },
                        { title: 'No Junk Food & Hit 180g Protein Target', category: 'Nutrition', streak: '8 day streak', checked: true },
                        { title: 'Evening Book Reading (30 mins)', category: 'Mindset', streak: '15 day streak', checked: false },
                      ].slice(0, 3).map((habit, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: habit.checked ? 'var(--accent-blue)' : 'transparent', border: habit.checked ? 'none' : '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {habit.checked && <Check size={14} color="var(--accent-text)" />}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 600, textDecoration: habit.checked ? 'line-through' : 'none', opacity: habit.checked ? 0.85 : 1 }}>{habit.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{habit.category}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: habit.checked ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
                            🔥 {habit.streak}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </section>

          {/* THREE PILLAR FEATURE CARDS */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '80px' }}>
            <div className="glass-card motion-card scroll-swipe-up" style={{ padding: '30px', borderRadius: '20px' }}>
              <div style={{ background: 'var(--accent-blue-dim)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Activity size={24} color="var(--accent-blue)" />
              </div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '10px' }}>Health Precision Engine</h4>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                Glanceable biometrics, workout logging, sleep stages, and progress telemetry engineered for peak physical and mental clarity.
              </p>
            </div>

            <div className="glass-card motion-card scroll-swipe-up scroll-delay-1" style={{ padding: '30px', borderRadius: '20px' }}>
              <div style={{ background: 'var(--accent-blue-dim)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Zap size={24} color="var(--accent-blue)" />
              </div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '10px' }}>High-Velocity Command Palette</h4>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                Instant keyboard commands (`⌘K` / `Ctrl+J`), zero lag workspace switching, and high-velocity workflow automation.
              </p>
            </div>

            <div className="glass-card motion-card scroll-swipe-up scroll-delay-2" style={{ padding: '30px', borderRadius: '20px' }}>
              <div style={{ background: 'var(--accent-blue-dim)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Bot size={24} color="var(--accent-blue)" />
              </div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '10px' }}>Personal AI Intelligence</h4>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                Sleek dark/light typography paired with a personal AI companion that understands your notes, budget, and habits in unison.
              </p>
            </div>
          </section>

          {/* BOTTOM CTA CARD */}
          <div className="glass-card scroll-swipe-up scroll-delay-3" style={{ padding: '50px 30px', textAlign: 'center', borderRadius: '24px', border: '1px solid var(--border-color)', marginBottom: '40px' }}>
            <h3 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '14px', letterSpacing: '-1px' }}>
              Ready to connect your life with your Personal AI Agent?
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '28px', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 28px' }}>
              Start organizing your habits, money, sleep, workouts, and calendar with intelligence today.
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                className="blue-btn" 
                style={{ fontSize: '1.1rem', padding: '16px 36px', borderRadius: '14px' }} 
                onClick={() => { setAuthMode('signup'); navigate('auth', '/auth'); }}
              >
                Get Started Free <ArrowRight size={18} />
              </button>
            </div>
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
                  We have saved <strong>{waitlistEmail}</strong> directly to our waitlist. We will notify you the moment early access invites open up!
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
                <div style={{ background: 'var(--accent-blue)', color: 'var(--accent-text)', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.4rem' }}>
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

      {/* AUTHENTICATION & PASSWORD RESET PAGE (At /auth) */}
      {currentPage === 'auth' && (
        <main className="animate-entrance" style={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', padding: '40px', borderRadius: '24px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '440px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
            
            {/* Header Title */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{
                background: 'var(--accent-blue)', width: '48px', height: '48px', borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
              }}>
                <Lock size={24} color="var(--accent-text)" />
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                {authMode === 'forgot' 
                  ? 'Reset Password' 
                  : (authMode === 'login' ? 'Welcome Back' : 'Create Account')}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '8px' }}>
                {authMode === 'forgot'
                  ? (resetStep === 1 
                      ? 'Enter your registered email or username to get a reset code.' 
                      : (resetStep === 2 
                          ? 'Enter the 6-digit reset code sent to your email.' 
                          : 'Create your new password below.'))
                  : (authMode === 'login' ? 'Sign in to access your AI workspace.' : 'Sign up to get your Personal AI Assistant.')}
              </p>
            </div>

            {/* Banners & Messages */}
            {authError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={18} /> {authError}
              </div>
            )}

            {resetSuccessMsg && (
              <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', color: '#10b981', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} /> {resetSuccessMsg}
              </div>
            )}

            {/* FORGOT / RESET PASSWORD FORM */}
            {authMode === 'forgot' ? (
              resetStep === 1 ? (
                /* Step 1: Request Code */
                <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Email Address or Username</label>
                    <input 
                      type="text" 
                      required 
                      value={resetEmailOrHandle} 
                      onChange={e => setResetEmailOrHandle(e.target.value)} 
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }} 
                      placeholder="example@gmail.com" 
                    />
                  </div>

                  <button type="submit" className="blue-btn" disabled={authLoading} style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '8px', opacity: authLoading ? 0.7 : 1 }}>
                    {authLoading ? 'Sending Reset Code...' : 'Get Reset Code'}
                  </button>
                </form>
              ) : resetStep === 2 ? (
                /* Step 2: Verify 6-Digit Code */
                <form onSubmit={handleVerifyResetCode} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>6-Digit Reset Code</label>
                    <input 
                      type="text" 
                      required 
                      value={resetCode} 
                      onChange={e => setResetCode(e.target.value)} 
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', letterSpacing: '4px', fontFamily: 'monospace', fontSize: '1.2rem', textAlign: 'center' }} 
                      placeholder="123456" 
                    />
                  </div>

                  <button type="submit" className="blue-btn" disabled={authLoading} style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '8px', opacity: authLoading ? 0.7 : 1 }}>
                    {authLoading ? 'Verifying Code...' : 'Verify Code'}
                  </button>
                </form>
              ) : (
                /* Step 3: Enter New Password Twice & Save */
                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>New Password</label>
                    <input 
                      type="password" 
                      required 
                      value={resetNewPassword} 
                      onChange={e => setResetNewPassword(e.target.value)} 
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }} 
                      placeholder="Enter new password..." 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Confirm New Password</label>
                    <input 
                      type="password" 
                      required 
                      value={resetConfirmPassword} 
                      onChange={e => setResetConfirmPassword(e.target.value)} 
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }} 
                      placeholder="Re-enter new password to confirm..." 
                    />
                  </div>

                  <button type="submit" className="blue-btn" disabled={authLoading} style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '8px', opacity: authLoading ? 0.7 : 1 }}>
                    {authLoading ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </form>
              )
            ) : (
              /* LOGIN / SIGNUP FORM */
              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {authMode === 'signup' && (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Full Name</label>
                      <input type="text" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }} placeholder="Enter your name..." />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Handle / Username</label>
                      <input type="text" value={authForm.handle} onChange={e => setAuthForm({...authForm, handle: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }} placeholder="Enter your handle..." />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Phone (Optional)</label>
                      <input type="tel" value={authForm.phone} onChange={e => setAuthForm({...authForm, phone: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }} placeholder="Enter your phone number..." />
                    </div>
                  </>
                )}
                
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Email Address or Username</label>
                  <input type="text" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }} placeholder="Enter email or username..." />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Password</label>
                  <input type="password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }} placeholder="••••••••" />
                  
                  {authMode === 'login' && (
                    <div style={{ textAlign: 'right', marginTop: '6px' }}>
                      <button 
                        type="button"
                        onClick={() => { setAuthMode('forgot'); setResetStep(1); setAuthError(''); setResetSuccessMsg(''); }}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', padding: '2px 0' }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>

                <button type="submit" className="blue-btn" disabled={authLoading} style={{ width: '100%', padding: '14px', fontSize: '1.02rem', marginTop: '8px', opacity: authLoading ? 0.7 : 1 }}>
                  {authLoading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
                </button>
              </form>
            )}

            {/* Footer Navigation Link */}
            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.92rem', color: 'var(--text-muted)' }}>
              {authMode === 'forgot' ? (
                <button 
                  onClick={() => { setAuthMode('login'); setAuthError(''); setResetSuccessMsg(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  ← Back to Sign In
                </button>
              ) : (
                <>
                  {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <button 
                    onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }} 
                    style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                  </button>
                </>
              )}
            </div>
          </div>
        </main>
      )}

      {/* Redirect unauthenticated users trying to access /dashboard */}
      {currentPage === 'dashboard' && !isAuthenticated && (
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
          <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', maxWidth: '400px' }}>
            <Lock size={40} color="var(--accent-blue)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }}>Sign in Required</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>You need to sign in to access your dashboard.</p>
            <button className="blue-btn" style={{ padding: '12px 32px' }} onClick={() => navigate('auth', '/auth')}>
              <LogIn size={18} /> Sign In
            </button>
          </div>
        </main>
      )}

      {/* MERABAAZAR / AUTONOMOUS AI INSPIRED 2-COLUMN SIDEBAR WORKSPACE DASHBOARD (At /dashboard) */}
      {currentPage === 'dashboard' && isAuthenticated && (
        <div className="animate-entrance" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-main)' }}>
          
          {/* FIXED / STICKY LEFT SIDEBAR THAT NEVER SCROLLS */}
          <aside className="desktop-sidebar" style={{
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
                  <Sparkles size={18} color="var(--accent-text)" />
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
                    background: activeTab === 'ai' ? 'var(--accent-blue-dim)' : 'transparent',
                    color: activeTab === 'ai' ? 'var(--accent-blue)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'ai' ? 700 : 500, cursor: 'pointer',
                    fontSize: '0.92rem', transition: 'all 0.2s', textAlign: 'left'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Bot size={18} /> {aiName} Mode
                  </span>
                  <span style={{ background: 'var(--accent-blue)', color: 'var(--accent-text)', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '20px' }}>NEW</span>
                </button>

                <button 
                  onClick={() => setActiveTab('today')}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: 'none',
                    background: activeTab === 'today' ? 'var(--accent-blue-dim)' : 'transparent',
                    color: activeTab === 'today' ? 'var(--accent-blue)' : 'var(--text-muted)',
                    fontSize: '0.95rem', fontWeight: activeTab === 'today' ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                  }}
                >
                  <Clock size={18} /> Today
                </button>

                <button 
                  onClick={() => setActiveTab('habits')}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: 'none',
                    background: activeTab === 'habits' ? 'var(--accent-blue-dim)' : 'transparent',
                    color: activeTab === 'habits' ? 'var(--accent-blue)' : 'var(--text-muted)',
                    fontSize: '0.95rem', fontWeight: activeTab === 'habits' ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                  }}
                >
                  <CheckCircle2 size={18} /> Daily Works
                </button>

                <button
                  onClick={() => setActiveTab('water')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '12px', border: 'none',
                    background: activeTab === 'water' ? 'var(--accent-blue-dim)' : 'transparent',
                    color: activeTab === 'water' ? 'var(--accent-blue)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'water' ? 700 : 500, cursor: 'pointer',
                    fontSize: '0.92rem', transition: 'all 0.2s', textAlign: 'left'
                  }}
                >
                  <Droplet size={18} /> Drink Water
                </button>

                <button
                  onClick={() => setActiveTab('notes')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '12px', border: 'none',
                    background: activeTab === 'notes' ? 'var(--accent-blue-dim)' : 'transparent',
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
                    background: activeTab === 'calendar' ? 'var(--accent-blue-dim)' : 'transparent',
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
                    background: activeTab === 'finance' ? 'var(--accent-blue-dim)' : 'transparent',
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
                    background: activeTab === 'body' ? 'var(--accent-blue-dim)' : 'transparent',
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
                    background: activeTab === 'sleep' ? 'var(--accent-blue-dim)' : 'transparent',
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
                    background: activeTab === 'analytics' ? 'var(--accent-blue-dim)' : 'transparent',
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
                  background: activeTab === 'settings' ? 'var(--accent-blue-dim)' : 'transparent',
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
          <section style={{ flex: 1, height: '100vh', padding: '24px 16px', overflowY: activeTab === 'ai' ? 'hidden' : 'auto' }}>
            
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                {activeTab === 'today' ? (
                  <>
                    <h2 style={{ fontSize: '1.9rem', fontWeight: 900, letterSpacing: '-0.5px' }}>
                      Hey {userProfile.handle ? `@${userProfile.handle.replace('@', '')}` : (userProfile.name ? userProfile.name.split(' ')[0] : 'User')} – welcome!
                    </h2>

                  </>
                ) : (
                  <h2 style={{ fontSize: '1.9rem', fontWeight: 900, letterSpacing: '-0.5px', color: 'var(--text-main)' }}>
                    {activeTab === 'today' ? "Today's Routine" :
                     activeTab === 'habits' ? 'Daily Works & Habits' :
                     (activeTab === 'gym' || activeTab === 'body') ? 'Body & Gym' : 
                     activeTab === 'sleep' ? 'Sleep & Recovery' : 
                     activeTab === 'water' ? 'Water Hydration' :
                     activeTab === 'finance' ? 'Finance & Money' : 
                     activeTab === 'notes' ? 'Notes & Diary' : 
                     activeTab === 'calendar' ? 'Calendar' :
                     activeTab === 'analytics' ? 'Master Analytics' :
                     activeTab === 'settings' ? 'Settings' : 
                     activeTab === 'ai' ? aiName : 'Dashboard'}
                  </h2>
                )}
              </div>

              {!isAiSidePanelOpen && (
                <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {activeTab !== 'ai' && (
                    <button
                      onClick={() => setIsAiSidePanelOpen(!isAiSidePanelOpen)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', borderRadius: '30px',
                        background: isAiSidePanelOpen ? 'var(--accent-blue)' : 'var(--accent-blue-dim)',
                        color: isAiSidePanelOpen ? 'var(--accent-text)' : 'var(--accent-blue)',
                        border: `1px solid ${isAiSidePanelOpen ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                        fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: isAiSidePanelOpen ? '0 0 16px var(--accent-blue-dim)' : 'none'
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
                      display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
                      maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}
                  >
                    <User size={16} color="var(--accent-blue)" /> {userProfile.handle}
                  </span>
                </div>
              )}
            </div>

            {/* Timeframe Dropdown Selector (Hide when on Settings or AI Chat tab) */}
            {(activeTab === 'finance') && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }} ref={timeDropdownRef}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Timeframe:</span>
                  
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
                          onClick={() => { 
                            setTimeRange(opt.id); 
                            setIsTimeMenuOpen(false); 
                          }}
                          style={{ fontWeight: timeRange === opt.id ? 800 : 500 }}
                        >
                          <Calendar size={14} /> {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {timeRange === 'custom' && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '8px' }}>
                      <input 
                        type="date" 
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '20px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} 
                      />
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>-</span>
                      <input 
                        type="date" 
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '20px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} 
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowFinanceForm(true)}
                  className="blue-btn"
                  style={{ padding: '10px 18px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '30px', fontWeight: 700 }}
                >
                  <Plus size={16} /> Record Entry
                </button>
              </div>
            )}

            {(activeTab === 'body') && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <button
                  onClick={() => setIsEditSplitOpen(true)}
                  className="blue-btn"
                  style={{ padding: '10px 18px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '30px', fontWeight: 700 }}
                >
                  + Add Routine
                </button>
              </div>
            )}

            {/* TAB CONTENT HOUSING BOX */}
            <div className="glass-card" style={{ padding: '32px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              
              {/* 0) TODAY DAILY ROUTINE & HABITS CHECKLIST (Ultra-neat & clean UI) */}
              {activeTab === 'today' && (
                <TabErrorBoundary tabName="Today's Routine">
                <div className="animate-entrance">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <h3 style={{ fontSize: '1.55rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Clock size={24} color="var(--accent-blue)" /> Today's Works
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '160px', height: '5px', background: 'var(--bg-card)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                          <div style={{
                            width: `${(todayItems.filter(i => i.checked).length / (todayItems.length || 1)) * 100}%`,
                            height: '100%',
                            background: 'var(--accent-blue)',
                            boxShadow: '0 0 8px rgba(59,130,246,0.4)',
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          {todayItems.filter(i => i.checked).length}/{todayItems.length} done
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button 
                        onClick={handleToggleAllToday}
                        className="blue-btn"
                        style={{
                          padding: '10px 20px', borderRadius: '30px', fontSize: '0.9rem', flexShrink: 0, whiteSpace: 'nowrap'
                        }}
                      >
                        <Check size={18} /> Tick All Today
                      </button>

                      <div style={{ position: 'relative' }} ref={todayConfigDropdownRef}>
                        <button
                          onClick={() => setIsTodayConfigMenuOpen(!isTodayConfigMenuOpen)}
                          title="Configure Today Cards"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '10px 12px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-main)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <MoreVertical size={18} />
                        </button>

                        {isTodayConfigMenuOpen && (
                          <div
                            className="theme-dropdown-menu"
                            style={{
                              right: 0,
                              left: 'auto',
                              top: '100%',
                              marginTop: '6px',
                              minWidth: '240px',
                              padding: '12px',
                              zIndex: 100
                            }}
                          >
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
                              Today Tab Cards
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', borderRadius: '8px' }}>
                              <input
                                type="checkbox"
                                checked={todayWidgetsConfig.showWorkout}
                                onChange={(e) => {
                                  setTodayWidgetsConfig(prev => ({ ...prev, showWorkout: e.target.checked }));
                                }}
                                style={{ cursor: 'pointer', accentColor: 'var(--accent-blue)', width: '16px', height: '16px' }}
                              />
                              <span>🏋️ Workout</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', borderRadius: '8px' }}>
                              <input
                                type="checkbox"
                                checked={todayWidgetsConfig.showProtein}
                                onChange={(e) => {
                                  setTodayWidgetsConfig(prev => ({ ...prev, showProtein: e.target.checked }));
                                }}
                                style={{ cursor: 'pointer', accentColor: 'var(--accent-blue)', width: '16px', height: '16px' }}
                              />
                              <span>🥩 Protein</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', borderRadius: '8px' }}>
                              <input
                                type="checkbox"
                                checked={todayWidgetsConfig.showHydration}
                                onChange={(e) => {
                                  setTodayWidgetsConfig(prev => ({ ...prev, showHydration: e.target.checked }));
                                }}
                                style={{ cursor: 'pointer', accentColor: 'var(--accent-blue)', width: '16px', height: '16px' }}
                              />
                              <span>💧 Hydration</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>


                  {/* Dedicated 'Today Workout & Nutrition Summary' Section */}
                  {(todayWidgetsConfig.showWorkout || todayWidgetsConfig.showProtein || todayWidgetsConfig.showHydration) && (
                    (() => {
                      const hasWorkoutData = Array.isArray(workouts) && workouts.length > 0;
                      const hasProteinSetup = Array.isArray(bodyStats) && bodyStats.some(s => Number(s.target_protein) > 0 || Number(s.protein) > 0);
                      const hasWaterSetup = !!safeStorage.getItem('water_target_goal') && Number(safeStorage.getItem('water_target_goal')) > 0;
                      if (!hasWorkoutData && !hasProteinSetup && !hasWaterSetup) return null;
                      return (
                    <div style={{ background: 'var(--bg-main)', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '24px', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', margin: 0 }}>
                          <Dumbbell size={22} color="var(--accent-blue)" /> Body
                        </h4>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                        {/* a) Today's Scheduled Workout Split */}
                        {todayWidgetsConfig.showWorkout && Array.isArray(workouts) && workouts.length > 0 && (() => {
                          const todayKeyStr = todayKey(userProfile?.timezone);
                          const isDone = Array.isArray(workouts) && workouts.some(w => w.date === todayKeyStr);
                          if (!isDone) return null;
                          const daysEpoch = Math.floor(new Date(todayKeyStr).getTime() / (1000 * 60 * 60 * 24));
                          const splitList = [];
                          const currentTitle = (splitList.length > 0) ? (typeof splitList[Math.abs(daysEpoch) % splitList.length] === 'string' ? splitList[Math.abs(daysEpoch) % splitList.length] : splitList[Math.abs(daysEpoch) % splitList.length]?.name) : 'Workout';

                          return (
                            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
                              <div>

                                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-blue)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  🏋️ {isDone ? (workouts.find(w => w.date === todayKeyStr)?.title || currentTitle) : currentTitle}
                                </div>

                              </div>

                              <div>
                                {isDone ? (
                                  <div style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', padding: '10px 16px', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1px solid var(--border-color)' }}>
                                    <Check size={16} /> Completed Today
                                  </div>
                                ) : (
                                  <button 
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(getApiUrl('/api/fitness?type=workouts'), {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                          body: JSON.stringify({ title: currentTitle, category: 'Strength', duration_mins: 45, calories: 320, notes: `Completed scheduled ${currentTitle}`, date: todayKeyStr })
                                        });
                                        if (res.ok) {
                                          const newW = await res.json();
                                          setWorkouts(prev => [newW, ...(Array.isArray(prev) ? prev : [])]);
                                          showToast(`🎉 ${currentTitle} Completed!`, 'success');
                                        } else {
                                          setWorkouts(prev => [{ title: currentTitle, category: 'Strength', duration_mins: 45, calories: 320, notes: `Completed scheduled ${currentTitle}`, date: todayKeyStr, id: Date.now() }, ...(Array.isArray(prev) ? prev : [])]);
                                          showToast(`🎉 ${currentTitle} Completed!`, 'success');
                                        }
                                      } catch(e) {
                                        setWorkouts(prev => [{ title: currentTitle, category: 'Strength', duration_mins: 45, calories: 320, notes: `Completed scheduled ${currentTitle}`, date: todayKeyStr, id: Date.now() }, ...(Array.isArray(prev) ? prev : [])]);
                                        showToast(`🎉 ${currentTitle} Completed!`, 'success');
                                      }
                                    }}
                                    className="blue-btn"
                                    style={{ width: '100%', padding: '10px 16px', fontSize: '0.88rem', fontWeight: 700, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                  >
                                    <Check size={18} /> Mark Complete Today
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* b) Daily Protein Tracker with Progress Bar */}
                        {todayWidgetsConfig.showProtein && (Array.isArray(bodyStats) && bodyStats.some(s => Number(s.target_protein) > 0 || Number(s.protein) > 0)) && (() => {
                          const latestStat = Array.isArray(bodyStats) && bodyStats.length > 0 ? bodyStats[0] : null;
                          const isToday = latestStat?.date === todayKey(userProfile?.timezone);
                          const protein = isToday ? (Number(latestStat?.protein) || 0) : 0;
                          const targetW = Number(latestStat?.target_weight) || 0;
                          const targetP = Number(latestStat?.target_protein) || 0;
                          const goal = targetP > 0 ? targetP : (targetW > 0 ? Math.round(targetW * 2) : 0);
                          const pct = Math.min(100, Math.max(0, Math.round((protein / goal) * 100)));

                          const handleAddProtein = async (amount) => {
                            try {
                              const safeBodyStats = Array.isArray(bodyStats) ? bodyStats : (bodyStats ? [bodyStats] : []);
                              const todayStr = todayKey(userProfile?.timezone);
                              const todayStat = safeBodyStats.find(s => s && s.date === todayStr) || null;
                              const latestStat = safeBodyStats.length > 0 ? safeBodyStats[0] : null;

                              const currentP = todayStat ? (Number(todayStat.protein) || 0) : (latestStat?.date === todayStr ? (Number(latestStat?.protein) || 0) : 0);
                              const targetW = Number(latestStat?.target_weight) || 0;
                              const targetP = Number(latestStat?.target_protein) || Number(todayStat?.target_protein) || 0;
                              const goal = targetP > 0 ? targetP : (targetW > 0 ? Math.round(targetW * 2) : 0);

                              const newProtein = Math.max(0, currentP + amount);

                              const payload = {
                                date: todayStr,
                                protein: newProtein,
                                target_protein: goal
                              };

                              const tempId = todayStat?.id || Date.now();
                              setBodyStats(prev => {
                                const list = Array.isArray(prev) ? prev : (prev ? [prev] : []);
                                const exists = list.some(s => s && (s.id === tempId || s.date === todayStr));
                                if (exists) {
                                  return list.map(s => (s && (s.id === tempId || s.date === todayStr)) ? { ...s, protein: newProtein, target_protein: goal } : s);
                                }
                                return [{ ...payload, id: tempId, weight: Number(latestStat?.weight) || 0, target_weight: targetW }, ...list];
                              });

                              const res = await fetch(getApiUrl('/api/fitness'), {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                },
                                body: JSON.stringify(payload)
                              });

                              if (res.status === 200 || res.status === 201) {
                                const sign = amount >= 0 ? '+' : '';
                                showToast(`Protein logged: ${sign}${amount}g`, 'success');
                              } else {
                                console.error('Failed to log protein in App.jsx:', res.status, res.statusText);
                              }
                            } catch (e) {
                              console.error('Error logging protein in App.jsx:', e);
                            }
                          };

                          return (
                            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    🥩 Daily Protein Tracker
                                  </span>
                                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                                    {pct}%
                                  </span>
                                </div>
                                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-blue)', marginBottom: '8px' }}>
                                  {protein}g {goal > 0 && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {goal}g goal</span>}
                                </div>
                                <div style={{ width: '100%', height: '10px', background: 'var(--bg-main)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-blue)', borderRadius: '10px', transition: 'width 0.3s ease', boxShadow: '0 0 8px rgba(59,130,246,0.3)' }} />
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => handleAddProtein(25)}
                                  style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  +25g
                                </button>
                                <button
                                  onClick={() => handleAddProtein(30)}
                                  style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  +30g
                                </button>
                                <button
                                  onClick={() => handleAddProtein(-10)}
                                  style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  -10g
                                </button>
                              </div>
                            </div>
                          );
                        })()}

                        {/* c) Daily Hydration Tracker */}
                        {todayWidgetsConfig.showHydration && !!safeStorage.getItem('water_target_goal') && Number(safeStorage.getItem('water_target_goal')) > 0 && (() => {
                          const latestStat = Array.isArray(bodyStats) && bodyStats.length > 0 ? bodyStats[0] : null;
                          const isToday = latestStat?.date === todayKey(userProfile?.timezone);
                          const hydration = isToday ? (Number(latestStat?.hydration) || 0) : 0;
                          const goal = Number(safeStorage.getItem('water_target_goal')) || 3.0;
                          const pct = Math.min(100, Math.max(0, Math.round((hydration / goal) * 100)));

                          const handleAddWater = async (liters) => {
                            const todayStr = todayKey(userProfile?.timezone);
                            const newHydration = Math.max(0, parseFloat((hydration + liters).toFixed(2)));
                            const proteinVal = isToday ? (Number(latestStat?.protein) || 0) : 0;
                            const targetW = Number(latestStat?.target_weight) || 70;
                            const payload = {
                              weight: Number(latestStat?.weight) || 70,
                              target_weight: targetW,
                              protein: proteinVal,
                              target_protein: Number(latestStat?.target_protein) || 0,
                              hydration: newHydration,
                              date: todayStr
                            };
                            
                            const isExistingToday = latestStat?.date === todayStr && latestStat?.id;
                            if (isExistingToday) {
                              payload.id = latestStat.id;
                            }

                            const tempId = isExistingToday ? latestStat.id : Date.now();
                            setBodyStats(prev => {
                              if (isExistingToday) {
                                return prev.map(s => s.id === tempId ? { ...s, hydration: newHydration } : s);
                              } else {
                                return [{ ...payload, id: tempId }, ...(Array.isArray(prev) ? prev : [])];
                              }
                            });

                            try {
                              if (token) {
                                const res = await fetch(getApiUrl('/api/fitness?type=body-stats'), {
                                  method: isExistingToday ? 'PUT' : 'POST',
                                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                  body: JSON.stringify(payload)
                                });
                                if (res.ok) {
                                  if (!isExistingToday) {
                                    const data = await res.json();
                                    setBodyStats(prev => prev.map(s => s.id === tempId ? data : s));
                                  }
                                }
                              }
                            } catch (e) {
                              console.error(e);
                            }
                          };

                          return (
                            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    💧 Daily Hydration Tracker
                                  </span>
                                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                                    {pct}%
                                  </span>
                                </div>
                                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-blue)', marginBottom: '8px' }}>
                                  {hydration} L <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {goal} L target</span>
                                </div>
                                <div style={{ width: '100%', height: '10px', background: 'var(--bg-main)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-blue)', borderRadius: '10px', transition: 'width 0.3s ease', boxShadow: '0 0 8px var(--accent-blue-dim)' }} />
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => handleAddWater(0.5)}
                                  style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  +0.5 L
                                </button>
                                <button
                                  onClick={() => handleAddWater(1.0)}
                                  style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  +1.0 L
                                </button>
                                <button
                                  onClick={() => handleAddWater(-0.5)}
                                  style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  -0.5 L
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    );
                    })()
                  )}


                  {/* Clean List of Today Items */}
                    {(!todayItems || todayItems.length === 0) ? (
                      <div className="glass-card" style={{ textAlign: 'center', padding: '36px 20px', background: 'var(--bg-main)', borderRadius: '18px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <Clock size={40} style={{ color: 'var(--accent-blue)', opacity: 0.5 }} />
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>No items logged yet</div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>No items logged yet. Click + to add your first entry</p>
                        <button
                          onClick={() => setActiveTab('habits')}
                          className="blue-btn"
                          style={{ marginTop: '8px', padding: '8px 18px', fontSize: '0.85rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Plus size={16} /> Add Habits / Tasks
                        </button>
                      </div>
                    ) : (
                      [...todayItems].sort((a,b) => (a.checked === b.checked ? 0 : a.checked ? 1 : -1)).map(item => (
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
                          flexWrap: 'wrap',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          userSelect: 'none',
                          boxShadow: item.checked ? '0 4px 16px rgba(59,130,246,0.12)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                          <span style={{ 
                            fontSize: '0.8rem', fontWeight: 800, color: item.checked ? 'var(--accent-blue)' : 'var(--text-muted)',
                            background: 'var(--bg-card)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', minWidth: '110px', textAlign: 'center',
                            display: item.time ? 'block' : 'none'
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
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 18px', borderRadius: '30px', border: item.checked ? 'none' : '1px solid var(--border-color)',
                            background: item.checked ? 'var(--accent-blue)' : 'var(--bg-card)', color: item.checked ? 'var(--accent-text)' : 'var(--text-main)',
                            fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transition: 'all 0.2s', flexShrink: 0
                          }}
                        >
                          {item.checked ? <><Check size={16} /> Done</> : 'Pending'}
                        </button>
                      </div>
                    ))
                    )}
                  </div>



                </TabErrorBoundary>
              )}

              {/* 1) AI CHAT MODE */}
              {activeTab === 'ai' && (
                <TabErrorBoundary tabName="AI Assistant">
                <div className="ai-chat-view animate-entrance" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: 'calc(100vh - 170px)',
                  overflow: 'hidden',
                  background: 'var(--bg-main)',
                  borderRadius: '20px',
                  border: '1px solid var(--border-color)'
                }}>
                  {/* Header */}
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-blue)' }}>{aiName}</span>
                    <button
                      onClick={handleClearAiChat}
                      title="Clear Chat History"
                      style={{ position: 'absolute', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      <RotateCcw size={15} /> Clear Chat
                    </button>
                  </div>
                  {/* Messages - ONLY THIS SCROLLS */}
                  <div ref={mainAiChatScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', WebkitOverflowScrolling: 'touch' }}>
                    {(!Array.isArray(aiMessages) || aiMessages.length === 0) && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', margin: 'auto' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🤖</div>
                        <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>Ask me anything about your life data</p>
                        <p style={{ fontSize: '0.88rem', marginTop: '8px', color: 'var(--text-muted)' }}>I can analyze your habits, money, sleep and more</p>
                      </div>
                    )}
                    {(Array.isArray(aiMessages) ? aiMessages : []).map(msg => (
                      <div key={msg.id} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', background: msg.sender === 'user' ? 'var(--accent-blue)' : 'var(--bg-card)', color: msg.sender === 'user' ? '#fff' : 'var(--text-main)', padding: '12px 16px', borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', fontSize: '0.88rem', lineHeight: '1.5', whiteSpace: 'pre-line', border: msg.sender === 'ai' ? '1px solid var(--border-color)' : 'none' }}>
                        {msg.text}
                      </div>
                    ))}
                  </div>
                  {/* Input - FIXED AT BOTTOM, never scrolls */}
                  <form onSubmit={handleSendAi} style={{ display: 'flex', gap: '8px', padding: '12px 16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
                    <input
                      type="text"
                      placeholder="Ask anything... (habits, money, sleep)"
                      value={inputMessage}
                      onChange={e => setInputMessage(e.target.value)}
                      style={{ flex: 1, padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '16px', outline: 'none' }}
                    />
                    <button type="submit" className="blue-btn" style={{ padding: '0 18px', flexShrink: 0 }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/></svg>
                    </button>
                  </form>
                </div>
                </TabErrorBoundary>
              )}

              {/* 2) HABITS & PROGRESS TRACKER (Redesigned with Graphs & AI Suggestions) */}
              {activeTab === 'habits' && (
                <TabErrorBoundary tabName="Daily Works & Habits">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Daily Works • Daily Mastery</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>Daily tracking and real-time AI streak curves</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)', gap: '4px' }}>
                        <button 
                          onClick={() => setShowHabitHistory(false)}
                          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: !showHabitHistory ? 'var(--bg-main)' : 'transparent', color: !showHabitHistory ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                          ⚡ Active ({(Array.isArray(habits) ? habits : []).filter(h => !h.archived).length})
                        </button>
                        <button 
                          onClick={() => setShowHabitHistory(true)}
                          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: showHabitHistory ? 'var(--bg-main)' : 'transparent', color: showHabitHistory ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                          📜 History ({(Array.isArray(habits) ? habits : []).filter(h => h.archived).length})
                        </button>
                      </div>
                      <button 
                        className="blue-btn" 
                        onClick={() => {
                          setIsAddHabitModalOpen(!isAddHabitModalOpen);
                        }}
                        style={{ padding: '12px 22px', fontSize: '0.92rem' }}
                      >
                        <Plus size={18} /> {isAddHabitModalOpen ? 'Close Form' : 'Add Habit / Daily Item'}
                      </button>
                    </div>
                  </div>

                  <Modal
                    isOpen={isAddHabitModalOpen}
                    onClose={() => setIsAddHabitModalOpen(false)}
                    title="Create New Daily Progress Item"
                    icon={Plus}
                    maxWidth="440px"
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Item Title / Habit Name</label>
                        <input 
                          type="text" 
                          placeholder="Enter habit name..."
                          value={newHabitData.title}
                          onChange={(e) => setNewHabitData({ ...newHabitData, title: e.target.value })}
                          style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                          autoFocus
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Pillar / Category</label>
                        {newHabitData.category === 'Other' ? (
                          <div style={{ position: 'relative', width: '100%' }}>
                            <input 
                              type="text" 
                              placeholder="Enter custom category name..."
                              value={customPillarInput}
                              onChange={(e) => setCustomPillarInput(e.target.value)}
                              style={{ width: '100%', padding: '12px 40px 12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.92rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                setNewHabitData({ ...newHabitData, category: '' });
                                setCustomPillarInput('');
                              }}
                              title="Re-select category"
                              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <CustomSelect 
                            value={newHabitData.category}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewHabitData({ ...newHabitData, category: val });
                              if (val === 'Body & Gym') setActiveTab('body');
                            }}
                            options={[
                              { value: '', label: 'Select Category...' },
                              { value: 'Coding', label: 'Coding Habit' },
                              { value: 'Study', label: 'Study Habit' },
                              { value: 'Reading', label: 'Reading' },
                              { value: 'Body & Gym', label: 'Fitness & Health' },
                              { value: 'Diet & Nutrition', label: 'Diet & Nutrition' },
                              { value: 'Money', label: 'Money Habit' },
                              { value: 'Deep Focus', label: 'Deep Focus' },
                              { value: 'Other', label: '+ Enter Custom Category...' }
                            ]}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '0.92rem', fontWeight: 600 }}
                          />
                        )}
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Daily Goal / Target</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 30 mins, 5 pages"
                          value={newHabitData.target}
                          onChange={(e) => setNewHabitData({ ...newHabitData, target: e.target.value })}
                          style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Frequency</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setNewHabitData({ ...newHabitData, frequency: 'daily' })}
                            style={{
                              flex: 1, padding: '10px', borderRadius: '10px',
                              border: `1px solid ${newHabitData.frequency !== 'custom' ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                              background: newHabitData.frequency !== 'custom' ? 'var(--accent-blue)' : 'var(--bg-card)',
                              color: newHabitData.frequency !== 'custom' ? '#fff' : 'var(--text-main)',
                              fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                          >
                            Daily
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewHabitData({ ...newHabitData, frequency: 'custom' })}
                            style={{
                              flex: 1, padding: '10px', borderRadius: '10px',
                              border: `1px solid ${newHabitData.frequency === 'custom' ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                              background: newHabitData.frequency === 'custom' ? 'var(--accent-blue)' : 'var(--bg-card)',
                              color: newHabitData.frequency === 'custom' ? '#fff' : 'var(--text-main)',
                              fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                          >
                            Custom Days
                          </button>
                        </div>

                        {newHabitData.frequency === 'custom' && (
                          <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                              <button
                                type="button"
                                onClick={() => setNewHabitData({ ...newHabitData, intervalDays: 0, interval_days: 0 })}
                                style={{
                                  flex: 1, padding: '6px 10px', borderRadius: '6px',
                                  border: `1px solid ${(newHabitData.intervalDays === 0 || !newHabitData.intervalDays) && newHabitData.intervalDays !== '' ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                                  background: ((newHabitData.intervalDays === 0 || !newHabitData.intervalDays) && newHabitData.intervalDays !== '') ? 'var(--accent-blue-dim)' : 'var(--bg-card)',
                                  color: ((newHabitData.intervalDays === 0 || !newHabitData.intervalDays) && newHabitData.intervalDays !== '') ? 'var(--accent-blue)' : 'var(--text-muted)',
                                  fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer'
                                }}
                              >
                                Specific Days
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewHabitData({ ...newHabitData, intervalDays: (newHabitData.intervalDays > 0 ? newHabitData.intervalDays : 1), interval_days: (newHabitData.intervalDays > 0 ? newHabitData.intervalDays : 1) })}
                                style={{
                                  flex: 1, padding: '6px 10px', borderRadius: '6px',
                                  border: `1px solid ${(newHabitData.intervalDays !== 0) ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                                  background: (newHabitData.intervalDays !== 0) ? 'var(--accent-blue-dim)' : 'var(--bg-card)',
                                  color: (newHabitData.intervalDays !== 0) ? 'var(--accent-blue)' : 'var(--text-muted)',
                                  fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer'
                                }}
                              >
                                Every N Days
                              </button>
                            </div>

                            {(newHabitData.intervalDays !== 0) ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Repeat every</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={newHabitData.intervalDays === '' ? '' : (newHabitData.intervalDays ?? 1)}
                                  onChange={(e) => {
                                    const valStr = e.target.value;
                                    if (valStr === '') {
                                      setNewHabitData({ ...newHabitData, intervalDays: '', interval_days: '' });
                                    } else {
                                      const parsed = parseInt(valStr, 10);
                                      setNewHabitData({ ...newHabitData, intervalDays: isNaN(parsed) ? '' : parsed, interval_days: isNaN(parsed) ? '' : parsed });
                                    }
                                  }}
                                  onBlur={() => {
                                    if (!newHabitData.intervalDays || Number(newHabitData.intervalDays) < 1) {
                                      setNewHabitData({ ...newHabitData, intervalDays: 1, interval_days: 1 });
                                    }
                                  }}
                                  style={{ minWidth: '75px', width: 'auto', maxWidth: '120px', padding: '6px 10px', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.88rem', fontWeight: 700, outline: 'none' }}
                                />
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>days</span>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', flexWrap: 'nowrap', width: '100%' }}>
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                                  const selectedDays = Array.isArray(newHabitData.customDays)
                                    ? newHabitData.customDays
                                    : (typeof newHabitData.customDays === 'string' ? newHabitData.customDays.split(',').map(s=>s.trim()).filter(Boolean) : ['Mon', 'Wed', 'Fri']);
                                  const isSelected = selectedDays.includes(day);
                                  return (
                                    <button
                                      key={day}
                                      type="button"
                                      onClick={() => {
                                        const nextDays = isSelected
                                          ? selectedDays.filter(d => d !== day)
                                          : [...selectedDays, day];
                                        setNewHabitData({ ...newHabitData, customDays: nextDays, intervalDays: 0, interval_days: 0 });
                                      }}
                                      style={{
                                        flex: 1, padding: '8px 0', borderRadius: '8px',
                                        border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                                        background: isSelected ? 'var(--accent-blue-dim)' : 'var(--bg-main)',
                                        color: isSelected ? 'var(--accent-blue)' : 'var(--text-muted)',
                                        fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s'
                                      }}
                                    >
                                      {day}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* CHALLENGE MODE OPTIONS */}
                      <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-main)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          <input 
                            type="checkbox" 
                            checked={newHabitData.challengeMode}
                            onChange={(e) => setNewHabitData({ ...newHabitData, challengeMode: e.target.checked })}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--accent-blue)' }}
                          />
                          Make this a time-limited challenge
                        </label>

                        {newHabitData.challengeMode && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Duration:</span>
                            <select
                              value={newHabitData.durationMode === 'custom' ? 'custom' : newHabitData.challengeDays}
                              onChange={(e) => {
                                if (e.target.value === 'custom') {
                                  setNewHabitData({ ...newHabitData, durationMode: 'custom', challengeDays: '' });
                                } else {
                                  setNewHabitData({ ...newHabitData, durationMode: 'preset', challengeDays: Number(e.target.value) });
                                }
                              }}
                              style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                            >
                              <option value={7} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>7 Days</option>
                              <option value={14} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>14 Days</option>
                              <option value={21} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>21 Days</option>
                              <option value={30} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>30 Days</option>
                              <option value={60} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>60 Days</option>
                              <option value={90} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>90 Days</option>
                              <option value="custom" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>Custom...</option>
                            </select>

                            {newHabitData.durationMode === 'custom' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="e.g. 100"
                                  value={newHabitData.challengeDays}
                                  onChange={(e) => setNewHabitData({ ...newHabitData, challengeDays: e.target.value ? Number(e.target.value) : '' })}
                                  style={{ width: '80px', padding: '6px 10px', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <button 
                          className="secondary-btn"
                          onClick={() => setIsAddHabitModalOpen(false)}
                          style={{ flex: 1, padding: '12px', fontSize: '0.92rem', fontWeight: 700 }}
                        >
                          Cancel
                        </button>
                        <button 
                          className="blue-btn"
                          onClick={async () => {
                            if (!newHabitData.title.trim()) {
                              showToast('Please enter a title for your daily item.', 'error');
                              return;
                            }

                            const finalCategory = newHabitData.category === 'Other' 
                              ? (customPillarInput.trim() || 'General') 
                              : (newHabitData.category || 'General');

                            const freq = newHabitData.frequency || 'daily';
                            const cDays = Array.isArray(newHabitData.customDays) ? newHabitData.customDays.join(',') : (newHabitData.customDays || '');
                            const iDays = freq === 'custom' ? Number(newHabitData.intervalDays || newHabitData.interval_days || 0) : 0;

                            try {
                              const res = await fetch(getApiUrl('/api/habits'), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({ 
                                  label: newHabitData.title.trim(), 
                                  category: finalCategory, 
                                  target: newHabitData.target.trim() || 'Daily',
                                  frequency: freq,
                                  custom_days: cDays,
                                  interval_days: iDays
                                })
                              });

                              if (res.ok) {
                                const saved = await res.json();
                                setHabits(prev => [...prev, {
                                  id: saved.id,
                                  title: saved.label,
                                  category: saved.category,
                                  streak: saved.streak || 0,
                                  target: saved.target || 'Daily',
                                  checkedToday: false,
                                  startDate: saved.start_date || new Date().toISOString().split('T')[0],
                                  start_date: saved.start_date || new Date().toISOString().split('T')[0],
                                  frequency: saved.frequency || freq,
                                  customDays: saved.custom_days || cDays,
                                  custom_days: saved.custom_days || cDays,
                                  intervalDays: saved.interval_days || iDays,
                                  interval_days: saved.interval_days || iDays
                                }]);

                                try {
                                  const todayRes = await fetch(getApiUrl('/api/today'), {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify({
                                      label: newHabitData.title.trim(),
                                      category: finalCategory,
                                      time: '',
                                      habit_id: saved.id,
                                      date: todayKey(userProfile.timezone)
                                    })
                                  });
                                  if (todayRes.ok) {
                                    const todayData = await todayRes.json();
                                    setTodayItems(prev => [...prev, { id: todayData.id, title: todayData.label, category: todayData.category, time: todayData.time, checked: false, habitId: saved.id }]);
                                  }
                                } catch (linkErr) {
                                  console.error('Failed to create linked today item:', linkErr);
                                }

                                setNewHabitData({ title: '', category: '', target: '', challengeMode: false, challengeDays: 30, durationMode: 'preset', frequency: 'daily', customDays: ['Mon', 'Wed', 'Fri'] });
                                setCustomPillarInput('');
                                setIsAddHabitModalOpen(false);
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          style={{ flex: 1, padding: '12px', fontSize: '0.92rem', fontWeight: 800, justifyContent: 'center' }}
                        >
                          + Add to Progress
                        </button>
                      </div>
                    </div>
                  </Modal>



                  {/* GRID OF HABIT CARDS WITH ACTIVITY PILL HEATMAPS */}

                  
                  {habits.filter(h => showHabitHistory ? h.archived : !h.archived).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      No {showHabitHistory ? 'archived' : 'active'} habits exist yet.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
                      {habits.filter(h => showHabitHistory ? h.archived : !h.archived).map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => handleToggleHabitItem(item.id)}
                        className="motion-card" 
                        style={{ 
                          background: item.checkedToday ? 'var(--accent-blue-dim)' : 'var(--bg-main)',
                          padding: '22px', borderRadius: '16px', 
                          border: `1px solid ${item.checkedToday ? 'var(--accent-blue)' : 'var(--border-color)'}`, 
                          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                          cursor: 'pointer', userSelect: 'none', position: 'relative'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>

                            {(() => {
                              if (item.challengeDays > 0 && item.startDate) {
                                const elapsed = Math.floor((new Date() - new Date(item.startDate)) / (1000 * 60 * 60 * 24));
                                const daysStr = Math.min(Math.max(elapsed + 1, 1), item.challengeDays); // +1 because day 1 is the start date
                                const isCompleted = daysStr >= item.challengeDays && item.checkedToday;
                                return (
                                  <span style={{ fontSize: '0.85rem', color: isCompleted ? '#22c55e' : 'var(--accent-blue)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {isCompleted ? '🎉 Completed!' : `Day ${daysStr} of ${item.challengeDays}`}
                                  </span>
                                );
                              }
                              return (
                                <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Flame size={16} /> {item.streak} Day Streak
                                </span>
                              );
                            })()}
                          </div>
                        {/* 3-Dots Menu Button */}
                        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setHabitMenuOpen(habitMenuOpen === item.id ? null : item.id);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-muted)',
                              padding: '4px'
                            }}
                            aria-label="Habit options"
                          >
                            <MoreVertical size={18} />
                          </button>
                          
                          {habitMenuOpen === item.id && (
                            <div className="dot-menu" style={{
                              position: 'absolute', top: '100%', right: '0', background: 'var(--bg-card)', 
                              border: '1px solid var(--border-color)', borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', minWidth: '160px',
                              display: 'flex', flexDirection: 'column'
                            }}>
                              {item.challengeDays > 0 && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const currentView = habitCardViews[item.id] || 'progress';
                                    setHabitCardViews({ ...habitCardViews, [item.id]: currentView === 'progress' ? 'heatmap' : 'progress' });
                                    setHabitMenuOpen(null);
                                  }}
                                  style={{ padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', textAlign: 'left', cursor: 'pointer', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600 }}
                                >
                                  {(habitCardViews[item.id] || 'progress') === 'progress' ? 'Show Heatmap View' : 'Show Progress Bar'}
                                </button>
                              )}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const predefinedCategories = ['Coding', 'Study', 'Reading', 'Body & Gym', 'Diet & Nutrition', 'Money', 'Deep Focus'];
                                  const isCustom = !predefinedCategories.includes(item.category);
                                  
                                  setEditingHabitData({
                                    id: item.id,
                                    title: item.title,
                                    category: isCustom ? 'Other' : item.category,
                                    target: item.target,
                                    challengeMode: item.challengeDays > 0,
                                    challengeDays: item.challengeDays || 30,
                                    durationMode: [7, 14, 21, 30, 60, 90].includes(item.challengeDays) ? 'preset' : 'custom',
                                    frequency: item.frequency || 'daily',
                                    intervalDays: item.interval_days || item.intervalDays || 0,
                                    interval_days: item.interval_days || item.intervalDays || 0,
                                    customDays: Array.isArray(item.customDays || item.custom_days)
                                      ? (item.customDays || item.custom_days)
                                      : (typeof (item.customDays || item.custom_days) === 'string' && (item.customDays || item.custom_days)
                                          ? (item.customDays || item.custom_days).split(',').map(s=>s.trim()).filter(Boolean)
                                          : ['Mon', 'Wed', 'Fri'])
                                  });
                                  if (isCustom) setCustomPillarInput(item.category);
                                  setIsEditHabitModalOpen(true);
                                  setHabitMenuOpen(null);
                                }}
                                style={{ padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', textAlign: 'left', cursor: 'pointer', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600 }}
                              >
                                Edit Habit
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newArchivedState = !item.archived;
                                  handleUpdateHabitDb(item.id, item.streak, item.checkedToday, item.pausedUntil, newArchivedState, item.completedAt);
                                  setHabits(prev => prev.map(h => h.id === item.id ? { ...h, archived: newArchivedState } : h));
                                  showToast(newArchivedState ? 'Habit archived' : 'Habit restored', 'info');
                                  setHabitMenuOpen(null);
                                }}
                                style={{ padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', textAlign: 'left', cursor: 'pointer', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600 }}
                              >
                                {item.archived ? 'Restore Habit' : 'Archive Habit'}
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmModal({
                                    isOpen: true,
                                    title: 'Delete Habit',
                                    message: 'Are you sure you want to delete this habit?',
                                    onConfirm: () => {
                                      handleDeleteHabitDb(item.id);
                                      setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
                                      showToast('Habit deleted', 'info');
                                    }
                                  });
                                  setHabitMenuOpen(null);
                                }}
                                style={{ padding: '10px 16px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--danger-color, #ef4444)', fontSize: '0.85rem', fontWeight: 600 }}
                              >
                                Delete Habit
                              </button>
                            </div>
                          )}
                        </div>

                          <h5 style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '6px', textDecoration: item.checkedToday ? 'line-through' : 'none' }}>{item.title}</h5>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Daily Goal: <strong style={{ color: 'var(--text-main)' }}>{item.target}</strong></p>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Category: <strong style={{ color: 'var(--text-main)' }}>{item.category}</strong></p>
                        </div>

                        <div>
                          {(() => {
                            const currentView = habitCardViews[item.id] || (item.challengeDays > 0 ? 'progress' : 'heatmap');

                            if (item.challengeDays > 0 && item.startDate && currentView === 'progress') {
                              const elapsed = Math.floor((new Date() - new Date(item.startDate)) / (1000 * 60 * 60 * 24));
                              const daysStr = Math.min(Math.max(elapsed + 1, 1), item.challengeDays);
                              const percent = Math.round((daysStr / item.challengeDays) * 100);
                              
                              return (
                                <div style={{ marginBottom: '16px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Challenge Progress:</span>
                                    <span style={{ color: 'var(--accent-blue)' }}>{percent}% Done</span>
                                  </div>
                                  <div style={{ width: '100%', height: '12px', background: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                                    <div style={{ width: `${percent}%`, height: '100%', background: 'var(--accent-blue)', borderRadius: '6px', transition: 'width 0.3s ease' }}></div>
                                  </div>
                                </div>
                              );
                            }

                            const weekDays = getWeekDays(userProfile?.weekStartDay || userProfile?.week_start_day || 'Monday');

                            return (
                              <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>
                                    {item.frequency === 'custom'
                                      ? ((item.interval_days || item.intervalDays) > 0
                                          ? `Every ${item.interval_days || item.intervalDays} Days`
                                          : `Custom (${Array.isArray(item.customDays) ? item.customDays.join(',') : (item.customDays || item.custom_days || '')})`)
                                      : 'Daily'}
                                  </span>
                                  <span style={{ color: 'var(--accent-blue)' }}>{item.completionRate}% Consistency</span>
                                </div>

                                {/* 7-Day Activity Pill Heatmap with Dynamic Week Start */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '16px' }}>
                                  {weekDays.map((day, dIdx) => {
                                    const todayDate = new Date();
                                    const todayJsDayIdx = todayDate.getDay();
                                    const todayInWeekDaysIdx = weekDays.findIndex(d => d.dayIdx === todayJsDayIdx);
                                    const offset = dIdx - (todayInWeekDaysIdx >= 0 ? todayInWeekDaysIdx : 0);
                                    const cellDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() + offset);

                                    const isToday = day.dayIdx === todayJsDayIdx;
                                    const isScheduled = isHabitScheduledOnDay(item, { ...day, date: cellDate });

                                    // Auto-treat non-scheduled days as completed/non-required so they don't block progress or streak
                                    const isCompleted = isScheduled
                                      ? (isToday ? item.checkedToday : false)
                                      : true;

                                    return (
                                      <div key={dIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                        <div style={{
                                          width: '100%',
                                          height: '24px',
                                          borderRadius: '6px',
                                          background: isCompleted ? (isScheduled ? 'var(--accent-blue)' : 'rgba(59, 130, 246, 0.2)') : 'var(--bg-card)',
                                          border: `1px solid ${isCompleted ? (isScheduled ? 'var(--accent-blue)' : 'var(--border-color)') : 'var(--border-color)'}`,
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          transition: 'all 0.2s',
                                          opacity: isScheduled ? 1 : 0.6
                                        }}>
                                          {isCompleted && (
                                            <Check size={12} color={isScheduled ? "var(--accent-text)" : "var(--accent-blue)"} />
                                          )}
                                        </div>
                                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: isScheduled ? 700 : 400, opacity: isScheduled ? 1 : 0.5 }}>
                                          {day.letter}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            );
                          })()}

                          {(() => {
                            const isChallenge = item.challengeDays > 0;
                            const elapsed = isChallenge && item.startDate ? Math.floor((new Date() - new Date(item.startDate)) / (1000 * 60 * 60 * 24)) : 0;
                            const daysStr = Math.min(Math.max(elapsed + 1, 1), item.challengeDays);
                            const isCompleted = isChallenge && daysStr >= item.challengeDays && item.checkedToday;

                            if (item.archived) {
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '12px', borderRadius: '12px', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                                    {item.completedAt ? `Completed on ${new Date(item.completedAt).toLocaleDateString()}` : 'Archived'}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateHabitDb(item.id, item.streak, item.checkedToday, item.pausedUntil, false, item.completedAt);
                                      setHabits(prev => prev.map(h => h.id === item.id ? { ...h, archived: false } : h));
                                      showToast('Habit restored to Active', 'success');
                                    }}
                                    style={{
                                      width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)',
                                      background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer'
                                    }}
                                  >
                                    Restore to Active
                                  </button>
                                </div>
                              );
                            }

                            if (isCompleted) {
                              return (
                                <div style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '12px', borderRadius: '12px', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                                  🎉 Challenge Completed!
                                </div>
                              );
                            }

                            return (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleHabitItem(item.id);
                                }}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%',
                                  padding: '12px', borderRadius: '12px', border: item.checkedToday ? 'none' : '1px solid var(--border-color)',
                                  background: item.checkedToday ? 'var(--accent-blue)' : 'var(--bg-card)',
                                  color: item.checkedToday ? 'var(--accent-text)' : 'var(--text-main)',
                                  fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                              >
                                {item.checkedToday ? <><Check size={16} /> Done</> : 'Quick Check-In Today'}
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                      ))}
                    </div>
                  )}

                  {/* EDIT HABIT MODAL */}
                  <Modal
                    isOpen={isEditHabitModalOpen && Boolean(editingHabitData)}
                    onClose={() => setIsEditHabitModalOpen(false)}
                    title="Edit Habit"
                    icon={Edit2}
                    maxWidth="400px"
                  >
                    {editingHabitData && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input 
                          type="text" placeholder="Enter habit name..."
                          value={editingHabitData.title}
                          onChange={e => setEditingHabitData({...editingHabitData, title: e.target.value})}
                          className="glass-input" 
                          autoFocus
                        />
                        <CustomSelect 
                          className="glass-input"
                          value={editingHabitData.category}
                          onChange={e => setEditingHabitData({...editingHabitData, category: e.target.value})}
                          options={[
                            { value: "Coding", label: "Coding Habit" },
                            { value: "Study", label: "Study Habit" },
                            { value: "Reading", label: "Reading" },
                            { value: "Body & Gym", label: "Fitness & Health" },
                            { value: "Diet & Nutrition", label: "Diet & Nutrition" },
                            { value: "Money", label: "Money Habit" },
                            { value: "Deep Focus", label: "Deep Focus" },
                            { value: "Other", label: "Custom Category" }
                          ]}
                        />
                        {editingHabitData.category === 'Other' && (
                          <input 
                            type="text" placeholder="Enter custom category name..."
                            value={customPillarInput}
                            onChange={e => setCustomPillarInput(e.target.value)}
                            className="glass-input" 
                          />
                        )}
                        <input 
                          type="text" placeholder="Daily Goal (e.g. 30 mins, 5 pages)"
                          value={editingHabitData.target}
                          onChange={e => setEditingHabitData({...editingHabitData, target: e.target.value})}
                          className="glass-input" 
                        />

                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Frequency</label>
                          <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setEditingHabitData({ ...editingHabitData, frequency: 'daily' })}
                              style={{
                                flex: 1, padding: '8px', borderRadius: '8px',
                                border: `1px solid ${editingHabitData.frequency !== 'custom' ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                                background: editingHabitData.frequency !== 'custom' ? 'var(--accent-blue)' : 'var(--bg-card)',
                                color: editingHabitData.frequency !== 'custom' ? '#fff' : 'var(--text-main)',
                                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                              }}
                            >
                              Daily
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingHabitData({ ...editingHabitData, frequency: 'custom' })}
                              style={{
                                flex: 1, padding: '8px', borderRadius: '8px',
                                border: `1px solid ${editingHabitData.frequency === 'custom' ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                                background: editingHabitData.frequency === 'custom' ? 'var(--accent-blue)' : 'var(--bg-card)',
                                color: editingHabitData.frequency === 'custom' ? '#fff' : 'var(--text-main)',
                                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                              }}
                            >
                              Custom Days
                            </button>
                          </div>

                          {editingHabitData.frequency === 'custom' && (
                            <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
                              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                <button
                                  type="button"
                                  onClick={() => setEditingHabitData({ ...editingHabitData, intervalDays: 0, interval_days: 0 })}
                                  style={{
                                    flex: 1, padding: '6px 10px', borderRadius: '6px',
                                    border: `1px solid ${(editingHabitData.intervalDays === 0 || !editingHabitData.intervalDays) && editingHabitData.intervalDays !== '' ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                                    background: ((editingHabitData.intervalDays === 0 || !editingHabitData.intervalDays) && editingHabitData.intervalDays !== '') ? 'var(--accent-blue-dim)' : 'var(--bg-card)',
                                    color: ((editingHabitData.intervalDays === 0 || !editingHabitData.intervalDays) && editingHabitData.intervalDays !== '') ? 'var(--accent-blue)' : 'var(--text-muted)',
                                    fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer'
                                  }}
                                >
                                  Specific Days
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingHabitData({ ...editingHabitData, intervalDays: (editingHabitData.intervalDays > 0 ? editingHabitData.intervalDays : 1), interval_days: (editingHabitData.intervalDays > 0 ? editingHabitData.intervalDays : 1) })}
                                  style={{
                                    flex: 1, padding: '6px 10px', borderRadius: '6px',
                                    border: `1px solid ${(editingHabitData.intervalDays !== 0) ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                                    background: (editingHabitData.intervalDays !== 0) ? 'var(--accent-blue-dim)' : 'var(--bg-card)',
                                    color: (editingHabitData.intervalDays !== 0) ? 'var(--accent-blue)' : 'var(--text-muted)',
                                    fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer'
                                  }}
                                >
                                  Every N Days
                                </button>
                              </div>

                              {(editingHabitData.intervalDays !== 0) ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Repeat every</span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={editingHabitData.intervalDays === '' ? '' : (editingHabitData.intervalDays ?? 1)}
                                    onChange={(e) => {
                                      const valStr = e.target.value;
                                      if (valStr === '') {
                                        setEditingHabitData({ ...editingHabitData, intervalDays: '', interval_days: '' });
                                      } else {
                                        const parsed = parseInt(valStr, 10);
                                        setEditingHabitData({ ...editingHabitData, intervalDays: isNaN(parsed) ? '' : parsed, interval_days: isNaN(parsed) ? '' : parsed });
                                      }
                                    }}
                                    onBlur={() => {
                                      if (!editingHabitData.intervalDays || Number(editingHabitData.intervalDays) < 1) {
                                        setEditingHabitData({ ...editingHabitData, intervalDays: 1, interval_days: 1 });
                                      }
                                    }}
                                    style={{ minWidth: '75px', width: 'auto', maxWidth: '120px', padding: '6px 10px', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.88rem', fontWeight: 700, outline: 'none' }}
                                  />
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>days</span>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', flexWrap: 'nowrap', width: '100%' }}>
                                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                                    const selectedDays = Array.isArray(editingHabitData.customDays)
                                      ? editingHabitData.customDays
                                      : (typeof editingHabitData.customDays === 'string' ? editingHabitData.customDays.split(',').map(s=>s.trim()).filter(Boolean) : ['Mon', 'Wed', 'Fri']);
                                    const isSelected = selectedDays.includes(day);
                                    return (
                                      <button
                                        key={day}
                                        type="button"
                                        onClick={() => {
                                          const nextDays = isSelected
                                            ? selectedDays.filter(d => d !== day)
                                            : [...selectedDays, day];
                                          setEditingHabitData({ ...editingHabitData, customDays: nextDays, intervalDays: 0, interval_days: 0 });
                                        }}
                                        style={{
                                          flex: 1, padding: '6px 0', borderRadius: '6px',
                                          border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                                          background: isSelected ? 'var(--accent-blue-dim)' : 'var(--bg-main)',
                                          color: isSelected ? 'var(--accent-blue)' : 'var(--text-muted)',
                                          fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer'
                                        }}
                                      >
                                        {day}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', marginBottom: editingHabitData.challengeMode ? '16px' : '0' }}>
                            <input 
                              type="checkbox"
                              checked={editingHabitData.challengeMode}
                              onChange={(e) => setEditingHabitData({ ...editingHabitData, challengeMode: e.target.checked })}
                              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-blue)' }}
                            />
                            Make this a time-limited challenge
                          </label>

                          {editingHabitData.challengeMode && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Duration:</span>
                              <CustomSelect
                                value={editingHabitData.durationMode === 'custom' ? 'custom' : editingHabitData.challengeDays}
                                onChange={(e) => {
                                  if (e.target.value === 'custom') {
                                    setEditingHabitData({ ...editingHabitData, durationMode: 'custom', challengeDays: '' });
                                  } else {
                                    setEditingHabitData({ ...editingHabitData, durationMode: 'preset', challengeDays: Number(e.target.value) });
                                  }
                                }}
                                style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 700, width: '130px' }}
                                options={[
                                  { value: 7, label: "7 Days" },
                                  { value: 14, label: "14 Days" },
                                  { value: 21, label: "21 Days" },
                                  { value: 30, label: "30 Days" },
                                  { value: 60, label: "60 Days" },
                                  { value: 90, label: "90 Days" },
                                  { value: "custom", label: "Custom..." }
                                ]}
                              />

                              {editingHabitData.durationMode === 'custom' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 100"
                                    value={editingHabitData.challengeDays}
                                    onChange={(e) => setEditingHabitData({ ...editingHabitData, challengeDays: e.target.value ? Number(e.target.value) : '' })}
                                    style={{ width: '80px', padding: '6px 10px', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
                                  />
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Days</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                          <button className="glass-button" style={{ flex: 1 }} onClick={() => setIsEditHabitModalOpen(false)}>Cancel</button>
                          <button 
                            className="blue-btn" style={{ flex: 1 }}
                            onClick={async () => {
                              if (!editingHabitData.title.trim()) return showToast('Title required', 'error');
                              const finalCategory = editingHabitData.category === 'Other' ? (customPillarInput.trim() || 'Custom') : editingHabitData.category;
                              const challengeDays = editingHabitData.challengeMode ? Number(editingHabitData.challengeDays || 30) : 0;
                              const freq = editingHabitData.frequency || 'daily';
                              const cDays = Array.isArray(editingHabitData.customDays) ? editingHabitData.customDays.join(',') : (editingHabitData.customDays || '');
                              const iDays = freq === 'custom' ? Number(editingHabitData.intervalDays || editingHabitData.interval_days || 0) : 0;

                              try {
                                if (token) {
                                  const res = await fetch(getApiUrl('/api/habits'), {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify({
                                      id: editingHabitData.id,
                                      label: editingHabitData.title,
                                      category: finalCategory,
                                      target: editingHabitData.target,
                                      challenge_days: challengeDays,
                                      frequency: freq,
                                      custom_days: cDays,
                                      interval_days: iDays
                                    })
                                  });
                                  if (!res.ok) {
                                    const errData = await res.json().catch(() => ({}));
                                    throw new Error(errData.error || 'Failed to update habit');
                                  }
                                }

                                // Optimistically update local React state
                                setHabits(prev => prev.map(h => h.id === editingHabitData.id ? {
                                  ...h,
                                  title: editingHabitData.title,
                                  label: editingHabitData.title,
                                  category: finalCategory,
                                  target: editingHabitData.target,
                                  challengeDays: challengeDays,
                                  challenge_days: challengeDays,
                                  startDate: challengeDays > 0 ? (h.startDate || todayKey()) : (iDays > 0 ? (h.startDate || todayKey()) : h.startDate),
                                  start_date: challengeDays > 0 ? (h.start_date || todayKey()) : (iDays > 0 ? (h.start_date || todayKey()) : h.start_date),
                                  frequency: freq,
                                  customDays: cDays,
                                  custom_days: cDays,
                                  intervalDays: iDays,
                                  interval_days: iDays
                                } : h));

                                setIsEditHabitModalOpen(false);
                                showToast('Habit updated!', 'success');
                                if (token) fetchStartupData(); // reload backend
                              } catch (e) {
                                console.error(e);
                                showToast(e.message || 'Failed to update habit', 'error');
                              }
                            }}
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    )}
                  </Modal>
                </div>
                </TabErrorBoundary>
              )}

              {/* 2.2) DRINK WATER & HYDRATION TAB */}
              {activeTab === 'water' && (
                <TabErrorBoundary tabName="Water Hydration">
                  <WaterReminder 
                    todayStat={bodyStats}
                    onLogStat={handleSaveBodyStat}
                    showToast={showToast}
                    userProfile={userProfile}
                  />
                </TabErrorBoundary>
              )}

              {/* 2.5) CALENDAR TAB */}
              {activeTab === 'calendar' && (
                <TabErrorBoundary tabName="Calendar">
                  <CalendarPanel
                    calendarEvents={calendarEvents}
                    setCalendarEvents={setCalendarEvents}
                    selectedCalendarDate={selectedCalendarDate}
                    setSelectedCalendarDate={setSelectedCalendarDate}
                    calendarSubTab={calendarSubTab}
                    setCalendarSubTab={setCalendarSubTab}
                    token={token}
                    showToast={showToast}
                    userProfile={userProfile}
                  />
                </TabErrorBoundary>
              )}

              {/* 2.5) NOTES & DIARY TAB (With Personal AI Assistant Permission Sharing) */}
              {activeTab === 'notes' && (
                <TabErrorBoundary tabName="Notes & Diary">
                <div className="animate-entrance">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.55rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BookOpen size={24} color="var(--accent-blue)" /> Notes & Personal Diary
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
                        Create daily logs, goals, and notes.
                      </p>
                    </div>
                    <button 
                      className="blue-btn"
                      onClick={() => {
                        const baseTitle = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
                        const count = notesList.filter(n => n.title && n.title.startsWith(baseTitle)).length;
                        const defaultTitle = count > 0 ? `${baseTitle} (${count + 1})` : baseTitle;
                        const tempId = Date.now();
                        const tempNote = { id: tempId, title: defaultTitle, content: '', shareWithAi: true, date: new Date().toISOString() };
                        
                        // Instant 0ms UI update
                        const updatedList = [tempNote, ...notesList];
                        setNotesList(updatedList);
                        setActiveNoteId(tempId);

                        // Background DB creation
                        handleCreateNoteDb(defaultTitle, '', true, (serverNote) => {
                          setNotesList(prev => prev.map(n => n.id === tempId ? { ...n, id: serverNote.id } : n));
                          setActiveNoteId(serverNote.id);
                        });
                      }}
                      style={{ padding: '10px 22px', fontSize: '0.92rem' }}
                    >
                      <Plus size={18} /> New Diary Page / Note
                    </button>
                  </div>

                  <div className="notes-container" style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 220px)', overflow: 'hidden' }}>
                    {/* LEFT NOTEBOOK LIST / TRASH VIEW SWITCHER */}
                    <div className="notes-left-col" style={{ flex: '0 0 320px', background: 'var(--bg-main)', borderRadius: '18px', border: '1px solid var(--border-color)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', overflowY: 'auto', paddingRight: '8px' }}>
                      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                        <button
                          onClick={() => {
                            setNotesViewMode('active');
                            setActiveNoteId(null);
                          }}
                          style={{
                            flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
                            background: notesViewMode === 'active' ? 'var(--accent-blue)' : 'transparent',
                            color: notesViewMode === 'active' ? 'var(--accent-text)' : 'var(--text-muted)',
                            fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          📖 Active ({notesList.length})
                        </button>
                        <button
                          onClick={() => {
                            setNotesViewMode('trash');
                            setActiveNoteId(null);
                          }}
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
                                  color: activeNoteId === note.id ? 'var(--accent-text)' : 'var(--text-main)',
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
                                      <span title="Shared with AI Agent" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', background: activeNoteId === note.id ? 'rgba(255,255,255,0.25)' : 'rgba(34,197,94,0.15)', color: activeNoteId === note.id ? 'var(--accent-text)' : '#22c55e', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                                        🤖 AI Shared
                                      </span>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateNoteDb({ id: note.id, is_trashed: 1, deleted_at: new Date().toISOString() });
                                        setTrashNotes([{ ...note, deletedAt: Date.now(), is_trashed: 1 }, ...trashNotes]);
                                        const next = notesList.filter(n => n.id !== note.id);
                                        setNotesList(next);
                                        if (activeNoteId === note.id && next.length > 0) setActiveNoteId(next[0].id);
                                        showToast('Note moved to Trash. Click 🗑️ Trash to restore anytime!');
                                      }}
                                      style={{ background: 'transparent', border: 'none', color: activeNoteId === note.id ? 'var(--accent-text)' : '#ef4444', cursor: 'pointer', padding: '2px', opacity: 0.8 }}
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
                                          const restoredNote = { ...tNote, is_trashed: 0, deletedAt: null, deleted_at: null };
                                          handleUpdateNoteDb(restoredNote);
                                          setNotesList(prev => [restoredNote, ...prev]);
                                          const remainingTrash = trashNotes.filter(n => n.id !== tNote.id);
                                          setTrashNotes(remainingTrash);
                                          // Stay on trash tab; select next trash note if available
                                          if (remainingTrash.length > 0) {
                                            setActiveNoteId(remainingTrash[0].id);
                                          } else {
                                            setActiveNoteId(null);
                                          }
                                          showToast('Note restored to active notes!');
                                        }}
                                        style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                                        title="Restore Note to Active"
                                      >
                                        ♻️ Restore
                                      </button>
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          const remainingTrash = trashNotes.filter(n => n.id !== tNote.id);
                                          setTrashNotes(remainingTrash);
                                          // Select next trash note or clear selection
                                          if (activeNoteId === tNote.id) {
                                            setActiveNoteId(remainingTrash.length > 0 ? remainingTrash[0].id : null);
                                          }
                                          try {
                                            const delRes = await fetch(getApiUrl('/api/notes'), {
                                              method: 'DELETE',
                                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                              body: JSON.stringify({ id: tNote.id })
                                            });
                                            if (delRes.ok) {
                                              showToast('Note permanently deleted', 'success');
                                            } else {
                                              showToast('Failed to delete note', 'error');
                                            }
                                          } catch (err) {
                                            console.error(err);
                                            showToast('Failed to delete note', 'error');
                                          }
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
                      const currentNote = currentList.find(n => n.id === activeNoteId);
                      if (!currentNote) {
                        return (
                          <div className="notes-right-col" style={{ flex: 1, background: 'var(--bg-main)', borderRadius: '18px', border: '1px solid var(--border-color)', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '12px', height: '100%', overflowY: 'auto' }}>
                            <BookOpen size={40} opacity={0.4} />
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No Note Selected</h4>
                            <p style={{ fontSize: '0.85rem' }}>Select a note from the left panel or click "+ New Diary Page / Note".</p>
                          </div>
                        );
                      }
                      return (
                        <div className="notes-right-col" style={{ flex: 1, background: 'var(--bg-main)', borderRadius: '18px', border: '1px solid var(--border-color)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', height: '100%', overflowY: 'auto' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                            <div style={{ flex: 1, minWidth: '240px' }}>
                              <input
                                type="text"
                                disabled={notesViewMode === 'trash'}
                                value={currentNote.title}
                                onChange={(e) => {
                                  if (notesViewMode === 'active') {
                                    setNotesList(notesList.map(n => n.id === currentNote.id ? { ...n, title: e.target.value, date: todayKey(userProfile.timezone) } : n));
                                  }
                                }}
                                onBlur={() => handleUpdateNoteDb(currentNote)}
                                style={{ width: '100%', fontSize: '1.3rem', fontWeight: 800, background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none' }}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                              {notesViewMode === 'active' ? (
                                <>
                                  <button
                                    onClick={() => {
                                      const trashedNote = { ...currentNote, deletedAt: Date.now(), is_trashed: 1 };
                                      setTrashNotes([trashedNote, ...trashNotes]);
                                      const nextList = notesList.filter(n => n.id !== currentNote.id);
                                      setNotesList(nextList);
                                      handleUpdateNoteDb(trashedNote);
                                      showToast('Note moved to Trash. Click 🗑️ Trash to restore anytime!');
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
                                      const restoredNote = { ...currentNote, is_trashed: 0, deletedAt: null, deleted_at: null };
                                      handleUpdateNoteDb(restoredNote);
                                      setNotesList(prev => [restoredNote, ...prev]);
                                      const remainingTrash = trashNotes.filter(n => n.id !== currentNote.id);
                                      setTrashNotes(remainingTrash);
                                      // Stay on trash tab; select next trash note if available
                                      if (remainingTrash.length > 0) {
                                        setActiveNoteId(remainingTrash[0].id);
                                      } else {
                                        setActiveNoteId(null);
                                      }
                                      showToast('Note restored to active notes!');
                                    }}
                                    className="blue-btn"
                                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                                  >
                                    ♻️ Restore Note
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const noteId = currentNote.id;
                                      const remainingTrash = trashNotes.filter(n => n.id !== noteId);
                                      setTrashNotes(remainingTrash);
                                      // Select next trash note or clear selection
                                      setActiveNoteId(remainingTrash.length > 0 ? remainingTrash[0].id : null);
                                      try {
                                        const delRes = await fetch(getApiUrl('/api/notes'), {
                                          method: 'DELETE',
                                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                          body: JSON.stringify({ id: noteId })
                                        });
                                        if (delRes.ok) {
                                          showToast('Note permanently deleted', 'success');
                                        } else {
                                          showToast('Failed to delete note', 'error');
                                        }
                                      } catch(e){
                                        console.error(e);
                                        showToast('Failed to delete note', 'error');
                                      }
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
                                setNotesList(notesList.map(n => n.id === currentNote.id ? { ...n, content: e.target.value, date: todayKey(userProfile.timezone) } : n));
                              }
                            }}
                            onBlur={() => handleUpdateNoteDb(currentNote)}
                            placeholder="Write your diary entry, personal reflection, or goals..."
                            style={{ flex: 1, width: '100%', minHeight: '280px', padding: '18px', borderRadius: '14px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '1rem', lineHeight: '1.6', outline: 'none', resize: 'none', opacity: notesViewMode === 'trash' ? 0.7 : 1 }}
                          />

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            <span>{notesViewMode === 'active' ? '' : '🗑️ Viewing note in Trash. Restore it to edit or keep permanently.'}</span>
                            {notesViewMode === 'active' ? (
                              <button
                                onClick={async () => {
                                  await handleUpdateNoteDb(currentNote);
                                  showToast('Successfully saved', 'success');
                                }}
                                className="blue-btn"
                                style={{ padding: '8px 20px', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                              >
                                <Save size={16} /> Save Note
                              </button>
                            ) : (
                              <span style={{ fontWeight: 700, color: '#ef4444' }}>In Trash Bin</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                </TabErrorBoundary>
              )}

              {/* 3) MONEY TRACKING */}
              {activeTab === 'finance' && (
                <TabErrorBoundary tabName="Finance & Money">
                  <MoneyTracker
                    transactions={transactions}
                    setTransactions={setTransactions}
                    token={token}
                    showToast={showToast}
                    currency={userProfile.currency || '$'}
                    timeRange={timeRange}
                    setTimeframe={setTimeRange}
                    userProfile={userProfile}
                    timezone={userProfile.timezone}
                    showForm={showFinanceForm}
                    setShowForm={setShowFinanceForm}
                    customStartDate={customStartDate}
                    customEndDate={customEndDate}
                  />
                </TabErrorBoundary>
              )}

              {/* 4) BODY & GYM */}
              {(activeTab === 'body' || activeTab === 'gym') && (
                <TabErrorBoundary tabName="Body & Gym">
                  <BodyGym
                    token={token}
                    showToast={showToast}
                    timeRange={timeRange}
                    userProfile={userProfile}
                    bodyStats={bodyStats}
                    setBodyStats={setBodyStats}
                    workouts={workouts}
                    setWorkouts={setWorkouts}
                    showForm={showWorkoutForm}
                    setShowForm={setShowWorkoutForm}
                    isEditSplitOpen={isEditSplitOpen}
                    setIsEditSplitOpen={setIsEditSplitOpen}
                  />
                </TabErrorBoundary>
              )}

              {/* 5) SLEEP & RECOVERY */}
              {activeTab === 'sleep' && (
                <TabErrorBoundary tabName="Sleep & Recovery">
                  <SleepTracker
                    token={token}
                    showToast={showToast}
                    timeRange={timeRange}
                    userProfile={userProfile}
                    sleepLogs={sleepLogs}
                    setSleepLogs={setSleepLogs}
                  />
                </TabErrorBoundary>
              )}

              {/* 6) MASTER ANALYTICS HUB */}
              {activeTab === 'analytics' && (
                <TabErrorBoundary tabName="Master Analytics">
                  <AnalyticsPanel
                    token={token}
                    showToast={showToast}
                    currency={userProfile.currency || '$'}
                    timeRange={timeRange}
                    userProfile={userProfile}
                  />
                </TabErrorBoundary>
              )}

              {/* 7) SETTINGS & PROFILE */}
              {activeTab === 'settings' && (
                <TabErrorBoundary tabName="Settings">
                  <SettingsPanel
                    userProfile={userProfile}
                    setUserProfile={setUserProfile}
                    aiName={aiName}
                    setAiName={setAiName}
                    aiProvider={aiProvider}
                    setAiProvider={setAiProvider}
                    geminiApiKey={geminiApiKey}
                    setGeminiApiKey={setGeminiApiKey}
                    groqApiKey={groqApiKey}
                    setGroqApiKey={setGroqApiKey}
                    themeMode={themeMode}
                    setThemeMode={setThemeMode}
                    token={token}
                    showToast={showToast}
                    handleLogout={handleLogout}
                    settingsSaved={settingsSaved}
                    setSettingsSaved={setSettingsSaved}
                    chatResetTime={userProfile.chat_reset_time || '00:00'}
                    setChatResetTime={(val) => setUserProfile({ ...userProfile, chat_reset_time: val })}
                    onResetAllAccountData={handleResetAllAccountData}
                  />
                </TabErrorBoundary>
              )}

            </div>

          </section>

          {/* PERSISTENT SIDE-BY-SIDE AI COACH PANEL (Always accessible across any tab) */}
          {isAiSidePanelOpen && activeTab !== 'ai' && (
              <aside className="animate-entrance ai-sidebar" style={{ width: '370px', height: '100vh', background: 'var(--bg-main)', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, position: 'relative', zIndex: 50 }}>
              <div style={{ padding: '20px 24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-blue)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Bot size={18} /> {aiName}
                  </h4>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={handleClearAiChat}
                    title="Clear Chat History"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button 
                    onClick={() => setIsAiSidePanelOpen(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div ref={sideAiChatScrollRef} style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {aiMessages.map(msg => (
                  <div 
                    key={msg.id} 
                    style={{ 
                      alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '90%',
                      background: msg.sender === 'user' ? 'var(--accent-blue)' : 'var(--bg-card)',
                      color: msg.sender === 'user' ? 'var(--accent-text)' : 'var(--text-main)',
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

          {/* MOBILE BOTTOM NAVIGATION BAR & DRAWER */}
          <nav className="mobile-bottom-nav">
            <button className={`mobile-nav-btn ${activeTab === 'today' ? 'active' : ''}`} onClick={() => setActiveTab('today')}>
              <Clock size={22} />
              <span>Today</span>
            </button>
            <button className={`mobile-nav-btn ${activeTab === 'habits' ? 'active' : ''}`} onClick={() => setActiveTab('habits')}>
              <CheckCircle2 size={22} />
              <span>Daily</span>
            </button>
            <button className={`mobile-nav-btn ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
              <Bot size={22} />
              <span>AI</span>
            </button>
            <button className={`mobile-nav-btn ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}>
              <DollarSign size={22} />
              <span>Money</span>
            </button>
            <button className={`mobile-nav-btn ${activeTab === 'body' ? 'active' : ''}`} onClick={() => setActiveTab('body')}>
              <Dumbbell size={22} />
              <span>Body</span>
            </button>
            <button className="mobile-nav-btn" onClick={() => setShowMobileMoreMenu(true)}>
              <Menu size={22} />
              <span>More</span>
            </button>
          </nav>
          
          {showMobileMoreMenu && (
            <div className="mobile-more-overlay" onClick={() => setShowMobileMoreMenu(false)}>
              <div className="mobile-more-drawer animate-entrance" onClick={e => e.stopPropagation()}>
                <div className="drawer-header">
                  <h3>More Options</h3>
                  <button onClick={() => setShowMobileMoreMenu(false)}><X size={20}/></button>
                </div>
                <div className="drawer-grid">
                  <button className={`drawer-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => { setActiveTab('notes'); setShowMobileMoreMenu(false); }}>
                    <BookOpen size={20} />
                    <span>Notes</span>
                  </button>
                  <button className={`drawer-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => { setActiveTab('calendar'); setShowMobileMoreMenu(false); }}>
                    <Calendar size={20} />
                    <span>Calendar</span>
                  </button>
                  <button className={`drawer-btn ${activeTab === 'water' ? 'active' : ''}`} onClick={() => { setActiveTab('water'); setShowMobileMoreMenu(false); }}>
                    <Droplet size={20} />
                    <span>Water</span>
                  </button>
                  <button className={`drawer-btn ${activeTab === 'sleep' ? 'active' : ''}`} onClick={() => { setActiveTab('sleep'); setShowMobileMoreMenu(false); }}>
                    <SleepIcon size={20} />
                    <span>Sleep</span>
                  </button>
                  <button className={`drawer-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => { setActiveTab('analytics'); setShowMobileMoreMenu(false); }}>
                    <BarChart3 size={20} />
                    <span>Analytics</span>
                  </button>
                  <button className={`drawer-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { setActiveTab('settings'); setShowMobileMoreMenu(false); }}>
                    <Settings size={20} />
                    <span>Settings</span>
                  </button>
                  <button className="drawer-btn logout-btn" onClick={handleLogout}>
                    <LogOut size={20} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Top-Right In-App Toast Notification */}
      {toast.visible && (
        <div className="toast-container">
          <div 
            className={`toast toast-${toast.type || 'success'} ${toast.isHiding ? 'hiding' : ''}`}
            onClick={() => setToast({ message: '', type: '', visible: false, isHiding: false })}
          >
            <div className="toast-icon">
              {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
            </div>
            <span className="toast-message">{toast.message}</span>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Delete"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}
