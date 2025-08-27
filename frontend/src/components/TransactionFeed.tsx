import { useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  Coffee, 
  ShoppingBag, 
  Car, 
  Home, 
  Utensils, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from "lucide-react";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  date: string;
  icon: React.ReactNode;
  pending?: boolean;
}

export function TransactionFeed() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const transactions: Transaction[] = [
    {
      id: 1,
      description: "Starbucks",
      amount: -5.47,
      type: 'expense',
      category: 'Food & Drink',
      date: 'Today',
      icon: <Coffee className="h-4 w-4" />
    },
    {
      id: 2,
      description: "Salary Deposit",
      amount: 3200.00,
      type: 'income',
      category: 'Income',
      date: 'Today',
      icon: <ArrowDownRight className="h-4 w-4" />
    },
    {
      id: 3,
      description: "Amazon Purchase",
      amount: -89.99,
      type: 'expense',
      category: 'Shopping',
      date: 'Yesterday',
      icon: <ShoppingBag className="h-4 w-4" />,
      pending: true
    },
    {
      id: 4,
      description: "Uber Ride",
      amount: -15.30,
      type: 'expense',
      category: 'Transport',
      date: 'Yesterday',
      icon: <Car className="h-4 w-4" />
    },
    {
      id: 5,
      description: "Rent Payment",
      amount: -1200.00,
      type: 'expense',
      category: 'Bills',
      date: '2 days ago',
      icon: <Home className="h-4 w-4" />
    },
    {
      id: 6,
      description: "Chipotle",
      amount: -12.45,
      type: 'expense',
      category: 'Food & Drink',
      date: '2 days ago',
      icon: <Utensils className="h-4 w-4" />
    },
    {
      id: 7,
      description: "Credit Card Payment",
      amount: -450.00,
      type: 'expense',
      category: 'Bills',
      date: '3 days ago',
      icon: <CreditCard className="h-4 w-4" />
    }
  ];

  const categories = ['All', 'Food & Drink', 'Shopping', 'Transport', 'Bills', 'Income'];

  const filteredTransactions = selectedCategory && selectedCategory !== 'All' 
    ? transactions.filter(t => t.category === selectedCategory)
    : transactions;

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Food & Drink': 'bg-orange-100 text-orange-700',
      'Shopping': 'bg-purple-100 text-purple-700',
      'Transport': 'bg-blue-100 text-blue-700',
      'Bills': 'bg-red-100 text-red-700',
      'Income': 'bg-green-100 text-green-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2>Recent Transactions</h2>
        <Button variant="ghost" size="sm">
          <Filter className="h-4 w-4 mr-1" />
          Filter
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="whitespace-nowrap"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.map((transaction) => (
          <Card key={transaction.id} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {transaction.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{transaction.description}</span>
                    {transaction.pending && (
                      <Badge variant="secondary" className="text-xs">
                        Pending
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getCategoryColor(transaction.category)}`}
                    >
                      {transaction.category}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {transaction.date}
                    </span>
                  </div>
                </div>
              </div>
              <div className={`text-right ${
                transaction.type === 'income' ? 'text-green-600' : 'text-gray-900'
              }`}>
                <div className="font-medium">
                  {transaction.type === 'income' ? '+' : ''}
                  ${Math.abs(transaction.amount).toLocaleString()}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button variant="outline" className="w-full">
        View All Transactions
      </Button>
    </div>
  );
}