export type HelpAudience = "staff" | "client";

export type HelpCategory =
  | "Getting started"
  | "Delivery"
  | "Sales"
  | "Comms"
  | "Business"
  | "Settings"
  | "Portal";

export type HelpArticle = {
  id: string;
  title: string;
  category: HelpCategory;
  keywords: string[];
  audiences: HelpAudience[];
  summary: string;
  body: string[];
  relatedLinks?: { href: string; label: string }[];
};

export const HELP_CATEGORIES: HelpCategory[] = [
  "Getting started",
  "Delivery",
  "Sales",
  "Comms",
  "Business",
  "Settings",
  "Portal",
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "welcome",
    title: "Welcome to Workflow",
    category: "Getting started",
    keywords: ["intro", "overview", "roles", "navigation"],
    audiences: ["staff"],
    summary: "How the internal app is organised and who can see what.",
    body: [
      "Workflow is your production operations hub: briefs, clients, CRM, team chat, and calendar in one place.",
      "Admins have full access including CRM, clients, services catalog, reports, and user management. Team members work on delivery — briefs, live work, calendar, and team chat — without access to sales or business settings.",
      "Use the sidebar to move between areas. Collapse it for more space; your preference is remembered. The floating Ask AI button is for internal staff only and can answer questions about clients and briefs.",
    ],
    relatedLinks: [
      { href: "/dashboard", label: "Open dashboard" },
      { href: "/help#roles", label: "Roles & permissions" },
    ],
  },
  {
    id: "roles",
    title: "Roles & permissions",
    category: "Getting started",
    keywords: ["admin", "team", "client", "access", "permissions"],
    audiences: ["staff"],
    summary: "What admins, team members, and clients can each do.",
    body: [
      "Admin — full internal app: CRM, clients, services, reports, user invites, client onboarding approvals, and contract-gated brief promotion.",
      "Team member — delivery focus: dashboard, briefs, live work, calendar, team chat, and profile. Cannot open CRM, clients list, services, or reports (URLs redirect to dashboard).",
      "Client — portal only at /portal: their company's briefs, messages, completed work, and account settings. Clients never see internal notes or team chat.",
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    category: "Getting started",
    keywords: ["home", "feed", "notifications", "activity", "crm card"],
    audiences: ["staff"],
    summary: "Your morning overview: activity, assignments, and calendar snapshot.",
    body: [
      "The activity feed merges personal notifications (mentions, DMs, alerts) with team-wide brief activity. Dismiss items to hide them from your feed only — nothing is deleted for others.",
      "Assigned work lists briefs in active production statuses assigned to you. The calendar snapshot shows your upcoming bookings.",
      "Admins also see a CRM card (open leads, active clients, check-ins due) and a banner when client onboarding requests are waiting for approval.",
    ],
    relatedLinks: [{ href: "/dashboard", label: "Go to dashboard" }],
  },
  {
    id: "brief-lifecycle",
    title: "Brief lifecycle",
    category: "Delivery",
    keywords: ["brief", "status", "workflow", "create", "complete"],
    audiences: ["staff"],
    summary: "From draft to completed — how a brief moves through production.",
    body: [
      "Create a brief from Delivery → Briefs → New. Link a client and optionally a service from the catalog. Creating a brief opens a client message thread and posts a notice in the client's team channel.",
      "Statuses progress from Draft → Awaiting internal start → Scheduled → In progress → review/amends rounds → Approved → Completed. Change status on the full brief page.",
      "When an admin moves certain statuses to In progress, a contract gate may ask for signed contract confirmation, delivery dates, and team assignment — this also creates calendar bookings.",
      "Marking Completed opens a time-log prompt so hours are captured for reports.",
    ],
    relatedLinks: [
      { href: "/briefs", label: "All briefs" },
      { href: "/briefs/new", label: "Create brief" },
      { href: "/help#brief-statuses", label: "Status glossary" },
    ],
  },
  {
    id: "brief-statuses",
    title: "Brief status glossary",
    category: "Delivery",
    keywords: ["status", "draft", "review", "amends", "approved", "completed"],
    audiences: ["staff", "client"],
    summary: "What each brief status means for the team and the client.",
    body: [
      "Draft — brief exists but work has not started. Awaiting internal start — ready for the team to pick up. Scheduled — dates or resources are set.",
      "In progress — active production. Awaiting client review — deliverable shared for client feedback. Amends requested / first & second round amends — revision cycles.",
      "Approved — client signed off. Completed — job finished and archived for reporting. Clients see a simplified view in the portal; internal statuses map to client-friendly labels there.",
    ],
  },
  {
    id: "scope-status",
    title: "Scope status (delivery fit)",
    category: "Delivery",
    keywords: ["scope", "in scope", "watch", "out of scope"],
    audiences: ["staff"],
    summary: "In scope, watch scope, and out of scope — when to use each.",
    body: [
      "In scope — work fits the agreed contract or retainer. Watch scope — potential creep; flag early so admins can discuss with the client. Out of scope — needs a change order or new brief.",
      "Awaiting admin review — team flagged something that needs a commercial decision before continuing.",
    ],
  },
  {
    id: "live-work",
    title: "Live work board",
    category: "Delivery",
    keywords: ["kanban", "board", "pipeline", "stages"],
    audiences: ["staff"],
    summary: "Read-only board grouped by workflow stage — change status on the brief page.",
    body: [
      "Live work shows active briefs in columns by status. It is a visual overview, not where you drag cards to change status.",
      "Open a brief and use the status control there to move it between sections. Admins may see an 'Update this client' shortcut to jump to the brief with a pre-filled client message.",
      "Use filters to narrow by client or status when the board is busy.",
    ],
    relatedLinks: [{ href: "/live-work", label: "Open live work" }],
  },
  {
    id: "crm-leads",
    title: "CRM & leads pipeline",
    category: "Sales",
    keywords: ["lead", "sales", "pipeline", "won", "lost", "quote"],
    audiences: ["staff"],
    summary: "Track prospects from first contact through to won or lost.",
    body: [
      "Add leads from CRM → Leads with deal value, work type, and follow-up reminder days. Open leads appear in the pipeline; the total is the sum of quoted potential values.",
      "Move leads through Active → Contacted → Quoted → Followed up. When a lead is Won, choose to mark won only or convert to a new brief (existing or new client). Lost leads move to the Lost section with an optional reason.",
      "Follow-up reminders post to the Leads team channel and notify admins on the dashboard when due.",
    ],
    relatedLinks: [
      { href: "/crm/leads", label: "Open leads" },
      { href: "/messages", label: "Team chat (Leads channel)" },
    ],
  },
  {
    id: "crm-check-ins",
    title: "Client relationship check-ins",
    category: "Sales",
    keywords: ["check-in", "cadence", "relationship", "retainer"],
    audiences: ["staff"],
    summary: "Reminder cadence for staying in touch with active clients.",
    body: [
      "Set a check-in frequency on each client profile (e.g. every 14 days). The system calculates the next due date and notifies admins when contact is overdue.",
      "Log a contact from the client page to reset the cycle. View all due check-ins under CRM → Check-ins.",
    ],
    relatedLinks: [
      { href: "/crm/clients", label: "Check-ins list" },
      { href: "/clients", label: "All clients" },
    ],
  },
  {
    id: "clients",
    title: "Client records",
    category: "Sales",
    keywords: ["client", "brand", "contacts", "onboarding"],
    audiences: ["staff"],
    summary: "Client profiles, contacts, and how they link to briefs and chat.",
    body: [
      "Each client has a profile with brand summary, contacts, engagement type (retainer vs project), and relationship cadence.",
      "Creating a client also creates a dedicated team chat channel named after the client. Brand guideline uploads are stored for the team.",
      "New clients can come from admin creation, converting a won lead, or approving a self-serve request from /join.",
    ],
    relatedLinks: [{ href: "/clients", label: "All clients" }],
  },
  {
    id: "team-chat",
    title: "Team chat",
    category: "Comms",
    keywords: ["messages", "channel", "dm", "giphy", "mentions"],
    audiences: ["staff"],
    summary: "General chat, Leads reminders, per-client channels, and DMs.",
    body: [
      "General Chat is workspace-wide. The Leads channel receives automated follow-up reminders. Each client has their own channel for internal discussion about that account.",
      "Use @Full Name to mention a colleague — they get an in-app notification. The composer supports emoji and GIF search (internal users only).",
      "Direct messages are 1:1 between internal users. Brief activity and assignments also post system lines to relevant channels.",
    ],
    relatedLinks: [{ href: "/messages", label: "Open team chat" }],
  },
  {
    id: "calendar",
    title: "Calendar",
    category: "Delivery",
    keywords: ["bookings", "schedule", "shoot", "delivery"],
    audiences: ["staff"],
    summary: "Team month view and your personal schedule.",
    body: [
      "The calendar shows bookings across the team. Filter to 'my schedule' to see only yours.",
      "Bookings are created when a brief is promoted to in progress (internal and client delivery dates) or manually via the calendar header.",
      "Toggle 'visible to client' when a booking should appear in the client portal calendar (where enabled).",
    ],
    relatedLinks: [{ href: "/calendar", label: "Open calendar" }],
  },
  {
    id: "services",
    title: "Services catalog",
    category: "Business",
    keywords: ["catalog", "package", "retainer", "template"],
    audiences: ["staff"],
    summary: "Reusable service products that speed up brief creation.",
    body: [
      "Fixed packages define scope, budget, and default deliverable templates. Retainer templates set monthly fees and scope type.",
      "When creating a brief, linking a catalog product pre-fills deliverables and deadlines. Manage products under Business → Services.",
    ],
    relatedLinks: [{ href: "/services", label: "Services catalog" }],
  },
  {
    id: "client-onboarding",
    title: "Client onboarding (/join)",
    category: "Settings",
    keywords: ["join", "signup", "approve", "pending"],
    audiences: ["staff"],
    summary: "How new client companies request access and get approved.",
    body: [
      "Prospective clients submit the form at /join with company name, contact details, and password. Requests land as Pending client signups.",
      "Admins approve or reject from Settings → Users or Settings → Client requests. Approval creates the client record and user account; the client can then sign in at /login and land on the portal.",
    ],
    relatedLinks: [
      { href: "/settings/users", label: "Users & onboarding" },
      { href: "/settings/signup-requests", label: "Pending requests" },
    ],
  },
  {
    id: "ai-assistant",
    title: "Ask AI (internal assistant)",
    category: "Comms",
    keywords: ["ai", "chat", "assistant", "openai"],
    audiences: ["staff"],
    summary: "Floating helper for questions about clients, briefs, and workload.",
    body: [
      "The Ask AI button appears on all internal pages. It can summarise clients, briefs, and recent activity using your organisation's data.",
      "Conversations are saved per user. Do not paste confidential client data you would not store in the app. Requires OPENAI_API_KEY to be configured on the server.",
    ],
  },
  {
    id: "portal-overview",
    title: "Client portal overview",
    category: "Portal",
    keywords: ["portal", "client", "overview"],
    audiences: ["client", "staff"],
    summary: "What clients see when they sign in.",
    body: [
      "Clients sign in at the same /login page and are routed to /portal. They only see their company's briefs, messages, and notifications — never internal CRM or team chat.",
      "The overview shows active briefs and a notification feed for messages and activity on their account. Completed work is under the Completed tab.",
    ],
    relatedLinks: [{ href: "/portal", label: "Portal overview (as client)" }],
  },
  {
    id: "portal-messages",
    title: "Messaging your agency",
    category: "Portal",
    keywords: ["message", "thread", "client", "reply"],
    audiences: ["client", "staff"],
    summary: "How client message threads work on each brief.",
    body: [
      "Each brief has a client-visible message thread. Posts from your team appear on the left; client replies on the right.",
      "Use the thread on the brief detail page to ask questions or share feedback. Team members are notified when you post.",
      "Internal notes and team chat are never visible here — only messages intended for the client.",
    ],
    relatedLinks: [{ href: "/portal/briefs", label: "Your briefs" }],
  },
  {
    id: "feedback",
    title: "Feedback & beta reports",
    category: "Settings",
    keywords: ["bug", "feedback", "suggestion", "beta"],
    audiences: ["staff", "client"],
    summary: "Report bugs or ideas from the beta banner or feedback page.",
    body: [
      "Use the beta banner at the top of the app or go to Feedback in the menu. Pick the app area, add a title and details, and submit.",
      "Admins review tickets under Settings → Feedback tickets and can mark them new, in review, resolved, or rejected.",
    ],
    relatedLinks: [
      { href: "/feedback", label: "Submit feedback (staff)" },
      { href: "/portal/feedback", label: "Submit feedback (portal)" },
    ],
  },
];

export function getArticle(id: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.id === id);
}

export function getArticlesForAudience(audience: HelpAudience): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.audiences.includes(audience));
}

export function searchArticles(query: string, audience: HelpAudience): HelpArticle[] {
  const q = query.trim().toLowerCase();
  const pool = getArticlesForAudience(audience);
  if (!q) return pool;
  return pool.filter((article) => {
    const hay = [
      article.title,
      article.category,
      article.summary,
      ...article.keywords,
      ...article.body,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q) || q.split(/\s+/).every((word) => hay.includes(word));
  });
}
