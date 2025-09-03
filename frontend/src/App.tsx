import { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from './store/store';
import { initAuth, login as loginAction, logout as logoutAction } from './store/authSlice';
import { Dashboard } from "./components/Dashboard";
import { AIAssistant } from "./components/AIAssistant";
import { Goals } from "./components/Goals";
import { TransactionFeed } from "./components/TransactionFeed";
import { Calendar } from "./components/Calendar";
import { BudgetManagement } from "./components/BudgetManagement";
import { SettingsModal } from "./components/SettingsModal";
import { ConnectBankModal } from "./components/ConnectBankModal";
import { AddGoalModal } from "./components/AddGoalModal";
import { LoginPage } from "./components/LoginPage";
import { UserDropdown } from "./components/UserDropdown";
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./components/ui/dialog";
import { 
  Home, 
  Target, 
  List, 
  Calendar as CalendarIcon,
  Settings,
  Bell,
  User,
  CreditCard,
  Sparkles,
  Plus,
  MessageCircle,
  PieChart,
  Download,
  Plane,
  Shield
} from "lucide-react";
import { AlertsPanel } from "./components/AlertsPanel";
import { ExportJobsPanel } from "./components/ExportJobsPanel";
import { SessionsPanel } from "./components/SessionsPanel";
import { VacationPeriodsPanel } from "./components/VacationPeriodsPanel";
import { PrivacyPanel } from "./components/PrivacyPanel";

type Tab = 'dashboard' | 'budget' | 'goals' | 'transactions' | 'calendar' | 'alerts' | 'exports' | 'sessions' | 'vacation' | 'privacy';

export default function App() {
  // const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConnectBankOpen, setIsConnectBankOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);

  const dispatch = useDispatch();
  const auth = useSelector((s: RootState) => s.auth);
  const isAuthenticated = auth.status === 'authenticated';

  useEffect(() => { if (auth.status === 'idle') dispatch(initAuth() as any); }, [dispatch]);

  const handleLogin = (email: string, password: string) => {
    dispatch(loginAction({ email, password }) as any);
  };

  const handleLogout = () => {
    dispatch(logoutAction() as any);
    setActiveTab('dashboard');
  };

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Home', icon: Home },
    { id: 'budget' as Tab, label: 'Budget', icon: PieChart },
    { id: 'goals' as Tab, label: 'Goals', icon: Target },
    { id: 'transactions' as Tab, label: 'Transactions', icon: List },
    { id: 'alerts' as Tab, label: 'Alerts', icon: Bell },
    { id: 'exports' as Tab, label: 'Exports', icon: Download },
    { id: 'calendar' as Tab, label: 'Calendar', icon: CalendarIcon },
    { id: 'sessions' as Tab, label: 'Sessions', icon: User },
    { id: 'vacation' as Tab, label: 'Vacation', icon: Plane },
    { id: 'privacy' as Tab, label: 'Privacy', icon: Shield },
  ];

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'budget':
        return <BudgetManagement />;
      case 'goals':
        return <Goals onAddGoal={() => setIsAddGoalOpen(true)} />;
      case 'transactions':
        return <TransactionFeed />;
      case 'calendar':
        return <Calendar />;
      case 'alerts':
        return <AlertsPanel />;
      case 'exports':
        return <ExportJobsPanel />;
      case 'sessions':
        return <SessionsPanel />;
      case 'vacation':
        return <VacationPeriodsPanel />;
      case 'privacy':
        return <PrivacyPanel />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Desktop Left Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-40">
        <div className="flex flex-col flex-grow bg-white border-r">
          {/* Logo/Header */}
          <div className="flex items-center p-6 border-b h-[85px]">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">Budget</h1>
              <p className="text-xs text-muted-foreground">Good morning, Alex</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    isActive 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Actions for Desktop */}
          <div className="p-4 border-t space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => setIsAddGoalOpen(true)}
            >
              <Target className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => setIsConnectBankOpen(true)}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Connect Bank
            </Button>
          </div>

          {/* Settings */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" className="flex-1">
                <Bell className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex-1"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <UserDropdown 
                onLogout={handleLogout}
                onSettings={() => setIsSettingsOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Right AI Chat Sidebar */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col lg:fixed lg:inset-y-0 lg:right-0 lg:z-40">
        <div className="flex flex-col flex-grow bg-white border-l">
          {/* AI Chat Header */}
          <div className="flex items-center p-6 border-b h-[85px]">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">AI Assistant</h1>
              <p className="text-xs text-muted-foreground">Ask about budgeting & spending</p>
            </div>
          </div>

          {/* AI Chat Content */}
          <div className="flex-1 overflow-hidden">
            <AIAssistant />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:ml-64 lg:mr-80 flex-1 h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold">Budget</h1>
                <p className="text-xs text-muted-foreground">Good morning, Alex</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block bg-white border-b sticky top-0 z-30">
          <div className="flex items-center justify-between p-6 h-[85px]">
            <div>
              <h1 className="text-2xl font-semibold capitalize">{activeTab}</h1>
              <p className="text-muted-foreground text-xs">
                {activeTab === 'dashboard' && 'Overview of your financial health'}
                {activeTab === 'budget' && 'Manage your spending categories and limits'}
                {activeTab === 'goals' && 'Track your savings goals and progress'}
                {activeTab === 'transactions' && 'Review your recent transactions'}
                {activeTab === 'calendar' && 'View upcoming bills and payments'}
                {activeTab === 'alerts' && 'View important alerts and notifications'}
                {activeTab === 'exports' && 'Manage your data export jobs'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                <Bell className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="hover:bg-gray-100"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
              <UserDropdown 
                onLogout={handleLogout}
                onSettings={() => setIsSettingsOpen(true)}
              />
            </div>
          </div>
        </div>

        {/* Mobile Quick Actions (Only on Dashboard) */}
        {activeTab === 'dashboard' && (
          <div className="lg:hidden p-4 bg-white border-b">
            <div className="flex space-x-3 overflow-x-auto">
              <Button 
                variant="outline" 
                size="sm" 
                className="whitespace-nowrap"
                onClick={() => setIsAssistantOpen(true)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Ask AI
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="whitespace-nowrap"
                onClick={() => setIsAddGoalOpen(true)}
              >
                <Target className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="whitespace-nowrap"
                onClick={() => setIsConnectBankOpen(true)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Connect Bank
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="p-4 lg:p-6 pb-24 lg:pb-6">
          <div className="max-w-full mx-auto">
            <div className="space-y-6 overflow-y-auto">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI Assistant Button - Mobile Only */}
      <Button
        onClick={() => setIsAssistantOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 z-50"
        size="icon"
      >
        <Plus className="h-6 w-6 text-white" />
      </Button>

      {/* AI Assistant Dialog */}
      <Dialog open={isAssistantOpen} onOpenChange={setIsAssistantOpen}>
        <DialogContent className="max-w-lg w-full h-[600px] lg:h-[700px] p-0 gap-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
              AI Financial Assistant
            </DialogTitle>
            <DialogDescription>
              Chat with your AI assistant about budgeting, spending decisions, and financial goals.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <AIAssistant />
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="flex items-center justify-around p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal Components */}
      <SettingsModal 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
      />
      
      <ConnectBankModal 
        open={isConnectBankOpen} 
        onOpenChange={setIsConnectBankOpen} 
      />
      
      <AddGoalModal 
        open={isAddGoalOpen} 
        onOpenChange={setIsAddGoalOpen} 
      />
    </div>
  );
}