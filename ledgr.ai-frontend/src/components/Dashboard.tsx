import { Button } from "./ui/button";
// Dashboard section subcomponents
import { TopMetrics } from './dashboard/TopMetrics';
import { BreakdownSection } from './dashboard/BreakdownSection';
import { BalancesSection } from './dashboard/BalancesSection';
import { PayPeriodCard } from './dashboard/PayPeriodCard';
import { GoalsAndTransactions } from './dashboard/GoalsAndTransactions';
import { BotMessageSquare, Landmark } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setChatOpen } from '../../store/SystemSlice';
import type { RootState } from '../../store/store';

function Dashboard() {
  const dispatch = useDispatch();
  const chatOpen = useSelector((state: RootState) => state.system.chatOpen);
  return (
      <div className="flex flex-col h-screen w-full gap-2">
        <div className="flex flex-row justify-between gap-4 items-center rounded-b-md bg-neutral-900 w-full px-2 py-2">
            <p className="text-lg antialiased font-medium pl-6">Dashboard</p>
            <div className="flex gap-4">
                <Button variant="outline"><Landmark />Connect account</Button>
                {!chatOpen && (
                  <Button variant="outline" onClick={() => dispatch(setChatOpen(true))}>
                    <BotMessageSquare />Chat
                  </Button>
                )}
            </div>
        </div>
        <div className="flex flex-col flex-1 gap-6 rounded-t-md bg-neutral-900 w-full p-8 overflow-auto ">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 space-y-4">
              <TopMetrics />
            </div>
            <PayPeriodCard />
          </div>
          <BreakdownSection />
          <BalancesSection />
          <GoalsAndTransactions />
        </div>
    </div>
  );
}
export default Dashboard;