import { useState, useEffect, useMemo } from "react";
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
import { useCloseMonthMutation, useGetBudgetCategoriesQuery, useSaveBudgetCategoriesMutation, useDeleteBudgetCategoryMutation } from "../store/api";
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useGetGoalsQuery } from "../store/api";

interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  icon: React.ReactNode;
  color: string;
  rollover_mode?: string;
  carry_over_percent?: number;
  savings_goal_id?: string | null;
}

export function BudgetManagement() {
  // Replace static seed with server categories
  const { data: serverCategories, isLoading: catLoading } = useGetBudgetCategoriesQuery();
  const [saveCategories, { isLoading: saving }] = useSaveBudgetCategoriesMutation();
  const [deleteCategory] = useDeleteBudgetCategoryMutation();
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const { data: goalsData } = useGetGoalsQuery();
  const goals = goalsData?.goals || [];
  const [closeMonth, { isLoading: closing }] = useCloseMonthMutation();

  // Seed from server once
  useEffect(() => {
    if (serverCategories) {
      setCategories(serverCategories.map((c: any) => ({
        id: c.id,
        name: c.name,
        budgeted: Number(c.monthly_limit) || 0,
        spent: Number(c.current_spent) || 0,
        icon: <Utensils className="h-4 w-4" />, // TODO: map icon_name to real icon
        color: c.color || 'bg-gray-100 text-gray-700',
        rollover_mode: c.rollover_mode || 'none',
        carry_over_percent: c.carry_over_percent || 0,
        savings_goal_id: c.savings_goal_id || null
      })));
    }
  }, [serverCategories]);

  // Keep an original snapshot for dirty tracking
  const originalKey = useMemo(() => JSON.stringify((serverCategories||[]).map((c:any)=>({
    id: c.id,
    name: c.name,
    budgeted: Number(c.monthly_limit)||0,
    rollover_mode: c.rollover_mode||'none',
    carry_over_percent: c.carry_over_percent||0,
    savings_goal_id: c.savings_goal_id||null,
    color: c.color || ''
  }))), [serverCategories]);
  const currentKey = JSON.stringify(categories.map(c=>({
    id: c.id,
    name: c.name,
    budgeted: c.budgeted,
    rollover_mode: c.rollover_mode||'none',
    carry_over_percent: c.carry_over_percent||0,
    savings_goal_id: c.savings_goal_id||null,
    color: c.color
  })));
  const dirty = originalKey !== currentKey;

  const handleCloseMonth = async () => {
    try {
      const res: any = await closeMonth().unwrap();
      if (res.status === 'queued') toast.message('Month close queued');
      else if (res.status === 'completed') toast.success('Month closed');
      else toast.success('Close month requested');
    } catch (e:any) {
      toast.error(e.message || 'Failed to close month');
    }
  };

  const totalBudgeted = categories.reduce((sum, cat) => sum + cat.budgeted, 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);

  const getBudgetStatus = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage >= 100) return { status: 'over', color: 'text-red-600', icon: AlertTriangle };
    if (percentage >= 80) return { status: 'warning', color: 'text-amber-600', icon: Clock };
    return { status: 'good', color: 'text-green-600', icon: CheckCircle };
  };

  // Local dialog state for new category
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('');

  const addCategory = () => {
    if (!newName.trim()) return;
    setCategories(prev => [...prev, {
      id: crypto.randomUUID(),
      name: newName.trim(),
      budgeted: parseFloat(newBudget)||0,
      spent: 0,
      icon: <Utensils className="h-4 w-4" />,
      color: 'bg-gray-100 text-gray-700',
      rollover_mode: 'none',
      carry_over_percent: 0,
      savings_goal_id: null
    }]);
    setNewName('');
    setNewBudget('');
  };

  const handleDelete = async (id: string) => {
    // Optimistic removal (server marks inactive)
    try {
      await deleteCategory({ id }).unwrap();
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Category deleted');
    } catch (e:any) {
      toast.error(e.message||'Delete failed');
    }
  };

  const handleSave = async () => {
    if (!dirty) return;
    const payload = categories.map(c => ({
      id: c.id,
      name: c.name,
      monthlyLimit: c.budgeted,
      rollover_mode: c.rollover_mode || 'none',
      carry_over_percent: c.rollover_mode === 'percent' ? (c.carry_over_percent||0) : 0,
      savings_goal_id: c.rollover_mode === 'to_savings' ? c.savings_goal_id : null,
      color: c.color,
      iconName: 'Utensils'
    }));
    try {
      await saveCategories({ categories: payload }).unwrap();
      toast.success('Categories saved');
    } catch (e:any) {
      toast.error(e.message||'Save failed');
    }
  };

  // Adjust updateCategory to include new fields
  const updateCategory = (id: string, patch: Partial<BudgetCategory>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  };

  return (
    <div className="space-y-6">
      {/* Top actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Budget</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleSave} disabled={!dirty || saving}>{saving ? 'Saving…' : dirty ? 'Save Changes' : 'Saved'}</Button>
          <Button size="sm" variant="outline" onClick={handleCloseMonth} disabled={closing}>{closing ? 'Closing…' : 'Close Month'}</Button>
        </div>
      </div>
      {/* Loading state */}
      {catLoading && <div className="text-sm text-muted-foreground">Loading categories…</div>}
      {/* Budget Overview */}
      <Card className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
        <div className="flex justify-between items-start mb-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
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
          <div className="ml-6">
            <Button size="sm" variant="outline" onClick={handleCloseMonth} disabled={closing} className="whitespace-nowrap mt-2">
              {closing ? 'Closing…' : 'Close Month'}
            </Button>
          </div>
        </div>
        <div className="mt-2">
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
                  <Input id="category-name" placeholder="e.g., Groceries" value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="category-budget">Monthly Budget</Label>
                  <Input id="category-budget" type="number" placeholder="0.00" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={addCategory}>Add Category</Button>
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

                {/* Rollover Settings */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Rollover Mode</span>
                    <Select value={(category as any).rollover_mode || 'none'} onValueChange={(value)=> updateCategory(category.id,{ rollover_mode: value as string })}>
                      <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="full">Full</SelectItem>
                        <SelectItem value="percent">Percent</SelectItem>
                        <SelectItem value="to_savings">To Goal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(category as any).rollover_mode === 'percent' && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Carry %</span>
                      <Input
                        className="h-8 w-24 text-xs"
                        type="number"
                        value={(category as any).carry_over_percent || ''}
                        onChange={(e)=> updateCategory(category.id,{ carry_over_percent: parseFloat(e.target.value)||0 })}
                        placeholder="0"
                      />
                    </div>
                  )}
                  {(category as any).rollover_mode === 'to_savings' && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Goal</span>
                      <Select value={(category as any).savings_goal_id || ''} onValueChange={(value)=> updateCategory(category.id,{ savings_goal_id: value as string })}>
                        <SelectTrigger className="h-8 w-40 text-xs">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="text-xs max-h-60">
                          {goals.length === 0 && <div className="px-2 py-1 text-muted-foreground text-xs">No goals</div>}
                          {goals.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
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