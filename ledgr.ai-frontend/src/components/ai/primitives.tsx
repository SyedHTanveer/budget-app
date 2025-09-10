import React from 'react';
import type { TextareaHTMLAttributes, HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import {
    Send,
} from 'lucide-react';
import { Button } from '../ui/button';
// Utility (simple version if not present)
// If cn not available in project, provide fallback
// (Expecting a local util; adjust if needed.)

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  avatar?: string;
  name?: string;
  reasoning?: string;
  sources?: { id: string; title: string; url?: string }[];
  isStreaming?: boolean;
}

/* Conversation */
export const Conversation = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col overflow-hidden rounded-md border border-border bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const ConversationContent = React.forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
  className={cn('flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm leading-relaxed', className)}
      {...props}
    >
      {children}
    </div>
  )
);
ConversationContent.displayName = 'ConversationContent';

export const ConversationScrollButton = ({ onClick }: { onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="absolute bottom-4 right-4 rounded-full border border-border bg-background/80 px-3 py-2 text-xs text-muted-foreground shadow-sm hover:text-foreground hover:bg-accent focus:outline-none"
  >
    ↓
  </button>
);

/* Message */
export const Message = ({ from, children, className }: { from: 'user' | 'assistant'; children: React.ReactNode; className?: string }) => (
  <div className={cn('flex w-full gap-3', from === 'user' ? 'justify-end' : 'justify-start', className)}>
    {from === 'assistant' && (
      <div className="h-8 w-8 flex items-center justify-center text-[10px] font-medium text-foreground ring-1 ring-border rounded-md">AI</div>
    )}
    <div
      className={cn(
        'max-w-[75%] rounded-md px-4 py-2 text-sm',
        from === 'user'
          ? 'ring-border rounded-md ring-1 bg-muted text-foreground'
          : ''
      )}
    >
      {children}
    </div>
    {from === 'user' && (
      <div className="h-8 w-8 shrink-0 rounded-md text-white flex items-center justify-center text-[10px] font-medium ring-1 ring-border bg-muted">ST</div>
    )}
  </div>
);

export const MessageContent = ({ children }: { children: React.ReactNode }) => <div className="whitespace-pre-wrap break-words">{children}</div>;

export const MessageAvatar = ({ src, name }: { src?: string; name?: string }) => (
  <div className="hidden" aria-hidden>{name || src}</div>
);

/* Prompt Input */
interface PromptInputProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onPromptSubmit: (value: string) => void;
  disabled?: boolean;
}

export const PromptInput = ({ onPromptSubmit, children, className, disabled, ...rest }: PromptInputProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const target = e.target as HTMLTextAreaElement;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && target.value.trim()) {
        onPromptSubmit(target.value);
        target.value = '';
      }
    }
  };
  return (
    <form
      onKeyDown={handleKeyDown}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const value = (fd.get('prompt') as string) || '';
        if (!disabled && value.trim()) onPromptSubmit(value);
        e.currentTarget.reset();
      }}
  className={cn('relative flex flex-col gap-2 rounded-sm border border-border bg-background/70 backdrop-blur p-2', className)}
      {...rest}
    >
      {children}
    </form>
  );
};

type PromptInputTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;
export const PromptInputTextarea = React.forwardRef<HTMLTextAreaElement, PromptInputTextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      name="prompt"
      rows={props.rows ?? 1}
      className={cn('w-full resize-none bg-transparent focus:outline-none text-sm text-neutral-100 placeholder:text-neutral-500', className)}
      {...props}
    />
  )
);
PromptInputTextarea.displayName = 'PromptInputTextarea';

export const PromptInputToolbar = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('flex items-center justify-between pt-1 text-xs text-muted-foreground', className)}>{children}</div>
);

export const PromptInputSubmit = ({ disabled }: { disabled?: boolean }) => (
  <Button
    variant="default"
    size="icon"
    disabled={disabled}
    className={cn('h-8 w-8 shrink-0 rounded-md')}
    type="submit"
  >
    <Send size={16} className="" />
    <span className="sr-only">Send message</span>
  </Button>
);

/* Reasoning (simple collapsible placeholder) */
export const Reasoning = ({ children }: { children: React.ReactNode }) => <div className="mt-2 space-y-1">{children}</div>;
export const ReasoningContent = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-md bg-muted p-2 text-xs text-muted-foreground ring-1 ring-border/50">{children}</div>
);
export const ReasoningTrigger = ({ onClick }: { onClick?: () => void }) => (
  <button type="button" onClick={onClick} className="text-[10px] uppercase tracking-wide text-neutral-500 hover:text-neutral-300">
    Reasoning
  </button>
);

/* Sources */
export const Sources = ({ children }: { children: React.ReactNode }) => <div className="mt-2">{children}</div>;
export const SourcesContent = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">{children}</div>
);
export const SourcesTrigger = ({ onClick }: { onClick?: () => void }) => (
  <button type="button" onClick={onClick} className="text-[10px] uppercase tracking-wide text-neutral-500 hover:text-neutral-300">
    Sources
  </button>
);

// Hooks moved to hooks.ts to satisfy fast-refresh constraints.
