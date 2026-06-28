import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CourseProgress from "./CourseProgress";
import type { CourseWithProgress } from "@/lib/learn";

interface CourseCardProps {
  course: CourseWithProgress;
}

const CourseCard = ({ course }: CourseCardProps) => (
  <Link to={`/learn/${course.id}`} className="block group">
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader>
        <span className="text-3xl mb-2 block">{course.emoji}</span>
        <CardTitle className="font-heading text-xl group-hover:text-blush-dark transition-colors">
          {course.title}
        </CardTitle>
        {course.description && (
          <CardDescription className="font-body line-clamp-2">
            {course.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <CourseProgress
          completed={course.completedWings}
          total={course.totalWings}
        />
      </CardContent>
    </Card>
  </Link>
);

export default CourseCard;
