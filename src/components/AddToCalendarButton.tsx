import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  downloadIcs,
  googleCalendarUrl,
  outlookCalendarUrl,
  slugifyFilename,
  type CalendarEvent,
} from "@/lib/calendar";

interface Props {
  event: CalendarEvent;
  size?: "sm" | "default";
  variant?: "outline" | "default" | "secondary" | "ghost";
  label?: string;
  className?: string;
}

export function AddToCalendarButton({
  event,
  size = "default",
  variant = "outline",
  label = "Add to calendar",
  className,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <CalendarPlus className="w-4 h-4 mr-2" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover z-50">
        <DropdownMenuItem
          onClick={() =>
            downloadIcs(event, `${slugifyFilename(event.title)}.ics`)
          }
        >
          Apple Calendar / .ics file
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer">
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={outlookCalendarUrl(event)} target="_blank" rel="noreferrer">
            Outlook
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
