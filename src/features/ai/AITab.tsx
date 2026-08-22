import { useState, useRef, useEffect } from 'react';
import { useAIChat } from '../../hooks/useQueries';
import { useAuthStore } from '../../stores/authStore';
import { Send, Loader2, Sparkles, Copy, Check, X } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  { label: 'Analyze my habits', text: 'Analyze my habits and suggest improvements' },
  { label: 'Workout plan', text: 'Create a workout plan for this week' },
  { label: 'Spending review', text: 'Review my spending patterns' },
  { label: 'Plan my day', text: 'Help me plan my day' },
];

export function AITab() {
  const user = useAuthStore((s) => s.user);
  const { sendMessage, isLoading, error } = useAIChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await sendMessage({ message: trimmed });
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response || 'Sorry, I could not generate a response.',
        timestamp: new Date(),
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: err.message || 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      }]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const copyToClipboard = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  };

  return (
    <div className="ai-tab">
      <div className="tab-header">
        <h2 className="tab-title">{user?.ai_name || 'AI Coach'}</h2>
        <p className="tab-subtitle">Your personal assistant</p>
      </div>

      <div className="ai-chat-container">
        <div className="chat-messages" role="log" aria-live="polite">
          {messages.length === 0 && !isLoading && (
            <div className="chat-welcome">
              <div className="welcome-icon"><Sparkles size={40} /></div>
              <h3>Hey! I'm {user?.ai_name || 'your AI coach'}</h3>
              <p>Ask me anything about your habits, finances, fitness, or just chat!</p>
              <div className="suggested-prompts">
                {SUGGESTED_PROMPTS.map(({ label, text }) => (
                  <button key={label} onClick={() => send(text)}>{label}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`chat-message ${message.role}`}>
              <div className="message-avatar">
                {message.role === 'user' ? <span>{(user?.name || 'U').charAt(0).toUpperCase()}</span> : <Sparkles size={18} />}
              </div>
              <div className="message-content">
                <div className="message-bubble">
                  <p>{message.content}</p>
                  <time className="message-time">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                </div>
                {message.role === 'assistant' && (
                  <button onClick={() => copyToClipboard(message.id, message.content)} className="copy-btn" aria-label="Copy message">
                    {copiedId === message.id ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chat-message assistant streaming">
              <div className="message-avatar"><Sparkles size={18} /></div>
              <div className="message-content">
                <div className="message-bubble typing">
                  <span className="typing-dots"><span>.</span><span>.</span><span>.</span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="chat-input-form">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={1}
            disabled={isLoading}
            className="chat-input"
            aria-label="Message"
          />
          <button type="submit" disabled={!input.trim() || isLoading} className="chat-send-btn" aria-label="Send message">
            {isLoading ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>

      {error && (
        <div className="chat-error">
          <span>{error.message}</span>
          <button onClick={() => setInput('')}><X size={16} /></button>
        </div>
      )}
    </div>
  );
}

export default AITab;
