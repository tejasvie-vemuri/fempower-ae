import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listUpcomingEvents from "./tools/list-upcoming-events";
import getMyRegistrations from "./tools/get-my-registrations";
import searchMembers from "./tools/search-members";
import listMeetups from "./tools/list-meetups";
import rsvpToMeetup from "./tools/rsvp-to-meetup";
import getMyChecklists from "./tools/get-my-checklists";

// The OAuth issuer must be the direct Supabase host, built from the project
// ref (inlined by Vite at build time, so this stays import-safe).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "fempower-landing",
  title: "FEmpower Landing",
  version: "0.1.0",
  instructions:
    "Tools for Fempower, a women's community in the UAE. Callers act as the signed-in member: browse published events and member-hosted meetups, check their own registrations and saved Zara coaching checklists, search the approved member directory, and RSVP to a meetup. Member data is protected by row-level security, so results are limited to what this member may see.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listUpcomingEvents,
    listMeetups,
    rsvpToMeetup,
    getMyRegistrations,
    searchMembers,
    getMyChecklists,
  ],
});
