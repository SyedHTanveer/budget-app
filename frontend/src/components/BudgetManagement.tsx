import { useState } from "react";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { 
  Edit3, 
  Plus, 
  Coffee, 
  Car, 
  Home, 
  ShoppingCart, 
  Utensils, 
  Gamepad2,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  icon: React.ReactNode;
  color: string;
}

export function BudgetManagement() {
  const [categories, setCategories] = useState<BudgetCategory[]>([
    {
      id: '1',
      name: 'Food & Dining',
      budgeted: 600,
      spent: 420,
      icon: <Utensils className="h-4 w-4" />,
      color: 'bg-orange-100 text-orange-700'
    },
    {
      id: '2', 
      name: 'Transportation',
      budgeted: 300,
      spent: 285,
      icon: <Car className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-700'
    },
    {
      id: '3',
      name: 'Shopping',
      budgeted: 200,
      spent: 156,
      icon: <ShoppingCart className="h-4 w-4" />,
      color: 'bg-purple-100 text-purple-700'
    },
    {
      id: '4',
      name: 'Entertainment',
      budgeted: 150,
      spent: 180,
      icon: <Gamepad2 className="h-4 w-4" />,
      color: 'bg-green-100 text-green-700'
    },
    {
      id: '5',
      name: 'Coffee & Drinks',
      budgeted: 80,
      spent: 92,
      icon: <Coffee className="h-4 w-4" />,
      color: 'bg-amber-100 text-amber-700'
    }
  ]);

  const totalBudgeted = categories.reduce((sum, cat) => sum + cat.budgeted, 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);

  const getBudgetStatus = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage >= 100) return { status: 'over', color: 'text-red-600', icon: AlertTriangle };
    if (percentage >= 80) return { status: 'warning', color: 'text-amber-600', icon: Clock };
    return { status: 'good', color: 'text-green-600', icon: CheckCircle };
  };

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <Card className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="text-center lg:text-left">
            <p className="text-sm text-indigo-700 mb-1">Total Budget</p>
            <p className="text-2xl font-semibold text-indigo-900">
              ${totalBudgeted.toLocaleString()}
            </p>
          </div>
          <div className="text-center lg:text-left">
            <p className="text-sm text-indigo-700 mb-1">Total Spent</p>
            <p className="text-2xl font-semibold text-indigo-900">
              ${totalSpent.toLocaleString()}
            </p>
          </div>
          <div className="text-center lg:text-left">
            <p className="text-sm text-indigo-700 mb-1">Remaining</p>
            <p className={`text-2xl font-semibold ${
              totalBudgeted - totalSpent >= 0 ? 'text-green-700' : 'text-red-700'
            }`}>
              ${Math.abs(totalBudgeted - totalSpent).toLocaleString()}
              {totalBudgeted - totalSpent < 0 && ' over'}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-indigo-700">Overall Progress</span>
            <span className="text-indigo-700">
              {((totalSpent / totalBudgeted) * 100).toFixed(0)}%
            </span>
          </div>
          <Progress 
            value={(totalSpent / totalBudgeted) * 100} 
            className="h-3"
          />
        </div>
      </Card>

      {/* Category Budgets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-muted-foreground">Budget Categories</h3>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Budget Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category-name">Category Name</Label>
                  <Input id="category-name" placeholder="e.g., Groceries" />
                </div>
                <div>
                  <Label htmlFor="category-budget">Monthly Budget</Label>
                  <Input id="category-budget" type="number" placeholder="0.00" />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Add Category</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {categories.map((category) => {
            const percentage = (category.spent / category.budgeted) * 100;
            const remaining = category.budgeted - category.spent;
            const status = getBudgetStatus(category.spent, category.budgeted);
            const StatusIcon = status.icon;

            return (
              <Card key={category.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${category.color} mr-3`}>
                      {category.icon}
                    </div>
                    <div>
                      <h4 className="font-medium">{category.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${category.spent} of ${category.budgeted}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusIcon className={`h-4 w-4 ${status.color}`} />
                    <Button variant="ghost" size="sm">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {percentage.toFixed(0)}% used
                    </span>
                    <span className={remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {remaining >= 0 
                        ? `$${remaining.toFixed(0)} left`
                        : `$${Math.abs(remaining).toFixed(0)} over`
                      }
                    </span>
                  </div>
                </div>

                {percentage >= 90 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                      <p className="text-sm text-amber-800">
                        {percentage >= 100 
                          ? "You've exceeded this budget!"
                          : "You're close to your budget limit"
                        }
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Insights */}
      <Card className="p-6">
        <h3 className="font-medium mb-4">Budget Insights</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div>
              <p className="font-medium text-green-800">Great job on Shopping!</p>
              <p className="text-sm text-green-600">You're $44 under budget this month</p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-800">Entertainment is over budget</p>
              <p className="text-sm text-red-600">Consider reducing spending by $30</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div>
              <p className="font-medium text-blue-800">Spending Trend</p>
              <p className="text-sm text-blue-600">You typically spend 20% more in the last week</p>
            </div>
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </Card>
    </div>
  );
}