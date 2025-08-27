import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  Calendar as CalendarIcon, 
  Home, 
  Zap, 
  Phone, 
  Wifi,
  Target,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface CalendarEvent {
  id: number;
  title: string;
  amount: number;
  type: 'bill' | 'goal' | 'income';
  date: number;
  icon: React.ReactNode;
  status: 'upcoming' | 'paid' | 'overdue';
}

export function Calendar() {
  const currentMonth = "August 2025";
  const today = 24;
  
  const events: CalendarEvent[] = [
    {
      id: 1,
      title: "Rent",
      amount: 1200,
      type: 'bill',
      date: 27,
      icon: <Home className="h-4 w-4" />,
      status: 'upcoming'
    },
    {
      id: 2,
      title: "Electric Bill",
      amount: 85,
      type: 'bill',
      date: 29,
      icon: <Zap className="h-4 w-4" />,
      status: 'upcoming'
    },
    {
      id: 3,
      title: "Phone Bill",
      amount: 45,
      type: 'bill',
      date: 32, // Next month
      icon: <Phone className="h-4 w-4" />,
      status: 'upcoming'
    },
    {
      id: 4,
      title: "Miami Trip Goal",
      amount: 100,
      type: 'goal',
      date: 25,
      icon: <Target className="h-4 w-4" />,
      status: 'upcoming'
    },
    {
      id: 5,
      title: "Internet",
      amount: 65,
      type: 'bill',
      date: 15,
      icon: <Wifi className="h-4 w-4" />,
      status: 'paid'
    }
  ];

  const getDaysInMonth = () => {
    return Array.from({ length: 31 }, (_, i) => i + 1);
  };

  const getEventsForDay = (day: number) => {
    return events.filter(event => event.date === day);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bill': return 'border-red-200 bg-red-50';
      case 'goal': return 'border-blue-200 bg-blue-50';
      case 'income': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5" />
          <h2>{currentMonth}</h2>
        </div>
        <div className="flex space-x-1">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Upcoming Events List */}
      <div className="space-y-3">
        <h3 className="text-muted-foreground">Upcoming This Period</h3>
        {events
          .filter(event => event.date >= today && event.status !== 'paid')
          .sort((a, b) => a.date - b.date)
          .map((event) => (
            <Card key={event.id} className={`p-3 ${getTypeColor(event.type)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-white">
                    {event.icon}
                  </div>
                  <div>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {event.date > 31 ? 'Next month' : `Aug ${event.date}`}
                      {event.date === today + 3 && ' (in 3 days)'}
                      {event.date === today + 5 && ' (in 5 days)'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    ${event.amount.toLocaleString()}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStatusColor(event.status)}`}
                  >
                    {event.status}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
      </div>

      {/* Mini Calendar Grid */}
      <Card className="p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {dayHeaders.map((day, index) => (
            <div key={`header-${index}-${day}`} className="p-2 text-muted-foreground">
              {day}
            </div>
          ))}
          
          {/* Dummy days for proper alignment */}
          {Array.from({ length: 3 }, (_, i) => (
            <div key={`empty-${i}`} className="p-2"></div>
          ))}
          
          {getDaysInMonth().map((day) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day === today;
            const hasPaidEvent = dayEvents.some(e => e.status === 'paid');
            const hasUpcomingEvent = dayEvents.some(e => e.status === 'upcoming');
            
            return (
              <div
                key={`day-${day}`}
                className={`p-2 relative ${
                  isToday 
                    ? 'bg-blue-500 text-white rounded-lg' 
                    : hasUpcomingEvent 
                      ? 'bg-red-100 text-red-700 rounded' 
                      : hasPaidEvent
                        ? 'bg-green-100 text-green-700 rounded'
                        : ''
                }`}
              >
                {day}
                {dayEvents.length > 0 && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-current rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-3 text-center">
          <div className="text-xl text-red-600 mb-1">$1,330</div>
          <div className="text-sm text-muted-foreground">Bills Due</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xl text-blue-600 mb-1">$100</div>
          <div className="text-sm text-muted-foreground">Goal Target</div>
        </Card>
      </div>
    </div>
  );
}