import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import WingListItem from "./WingListItem";
import type { LearnModule, LearnWing } from "@/lib/learn";

interface ModuleAccordionProps {
  modules: LearnModule[];
  wingsByModule: Record<string, LearnWing[]>;
  courseId: string;
  completedWingIds: Set<string>;
}

const ModuleAccordion = ({
  modules,
  wingsByModule,
  courseId,
  completedWingIds,
}: ModuleAccordionProps) => {
  return (
    <Accordion type="multiple" defaultValue={modules.map((m) => m.id)} className="space-y-4">
      {modules.map((mod) => {
        const wings = wingsByModule[mod.id] ?? [];
        const done = wings.filter((w) => completedWingIds.has(w.id)).length;
        return (
          <AccordionItem key={mod.id} value={mod.id} className="border rounded-xl px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="text-left">
                <h3 className="font-heading text-lg">{mod.title}</h3>
                <p className="text-xs font-body text-muted-foreground mt-0.5">
                  {done} of {wings.length} wings completed
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pb-2">
                {wings.map((w) => (
                  <WingListItem
                    key={w.id}
                    wing={w}
                    courseId={courseId}
                    moduleId={mod.id}
                    completed={completedWingIds.has(w.id)}
                  />
                ))}
                {wings.length === 0 && (
                  <p className="text-sm text-muted-foreground italic py-2">
                    No wings in this module yet.
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default ModuleAccordion;
