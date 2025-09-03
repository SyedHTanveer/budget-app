import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, Bot, ChevronDown, Loader2 } from "lucide-react";
import { getAccessToken } from '../store/api';
import { toast } from 'sonner';

interface Message { id: string; role: 'user' | 'assistant'; content: string; pending?: boolean; }

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([{
    id: 'intro', role: 'assistant', content: "Hi! I'm your financial assistant. Ask me about spending, goals, or affordability." }
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 120);
  };

  const appendAssistantChunk = useCallback((chunk: string) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last && last.role === 'assistant' && last.pending) {
        return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
      }
      return [...prev, { id: crypto.randomUUID(), role: 'assistant', content: chunk, pending: true }];
    });
  }, []);

  const finalizeAssistant = () => {
    setMessages(prev => prev.map(m => m.pending ? { ...m, pending: false } : m));
  };

  const send = async () => {
    if (!input.trim() || streaming) return;
    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: question }]);
    setStreaming(true);
    try {
      // Access token automatically attached via cookie / header logic on SSE? (SSE can't set headers) -> include token param if present
      const token = getAccessToken();
      const url = `/api/v1/ai/stream?query=${encodeURIComponent(question)}${token ? `&token=${encodeURIComponent(token)}`: ''}`;
      const es = new EventSource(url, { withCredentials: true } as any);
      es.onmessage = (e) => {
        if (e.data === '[DONE]') {
          es.close();
          finalizeAssistant();
          setStreaming(false);
          return;
        }
        appendAssistantChunk(e.data);
      };
      es.onerror = () => {
        es.close();
        finalizeAssistant();
        setStreaming(false);
        toast.error('AI stream error');
      };
    } catch (err:any) {
      toast.error(err.message || 'Failed to start AI stream');
      setStreaming(false);
    }
  };

  const cancel = () => {
    finalizeAssistant();
    setStreaming(false);
  };

  const quickPrompts = [
    'Can I afford a $120 dinner tonight?',
    'How much can I spend on travel this month?',
    'Am I on track with my goals?',
    'What is my safe to spend today?'
  ];

  const creditsUsed = 0; // TODO wire to useGetAIUsageQuery
  const creditsLimit = 100; // tier-based; placeholder until subscription data available

  return (
    <div className="flex flex-col h-full relative">
      <div className="px-4 pt-3 pb-2 border-b flex items-center justify-between text-[11px] text-muted-foreground">
        <span>AI Chat</span>
        <span className="font-medium">Credits {creditsUsed}/{creditsLimit}</span>
      </div>
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto space-y-4 p-4 min-h-0">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}`}>
              <div className="flex items-start">
                {m.role === 'assistant' && <Bot className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />}
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
              {m.pending && streaming && <span className="inline-block w-1 h-4 bg-blue-500 animate-pulse ml-1 align-bottom" />}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {showScrollButton && (
        <Button onClick={scrollToBottom} size="icon" className="absolute bottom-24 right-4 h-8 w-8 rounded-full shadow bg-blue-500 hover:bg-blue-600"><ChevronDown className="h-4 w-4 text-white" /></Button>
      )}
      {!streaming && messages.length <= 2 && (
        <div className="p-4 border-t">
          <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
          <div className="space-y-2">
            {quickPrompts.map(q => (
              <Button key={q} variant="outline" size="sm" className="w-full justify-start h-auto p-3 text-xs" onClick={()=> setInput(q)}>{q}</Button>
            ))}
          </div>
        </div>
      )}
      <div className="p-4 border-t flex items-center gap-2">
        <Input
          placeholder="Ask about your finances..."
            value={input}
            disabled={streaming}
            onChange={e=> setInput(e.target.value)}
            onKeyDown={e=> { if (e.key === 'Enter') send(); }}
            className="text-sm flex-1"
          />
          {!streaming ? (
            <Button onClick={send} size="icon" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={cancel}>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Stop
            </Button>
          )}
      </div>
    </div>
  );
}