import GoalCard from "./GoalCard";
import { Goal } from "../utils/goalTypes";

export default function GoalsList({
  goals,
  selectedGoalId,
  onSelect,
}: {
  goals: Goal[];
  selectedGoalId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="lg:col-span-2 space-y-4">
      <h2 className="text-lg font-semibold text-gray-200">Your goals</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            selected={goal.id === selectedGoalId}
            onClick={() => onSelect(goal.id)}
          />
        ))}
      </div>
    </div>
  );
}