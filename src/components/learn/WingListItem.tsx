import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ChevronRight, Clock } from "lucide-react";
import type { LearnWing } from "@/lib/learn";

interface WingListItemProps {
  wing: LearnWing;
  courseId: string;
  moduleId: string;
  completed: boolean;
}

const WingListItem = ({ wing, courseId, moduleId, completed }: WingListItemProps) => (
  <Link to={`/learn/${courseId}/${moduleId}/${wing.id}`}>
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
      {completed ? (
        <CheckCircle2 size={20} className="text-blush-dark flex-shrink-0" />
      ) : (
        <Circle size={20} className="text-muted-foreground flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-body font-medium text-sm truncate">{wing.title}</p>
        {wing.estimated_minutes && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock size={12} /> {wing.estimated_minutes} min
          </p>
        )}
      </div>
      <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
    </div>
  </Link>
);

export default WingListItem;
