import { Progress } from "@/components/ui/progress";

interface CourseProgressProps {
  completed: number;
  total: number;
}

const CourseProgress = ({ completed, total }: CourseProgressProps) => {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <Progress value={pct} className="h-2 flex-1" />
      <span className="text-xs font-body text-muted-foreground whitespace-nowrap">
        {completed}/{total} Wings
      </span>
    </div>
  );
};

export default CourseProgress;
