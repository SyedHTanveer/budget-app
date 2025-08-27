import { useState, useRef, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, Bot, User, ChevronDown } from "lucide-react";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm your financial assistant. Ask me anything about your spending, goals, or budget!",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  // Unique id ref to prevent duplicate keys
  const nextIdRef = useRef(2); // since initial message used id 1

  const quickQuestions = [
    "Can I afford a $120 dinner tonight?",
    "How much can I spend on my Miami trip?",
    "When is my next bill due?",
    "How am I doing with my savings goal?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const question = inputValue; // capture current input

    const userMessage: Message = {
      id: nextIdRef.current++,
      text: question,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // Mock AI response with delay (use functional update + unique id)
    setTimeout(() => {
      const aiResponse: Message = {
        id: nextIdRef.current++,
        text: getAIResponse(question),
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const getAIResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes("dinner") || lowerQuestion.includes("$120")) {
      return "Yes! You have $847 safe to spend, so a $120 dinner is definitely within your budget. That would leave you with $727 for the rest of the period.";
    }
    
    if (lowerQuestion.includes("miami") || lowerQuestion.includes("trip")) {
      return "Based on your Miami trip goal, you've saved $320 out of $800. You could comfortably spend $300-400 on the trip from your safe-to-spend amount without impacting your other goals.";
    }
    
    if (lowerQuestion.includes("bill")) {
      return "Your next bills are: Rent ($1,200) due in 3 days, Electric ($85) due in 5 days, and Phone ($45) due in 8 days. All are covered by your reserved funds.";
    }
    
    return "I can help you with spending decisions, goal tracking, and budget analysis. Try asking about specific purchases or your financial goals!";
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages */}
      <div 
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-4 p-4 min-h-0 relative"
        style={{ maxHeight: 'calc(100vh - 150px)' }}
      >
        {messages.map((message) => (
          <div key={message.id}>
            <div
              className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl ${
                  message.isUser
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <div className="flex items-start">
                  {!message.isUser && (
                    <Bot className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 opacity-70 ${
                      message.isUser ? "text-blue-100" : "text-gray-500"
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                  {message.isUser && (
                    <User className="h-4 w-4 ml-2 mt-0.5" />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button (now overlays messages while scrolled up) */}
      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 h-8 w-8 rounded-full shadow-lg bg-blue-500 hover:bg-blue-600"
          size="icon"
        >
          <ChevronDown className="h-4 w-4 text-white" />
        </Button>
      )}

      {/* Quick Questions */}
      {messages.length <= 2 && (
        <div className="p-4 border-t">
          <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
          <div className="space-y-2">
            {quickQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full text-left justify-start h-auto p-3 text-xs"
                onClick={() => handleQuickQuestion(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me about your finances..."
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1 text-sm"
          />
          <Button onClick={handleSendMessage} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}