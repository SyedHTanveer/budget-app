import { useGetGoalsQuery, useCreateGoalMutation, useUpdateGoalMutation, useDeleteGoalMutation, useContributeGoalMutation } from '../store/api';
import { useState } from 'react';
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { EditGoalModal } from "./EditGoalModal";

export function Goals({ onAddGoal }: { onAddGoal?: ()=>void }) {
  const { data, isLoading } = useGetGoalsQuery();
  const [createGoal] = useCreateGoalMutation();
  const [updateGoal] = useUpdateGoalMutation();
  const [deleteGoal] = useDeleteGoalMutation();
  const [contribute] = useContributeGoalMutation();
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const goals = data?.goals || [];

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Goals</h2>
        <div className="flex gap-2">
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Name" className="border rounded px-2 py-1 text-xs" />
          <input value={newTarget} onChange={e=>setNewTarget(e.target.value)} placeholder="Target $" className="border rounded px-2 py-1 text-xs w-24" />
          <button className="text-xs px-3 py-1 bg-blue-600 text-white rounded" onClick={async ()=>{ if(!newName||!newTarget) return; await createGoal({ name:newName.trim(), target_amount: parseFloat(newTarget)||0 }).unwrap(); setNewName(''); setNewTarget(''); }}>Add</button>
        </div>
      </div>
      <div className="space-y-3">
        {goals.map((g:any)=>{
          const pct = g.target_amount ? (g.current_amount / g.target_amount) * 100 : 0;
          return (
            <div key={g.id} className="p-3 border rounded flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate" title={g.name}>{g.name}</span>
                  {!g.is_active && <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 rounded">Archived</span>}
                </div>
                <div className="text-xs text-muted-foreground mt-1">${g.current_amount?.toLocaleString()} / ${g.target_amount?.toLocaleString()} ({pct.toFixed(0)}%)</div>
                <div className="h-1.5 bg-gray-200 rounded mt-2 overflow-hidden"><div style={{width:`${Math.min(100,pct)}%`}} className="h-full bg-blue-500" /></div>
              </div>
              <div className="flex flex-col gap-1 ml-4">
                <button className="text-[10px] px-2 py-1 border rounded" onClick={async ()=>{ await contribute({ id:g.id, amount:25 }).unwrap(); }}>+25</button>
                <button className="text-[10px] px-2 py-1 border rounded" onClick={async ()=>{ await updateGoal({ id:g.id, is_active: !g.is_active }).unwrap(); }}>{g.is_active? 'Archive':'Restore'}</button>
                <button className="text-[10px] px-2 py-1 border rounded text-red-600" onClick={async ()=>{ await deleteGoal({ id:g.id }).unwrap(); }}>Del</button>
              </div>
            </div>
          );
        })}
        {goals.length===0 && !isLoading && <div className="text-xs text-muted-foreground">No goals yet.</div>}
      </div>

      {/* Total Progress */}
      <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <div className="text-center">
          <div className="text-2xl text-indigo-800 mb-1">
            ${goals.reduce((sum: number, goal: any) => sum + (goal.current_amount||0), 0).toLocaleString()}
          </div>
          <p className="text-indigo-600 text-sm">
            Total saved across all goals
          </p>
        </div>
      </Card>

      {isEditModalOpen && editingGoal && (
        <div className="hidden" />
      )}

      <EditGoalModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        goal={editingGoal}
      />
    </div>
  );
}

export default Goals;