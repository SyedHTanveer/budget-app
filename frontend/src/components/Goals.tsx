import { useState } from "react";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { Plus, Plane, Car, Home, Gift, Edit3 } from "lucide-react";
import { EditGoalModal } from "./EditGoalModal";

interface Goal {
  id: number;
  name: string;
  currentAmount: number;
  targetAmount: number;
  icon: React.ReactNode;
  color: string;
  dueDate?: string;
}

interface GoalsProps {
  onAddGoal?: () => void;
}

export function Goals({ onAddGoal }: GoalsProps) {
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const goals: Goal[] = [
    {
      id: 1,
      name: "Miami Trip",
      currentAmount: 320,
      targetAmount: 800,
      icon: <Plane className="h-5 w-5" />,
      color: "from-blue-400 to-blue-600",
      dueDate: "Next weekend"
    },
    {
      id: 2,
      name: "Emergency Fund",
      currentAmount: 2400,
      targetAmount: 5000,
      icon: <Home className="h-5 w-5" />,
      color: "from-green-400 to-green-600"
    },
    {
      id: 3,
      name: "New Car",
      currentAmount: 1850,
      targetAmount: 8000,
      icon: <Car className="h-5 w-5" />,
      color: "from-purple-400 to-purple-600"
    },
    {
      id: 4,
      name: "Annual Subscriptions",
      currentAmount: 45,
      targetAmount: 300,
      icon: <Gift className="h-5 w-5" />,
      color: "from-orange-400 to-orange-600",
      dueDate: "Due in 2 months"
    }
  ];

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2>Your Goals</h2>
        <Button size="sm" className="h-8" onClick={onAddGoal}>
          <Plus className="h-4 w-4 mr-1" />
          Add Goal
        </Button>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          const remaining = goal.targetAmount - goal.currentAmount;
          
          return (
            <Card key={goal.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${goal.color} text-white mr-3`}>
                    {goal.icon}
                  </div>
                  <div>
                    <h3 className="font-medium">{goal.name}</h3>
                    {goal.dueDate && (
                      <p className="text-sm text-muted-foreground">{goal.dueDate}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg">
                    ${goal.currentAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    of ${goal.targetAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {progress.toFixed(0)}% complete
                  </span>
                  <span className="text-muted-foreground">
                    ${remaining.toLocaleString()} to go
                  </span>
                </div>
              </div>

              <div className="flex justify-center mt-3">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleEditGoal(goal)}
                  className="flex items-center"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Goal
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Total Progress */}
      <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <div className="text-center">
          <div className="text-2xl text-indigo-800 mb-1">
            ${goals.reduce((sum, goal) => sum + goal.currentAmount, 0).toLocaleString()}
          </div>
          <p className="text-indigo-600 text-sm">
            Total saved across all goals
          </p>
        </div>
      </Card>

      <EditGoalModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        goal={editingGoal}
      />
    </div>
  );
}