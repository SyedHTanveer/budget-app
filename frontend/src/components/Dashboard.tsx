import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Wallet, Shield, Target, Calendar, TrendingUp, TrendingDown, CreditCard, Banknote, Clock, Percent } from "lucide-react";

interface ReserveBreakdown {
  label: string;
  amount: number;
  icon: React.ReactNode;
  color: string;
}

export function Dashboard() {
  const safeToSpend = 847.23;
  const totalBalance = 3420.50;
  
  const connectedAccounts = [
    { name: "Chase Checking", balance: 2180.50, type: "checking", last4: "4521" },
    { name: "Capital One Savings", balance: 1240.00, type: "savings", last4: "7832" },
  ];

  const payPeriodStats = {
    daysUntilPaycheck: 8,
    percentUsed: 68,
    amountUsed: 2172.50,
    totalBudget: 3200.00
  };
  
  const reserves: ReserveBreakdown[] = [
    {
      label: "Upcoming Bills",
      amount: 1150.00,
      icon: <Calendar className="h-4 w-4" />,
      color: "bg-red-100 text-red-700"
    },
    {
      label: "Goals & Savings",
      amount: 850.00,
      icon: <Target className="h-4 w-4" />,
      color: "bg-blue-100 text-blue-700"
    },
    {
      label: "Safety Buffer",
      amount: 573.27,
      icon: <Shield className="h-4 w-4" />,
      color: "bg-green-100 text-green-700"
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Safe to Spend Card */}
      <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Wallet className="h-6 w-6 text-emerald-600 mr-2" />
            <span className="text-emerald-700">Safe to Spend</span>
          </div>
          <div className="text-4xl lg:text-5xl text-emerald-800 mb-2">
            ${safeToSpend.toLocaleString()}
          </div>
          <p className="text-emerald-600 text-sm">
            Out of ${totalBalance.toLocaleString()} total balance
          </p>
          <div className="mt-4 w-full bg-emerald-200 rounded-full h-2">
            <div 
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(safeToSpend / totalBalance) * 100}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Connected Accounts */}
      <div className="space-y-3">
        <h3 className="text-muted-foreground">Connected Accounts</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {connectedAccounts.map((account, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700 mr-3">
                    {account.type === "checking" ? <Banknote className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                  </div>
                  <div>
                    <h4 className="font-medium">{account.name}</h4>
                    <p className="text-xs text-muted-foreground">••••{account.last4}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${account.balance.toLocaleString()}</div>
                  <Badge variant="secondary" className="text-xs">
                    {account.type === "checking" ? "Checking" : "Savings"}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Pay Period Overview */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="font-medium text-purple-900">Current Pay Period</h3>
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            {payPeriodStats.daysUntilPaycheck} days until next paycheck
          </Badge>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-purple-700">Amount Used</p>
            <p className="text-xl font-semibold text-purple-900">
              ${payPeriodStats.amountUsed.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-purple-700">Budget Progress</p>
            <div className="flex items-center">
              <p className="text-xl font-semibold text-purple-900 mr-2">
                {payPeriodStats.percentUsed}%
              </p>
              <Percent className="h-4 w-4 text-purple-600" />
            </div>
          </div>
          <div className="col-span-2 lg:col-span-1">
            <p className="text-sm text-purple-700 mb-2">Progress</p>
            <Progress 
              value={payPeriodStats.percentUsed} 
              className="h-2"
            />
          </div>
        </div>
      </Card>

      {/* Reserves Breakdown */}
      <div className="space-y-3">
        <h3 className="text-muted-foreground">Your Money Breakdown</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {reserves.map((reserve, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between mb-3 lg:flex-col lg:items-start lg:space-y-2">
                <div className="flex items-center lg:w-full">
                  <div className={`p-2 rounded-lg ${reserve.color} mr-3`}>
                    {reserve.icon}
                  </div>
                  <span className="lg:text-sm">{reserve.label}</span>
                </div>
                <span className="font-medium lg:text-lg">${reserve.amount.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(reserve.amount / totalBalance) * 100}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {((reserve.amount / totalBalance) * 100).toFixed(0)}% of total
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center mb-2 lg:mb-1">
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
          </div>
          <div className="text-xl lg:text-2xl text-red-600 mb-1">$425</div>
          <div className="text-xs lg:text-sm text-muted-foreground">This Week Spent</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center mb-2 lg:mb-1">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          </div>
          <div className="text-xl lg:text-2xl text-green-600 mb-1">$180</div>
          <div className="text-xs lg:text-sm text-muted-foreground">Goals Progress</div>
        </Card>
        <Card className="p-4 text-center lg:block hidden">
          <div className="text-xl lg:text-2xl text-blue-600 mb-1">$2,400</div>
          <div className="text-xs lg:text-sm text-muted-foreground">Emergency Fund</div>
        </Card>
        <Card className="p-4 text-center lg:block hidden">
          <div className="text-xl lg:text-2xl text-purple-600 mb-1">6</div>
          <div className="text-xs lg:text-sm text-muted-foreground">Active Goals</div>
        </Card>
      </div>

      {/* Recent Activity (Desktop Only) */}
      <div className="hidden lg:block">
        <Card className="p-6">
          <h3 className="font-medium mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { description: "Starbucks", amount: -5.47, date: "Today" },
              { description: "Salary Deposit", amount: 3200.00, date: "Today" },
              { description: "Amazon Purchase", amount: -89.99, date: "Yesterday" },
            ].map((transaction, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium">{transaction.description}</div>
                  <div className="text-sm text-muted-foreground">{transaction.date}</div>
                </div>
                <div className={`font-medium ${
                  transaction.amount > 0 ? 'text-green-600' : 'text-gray-900'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}