import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card } from "./ui/card";
import { Target, Calendar, DollarSign, Trash2 } from "lucide-react";

interface Goal {
  id: number;
  name: string;
  currentAmount: number;
  targetAmount: number;
  dueDate?: string;
  priority?: string;
}

interface EditGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
}

export function EditGoalModal({ open, onOpenChange, goal }: EditGoalModalProps) {
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("");

  useEffect(() => {
    if (goal) {
      setGoalName(goal.name);
      setTargetAmount(goal.targetAmount.toString());
      setDeadline(goal.dueDate || "");
      setPriority(goal.priority || "medium");
    }
  }, [goal]);

  const handleSave = () => {
    // Mock save process
    console.log("Updating goal:", {
      id: goal?.id,
      name: goalName,
      amount: targetAmount,
      deadline,
      priority
    });
    
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this goal? This action cannot be undone.")) {
      console.log("Deleting goal:", goal?.id);
      onOpenChange(false);
    }
  };

  if (!goal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Edit Goal
          </DialogTitle>
          <DialogDescription>
            Update your goal details. AI will automatically adjust your savings plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Progress */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-blue-900">Current Progress</h4>
                <p className="text-sm text-blue-700">
                  ${goal.currentAmount.toLocaleString()} saved
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-blue-900">
                  {((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-blue-700">Complete</p>
              </div>
            </div>
          </Card>

          {/* Goal Name */}
          <div className="space-y-2">
            <Label htmlFor="goal-name">Goal Name</Label>
            <Input
              id="goal-name"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
            />
          </div>

          {/* Target Amount */}
          <div className="space-y-2">
            <Label htmlFor="target-amount">Target Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="target-amount"
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline">Target Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High - Save aggressively</SelectItem>
                <SelectItem value="medium">Medium - Steady progress</SelectItem>
                <SelectItem value="low">Low - Save when possible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* AI Notice */}
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-start space-x-3">
              <Target className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Smart Savings Adjustment</h4>
                <p className="text-sm text-green-700">
                  AI will recalculate your monthly savings amount based on these changes 
                  to keep you on track for your goal.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-between pt-4">
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            className="flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Goal
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!goalName || !targetAmount}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}