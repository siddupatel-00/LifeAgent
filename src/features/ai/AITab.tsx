import { useState, useRef, useEffect } from 'react';
import { useAIChat } from '../../hooks/useQueries';
import { Send, Loader2, Sparkles, Copy, Check, X, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AITab({ user }: { user: any }) {
  const { sendMessage, isLoading, error } = useAIChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsStreaming(true);

    try {
      const response = await sendMessage({ messages: [...messages, userMessage] });
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response || 'Sorry, I could not generate a response.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('AI Chat error:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="ai-tab">
      <div className="tab-header">
        <h2 className="tab-title">AI Coach</h2>
        <p className="tab-subtitle">Your personal assistant</p>
      </div>

      <div className="ai-chat-container">
        <div className="chat-messages" role="log" aria-live="polite">
          {messages.length === 0 && (
            <div className="chat-welcome">
              <div className="welcome-icon"><Sparkles size={48} /></div>
              <h3>Hey! I'm {user?.ai_name || 'AI'}</h3>
              <p>Ask me anything about your habits, finances, fitness, or just chat!</p>
              <div className="suggested-prompts">
                <button onClick={() => { setInput('Analyze my habits and suggest improvements'); handleSubmit(new Event('submit') as any); }}>Analyze my habits</button>
                <button onClick={() => { setInput('Create a workout plan for this week'); handleSubmit(new Event('submit') as any); }}>Workout plan</button>
                <button onClick={() => { setInput('Review my spending patterns'); handleSubmit(new Event('submit') as any); }}>Spending review</button>
                <button onClick={() => { setInput('Help me plan my day'); handleSubmit(new Event('submit') as any); }}>Plan my day</button>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`chat-message ${message.role}`}>
              <div className="message-avatar">
                {message.role === 'user' ? <span>U</span> : <Sparkles size={20} />}
              </div>
              <div className="message-content">
                <div className="message-bubble">
                  <p>{message.content}</p>
                  <time className="message-time">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                </div>
                {message.role === 'assistant' && (
                  <button onClick={() => copyToClipboard(message.content)} className="copy-btn" aria-label="Copy message">
                    <Copy size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chat-message assistant streaming">
              <div className="message-avatar"><Sparkles size={20} /></div>
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
          <span>Error: {error.message}</span>
          <button onClick={() => setMessages([])}><X size={16} /></button>
        </div>
      )}
    </div>
  );
}