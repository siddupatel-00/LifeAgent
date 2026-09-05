import { getApiUrl } from './utils/apiUrl';
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
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
import NotesPanel from './components/NotesPanel';
import FounderPortal from './components/FounderPortal';
import LandingPage from './components/landing/LandingPage';
import ConfirmModal from './components/ConfirmModal';
import Modal from './components/Modal';
import { todayKey, localTimeZone, getWeekDays, isHabitScheduledOnDay, ALL_WEEK_DAYS } from './utils/date';
import WaterReminder from './components/WaterReminder';
import TabErrorBoundary from './components/TabErrorBoundary';
import { regenerateAllReminders, scheduleHabitReminders, scheduleEventReminders, cancelEntityReminders, isRegenNeeded, requestNotificationPermission } from './utils/reminderScheduler';
import ReminderEditor from './components/ReminderEditor';
import Navbar from './components/landing/Navbar';

// Auto-reload on stale Vite chunk errors across deployments
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', () => {
    window.location.reload();
  });
}

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

const readCachedJson = (key, fallback) => {
  const value = safeStorage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    safeStorage.removeItem(key);
    return fallback;
  }
};

const parseReminders = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function App() {
  const [themeMode, setThemeMode] = useState(() => safeStorage.getItem('themeMode') || 'pc'); // 'dark', 'light', 'pc'
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeDropdownRef = useRef(null);

  // Sync initial page with URL pathname (/dashboard, /founder, /waitlist, /contact, or /)
  const [currentPage, setCurrentPage] = useState(() => {
    const path = window.location.pathname;
    const token = safeStorage.getItem('token');
    const isAuth = !!token;
    
    if (path.includes('/founder')) return 'founder';
    if (isAuth) return 'dashboard';
    if (path.includes('/dashboard') || SLUG_TO_TAB[path]) return 'auth';
    if (path.includes('/auth') || path.includes('/login')) return 'auth';
    if (path.includes('/message') || path.includes('/contact') || path.includes('/waitlist')) return 'message';
    
    return 'landing';
  });

  // Helper to change page and URL address bar simultaneously
  const navigate = (page, path) => {
    const isAuth = !!safeStorage.getItem('token');
    if (page === 'founder') {
      setCurrentPage('founder');
      window.history.pushState({}, '', '/founder');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (page === 'auth' && isAuth) {
      setCurrentPage('dashboard');
      window.history.pushState({}, '', '/dashboard');
      return;
    }
    setCurrentPage(page);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const isAuth = !!safeStorage.getItem('token');
      
      if (path.includes('/founder')) {
        setCurrentPage('founder');
      } else if (path.includes('/dashboard') || SLUG_TO_TAB[path]) {
        if (!isAuth) window.history.replaceState({}, '', '/auth');
        setCurrentPage(isAuth ? 'dashboard' : 'auth');
        if (SLUG_TO_TAB[path] && isAuth) {
          setActiveTabRaw(SLUG_TO_TAB[path]);
        }
      } else if (path.includes('/auth') || path === '/login') {
        setCurrentPage(isAuth ? 'dashboard' : 'auth');
      } else if (path.includes('/message') || path.includes('/contact') || path.includes('/waitlist')) {
        setCurrentPage('message');
      } else {
        setCurrentPage(isAuth ? 'dashboard' : 'landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Form state for Drop a Message to Founder
  const [founderMsgName, setFounderMsgName] = useState('');
  const [founderMsgEmail, setFounderMsgEmail] = useState('');
  const [founderMsgText, setFounderMsgText] = useState('');
  const [founderMsgSending, setFounderMsgSending] = useState(false);
  const [founderMsgSuccess, setFounderMsgSuccess] = useState(false);

  // Form state for Waitlist Legacy
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

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

  // Dashboard state & Global Timeframe Filter
  const [activeTabRaw, setActiveTabRaw] = useState(() => {
    const path = window.location.pathname;
    return SLUG_TO_TAB[path] || 'today';
  });
  const activeTab = activeTabRaw;
  const [visitedTabs, setVisitedTabs] = useState(() => new Set(['today', activeTabRaw]));

  useEffect(() => {
    if (activeTab && !visitedTabs.has(activeTab)) {
      setVisitedTabs(prev => new Set([...prev, activeTab]));
    }
  }, [activeTab]);

  const setActiveTab = (tab) => {
    if (isAuthenticated) setCurrentPage('dashboard');
    setActiveTabRaw(tab);
    setVisitedTabs(prev => new Set([...prev, tab]));
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

  const [todayWidgetsConfig, setTodayWidgetsConfig] = useState(() => {
    return readCachedJson('cache_todayWidgetsConfig', { showWorkout: true, showProtein: true, showHydration: true });
  });

  useEffect(() => {
    safeStorage.setItem('cache_todayWidgetsConfig', JSON.stringify(todayWidgetsConfig));
  }, [todayWidgetsConfig]);
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
      if (!res.ok) {
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
        const savedWidgetsConfig = safeStorage.getItem('cache_todayWidgetsConfig');
        safeStorage.clear();
        if (savedThemeMode) safeStorage.setItem('themeMode', savedThemeMode);
        if (savedThemeColor) safeStorage.setItem('themeColor', savedThemeColor);
        if (savedWidgetsConfig) safeStorage.setItem('cache_todayWidgetsConfig', savedWidgetsConfig);

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
    const savedWidgetsConfig = safeStorage.getItem('cache_todayWidgetsConfig');
    safeStorage.clear();
    if (savedThemeMode) safeStorage.setItem('themeMode', savedThemeMode);
    if (savedThemeColor) safeStorage.setItem('themeColor', savedThemeColor);
    if (savedWidgetsConfig) safeStorage.setItem('cache_todayWidgetsConfig', savedWidgetsConfig);
    setToken('');
    setIsAuthenticated(false);
    setAuthMode('login');
    navigate('auth', '/auth');
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
  const [aiMessages, setAiMessages] = useState(() => readCachedJson('cache_aiMessages', []));
  const [inputMessage, setInputMessage] = useState('');
  const [aiName, setAiName] = useState('AI');
  const mainAiChatScrollRef = useRef(null);
  const sideAiChatScrollRef = useRef(null);
  const mainContentScrollRef = useRef(null);

  // Auto-scroll main workspace container to top on tab switch so every tab starts cleanly and scrolls smoothly
  useEffect(() => {
    if (mainContentScrollRef.current) {
      mainContentScrollRef.current.scrollTop = 0;
    }
  }, [activeTab]);

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
    const scrollChatToBottom = (ref) => {
      if (ref?.current) {
        requestAnimationFrame(() => {
          if (ref.current) {
            ref.current.scrollTop = ref.current.scrollHeight;
          }
        });
      }
    };
    scrollChatToBottom(mainAiChatScrollRef);
    scrollChatToBottom(sideAiChatScrollRef);
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
  const [habits, setHabits] = useState(() => readCachedJson('cache_habits', []));
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [isEditHabitModalOpen, setIsEditHabitModalOpen] = useState(false);
  const [editingHabitData, setEditingHabitData] = useState(null);
  const [newHabitData, setNewHabitData] = useState({ title: '', category: '', target: '', challengeMode: false, challengeDays: 30, durationMode: 'preset', frequency: 'daily', customDays: ['Mon', 'Wed', 'Fri'], intervalDays: 0, interval_days: 0, reminders: [] });
  const [customPillarInput, setCustomPillarInput] = useState('');
  const [newTodayItemData, setNewTodayItemData] = useState({ title: '', category: 'Coding', time: '10:00 AM' });
  const [isAddTodayItemOpen, setIsAddTodayItemOpen] = useState(false);
  const [todayItems, setTodayItems] = useState(() => readCachedJson('cache_todayItems', []));
  const [habitCardViews, setHabitCardViews] = useState({}); // { habitId: 'progress' | 'heatmap' }
  const [habitMenuOpen, setHabitMenuOpen] = useState(null); // habitId
  const [habitNotificationsEnabled, setHabitNotificationsEnabled] = useState(() => {
    return safeStorage.getItem('habitNotifications_enabled') === 'true';
  });
  // Habit reminder editing state
  const [editHabitReminderId, setEditHabitReminderId] = useState(null); // habitId being edited
  const [editHabitReminderList, setEditHabitReminderList] = useState([]);

  // 3) Finance state
  const [transactions, setTransactions] = useState(() => readCachedJson('cache_transactions', []));
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState('spend');

  // 4) Body & Gym state
  const [workouts, setWorkouts] = useState(() => readCachedJson('cache_workouts', []));
  const [bodyStats, setBodyStats] = useState(() => readCachedJson('cache_bodyStats', []));

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
  const [sleepLogs, setSleepLogs] = useState(() => readCachedJson('cache_sleepLogs', []));

  // 6) Notes & Diary state
  const [notesList, setNotesList] = useState(() => readCachedJson('cache_notesList', []));
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [expandedNoteId, setExpandedNoteId] = useState(null);
  const [isFloatingDiaryOpen, setIsFloatingDiaryOpen] = useState(false);
  const [floatingDiaryContent, setFloatingDiaryContent] = useState("");
  const [floatingDiaryShare, setFloatingDiaryShare] = useState(true);
  const [trashNotes, setTrashNotes] = useState(() => readCachedJson('cache_trashNotes', []));
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
  const [calendarEvents, setCalendarEvents] = useState(() => readCachedJson('cache_calendarEvents', []));
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

      const bootRes = await fetch(getApiUrl(`/api/bootstrap?client_date=${clientDate}`), { headers }).catch(e => null);

      if (bootRes && bootRes.ok) {
        const data = await bootRes.json();
        if (data) {
          // 1. User Settings
          if (data.settings) {
            const sData = data.settings;
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

          // 2. Today Checklist
          const todayData = data.todayItems || [];
          const mappedToday = todayData.map(t => ({ id: t.id, time: t.time, title: t.label, category: t.category, checked: !!t.checked, habitId: t.habit_id || null }));
          setTodayItems(mappedToday);
          safeStorage.setItem('cache_todayItems', JSON.stringify(mappedToday));

          // 3. Habits
          const hData = data.habits || [];
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
            interval_days: h.interval_days || 0,
            reminders: parseReminders(h.reminders)
          }));
          setHabits(mappedHabits);
          safeStorage.setItem('cache_habits', JSON.stringify(mappedHabits));

          // 4. Body Stats
          if (data.bodyStats) {
            setBodyStats(data.bodyStats);
            safeStorage.setItem('cache_bodyStats', JSON.stringify(data.bodyStats));
          }

          // 5. Calendar Events
          const calData = data.calendarEvents || [];
          const mappedCal = calData.map(c => ({
            id: c.id,
            title: c.title,
            date: c.date,
            time: c.time || '',
            reminders: parseReminders(c.reminders),
            color: c.color,
            status: c.status,
            endDate: c.end_date
          }));
          setCalendarEvents(mappedCal);
          safeStorage.setItem('cache_calendarEvents', JSON.stringify(mappedCal));

          // 6. Workouts
          if (Array.isArray(data.workouts)) {
            setWorkouts(data.workouts);
            safeStorage.setItem('cache_workouts', JSON.stringify(data.workouts));
          }

          // 7. Transactions
          if (Array.isArray(data.transactions)) {
            const mappedTx = data.transactions.map(t => ({ id: t.id, title: t.title, amount: t.amount, type: t.type, date: t.date, category: t.category, notes: t.notes }));
            setTransactions(mappedTx);
            safeStorage.setItem('cache_transactions', JSON.stringify(mappedTx));
          }

          // 8. Notes
          if (Array.isArray(data.notes)) {
            let activeNotes = data.notes.filter(n => !n.is_trashed).map(n => ({ id: n.id, title: n.title, content: n.content, category: n.category, date: n.date, shareWithAi: !!n.share_with_ai }));
            const trashedNotes = data.notes.filter(n => !!n.is_trashed).map(n => ({ id: n.id, title: n.title, content: n.content, category: n.category, date: n.date, shareWithAi: !!n.share_with_ai, deletedAt: n.deleted_at ? new Date(n.deleted_at).getTime() : Date.now() }));
            setTrashNotes(trashedNotes);
            safeStorage.setItem('cache_trashNotes', JSON.stringify(trashedNotes));
            setNotesList(activeNotes);
            safeStorage.setItem('cache_notesList', JSON.stringify(activeNotes));
          }

          // 9. Sleep Logs
          if (Array.isArray(data.sleepLogs)) {
            setSleepLogs(data.sleepLogs);
            safeStorage.setItem('cache_sleepLogs', JSON.stringify(data.sleepLogs));
          }

          loadedTabsRef.current = { startup: true, body: true, finance: true, notes: true, sleep: true, calendar: true };
        }
      }
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
      const txRes = await fetch(getApiUrl('/api/transactions'), { headers }).catch(e => null);
      if (txRes && txRes.ok) {
        const txData = await txRes.json();
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
      const sleepRes = await fetch(getApiUrl('/api/fitness?type=sleep'), { headers }).catch(e => null);
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
        const mappedCal = calData.map(c => ({
          id: c.id,
          title: c.title,
          date: c.date,
          time: c.time || '',
          reminders: parseReminders(c.reminders),
          color: c.color,
          status: c.status,
          endDate: c.end_date
        }));
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
        const savedWidgetsConfig = safeStorage.getItem('cache_todayWidgetsConfig');
        safeStorage.clear();
        if (savedToken) safeStorage.setItem('token', savedToken);
        if (savedThemeMode) safeStorage.setItem('themeMode', savedThemeMode);
        if (savedThemeColor) safeStorage.setItem('themeColor', savedThemeColor);
        if (savedUserProfile) safeStorage.setItem('cache_userProfile', savedUserProfile);
        if (savedWidgetsConfig) safeStorage.setItem('cache_todayWidgetsConfig', savedWidgetsConfig);
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

  const handleDeleteAccount = async () => {
    if (!token) return;
    try {
      const res = await fetch(getApiUrl('/api/settings?action=delete-account'), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Account permanently deleted', 'info');
        handleLogout();
      } else {
        showToast(data.error || 'Failed to delete account', 'error');
      }
    } catch (err) {
      console.error('Delete account error:', err);
      showToast('Failed to delete account', 'error');
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
    } catch (e) {
      if (import.meta.env.DEV) console.warn('Today sync failed (offline-first, will retry):', e);
    }
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
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Habit sync failed (offline-first, will retry):', e);
      }
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

  // Morning Audit & Summary scheduling is handled by the regenerateAllReminders effect below.


  // ─── Regenerate ALL Capacitor reminders (on data load + daily rollover + settings change) ─────
  useEffect(() => {
    if (!isAuthenticated) return;

    const globalEnabled = userProfile?.remindersGlobalEnabled !== false && userProfile?.reminders_global_enabled !== 0;
    const isWaterEnabled = userProfile?.waterReminderEnabled !== undefined ? !!userProfile.waterReminderEnabled : (userProfile?.water_reminder_enabled !== 0 && userProfile?.water_reminder_enabled !== false);
    const isSleepEnabled = userProfile?.sleepReminderEnabled !== undefined ? !!userProfile.sleepReminderEnabled : (userProfile?.sleep_reminder_enabled !== 0 && userProfile?.sleep_reminder_enabled !== false);
    const isWorkoutEnabled = userProfile?.workoutReminderEnabled !== undefined ? !!userProfile.workoutReminderEnabled : (userProfile?.workout_reminder_enabled !== 0 && userProfile?.workout_reminder_enabled !== false);
    const isSummaryEnabled = userProfile?.summaryReminderEnabled !== undefined ? !!userProfile.summaryReminderEnabled : (userProfile?.summary_reminder_enabled !== 0 && userProfile?.summary_reminder_enabled !== false);

    regenerateAllReminders({
      habits: {
        habits: Array.isArray(habits) ? habits : [],
        daily7pmEnabled: habitNotificationsEnabled,
        userName: userProfile?.name || 'User',
      },
      events: Array.isArray(calendarEvents) ? calendarEvents : [],
      waterSettings: {
        enabled: isWaterEnabled,
        startTime: userProfile?.water_reminder_start || '08:00',
        endTime: userProfile?.water_reminder_end || '22:00',
        intervalMinutes: userProfile?.water_reminder_interval || 60,
        goal: userProfile?.water_target_goal || 2.5,
        hydration: 0,
      },
      sleepSettings: {
        enabled: isSleepEnabled,
        reminderTime: userProfile?.sleepReminderTime || userProfile?.sleep_reminder_time || '22:00',
      },
      workoutSettings: {
        enabled: isWorkoutEnabled,
        reminderTime: userProfile?.workoutReminderTime || userProfile?.workout_reminder_time || '07:00',
        repeatRule: userProfile?.workoutReminderRepeat || userProfile?.workout_reminder_repeat || { type: 'daily' },
      },
      summarySettings: {
        enabled: isSummaryEnabled,
        reminderTime: userProfile?.summaryReminderTime || userProfile?.summary_reminder_time || '07:00',
        userName: userProfile?.name || 'User',
        calendarEvents: Array.isArray(calendarEvents) ? calendarEvents : [],
      },
      globalEnabled,
    }).catch(err => console.warn('[App] regenerateAllReminders error:', err));
  }, [
    isAuthenticated,
    habits,
    calendarEvents,
    habitNotificationsEnabled,
    userProfile?.name,
    userProfile?.remindersGlobalEnabled,
    userProfile?.reminders_global_enabled,
    userProfile?.sleepReminderEnabled,
    userProfile?.sleep_reminder_enabled,
    userProfile?.sleepReminderTime,
    userProfile?.sleep_reminder_time,
    userProfile?.workoutReminderEnabled,
    userProfile?.workout_reminder_enabled,
    userProfile?.workoutReminderTime,
    userProfile?.workout_reminder_time,
    userProfile?.workoutReminderRepeat,
    userProfile?.workout_reminder_repeat,
    userProfile?.summaryReminderEnabled,
    userProfile?.summary_reminder_enabled,
    userProfile?.summaryReminderTime,
    userProfile?.summary_reminder_time,
    userProfile?.waterReminderEnabled,
    userProfile?.water_reminder_enabled,
    userProfile?.water_reminder_start,
    userProfile?.water_reminder_end,
    userProfile?.water_reminder_interval,
  ]);

  // ─── Save habit reminders ──────────────────────────────────────────────────
  const handleSaveHabitReminders = (habitId) => {
    const updatedReminders = editHabitReminderList;
    const nextHabits = habits.map(h => h.id === habitId ? { ...h, reminders: updatedReminders } : h);
    
    // Instantly update state, close modal, and display toast (0ms latency)
    setHabits(nextHabits);
    setEditHabitReminderId(null);
    showToast?.('Habit reminders saved!', 'success');

    // Register the Android alarm before doing any network work. Waiting for the
    // PUT used to leave no OS alarm when a user saved a reminder and immediately
    // swiped the app away from Recents; the JS task was stopped first.
    const globalEnabled = userProfile?.remindersGlobalEnabled !== false
      && userProfile?.reminders_global_enabled !== 0;
    scheduleHabitReminders({
      habits: nextHabits,
      daily7pmEnabled: habitNotificationsEnabled,
      userName: userProfile?.name || 'User',
    }, globalEnabled).catch(console.error);

    // Persist the reminder in the background after the local alarm is safe.
    (async () => {
      try {
        const t = safeStorage.getItem('token');
        if (t) {
          await fetch(getApiUrl('/api/habits'), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
            body: JSON.stringify({
              id: habitId,
              reminders: updatedReminders,
              // Preserve legacy single reminder_time field for compatibility
              ...(updatedReminders.length === 1 ? { reminder_time: updatedReminders[0].reminder_time || updatedReminders[0].time } : {})
            })
          });
        }
      } catch (e) {
        console.error('Failed to save habit reminders:', e);
      }
    })();
  };



  // Universal sync helpers between Today routine and Daily Works (habits)
  // Sync is now 1:1 via habitId linkage
  const handleToggleTodayItem = (targetId) => {
    // Check if targetId is a synced habit item (e.g. "synced-12")
    const isSynced = typeof targetId === 'string' && targetId.startsWith('synced-');
    const syncedHabitId = isSynced ? targetId.replace('synced-', '') : null;

    if (isSynced) {
      const habit = habits.find(h => String(h.id) === String(syncedHabitId));
      if (!habit) return;

      const nextChecked = !habit.checkedToday;
      const newStreak = nextChecked ? (habit.streak || 0) + 1 : Math.max(0, (habit.streak || 0) - 1);

      let isArchived = habit.archived;
      let compAt = habit.completedAt;
      if (nextChecked && habit.challengeDays > 0 && habit.startDate) {
        const elapsed = Math.floor((new Date() - new Date(habit.startDate)) / (1000 * 60 * 60 * 24));
        const daysStr = Math.min(Math.max(elapsed + 1, 1), habit.challengeDays);
        if (daysStr >= habit.challengeDays) {
          isArchived = true;
          compAt = new Date().toISOString();
        }
      }

      handleUpdateHabitDb(habit.id, newStreak, nextChecked, habit.pausedUntil, isArchived, compAt);

      setHabits(prev => prev.map(h => String(h.id) === String(habit.id) ? { ...h, checkedToday: nextChecked, streak: newStreak, archived: isArchived, completedAt: compAt } : h));

      // Add or update entry in todayItems state & DB
      setTodayItems(prev => {
        const existingIdx = prev.findIndex(ti => String(ti.habitId) === String(habit.id) || ti.id === targetId || (ti.title && habit.title && ti.title.toLowerCase() === habit.title.toLowerCase()));
        if (existingIdx >= 0) {
          const updated = [...prev];
          const existing = updated[existingIdx];
          handleUpdateTodayDb(existing.id, nextChecked);
          updated[existingIdx] = { ...existing, checked: nextChecked, habitId: habit.id };
          return updated;
        } else {
          const newId = Date.now();
          const newTodayItem = { id: newId, habitId: habit.id, title: habit.title, category: habit.category || '', checked: nextChecked, time: 'Daily' };
          if (token) {
            fetch(getApiUrl('/api/today'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ label: habit.title, category: habit.category || '', checked: nextChecked ? 1 : 0, habit_id: habit.id, time: 'Daily', client_date: todayKey(userProfile?.timezone) })
            }).catch(console.error);
          }
          return [...prev, newTodayItem];
        }
      });

      if (nextChecked) {
        showToast?.(`🎉 Checked off "${habit.title}"! Streak: ${newStreak} days`, 'success');
      } else {
        showToast?.(`Unchecked "${habit.title}"`, 'info');
      }
      return;
    }

    // Standard today item
    const currentItem = (todayItems || []).find(i => i.id === targetId);
    const nextChecked = currentItem ? !currentItem.checked : true;

    // Sync linked habit if present
    const linkedHabitId = currentItem?.habitId || currentItem?.habit_id;
    const linkedHabit = habits.find(h => (linkedHabitId && String(h.id) === String(linkedHabitId)) || (currentItem?.title && h.title && currentItem.title.toLowerCase() === h.title.toLowerCase()));

    if (linkedHabit) {
      const newStreak = nextChecked ? (linkedHabit.streak || 0) + 1 : Math.max(0, (linkedHabit.streak || 0) - 1);
      handleUpdateHabitDb(linkedHabit.id, newStreak, nextChecked, linkedHabit.pausedUntil);
      setHabits(prev => prev.map(h => String(h.id) === String(linkedHabit.id) ? { ...h, checkedToday: nextChecked, streak: newStreak } : h));
    }

    handleUpdateTodayDb(targetId, nextChecked);
    setTodayItems(prev => prev.map(i => i.id === targetId ? { ...i, checked: nextChecked, habitId: linkedHabit ? linkedHabit.id : i.habitId } : i));

    if (currentItem) {
      if (nextChecked) {
        showToast?.(`🎉 Checked off "${currentItem.title || currentItem.label || 'item'}"!`, 'success');
      } else {
        showToast?.(`Unchecked "${currentItem.title || currentItem.label || 'item'}"`, 'info');
      }
    }
  };

  const handleToggleAllToday = () => {
    const activeHabits = (Array.isArray(habits) ? habits : []).filter(h => !h.archived && !h.completedAt && !h.pausedUntil);
    const rawToday = Array.isArray(todayItems) ? todayItems : [];
    
    // Determine targetState: if all active habits AND all today items are checked, uncheck all. Otherwise check all.
    const allHabitsChecked = activeHabits.length > 0 ? activeHabits.every(h => !!h.checkedToday) : true;
    const allTodayChecked = rawToday.length > 0 ? rawToday.every(i => !!i.checked) : true;
    const totalCount = activeHabits.length + rawToday.length;
    const allAreChecked = totalCount > 0 && allHabitsChecked && allTodayChecked;
    const targetState = !allAreChecked;
    
    // 1. Sync all active habits
    setHabits(prevHabits => prevHabits.map(h => {
      if (h.archived || h.completedAt || h.pausedUntil) return h;
      const wasChecked = !!h.checkedToday;
      let newStreak = h.streak || 0;
      if (targetState && !wasChecked) newStreak += 1;
      else if (!targetState && wasChecked) newStreak = Math.max(0, newStreak - 1);
      handleUpdateHabitDb(h.id, newStreak, targetState, h.pausedUntil);
      return { ...h, checkedToday: targetState, streak: newStreak };
    }));

    // 2. Sync all today items
    setTodayItems(prev => prev.map(i => {
      handleUpdateTodayDb(i.id, targetState);
      return { ...i, checked: targetState };
    }));

    const todayStr = todayKey(userProfile?.timezone);

    // 3. Mark Today's Gym Workout Split Complete if checking all
    if (targetState) {
      let splitList = [];
      try {
        if (userProfile?.workout_templates) splitList = JSON.parse(userProfile.workout_templates);
      } catch (e) {}
      const startCount = Number(userProfile?.workout_start_count || 0);
      const manualOffset = Number(userProfile?.manual_day_offset || 0);
      const workoutsDone = Math.max(0, (Array.isArray(workouts) ? workouts.length : 0) - startCount);
      const todaySplitIdx = splitList.length > 0 ? (workoutsDone + manualOffset) % splitList.length : 0;
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

      // 4. Mark Protein & Hydration Trackers to 100% Goal Target
      const safeBodyStats = Array.isArray(bodyStats) ? bodyStats : (bodyStats ? [bodyStats] : []);
      const todayStat = safeBodyStats.find(s => s && s.date === todayStr) || null;
      const latestStat = safeBodyStats.length > 0 ? safeBodyStats[0] : null;
      const targetW = Number(latestStat?.target_weight) || Number(todayStat?.target_weight) || 70;
      const targetP = Number(latestStat?.target_protein) || Number(todayStat?.target_protein) || 0;
      const proteinGoal = targetP > 0 ? targetP : (targetW > 0 ? Math.round(targetW * 2) : 140);
      const hydrationGoal = Number(safeStorage.getItem('water_target_goal')) || Number(latestStat?.hydration) || 3.0;

      const payload = {
        weight: Number(todayStat?.weight) || Number(latestStat?.weight) || 70,
        target_weight: targetW,
        protein: proteinGoal,
        target_protein: proteinGoal,
        hydration: hydrationGoal,
        date: todayStr
      };

      if (todayStat?.id) {
        payload.id = todayStat.id;
      }

      if (token) {
        fetch(getApiUrl('/api/fitness?type=body-stats'), {
          method: payload.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        }).catch(console.error);
      }

      setBodyStats(prev => {
        const list = Array.isArray(prev) ? prev : [];
        const exists = list.some(s => s && s.date === todayStr);
        if (exists) return list.map(s => s && s.date === todayStr ? { ...s, protein: proteinGoal, hydration: hydrationGoal } : s);
        return [{ ...payload, id: Date.now() }, ...list];
      });

      showToast?.('🎉 Ticked All Today (Habits, Workout, Protein & Water)!', 'success');
    } else {
      showToast?.('Unchecked items for today', 'info');
    }
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
          cancelEntityReminders('habit', h.id).catch(console.error);
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
    // Cancel native OS alarms and update state immediately before network call
    cancelEntityReminders('habit', id).catch(console.error);
    setHabits(prev => prev.filter(h => h.id !== id));
    setTodayItems(prev => prev.filter(ti => ti.habitId !== id));

    if (!token) return;
    try {
      await fetch(getApiUrl('/api/habits'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id })
      });
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
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = (e) => root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        if (media.addEventListener) {
          media.addEventListener('change', listener);
        } else if (media.addListener) {
          media.addListener(listener);
        }
        return () => {
          if (media.removeEventListener) {
            media.removeEventListener('change', listener);
          } else if (media.removeListener) {
            media.removeListener(listener);
          }
        };
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
      if (!e.target.closest('.theme-dropdown-menu') && !e.target.closest('.theme-toggle-btn')) {
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

  const handleSendFounderMessage = async (e) => {
    e.preventDefault();
    if (!founderMsgText.trim()) {
      showToast('Please enter a message.', 'error');
      return;
    }
    setFounderMsgSending(true);
    try {
      const response = await fetch(getApiUrl('/api/auth?action=founder_message'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: founderMsgName.trim() || 'Anonymous Visitor',
          email: founderMsgEmail.trim(),
          message: founderMsgText.trim()
        })
      });
      if (response.ok) {
        setFounderMsgSuccess(true);
        setFounderMsgText('');
        showToast('✓ Message sent directly to the founder!', 'success');
      } else {
        const err = await response.json().catch(() => ({}));
        showToast(err.error || 'Failed to send message. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Connection error. Please try again later.', 'error');
    } finally {
      setFounderMsgSending(false);
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
        [CALENDAR_EVENT]{"title":"Meeting","date":"${todayStr}","time":"07:00","endDate":null,"color":"#3b82f6","reminders":[{"reminder_time":"07:00","offset_minutes":0}]}[/CALENDAR_EVENT]

        CRITICAL FOR RECURRING / MULTI-DATE NOTIFICATION COMMANDS (e.g. "every Sunday at 7am", "all Sundays this year", "every day at 8am"):
        When the user asks for a recurring event or notification (e.g. "every Sunday at 7am in 2026"), you MUST generate ALL matching dates for the year in a "dates" array in [CALENDAR_EVENT] AND/OR output an [ADD_HABIT] tag WITH 7am reminder:
        - [ADD_HABIT]{"label":"Leet code weekly contest","category":"Coding","target":"Weekly","frequency":"weekly","custom_days":"0","reminders":[{"reminder_time":"07:00"}]}[/ADD_HABIT]
        - [CALENDAR_EVENT]{"title":"Leet code weekly contest","time":"07:00","color":"#3b82f6","reminders":[{"reminder_time":"07:00","offset_minutes":0}],"dates":["2026-08-09","2026-08-16","2026-08-23","2026-08-30","2026-09-06","2026-09-13","2026-09-20","2026-09-27","2026-10-04","2026-10-11","2026-10-18","2026-10-25","2026-11-01","2026-11-08","2026-11-15","2026-11-22","2026-11-29","2026-12-06","2026-12-13","2026-12-20","2026-12-27"]}[/CALENDAR_EVENT]

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
      let aiError = null;
      const cleanGeminiKey = (geminiApiKey || '').trim();
      const cleanGroqKey = (groqApiKey || '').trim();

      // 1. Direct Groq if configured
      if ((effectiveProvider === 'groq' || (!cleanGeminiKey && cleanGroqKey)) && cleanGroqKey) {
        const groqModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"];
        for (const m of groqModels) {
          try {
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${cleanGroqKey}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                model: m,
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: userMsgText }
                ]
              })
            });
            const data = await res.json();
            if (data.choices?.[0]?.message?.content) {
              responseText = data.choices[0].message.content;
              break;
            } else if (data.error) {
              aiError = new Error(data.error.message || 'Groq error');
            }
          } catch (e) {
            aiError = e;
          }
        }
      }

      // 2. Direct Gemini REST API if configured
      if (!responseText && cleanGeminiKey) {
        const geminiModels = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-1.5-flash-8b", "gemini-2.0-flash-exp", "gemini-pro"];
        for (const mName of geminiModels) {
          try {
            const fullPrompt = `${systemPrompt}\n\nUser Request: ${userMsgText}`;
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${cleanGeminiKey}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
              })
            });
            const data = await res.json();
            const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candidateText) {
              responseText = candidateText;
              break;
            } else if (data.error) {
              aiError = new Error(data.error.message || `Gemini ${mName} error`);
            }
          } catch (e) {
            aiError = e;
          }
        }

        // Direct SDK fallback
        if (!responseText) {
          try {
            const genAI = new GoogleGenerativeAI(cleanGeminiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(`${systemPrompt}\n\nUser: ${userMsgText}`);
            if (result && result.response) {
              responseText = result.response.text();
            }
          } catch (e) {
            aiError = e;
          }
        }
      }

      // 3. Fallback to server endpoint
      if (!responseText) {
        try {
          const res = await fetch(getApiUrl('/api/chat?action=generate'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              action: 'generate',
              prompt: userMsgText,
              systemPrompt,
              provider: effectiveProvider || aiProvider || 'gemini',
              apiKey: effectiveProvider === 'groq' ? cleanGroqKey : cleanGeminiKey
            })
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.text) {
            responseText = data.text;
          } else if (data.error) {
            aiError = new Error(data.error);
          }
        } catch (e) {
          aiError = e;
        }
      }

      if (!responseText) {
        throw aiError || new Error("Please verify your Gemini or Groq API key in Settings to use the AI Assistant.");
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
            const timeVal = data.time || '07:00';
            const remindersList = Array.isArray(data.reminders) && data.reminders.length > 0
              ? data.reminders
              : (data.time ? [{ reminder_time: data.time, offset_minutes: 0 }] : []);

            const datesList = Array.isArray(data.dates) && data.dates.length > 0
              ? data.dates
              : [data.date || todayStr];

            for (const dStr of datesList) {
              const res = await fetch(getApiUrl('/api/calendar'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                  title: data.title || 'AI Event',
                  date: dStr,
                  time: timeVal,
                  end_date: data.endDate || null,
                  color: data.color || '#3b82f6',
                  status: 'upcoming',
                  reminders: remindersList
                })
              });
              if (res.ok) {
                const saved = await res.json();
                newEvents.push({ ...saved, reminders: remindersList });
              }
            }
            finalReply = finalReply.replace(match[0], '').trim();
          } catch (err) {
            console.error("Failed to parse calendar event JSON", err);
          }
        }
        if (newEvents.length > 0) {
          setCalendarEvents(prev => {
            const updated = [...newEvents, ...prev];
            scheduleEventReminders(updated).catch(console.error);
            return updated;
          });
        }
      }

      // 2. Parse ADD_HABIT
      const habitMatches = [...responseText.matchAll(/\[ADD_HABIT\](.*?)\[\/ADD_HABIT\]/gs)];
      if (habitMatches.length > 0) {
        const addedHabits = [];
        for (const match of habitMatches) {
          try {
            const data = JSON.parse(match[1]);
            const remindersList = Array.isArray(data.reminders) && data.reminders.length > 0
              ? data.reminders
              : (data.reminder_time ? [{ reminder_time: data.reminder_time }] : []);

            const res = await fetch(getApiUrl('/api/habits'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                label: data.label || 'New Habit',
                category: data.category || 'General',
                target: data.target || 'Daily',
                frequency: data.frequency || 'daily',
                custom_days: data.custom_days || '',
                reminders: remindersList
              })
            });
            if (res.ok) {
              const saved = await res.json();
              addedHabits.push({ ...saved, reminders: remindersList });
            }
            finalReply = finalReply.replace(match[0], '').trim();
          } catch (err) {
            console.error("Failed to parse habit JSON", err);
          }
        }
        if (addedHabits.length > 0) {
          setHabits(prev => {
            const updated = [...prev, ...addedHabits.map(h => ({
              id: h.id,
              label: h.label,
              title: h.label,
              category: h.category,
              streak: h.streak || 0,
              target: h.target || '',
              frequency: h.frequency || 'daily',
              custom_days: h.custom_days || '',
              checkedToday: false,
              reminders: h.reminders || remindersList
            }))];
            const globalEnabled = userProfile?.remindersGlobalEnabled !== false && userProfile?.reminders_global_enabled !== 0;
            scheduleHabitReminders({
              habits: updated,
              daily7pmEnabled: userProfile?.habit_7pm_reminder_enabled !== 0,
              userName: userProfile?.name || 'User'
            }, globalEnabled).catch(console.error);
            return updated;
          });
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
            await fetch(getApiUrl('/api/fitness?type=sleep'), {
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

  return (
    <div className={(currentPage === 'dashboard' || currentPage === 'landing' || currentPage === 'auth' || currentPage === 'message' || currentPage === 'contact' || currentPage === 'waitlist' || currentPage === 'founder') ? '' : 'container'} style={(currentPage === 'dashboard' || currentPage === 'landing' || currentPage === 'auth' || currentPage === 'message' || currentPage === 'contact' || currentPage === 'waitlist' || currentPage === 'founder') ? { minHeight: '100vh', background: 'var(--bg-main)' } : { paddingBottom: '60px' }}>
      
      {/* NAVBAR (For /message and landing pages) */}
      {(currentPage === 'message' || currentPage === 'contact' || currentPage === 'waitlist') && (
        <Navbar
          onNavigate={navigate}
          isAuthenticated={isAuthenticated}
          onGetStarted={() => { setAuthMode('signup'); navigate('auth', '/auth'); }}
          onSignIn={() => { setAuthMode('login'); navigate('auth', '/auth'); }}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          currentPage="message"
        />
      )}

      {/* MODULAR PRODUCTION-READY LANDING PAGE (At /) */}
      {currentPage === 'landing' && (
        <LandingPage
          navigate={navigate}
          onNavigate={navigate}
          onGetStarted={() => { setWaitlistSuccess(false); setAuthMode('signup'); navigate('auth', '/auth'); }}
          onSignIn={() => { setWaitlistSuccess(false); setAuthMode('login'); navigate('auth', '/auth'); }}
          onJoinWaitlist={() => navigate('waitlist', '/waitlist')}
          token={token}
          isAuthenticated={isAuthenticated}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          themeColor={themeColor}
        />
      )}

      {/* DROP A MESSAGE TO FOUNDER PAGE (At /message, /contact) */}
      {(currentPage === 'message' || currentPage === 'contact' || currentPage === 'waitlist') && (
        <main className="animate-entrance" style={{ maxWidth: '580px', margin: '40px auto 60px', padding: '0 16px' }}>
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
            <div style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center', cursor: 'pointer' }} onClick={() => navigate('landing', '/')}>
              <span className="wordmark-mark" style={{ width: '48px', height: '48px', fontSize: '1.6rem' }}>L</span>
            </div>
            
            <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: '10px' }}>
              <span className="eyebrow-dot" /> direct note <span className="eyebrow-rule" /> to founder
            </div>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 500, letterSpacing: '-0.04em', marginBottom: '8px', color: 'var(--text-main)' }}>
              Drop a message to <em>the founder.</em>
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '28px', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Have feedback, ideas, feature requests, or questions? Send a direct note below. I read and respond to every message.
            </p>

            {!founderMsgSuccess ? (
              <form onSubmit={handleSendFounderMessage} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                <div>
                  <label className="micro-label" style={{ display: 'block', marginBottom: '6px' }}>Your Name (Optional)</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input 
                      type="text" 
                      placeholder="e.g. Alex"
                      value={founderMsgName} 
                      onChange={(e) => setFounderMsgName(e.target.value)} 
                      className="has-left-icon"
                      style={{ 
                        width: '100%', paddingLeft: '38px', paddingRight: '12px', paddingTop: '10px', paddingBottom: '10px',
                        borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', 
                        background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="micro-label" style={{ display: 'block', marginBottom: '6px' }}>Your Email or @Handle (Optional)</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input 
                      type="text" 
                      placeholder="e.g. alex@gmail.com or @alex_x"
                      value={founderMsgEmail} 
                      onChange={(e) => setFounderMsgEmail(e.target.value)} 
                      className="has-left-icon"
                      style={{ 
                        width: '100%', paddingLeft: '38px', paddingRight: '12px', paddingTop: '10px', paddingBottom: '10px',
                        borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', 
                        background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="micro-label" style={{ display: 'block', marginBottom: '6px' }}>Your Message *</label>
                  <textarea 
                    rows={4}
                    placeholder="Write your note, feedback, thoughts, or custom inquiries here..."
                    value={founderMsgText} 
                    onChange={(e) => setFounderMsgText(e.target.value)} 
                    required
                    style={{ 
                      width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', 
                      border: '1px solid var(--border-color)', background: 'var(--bg-main)', 
                      color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', resize: 'vertical',
                      fontFamily: "'DM Sans', sans-serif", minHeight: '110px'
                    }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={founderMsgSending}
                  className="blue-btn" 
                  style={{ justifyContent: 'center', padding: '12px', fontSize: '0.92rem', marginTop: '6px' }}
                >
                  {founderMsgSending ? 'Sending Message...' : 'Send Message to Founder ✉️'}
                </button>
              </form>
            ) : (
              <div style={{ padding: '24px', background: 'rgba(216, 242, 119, 0.08)', border: '1px solid #d8f277', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <CheckCircle2 color="#d8f277" size={44} style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Message delivered to founder.
                </h4>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6, fontSize: '0.88rem' }}>
                  Thank you for reaching out! Your note has been received and will be reviewed shortly.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button 
                    type="button"
                    className="secondary-btn" 
                    style={{ padding: '10px 18px', fontSize: '0.85rem' }} 
                    onClick={() => { setFounderMsgSuccess(false); setFounderMsgText(''); }}
                  >
                    Send Another Note
                  </button>
                  <button 
                    type="button"
                    className="blue-btn" 
                    style={{ padding: '10px 18px', fontSize: '0.85rem' }} 
                    onClick={() => navigate('landing', '/')}
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Official Creator: <strong style={{ color: 'var(--text-main)' }}>@Zenitsu_T7</strong></span>
              <button 
                type="button" 
                onClick={() => navigate('landing', '/')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', font: "500 0.76rem 'DM Mono', monospace" }}
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </main>
      )}

      {/* STOREFRONT FOOTER (Only visible on waitlist and contact pages) */}
      {currentPage !== 'dashboard' && currentPage !== 'landing' && currentPage !== 'auth' && currentPage !== 'founder' && (
        <footer className="storefront-footer container">
          <div className="storefront-footer-grid">
            {/* Column 1: Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', cursor: 'pointer' }} onClick={() => navigate('landing', '/')}>
                <span className="wordmark-mark">L</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-main)' }}>lifeagent</span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px', maxWidth: '300px' }}>
                One calm place for the systems that move you forward. Handcrafted for clarity and local telemetry.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', font: "500 0.68rem 'DM Mono', monospace", color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span className="status-dot" style={{ background: '#78a354', boxShadow: 'none' }} /> systems online
              </div>
            </div>

            {/* Column 2: Navigation */}
            <div>
              <h4 className="storefront-footer-col-title">Navigation</h4>
              <div className="storefront-footer-links">
                <button className="storefront-footer-link" onClick={() => navigate('landing', '/')}>Systems</button>
                <button className="storefront-footer-link" onClick={() => navigate('message', '/message')}>Drop a message to founder</button>
                <button className="storefront-footer-link" onClick={() => { setAuthMode('login'); navigate('auth', '/auth'); }}>Sign In</button>
              </div>
            </div>

            {/* Column 3: Capabilities */}
            <div>
              <h4 className="storefront-footer-col-title">Systems</h4>
              <div className="storefront-footer-links">
                <span className="storefront-footer-link" style={{ cursor: 'default' }}>Sleep Recovery</span>
                <span className="storefront-footer-link" style={{ cursor: 'default' }}>Training Load</span>
                <span className="storefront-footer-link" style={{ cursor: 'default' }}>Cashflow View</span>
                <span className="storefront-footer-link" style={{ cursor: 'default' }}>Daily Habits</span>
                <span className="storefront-footer-link" style={{ cursor: 'default' }}>Copilot Direction</span>
              </div>
            </div>

            {/* Column 4: Resources & Legal */}
            <div>
              <h4 className="storefront-footer-col-title">Connect</h4>
              <div className="storefront-footer-links">
                <a href="https://twitter.com/Zenitsu_T7" target="_blank" rel="noreferrer" className="storefront-footer-link">Creator X (@Zenitsu_T7)</a>
                <button className="storefront-footer-link" onClick={() => navigate('message', '/message')}>Drop a message to founder</button>
              </div>
            </div>
          </div>

          <div className="storefront-footer-bottom">
            <div className="storefront-footer-copy">
              © 2026 LifeAgent. Handcrafted with clean typography.
            </div>
            <div style={{ font: "500 0.65rem 'DM Mono', monospace", color: 'var(--text-muted)' }}>
              v2.0 / editorial edition
            </div>
          </div>
        </footer>
      )}

      {/* DEDICATED FOUNDER COMMAND PORTAL (At /founder) */}
      {currentPage === 'founder' && (
        <FounderPortal
          onNavigate={navigate}
          showToast={showToast}
        />
      )}

      {/* AUTHENTICATION & PASSWORD RESET PAGE (At /auth) */}
      {currentPage === 'auth' && (
        <main className="animate-entrance auth-page" style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box', background: 'var(--bg-main)' }}>
          <div className="auth-card" style={{ background: 'var(--bg-card)', padding: '36px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', width: '100%', maxWidth: '420px', boxShadow: 'var(--shadow-lg)' }}>
            
            {/* Header Title */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ margin: '0 auto 14px', display: 'flex', justifyContent: 'center', cursor: 'pointer' }} onClick={() => navigate('landing', '/')}>
                <span className="wordmark-mark" style={{ width: '44px', height: '44px', fontSize: '1.5rem' }}>L</span>
              </div>
              <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: '8px' }}>
                <span className="eyebrow-dot" /> secure gateway <span className="eyebrow-rule" /> system
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 500, letterSpacing: '-0.04em', color: 'var(--text-main)', margin: '4px 0 6px' }}>
                {authMode === 'forgot' 
                  ? 'Reset Password' 
                  : (authMode === 'login' ? 'Welcome Back' : 'Create Account')}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
                {authMode === 'forgot'
                  ? (resetStep === 1 
                      ? 'Enter your registered email or username to get a reset code.' 
                      : (resetStep === 2 
                          ? 'Enter the 6-digit reset code sent to your email.' 
                          : 'Create your new password below.'))
                  : (authMode === 'login' ? 'Sign in to access your personal system.' : 'Sign up to build your personal operating system.')}
              </p>
            </div>

            {/* Banners & Messages */}
            {authError && (
              <div style={{ background: 'rgba(239, 111, 62, 0.1)', border: '1px solid var(--orange)', color: 'var(--orange)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={16} /> {authError}
              </div>
            )}

            {resetSuccessMsg && (
              <div style={{ background: 'var(--accent-blue-dim)', border: '1px solid var(--accent-blue)', color: 'var(--text-main)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="var(--accent-blue)" /> {resetSuccessMsg}
              </div>
            )}

            {/* FORGOT / RESET PASSWORD FORM */}
            {authMode === 'forgot' ? (
              resetStep === 1 ? (
                /* Step 1: Request Code */
                <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label className="micro-label" style={{ display: 'block', marginBottom: '6px' }}>Email Address or Username</label>
                    <input 
                      type="text" 
                      required 
                      value={resetEmailOrHandle} 
                      onChange={e => setResetEmailOrHandle(e.target.value)} 
                      style={{ width: '100%' }} 
                      placeholder="example@gmail.com" 
                    />
                  </div>

                  <button type="submit" className="blue-btn" disabled={authLoading} style={{ width: '100%', padding: '12px', fontSize: '0.92rem', marginTop: '6px' }}>
                    {authLoading ? 'Sending Reset Code...' : 'Get Reset Code'}
                  </button>
                </form>
              ) : resetStep === 2 ? (
                /* Step 2: Verify 6-Digit Code */
                <form onSubmit={handleVerifyResetCode} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label className="micro-label" style={{ display: 'block', marginBottom: '6px' }}>6-Digit Reset Code</label>
                    <input 
                      type="text" 
                      required 
                      value={resetCode} 
                      onChange={e => setResetCode(e.target.value)} 
                      style={{ width: '100%', letterSpacing: '4px', fontFamily: "'DM Mono', monospace", fontSize: '1.15rem', textAlign: 'center' }} 
                      placeholder="123456" 
                    />
                  </div>

                  <button type="submit" className="blue-btn" disabled={authLoading} style={{ width: '100%', padding: '12px', fontSize: '0.92rem', marginTop: '6px' }}>
                    {authLoading ? 'Verifying Code...' : 'Verify Code'}
                  </button>
                </form>
              ) : (
                /* Step 3: Enter New Password Twice & Save */
                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label className="micro-label" style={{ display: 'block', marginBottom: '6px' }}>New Password</label>
                    <input 
                      type="password" 
                      required 
                      value={resetNewPassword} 
                      onChange={e => setResetNewPassword(e.target.value)} 
                      style={{ width: '100%' }} 
                      placeholder="Enter new password..." 
                    />
                  </div>

                  <div>
                    <label className="micro-label" style={{ display: 'block', marginBottom: '6px' }}>Confirm New Password</label>
                    <input 
                      type="password" 
                      required 
                      value={resetConfirmPassword} 
                      onChange={e => setResetConfirmPassword(e.target.value)} 
                      style={{ width: '100%' }} 
                      placeholder="Re-enter new password..." 
                    />
                  </div>

                  <button type="submit" className="blue-btn" disabled={authLoading} style={{ width: '100%', padding: '12px', fontSize: '0.92rem', marginTop: '6px' }}>
                    {authLoading ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </form>
              )
            ) : (
              /* LOGIN / SIGNUP FORM */
              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {authMode === 'signup' && (
                  <>
                    <div>
                      <label className="micro-label" style={{ display: 'block', marginBottom: '6px' }}>Full Name</label>
                      <input type="text" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} style={{ width: '100%' }} placeholder="Enter your name..." />
                    </div>
                    <div>
                      <label className="micro-label" style={{ display: 'block', marginBottom: '6px' }}>Handle / Username</label>
                      <input type="text" value={authForm.handle} onChange={e => setAuthForm({...authForm, handle: e.target.value})} style={{ width: '100%' }} placeholder="Enter your handle..." />
                    </div>
                    <div>
                      <label className="micro-label" style={{ display: 'block', marginBottom: '6px' }}>Phone (Optional)</label>
                      <input type="tel" value={authForm.phone} onChange={e => setAuthForm({...authForm, phone: e.target.value})} style={{ width: '100%' }} placeholder="Enter your phone number..." />
                    </div>
                  </>
                )}
                
                <div>
                  <label className="micro-label" style={{ display: 'block', marginBottom: '6px' }}>Email Address or Username</label>
                  <input type="text" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} style={{ width: '100%' }} placeholder="Enter email or username..." />
                </div>
                
                <div>
                  <label className="micro-label" style={{ display: 'block', marginBottom: '6px' }}>Password</label>
                  <input type="password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} style={{ width: '100%' }} placeholder="••••••••" />
                  
                  {authMode === 'login' && (
                    <div style={{ textAlign: 'right', marginTop: '6px' }}>
                      <button 
                        type="button"
                        onClick={() => { setAuthMode('forgot'); setResetStep(1); setAuthError(''); setResetSuccessMsg(''); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', font: "500 0.78rem 'DM Mono', monospace", cursor: 'pointer', padding: '2px 0' }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>

                <button type="submit" className="blue-btn" disabled={authLoading} style={{ width: '100%', padding: '12px', fontSize: '0.92rem', marginTop: '6px' }}>
                  {authLoading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
                </button>
              </form>
            )}

            {/* Footer Navigation Link */}
            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {authMode === 'forgot' ? (
                <button 
                  onClick={() => { setAuthMode('login'); setAuthError(''); setResetSuccessMsg(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', padding: 0, font: "500 0.8rem 'DM Mono', monospace" }}
                >
                  ← Back to Sign In
                </button>
              ) : (
                <>
                  {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <button 
                    onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }} 
                    style={{ background: 'none', border: 'none', color: 'var(--orange)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                  </button>
                </>
              )}
            </div>

            {/* Back to Home Link */}
            <div style={{ textAlign: 'center', marginTop: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <button
                type="button"
                onClick={() => navigate('landing', '/')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.76rem', font: "500 0.76rem 'DM Mono', monospace", cursor: 'pointer', padding: '2px 0', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-main)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Redirect unauthenticated users trying to access /dashboard */}
      {currentPage === 'dashboard' && !isAuthenticated && (
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
          <div style={{ textAlign: 'center', padding: '36px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', maxWidth: '380px' }}>
            <div style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
              <span className="wordmark-mark" style={{ width: '48px', height: '48px', fontSize: '1.6rem' }}>L</span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 500, marginBottom: '8px' }}>Sign in Required</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.88rem' }}>You need to sign in to access your personal system.</p>
            <button className="blue-btn" style={{ padding: '10px 24px' }} onClick={() => navigate('auth', '/auth')}>
              <LogIn size={16} /> Sign In
            </button>
          </div>
        </main>
      )}

      {/* MERABAAZAR / AUTONOMOUS AI INSPIRED 2-COLUMN SIDEBAR WORKSPACE DASHBOARD (At /dashboard) */}
      {currentPage === 'dashboard' && isAuthenticated && (
        <div className="animate-entrance" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-main)' }}>
          
          {/* FIXED / STICKY LEFT SIDEBAR THAT NEVER SCROLLS */}
          <aside className="desktop-sidebar">
            <div>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', cursor: 'pointer', paddingLeft: '4px' }}
                onClick={() => navigate('landing', '/')}
              >
                <span className="wordmark-mark" aria-hidden="true">L</span>
                <div>
                  <h1 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-main)', lineHeight: 1.1, margin: 0 }}>
                    lifeagent
                  </h1>
                  <span style={{ font: "500 0.62rem 'DM Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>system</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`sidebar-nav-btn ${activeTab === 'ai' ? 'active' : ''}`}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles size={16} /> {aiName || 'AI'}
                  </span>
                  <span style={{ marginLeft: 'auto', background: 'var(--acid)', color: 'var(--ink)', fontSize: '0.62rem', font: "600 0.62rem 'DM Mono', monospace", padding: '1px 5px', borderRadius: '3px' }}>AI</span>
                </button>

                <button 
                  onClick={() => setActiveTab('today')}
                  className={`sidebar-nav-btn ${activeTab === 'today' ? 'active' : ''}`}
                >
                  <Clock size={16} /> Today
                </button>

                <button 
                  onClick={() => setActiveTab('habits')}
                  className={`sidebar-nav-btn ${activeTab === 'habits' ? 'active' : ''}`}
                >
                  <CheckCircle2 size={16} /> Daily Works
                </button>

                <button
                  onClick={() => setActiveTab('water')}
                  className={`sidebar-nav-btn ${activeTab === 'water' ? 'active' : ''}`}
                >
                  <Droplet size={16} /> Water
                </button>

                <button
                  onClick={() => setActiveTab('notes')}
                  className={`sidebar-nav-btn ${activeTab === 'notes' ? 'active' : ''}`}
                >
                  <BookOpen size={16} /> Field Notes
                </button>

                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`sidebar-nav-btn ${activeTab === 'calendar' ? 'active' : ''}`}
                >
                  <Calendar size={16} /> Calendar
                </button>

                <button
                  onClick={() => setActiveTab('finance')}
                  className={`sidebar-nav-btn ${activeTab === 'finance' ? 'active' : ''}`}
                >
                  <DollarSign size={16} /> Cashflow
                </button>

                <button
                  onClick={() => setActiveTab('body')}
                  className={`sidebar-nav-btn ${activeTab === 'body' ? 'active' : ''}`}
                >
                  <Dumbbell size={16} /> Training
                </button>

                <button
                  onClick={() => setActiveTab('sleep')}
                  className={`sidebar-nav-btn ${activeTab === 'sleep' ? 'active' : ''}`}
                >
                  <SleepIcon size={16} /> Sleep
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`sidebar-nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                >
                  <BarChart3 size={16} /> Analytics
                </button>

              </div>
            </div>

            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                onClick={() => setActiveTab('settings')}
                className={`sidebar-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
              >
                <Settings size={16} /> Settings
              </button>
            </div>
          </aside>

          {/* MAIN RIGHT AREA */}
          <section 
            ref={mainContentScrollRef}
            className={`main-layout-section ${activeTab === 'ai' ? 'ai-tab-active' : ''}`} 
            style={{ 
              flex: 1, 
              height: '100dvh', 
              maxHeight: '100dvh',
              overflowY: activeTab === 'ai' ? 'hidden' : 'auto',
              overflowX: 'hidden',
              overscrollBehaviorY: 'contain',
              WebkitOverflowScrolling: 'touch',
              position: 'relative'
            }}
          >
            <div style={{ padding: '20px 16px 100px 16px', minHeight: '100%' }}>
            
            <div className="dashboard-header">
              <div>
                <div className="dashboard-timestamp">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                {activeTab === 'today' ? (
                  <h2>
                    Good day, <em>{userProfile.handle ? `@${userProfile.handle.replace('@', '')}` : (userProfile.name ? userProfile.name.split(' ')[0] : 'Siddu')}.</em>
                  </h2>
                ) : (
                  <h2>
                    {activeTab === 'today' ? "Today's System" :
                     activeTab === 'habits' ? 'Daily Habits' :
                     (activeTab === 'gym' || activeTab === 'body') ? 'Training & Gym' : 
                     activeTab === 'sleep' ? 'Sleep Recovery' : 
                     activeTab === 'water' ? 'Hydration' :
                     activeTab === 'finance' ? 'Cashflow & Money' : 
                     activeTab === 'notes' ? 'Field Notes' : 
                     activeTab === 'calendar' ? 'Calendar' :
                     activeTab === 'analytics' ? 'Master Telemetry' :
                     activeTab === 'settings' ? 'Settings' : 
                     activeTab === 'ai' ? (aiName || 'AI') : 'System'}
                  </h2>
                )}
              </div>

              <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {activeTab !== 'ai' && (
                    <button
                      onClick={() => setIsAiSidePanelOpen(!isAiSidePanelOpen)}
                      className="ai-toggle-chip"
                      style={{
                        background: isAiSidePanelOpen ? 'var(--accent-blue)' : 'var(--bg-card)',
                        color: isAiSidePanelOpen ? 'var(--accent-text)' : 'var(--text-main)',
                        border: `1px solid var(--border-color)`,
                        borderRadius: 'var(--radius-sm)'
                      }}
                      title="Toggle AI Side Panel"
                    >
                      <Sparkles size={15} /> {aiName || 'AI'}
                    </button>
                  )}

                  <div ref={themeDropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      className="theme-toggle-btn"
                      style={{ padding: '7px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                      onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                      title="Change Theme Mode"
                    >
                      {themeMode === 'dark' && <Moon size={15} />}
                      {themeMode === 'light' && <Sun size={15} />}
                      {themeMode === 'pc' && <Monitor size={15} />}
                      {themeMode === 'night' && <Zap size={15} />}
                      <ChevronDown size={13} style={{ transform: isThemeMenuOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                    </button>

                    {isThemeMenuOpen && (() => {
                      const rect = themeDropdownRef.current?.getBoundingClientRect();
                      const top = rect ? rect.bottom + 8 : 60;
                      const right = rect ? Math.max(16, window.innerWidth - rect.right) : 16;

                      const handleSelectTheme = (mode, e) => {
                        if (e) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                        setThemeMode(mode);
                        safeStorage.setItem('themeMode', mode);
                        setIsThemeMenuOpen(false);
                      };

                      return ReactDOM.createPortal(
                        <div 
                          className="theme-dropdown-menu" 
                          style={{ 
                            position: 'fixed',
                            top: `${top}px`,
                            right: `${right}px`,
                            left: 'auto',
                            minWidth: '160px',
                            zIndex: 99999999,
                            boxShadow: 'var(--shadow-lg)',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '6px'
                          }}
                        >
                          <button 
                            className={`theme-dropdown-item ${themeMode === 'dark' ? 'active' : ''}`}
                            onMouseDown={(e) => handleSelectTheme('dark', e)}
                            onClick={(e) => handleSelectTheme('dark', e)}
                          >
                            <Moon size={14} /> Dark Mode
                          </button>
                          <button 
                            className={`theme-dropdown-item ${themeMode === 'light' ? 'active' : ''}`}
                            onMouseDown={(e) => handleSelectTheme('light', e)}
                            onClick={(e) => handleSelectTheme('light', e)}
                          >
                            <Sun size={14} /> Light Mode
                          </button>
                          <button 
                            className={`theme-dropdown-item ${themeMode === 'pc' ? 'active' : ''}`}
                            onMouseDown={(e) => handleSelectTheme('pc', e)}
                            onClick={(e) => handleSelectTheme('pc', e)}
                          >
                            <Monitor size={14} /> PC / System
                          </button>
                          <button 
                            className={`theme-dropdown-item ${themeMode === 'night' ? 'active' : ''}`}
                            onMouseDown={(e) => handleSelectTheme('night', e)}
                            onClick={(e) => handleSelectTheme('night', e)}
                          >
                            <Zap size={14} /> 🌌 Night Mode
                          </button>
                        </div>,
                        document.body
                      );
                    })()}
                  </div>
                </div>
            </div>

            {/* Timeframe Dropdown Selector (Hide when on Settings or AI Chat tab) */}
            {(activeTab === 'finance') && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", letterSpacing: '0.04em' }}>Timeframe:</span>
                  
                  <div style={{ position: 'relative' }} ref={timeDropdownRef}>
                    <button
                      onClick={() => setIsTimeMenuOpen(!isTimeMenuOpen)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)', color: 'var(--text-main)',
                        fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <Calendar size={14} color="var(--accent-blue)" />
                      <span>{timeOptions.find(o => o.id === timeRange)?.label || 'Today'}</span>
                      <ChevronDown size={13} style={{ transform: isTimeMenuOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', opacity: 0.7 }} />
                    </button>

                    {isTimeMenuOpen && (
                      <div
                        className="theme-dropdown-menu"
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 'calc(100% + 4px)',
                          minWidth: '160px',
                          maxHeight: '260px',
                          overflowY: 'auto',
                          zIndex: 100,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}
                      >
                        {timeOptions.map((opt) => (
                          <button
                            key={opt.id}
                            className={`theme-dropdown-item ${timeRange === opt.id ? 'active' : ''}`}
                            onClick={() => { 
                              setTimeRange(opt.id); 
                              setIsTimeMenuOpen(false); 
                            }}
                            style={{ fontWeight: timeRange === opt.id ? 700 : 500, fontSize: '0.82rem', padding: '7px 10px' }}
                          >
                            <Calendar size={13} /> {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {timeRange === 'custom' && (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginLeft: '4px' }}>
                      <input 
                        type="date" 
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.8rem', fontFamily: "'DM Mono', monospace" }} 
                      />
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>-</span>
                      <input 
                        type="date" 
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.8rem', fontFamily: "'DM Mono', monospace" }} 
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowFinanceForm(true)}
                  className="blue-btn"
                  style={{ padding: '7px 14px', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}
                >
                  <Plus size={15} /> Record Entry
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
            <div 
              className={activeTab === 'ai' ? 'ai-tab-housing-container' : 'glass-card tab-content-housing-box'} 
              style={activeTab === 'ai' 
                ? { width: '100%', boxSizing: 'border-box', padding: 0, margin: 0, background: 'transparent', border: 'none', boxShadow: 'none' } 
                : { padding: '32px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', marginBottom: '24px', width: '100%', boxSizing: 'border-box' }
              }
            >
              
              {/* 0) TODAY DAILY ROUTINE & HABITS CHECKLIST (Ultra-neat & clean UI) */}
              {activeTab === 'today' && (() => {
                const activeHabits = (Array.isArray(habits) ? habits : []).filter(h => !h.archived && !h.completedAt);
                const activeHabitIdSet = new Set(activeHabits.map(h => String(h.id)));
                
                const seenKeys = new Set();
                const activeTodayItems = [];

                const rawItems = Array.isArray(todayItems) ? todayItems : [];
                for (const item of rawItems) {
                  const hId = item.habitId || item.habit_id;
                  const titleKey = (item.title || item.label || '').trim().toLowerCase();

                  if (hId) {
                    const hIdStr = String(hId);
                    if (!activeHabitIdSet.has(hIdStr)) continue;
                    if (seenKeys.has(`id:${hIdStr}`) || (titleKey && seenKeys.has(`title:${titleKey}`))) continue;
                    seenKeys.add(`id:${hIdStr}`);
                    if (titleKey) seenKeys.add(`title:${titleKey}`);
                  } else {
                    if (!titleKey || seenKeys.has(`title:${titleKey}`)) continue;
                    seenKeys.add(`title:${titleKey}`);
                  }

                  activeTodayItems.push({
                    id: item.id,
                    title: item.title || item.label,
                    category: item.category || '',
                    time: item.time || '',
                    checked: !!item.checked,
                    habitId: hId || null
                  });
                }

                for (const habit of activeHabits) {
                  if (habit.pausedUntil) continue;
                  const hIdStr = String(habit.id);
                  const titleKey = (habit.title || '').trim().toLowerCase();

                  if (seenKeys.has(`id:${hIdStr}`) || (titleKey && seenKeys.has(`title:${titleKey}`))) continue;

                  seenKeys.add(`id:${hIdStr}`);
                  if (titleKey) seenKeys.add(`title:${titleKey}`);

                  activeTodayItems.push({
                    id: `synced-${habit.id}`,
                    title: habit.title,
                    category: habit.category || '',
                    checked: !!habit.checkedToday,
                    habitId: habit.id
                  });
                }
                return (
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
                            width: `${(activeTodayItems.filter(i => i.checked).length / (activeTodayItems.length || 1)) * 100}%`,
                            height: '100%',
                            background: 'var(--accent-blue)',
                            boxShadow: '0 0 8px rgba(59,130,246,0.4)',
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          {activeTodayItems.filter(i => i.checked).length}/{activeTodayItems.length} done
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
                      <button
                        type="button"
                        className="secondary-btn today-habits-link"
                        onClick={() => setActiveTab('habits')}
                        style={{ padding: '10px 16px', borderRadius: '30px', fontSize: '0.9rem', flexShrink: 0, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '7px' }}
                      >
                        <CheckCircle2 size={16} /> Manage Habits
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
                        {todayWidgetsConfig.showWorkout && ((Array.isArray(workouts) && workouts.length > 0) || !!userProfile?.workout_templates) && (() => {
                          const todayKeyStr = todayKey(userProfile?.timezone);
                          const isDone = Array.isArray(workouts) && workouts.some(w => w.date === todayKeyStr);
                          let splitList = [];
                          try {
                            if (userProfile?.workout_templates) splitList = JSON.parse(userProfile.workout_templates);
                          } catch (e) {
                            if (import.meta.env.DEV) console.warn('Invalid workout_templates JSON:', e);
                            splitList = [];
                          }
                          const startCount = Number(userProfile?.workout_start_count || 0);
                          const manualOffset = Number(userProfile?.manual_day_offset || 0);
                          const workoutsDone = Math.max(0, (Array.isArray(workouts) ? workouts.length : 0) - startCount);
                          const todaySplitIdx = splitList.length > 0 ? (workoutsDone + manualOffset) % splitList.length : 0;
                          const currentTitle = (splitList.length > 0 && splitList[todaySplitIdx]) ? (typeof splitList[todaySplitIdx] === 'string' ? splitList[todaySplitIdx] : splitList[todaySplitIdx]?.name) : 'Workout';

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
                                          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
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
                          const safeBodyStats = Array.isArray(bodyStats) ? bodyStats : (bodyStats ? [bodyStats] : []);
                          const todayStr = todayKey(userProfile?.timezone);
                          const todayStat = safeBodyStats.find(s => s && s.date === todayStr) || null;
                          const latestStat = safeBodyStats.length > 0 ? safeBodyStats[0] : null;
                          const protein = todayStat ? (Number(todayStat.protein) || 0) : (latestStat?.date === todayStr ? (Number(latestStat?.protein) || 0) : 0);
                          const targetW = Number(latestStat?.target_weight) || Number(todayStat?.target_weight) || 0;
                          const targetP = Number(latestStat?.target_protein) || Number(todayStat?.target_protein) || 0;
                          const goal = targetP > 0 ? targetP : (targetW > 0 ? Math.round(targetW * 2) : 0);
                          const pct = goal > 0 ? Math.min(100, Math.max(0, Math.round((protein / goal) * 100))) : 0;

                          const handleAddProtein = async (amount) => {
                            try {
                              const currentP = todayStat ? (Number(todayStat.protein) || 0) : (latestStat?.date === todayStr ? (Number(latestStat?.protein) || 0) : 0);
                              const newProtein = Math.max(0, currentP + amount);

                              const payload = {
                                date: todayStr,
                                protein: newProtein,
                                target_protein: goal,
                                weight: Number(todayStat?.weight) || Number(latestStat?.weight) || 0,
                                target_weight: targetW
                              };

                              const isExistingToday = todayStat && todayStat.id;
                              if (isExistingToday) {
                                payload.id = todayStat.id;
                              }

                              const tempId = isExistingToday ? todayStat.id : Date.now();
                              setBodyStats(prev => {
                                const list = Array.isArray(prev) ? prev : (prev ? [prev] : []);
                                const exists = list.some(s => s && (s.id === tempId || s.date === todayStr));
                                if (exists) {
                                  return list.map(s => (s && (s.id === tempId || s.date === todayStr)) ? { ...s, protein: newProtein, target_protein: goal } : s);
                                }
                                return [{ ...payload, id: tempId }, ...list];
                              });

                              const sign = amount >= 0 ? '+' : '';
                              showToast(`Protein logged: ${sign}${amount}g`, 'success');

                              if (token) {
                                const res = await fetch(getApiUrl('/api/fitness?type=body-stats'), {
                                  method: isExistingToday ? 'PUT' : 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                  },
                                  body: JSON.stringify(payload)
                                });

                                if (res.ok) {
                                  const data = await res.json();
                                  setBodyStats(prev => {
                                    const list = Array.isArray(prev) ? prev : [];
                                    return list.map(s => (s && (s.id === tempId || s.date === todayStr)) ? { ...s, ...data } : s);
                                  });
                                }
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

                            const sign = liters >= 0 ? '+' : '';
                            showToast?.(`Hydration logged: ${sign}${liters}L`, 'success');

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


                  {/* Clean 2-Box Grid of Today Items (One line two boxes, habit name only) */}
                    {(!activeTodayItems || activeTodayItems.length === 0) ? (
                      <div className="glass-card" style={{ textAlign: 'center', padding: '36px 20px', background: 'var(--bg-main)', borderRadius: '18px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <Clock size={40} style={{ color: 'var(--accent-blue)', opacity: 0.5 }} />
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>No items logged yet</div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Click + to add your first habit or task</p>
                        <button
                          onClick={() => setActiveTab('habits')}
                          className="blue-btn"
                          style={{ marginTop: '8px', padding: '8px 18px', fontSize: '0.85rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Plus size={16} /> Add Habits / Tasks
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        {[...activeTodayItems].sort((a,b) => (a.checked === b.checked ? 0 : a.checked ? 1 : -1)).map(item => (
                          <div 
                            key={item.id} 
                            onClick={() => handleToggleTodayItem(item.id)}
                            style={{
                              background: item.checked ? 'var(--accent-blue-dim)' : 'var(--bg-card)',
                              padding: '20px 22px',
                              borderRadius: '20px',
                              border: `1px solid ${item.checked ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '16px',
                              transition: 'all 0.25s ease',
                              cursor: 'pointer',
                              userSelect: 'none',
                              boxShadow: item.checked ? '0 8px 24px rgba(59,130,246,0.18)' : '0 4px 12px rgba(0,0,0,0.06)',
                              position: 'relative'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {item.category && (
                                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                                    {item.category}
                                  </span>
                                )}
                                <div style={{
                                  fontSize: '1.15rem',
                                  fontWeight: 800,
                                  color: 'var(--text-main)',
                                  textDecoration: item.checked ? 'line-through' : 'none',
                                  opacity: item.checked ? 0.7 : 1,
                                  wordBreak: 'break-word',
                                  lineHeight: '1.35'
                                }}>
                                  {item.title}
                                </div>
                                {item.goal_description && (
                                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                    {item.goal_description}
                                  </div>
                                )}
                              </div>

                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                border: `2px solid ${item.checked ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                                background: item.checked ? 'var(--accent-blue)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'all 0.2s ease',
                                boxShadow: item.checked ? '0 0 10px rgba(59,130,246,0.5)' : 'none'
                              }}>
                                {item.checked && <Check size={16} color="#fff" strokeWidth={3} />}
                              </div>
                            </div>

                            <div style={{
                              padding: '10px 14px',
                              borderRadius: '12px',
                              background: item.checked ? 'rgba(59,130,246,0.15)' : 'var(--bg-main)',
                              border: `1px solid ${item.checked ? 'rgba(59,130,246,0.3)' : 'var(--border-color)'}`,
                              color: item.checked ? 'var(--accent-blue)' : 'var(--text-muted)',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.2s ease'
                            }}>
                              {item.checked ? (
                                <>
                                  <Check size={16} /> Completed Today
                                </>
                              ) : (
                                <>
                                  <Clock size={15} /> Tap to Mark Done
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>



                </TabErrorBoundary>
                );
              })()}

              {/* 1) AI CHAT MODE */}
              {activeTab === 'ai' && (
                <TabErrorBoundary tabName="AI Assistant">
                <div className="ai-chat-view animate-entrance" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: 'calc(100vh - 118px)',
                  overflow: 'hidden',
                  background: 'var(--bg-card)',
                  borderRadius: '20px',
                  border: '1px solid var(--border-color)'
                }}>
                  {/* Header */}
                  <div className="ai-chat-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
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
                  <div ref={mainAiChatScrollRef} className="ai-chat-messages" style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', WebkitOverflowScrolling: 'touch' }}>
                    {(!Array.isArray(aiMessages) || aiMessages.length === 0) && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', margin: 'auto' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🤖</div>
                        <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>Ask me anything about your life data</p>
                        <p style={{ fontSize: '0.88rem', marginTop: '8px', color: 'var(--text-muted)' }}>I can analyze your habits, money, sleep and more</p>
                      </div>
                    )}
                    {(Array.isArray(aiMessages) ? aiMessages : []).map(msg => (
                      <div key={msg.id} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', background: msg.sender === 'user' ? 'var(--accent-blue)' : 'var(--bg-card)', color: msg.sender === 'user'  ? 'var(--accent-text, #ffffff)' : 'var(--text-main)', padding: '12px 16px', borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', fontSize: '0.88rem', lineHeight: '1.5', whiteSpace: 'pre-line', border: msg.sender === 'ai' ? '1px solid var(--border-color)' : 'none' }}>
                        {msg.text}
                      </div>
                    ))}
                  </div>
                  {/* Input - FIXED AT BOTTOM, never scrolls */}
                  <form onSubmit={handleSendAi} className="ai-chat-input-form" style={{ display: 'flex', gap: '8px', padding: '12px 16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
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
                  
                  {/* HABITS NOTIFICATIONS TOGGLE */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '20px', gap: '12px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <strong style={{ color: 'var(--text-main)' }}>Daily 7 PM Check-in</strong><br/>
                      Receive an automatic push reminder for incomplete habits.
                    </div>
                    <div
                      onClick={() => {
                        const nextVal = !habitNotificationsEnabled;
                        setHabitNotificationsEnabled(nextVal);
                        safeStorage.setItem('habitNotifications_enabled', String(nextVal));
                        showToast?.(nextVal ? '🔔 Daily 7 PM Habit Check-in Enabled!' : '🔕 Daily 7 PM Check-in Disabled', nextVal ? 'success' : 'info');
                        if (token) {
                          fetch(getApiUrl('/api/settings'), {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ habit_7pm_reminder_enabled: nextVal ? 1 : 0 })
                          }).catch(err => console.error('Failed to update 7pm checkin setting:', err));
                        }
                      }}
                      style={{
                        width: '42px', height: '24px', borderRadius: '12px', cursor: 'pointer', flexShrink: 0,
                        background: habitNotificationsEnabled ? 'var(--accent-blue)' : 'var(--border-color)',
                        position: 'relative', transition: 'background 0.25s'
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: '2px',
                        left: habitNotificationsEnabled ? '20px' : '2px',
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                        transition: 'left 0.25s'
                      }} />
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
                              color: newHabitData.frequency !== 'custom'  ? 'var(--accent-text, #ffffff)' : 'var(--text-main)',
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
                              color: newHabitData.frequency === 'custom'  ? 'var(--accent-text, #ffffff)' : 'var(--text-main)',
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
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', width: '100%', boxSizing: 'border-box' }}>
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
                                        width: '100%', padding: '8px 0', borderRadius: '8px',
                                        border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                                        background: isSelected ? 'var(--accent-blue-dim)' : 'var(--bg-main)',
                                        color: isSelected ? 'var(--accent-blue)' : 'var(--text-muted)',
                                        fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s',
                                        boxSizing: 'border-box', textAlign: 'center'
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
                            <CustomSelect
                              value={newHabitData.durationMode === 'custom' ? 'custom' : newHabitData.challengeDays}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'custom') {
                                  setNewHabitData({ ...newHabitData, durationMode: 'custom', challengeDays: '' });
                                } else {
                                  setNewHabitData({ ...newHabitData, durationMode: 'preset', challengeDays: Number(val) });
                                }
                              }}
                              options={[
                                { value: 7, label: '7 Days' },
                                { value: 14, label: '14 Days' },
                                { value: 21, label: '21 Days' },
                                { value: 30, label: '30 Days' },
                                { value: 60, label: '60 Days' },
                                { value: 90, label: '90 Days' },
                                { value: 'custom', label: 'Custom...' }
                              ]}
                              style={{ padding: '6px 12px', fontSize: '0.85rem', fontWeight: 700 }}
                            />

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

                      {/* HABIT REMINDERS */}
                      <ReminderEditor
                        reminders={newHabitData.reminders || []}
                        onChange={(rems) => setNewHabitData({ ...newHabitData, reminders: rems })}
                        mode="time"
                        label="Reminders"
                      />

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
                            const habitRems = Array.isArray(newHabitData.reminders) ? newHabitData.reminders : [];

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
                                  interval_days: iDays,
                                  reminders: habitRems
                                })
                              });

                              if (res.ok) {
                                const saved = await res.json();
                                const newHabitObj = {
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
                                  interval_days: saved.interval_days || iDays,
                                  reminders: habitRems
                                };
                                setHabits(prev => [...prev, newHabitObj]);

                                if (habitRems.length > 0) {
                                  const globalEnabled = userProfile?.remindersGlobalEnabled !== false && userProfile?.reminders_global_enabled !== 0;
                                  scheduleHabitReminders({
                                    habits: [...habits, newHabitObj],
                                    daily7pmEnabled: habitNotificationsEnabled,
                                    userName: userProfile?.name || 'User'
                                  }, globalEnabled).catch(console.error);
                                }

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

                                setNewHabitData({ title: '', category: '', target: '', challengeMode: false, challengeDays: 30, durationMode: 'preset', frequency: 'daily', customDays: ['Mon', 'Wed', 'Fri'], intervalDays: 0, interval_days: 0, reminders: [] });
                                setCustomPillarInput('');
                                setIsAddHabitModalOpen(false);
                                showToast('Habit added successfully!', 'success');
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
                                          : ['Mon', 'Wed', 'Fri']),
                                    reminders: Array.isArray(item.reminders) ? item.reminders : []
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
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const existingReminders = Array.isArray(item.reminders) ? item.reminders : [];
                                  setEditHabitReminderList(existingReminders);
                                  setEditHabitReminderId(item.id);
                                  setHabitMenuOpen(null);
                                }}
                                style={{ padding: '10px 16px', background: 'transparent', border: 'none', borderTop: '1px solid var(--border-color)', textAlign: 'left', cursor: 'pointer', color: 'var(--accent-blue)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                              >
                                <Bell size={14} /> Set Reminders {(item.reminders?.length || 0) > 0 ? `(${item.reminders.length})` : ''}
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
                                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '6px', marginBottom: '16px' }}>
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
                                      <div key={dIdx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: 0 }}>
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
                                color: editingHabitData.frequency !== 'custom'  ? 'var(--accent-text, #ffffff)' : 'var(--text-main)',
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
                                color: editingHabitData.frequency === 'custom'  ? 'var(--accent-text, #ffffff)' : 'var(--text-main)',
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
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', width: '100%', boxSizing: 'border-box' }}>
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
                                          width: '100%', padding: '6px 0', borderRadius: '6px',
                                          border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                                          background: isSelected ? 'var(--accent-blue-dim)' : 'var(--bg-main)',
                                          color: isSelected ? 'var(--accent-blue)' : 'var(--text-muted)',
                                          fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                                          boxSizing: 'border-box', textAlign: 'center'
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
                        
                        {/* HABIT REMINDERS */}
                        <ReminderEditor
                          reminders={editingHabitData.reminders || []}
                          onChange={(rems) => setEditingHabitData({ ...editingHabitData, reminders: rems })}
                          mode="time"
                          label="Reminders"
                        />
                        
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
                              const habitRems = Array.isArray(editingHabitData.reminders) ? editingHabitData.reminders : [];

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
                                      interval_days: iDays,
                                      reminders: habitRems
                                    })
                                  });
                                  if (!res.ok) {
                                    const errData = await res.json().catch(() => ({}));
                                    throw new Error(errData.error || 'Failed to update habit');
                                  }
                                }

                                // Optimistically update local React state
                                const nextHabits = habits.map(h => h.id === editingHabitData.id ? {
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
                                  interval_days: iDays,
                                  reminders: habitRems
                                } : h);
                                setHabits(nextHabits);

                                const globalEnabled = userProfile?.remindersGlobalEnabled !== false && userProfile?.reminders_global_enabled !== 0;
                                scheduleHabitReminders({
                                  habits: nextHabits,
                                  daily7pmEnabled: habitNotificationsEnabled,
                                  userName: userProfile?.name || 'User'
                                }, globalEnabled).catch(console.error);

                                setIsEditHabitModalOpen(false);
                                showToast('Habit updated!', 'success');
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

              {/* 2.5) NOTES & DIARY TAB */}
              {activeTab === 'notes' && (
                <TabErrorBoundary tabName="Notes & Diary">
                  <NotesPanel
                    notesList={notesList}
                    setNotesList={setNotesList}
                    activeNoteId={activeNoteId}
                    setActiveNoteId={setActiveNoteId}
                    trashNotes={trashNotes}
                    setTrashNotes={setTrashNotes}
                    notesViewMode={notesViewMode}
                    setNotesViewMode={setNotesViewMode}
                    token={token}
                    showToast={showToast}
                    userProfile={userProfile}
                  />
                </TabErrorBoundary>
              )}

              {/* 3) MONEY TRACKING */}
              {visitedTabs.has('finance') && (
                <div style={{ display: activeTab === 'finance' ? 'block' : 'none' }}>
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
                </div>
              )}

              {/* 4) BODY & GYM */}
              {(visitedTabs.has('body') || visitedTabs.has('gym')) && (
                <div style={{ display: (activeTab === 'body' || activeTab === 'gym') ? 'block' : 'none' }}>
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
                </div>
              )}

              {/* 5) SLEEP & RECOVERY */}
              {visitedTabs.has('sleep') && (
                <div style={{ display: activeTab === 'sleep' ? 'block' : 'none' }}>
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
                </div>
              )}

              {/* 6) MASTER ANALYTICS HUB */}
              {visitedTabs.has('analytics') && (
                <div style={{ display: activeTab === 'analytics' ? 'block' : 'none' }}>
                  <TabErrorBoundary tabName="Master Analytics">
                    <AnalyticsPanel
                      token={token}
                      showToast={showToast}
                      currency={userProfile.currency || '$'}
                      timeRange={timeRange}
                      userProfile={userProfile}
                    />
                  </TabErrorBoundary>
                </div>
              )}

              {/* 7) SETTINGS & PROFILE */}
              {(visitedTabs.has('settings') || activeTab === 'settings') && (
                <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
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
                    onDeleteAccount={handleDeleteAccount}
                    habits={habits}
                    calendarEvents={calendarEvents}
                  />
                </TabErrorBoundary>
              </div>
              )}

            </div>
            </div>
          </section>

          {/* PERSISTENT SIDE-BY-SIDE AI COACH PANEL (Always accessible across any tab) */}
          {isAiSidePanelOpen && activeTab !== 'ai' && (
              <aside className="animate-entrance ai-sidebar" style={{ width: '370px', height: '100vh', background: 'var(--bg-main)', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, position: 'relative', zIndex: 50 }}>
              <div style={{ padding: '16px 20px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></div>
                  <h4 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="var(--accent-blue)" /> {aiName || 'AI'}
                  </h4>
                  <span className="ai-timestamp" style={{ background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontFamily: "'DM Mono', monospace", fontSize: '0.65rem' }}>
                    ONLINE
                  </span>
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

              <div ref={sideAiChatScrollRef} style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ textAlign: 'center', margin: '0 0 4px' }}>
                  <span className="ai-timestamp" style={{ background: 'var(--bg-card)', padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--border-color)', fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} • Interactive AI Studio
                  </span>
                </div>

                {aiMessages.map(msg => (
                  <div 
                    key={msg.id} 
                    style={{ 
                      alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '88%',
                      background: msg.sender === 'user' ? 'var(--accent-blue)' : 'var(--bg-card)',
                      color: msg.sender === 'user' ? 'var(--accent-text)' : 'var(--text-main)',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: msg.sender === 'ai' ? '1px solid var(--border-color)' : 'none',
                      fontSize: '0.86rem',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-line',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {msg.text}
                    {msg.timestamp && (
                      <div className="ai-timestamp" style={{ marginTop: '6px', textAlign: 'right', opacity: 0.75, fontFamily: "'DM Mono', monospace", fontSize: '0.62rem' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendAi} style={{ padding: '14px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Chat anywhere, ask about diary..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '0.86rem', fontFamily: "'DM Sans', sans-serif" }}
                />
                <button type="submit" className="blue-btn" style={{ padding: '0 14px', borderRadius: '6px' }}>
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
            <button className={`mobile-nav-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
              <Calendar size={22} />
              <span>Calendar</span>
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
                  <button className={`drawer-btn ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => { setActiveTab('ai'); setShowMobileMoreMenu(false); }}>
                    <Sparkles size={20} />
                    <span>{aiName || 'AI'}</span>
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

      {/* Habit Reminder Edit Modal */}
      {editHabitReminderId !== null && (
        <Modal
          isOpen={true}
          onClose={() => setEditHabitReminderId(null)}
          title="Habit Reminders"
          icon={Bell}
          maxWidth="440px"
        >
          <ReminderEditor
            reminders={editHabitReminderList}
            onChange={setEditHabitReminderList}
            mode="time"
            label="Reminders"
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button 
              type="button"
              onClick={() => setEditHabitReminderId(null)}
              style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={() => handleSaveHabitReminders(editHabitReminderId)}
              style={{ padding: '10px 20px', background: '#3b82f6', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)' }}
            >
              Save Reminders
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
}
