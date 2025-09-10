import { useEffect, useRef, useState, useCallback } from 'react';

export function useStreamingAppend(fullText: string, isActive: boolean, speed = 25) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!isActive) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setText(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [fullText, isActive, speed]);
  return text;
}

export function useAutoScroll(deps: unknown[]) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 24;
    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setAtBottom(isBottom);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (atBottom) {
      const el = containerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { containerRef, atBottom, scrollToBottom: () => { const el = containerRef.current; if (el) el.scrollTop = el.scrollHeight; } };
}
