import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card } from "./ui/card";
import { Target, Calendar, DollarSign, Plane, Home, Car, GraduationCap, Heart } from "lucide-react";

interface AddGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const goalCategories = [
  { name: "Vacation", icon: Plane, color: "bg-blue-500" },
  { name: "Emergency Fund", icon: Home, color: "bg-green-500" },
  { name: "Car", icon: Car, color: "bg-red-500" },
  { name: "Education", icon: GraduationCap, color: "bg-purple-500" },
  { name: "Wedding", icon: Heart, color: "bg-pink-500" },
  { name: "Other", icon: Target, color: "bg-gray-500" },
];

export function AddGoalModal({ open, onOpenChange }: AddGoalModalProps) {
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priority, setPriority] = useState("");

  const handleSave = () => {
    // Mock save process
    console.log("Saving goal:", {
      name: goalName,
      amount: targetAmount,
      deadline,
      category: selectedCategory,
      priority
    });
    
    // Reset form
    setGoalName("");
    setTargetAmount("");
    setDeadline("");
    setSelectedCategory("");
    setPriority("");
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Add New Goal
          </DialogTitle>
          <DialogDescription>
            Create a new savings goal and let our AI help you achieve it automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Goal Category */}
          <div className="space-y-2">
            <Label>Goal Category</Label>
            <div className="grid grid-cols-3 gap-2">
              {goalCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Card
                    key={category.name}
                    className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedCategory === category.name ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className={`h-8 w-8 rounded-full ${category.color} flex items-center justify-center`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs font-medium">{category.name}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Goal Name */}
          <div className="space-y-2">
            <Label htmlFor="goal-name">Goal Name</Label>
            <Input
              id="goal-name"
              placeholder="e.g., Miami Vacation"
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
                placeholder="0.00"
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
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <Target className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">AI-Powered Savings</h4>
                <p className="text-sm text-blue-700">
                  Our AI will automatically calculate how much to save each month based on your 
                  income, expenses, and timeline to help you reach this goal.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!goalName || !targetAmount || !selectedCategory}
          >
            Create Goal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}