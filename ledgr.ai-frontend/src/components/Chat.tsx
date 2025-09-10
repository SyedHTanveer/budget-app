import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  Message,
  MessageAvatar,
  MessageContent,
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
  Sources,
  SourcesContent,
  SourcesTrigger,
  type ChatMessage,
} from './ai/primitives';
import { useAutoScroll } from './ai/hooks.ts';
import { BotMessageSquare, MessagesSquare, X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setChatOpen } from '../../store/SystemSlice';


function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'intro', role: 'assistant', content: 'Hi! Ask me anything about your budgeting data or general finance. I\'ll stream back a response.',
  }]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [draft, setDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const dispatch = useDispatch();

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const max = 320; // px cap (~10-12 lines)
    el.style.height = Math.min(el.scrollHeight, max) + 'px';
  };

  useEffect(() => { resizeTextarea(); }, [draft]);

  const { containerRef, atBottom, scrollToBottom } = useAutoScroll([messages, isStreaming]);

  const handleSubmit = useCallback((value: string) => {
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: value };
    setMessages(prev => [...prev, userMessage]);

    // Simulate assistant streaming
    const assistantId = crypto.randomUUID();
    const fullResponse = `You said: "${value}". (Demo response)\n\nThis is a simulated streaming reply. Integrate your backend SSE or streaming API here.`;
    setIsStreaming(true);
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', isStreaming: true }]);

    let i = 0;
    const interval = setInterval(() => {
      i += 4; // chunk size
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullResponse.slice(0, i) } : m));
      if (i >= fullResponse.length) {
        clearInterval(interval);
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m));
        setIsStreaming(false);
      }
  }, 40);

  // reset draft + textarea height
  setDraft('');
  requestAnimationFrame(resizeTextarea);
  }, []);

  return (
    <div className="flex flex-col h-screen w-[600px] gap-2">
      <div className="flex flex-row justify-between gap-4 items-center rounded-b-md bg-neutral-900 w-full p-2">
        <Button variant="ghost" onClick={() => dispatch(setChatOpen(false))}>
          <X />Close
        </Button>
        <Button variant="ghost">
            <MessagesSquare /> Conversations
        </Button>
      </div>

      <div className="relative flex flex-1 rounded-md bg-neutral-900 overflow-auto">
        <Conversation className="flex-1 bg-transparent border-0">
          <ConversationContent ref={containerRef} className="bg-transparent">
            {messages.map(msg => (
              <Message key={msg.id} from={msg.role}>
                <MessageContent>
                  {msg.content || (msg.isStreaming ? '...' : '')}
                </MessageContent>
                <MessageAvatar name={msg.role === 'assistant' ? 'AI' : 'You'} />
                {msg.reasoning && (
                  <Reasoning>
                    <ReasoningTrigger />
                    <ReasoningContent>{msg.reasoning}</ReasoningContent>
                  </Reasoning>
                )}
                {msg.sources && msg.sources.length > 0 && (
                  <Sources>
                    <SourcesTrigger />
                    <SourcesContent>
                      {msg.sources.map(s => (
                        <div key={s.id} className="truncate">• {s.title}</div>
                      ))}
                    </SourcesContent>
                  </Sources>
                )}
              </Message>
            ))}
          </ConversationContent>
          {!atBottom && <ConversationScrollButton onClick={scrollToBottom} />}
        </Conversation>
      </div>

      <div className="flex rounded-t-md bg-neutral-900 p-2">
        <PromptInput onPromptSubmit={handleSubmit} disabled={isStreaming} className="w-full bg-neutral-800 border-neutral-700">
          <PromptInputTextarea
            ref={textareaRef}
            placeholder="Ask a question..."
            value={draft}
            onChange={(e) => { setDraft(e.target.value); resizeTextarea(); }}
            className="max-h-80 overflow-y-auto"
          />
          <PromptInputToolbar>
            <div className="text-[10px] text-neutral-500">{isStreaming ? 'Streaming...' : 'Enter to send • Shift+Enter = newline'}</div>
            <PromptInputSubmit disabled={isStreaming} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}

export default Chat;