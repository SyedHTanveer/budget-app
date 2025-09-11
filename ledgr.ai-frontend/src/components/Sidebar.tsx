import styles from './Sidebar.module.css'
import { Button } from './ui/button'
import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { useNavigate } from 'react-router-dom'
import { 
  Home,
  PieChart,
  Target,
  List,
  Bell,
  Calendar as CalendarIcon,
  Settings,
  LogOut
} from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar'
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator
} from './ui/dropdown-menu'

type Tab = 'dashboard' | 'budget' | 'goals' | 'transactions' | 'calendar' | 'alerts';

function Sidebar() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: Home },
    { id: 'budget' as Tab, label: 'Budget', icon: PieChart },
    { id: 'goals' as Tab, label: 'Goals', icon: Target },
    { id: 'transactions' as Tab, label: 'Transactions', icon: List },
    { id: 'alerts' as Tab, label: 'Alerts', icon: Bell },
    { id: 'calendar' as Tab, label: 'Calendar', icon: CalendarIcon },
  ];

  return (
    <>
      <div className="flex flex-col h-screen w-[300px] gap-2">
        {/* Sidebar top */}
        <div className="flex flex-row gap-2 items-center rounded-b-md bg-neutral-900 p-2 justify-between">
          <div className={[styles.header, "flex items-center rounded-sm"].join(' ')}>
        <img
          src={new URL('./assets/ledgr_icon.svg', import.meta.url).href}
          alt="Ledgr icon"
          className={styles.logo}
        />
          </div>
          <div className="flex flex-row gap-2">
        <Button variant="ghost">
          <Bell className="w-6 h-6" />
        </Button>
          </div>
        </div>

        {/* Sidebar middle */}
        <div className="flex-grow flex flex-col gap-2 rounded-md bg-neutral-900 p-2">
          {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <Button
            variant={isActive ? 'secondary' : 'ghost'}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center justify-start text-left transition-colors"
          >
            <Icon className="w-6 h-6" />
            <span className={`flex text-left text-sm ${isActive ? 'font-medium' : 'font-normal'}`}>{tab.label}</span>
          </Button>
        );
          })}
        </div>

        {/* Sidebar bottom (user account dropdown) */}
        <div className="rounded-t-md bg-neutral-900 p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 h-auto">
                <Avatar>
                  <AvatarFallback className="text-xs">ST</AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 text-left">
                  <span className="text-sm font-medium leading-none">Syed Tanveer</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" sideOffset={6} align="start">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-0.5">
                  <span className="text-sm font-medium leading-none">Syed Tanveer</span>
                  <span className="text-xs text-muted-foreground">syed@example.com</span>
                </div>
              <DropdownMenuSeparator />
              </DropdownMenuLabel>
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); /* logout */ }}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  logout();
                  navigate('/');
                }}
              >
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  )
}

export default Sidebar;