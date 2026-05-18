export type Role = "admin" | "opiekun" | "klient";

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  initials: string | null;
  phone: string | null;
  email: string | null;
  whatsapp_url: string | null;
};

export type SectionKey =
  | "services" | "documents" | "calendar" | "plan"
  | "assets" | "reports" | "notifications" | "opiekunowie"
  | "report_entries" | "current_work";

export type Client = {
  id: string;
  owner_user_id: string | null;
  salon_name: string;
  display_first_name: string;
  display_short: string;
  avatar_initials: string;
  case_status: string;
  hero_eyebrow: string;
  hero_sub: string;
  hero_micro: string;
  visible_sections: Partial<Record<SectionKey, boolean>> | null;
};

export type StatusPill = {
  id: string;
  client_id: string;
  icon: string | null;
  label: string;
  variant: "default" | "ok" | "accent";
  display_order: number;
};

export type Service = {
  id: string;
  client_id: string;
  icon: string | null;
  title: string;
  body: string | null;
  status: "w_robocie" | "czeka" | "dostarczone";
  link_href: string | null;
  link_label: string | null;
  display_order: number;
};

export type Document = {
  id: string;
  client_id: string;
  category: "umowy" | "brief" | "rodo" | "faktury";
  icon: string;
  name: string;
  meta: string | null;
  file_path: string;
  uploaded_at: string;
};

export type CalendarItem = {
  id: string;
  client_id: string;
  publish_date: string;
  title: string;
  meta: string | null;
  channel: string | null;
  display_order: number;
};

export type Notification = {
  id: string;
  client_id: string;
  title: string;
  meta: string | null;
  action_url: string | null;
  is_new: boolean;
  created_at: string;
};

export type MonthlyReport = {
  id: string;
  client_id: string;
  period: string;
  file_path: string | null;
  pages: number | null;
  published_at: string | null;
};

export type BrandAsset = {
  id: string;
  client_id: string;
  kind: "logo" | "palette" | "photos" | "templates" | "other";
  title: string;
  meta: string | null;
  icon_text: string | null;
  icon_gradient: string | null;
  file_path: string | null;
  display_order: number;
};

export type PlanMilestone = {
  id: string;
  client_id: string;
  code: string;
  title: string;
  body: string | null;
  badge_status: "done" | "active" | "upcoming";
  display_order: number;
};

export type ClientTab = {
  id: string;
  client_id: string;
  slug: string;
  label: string;
  display_order: number;
  content: ContentBlock[];
};

export type ContentBlock =
  | { type: "heading"; text: string; serif_suffix?: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "docs"; documents: { name: string; meta: string; file_path: string }[] }
  | { type: "image"; src: string; caption?: string }
  | { type: "embed"; html: string };

export type ClientUpload = {
  id: string;
  client_id: string;
  uploaded_by: string | null;
  kind: "zdjecie" | "filmik" | "inne";
  caption: string | null;
  file_path: string;
  status: "nowe" | "przyjete" | "wykorzystane";
  created_at: string;
};

export type ChatThread = {
  id: string;
  client_id: string;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  thread_id: string;
  sender_id: string | null;
  body: string | null;
  attachments: { name: string; path: string; mime?: string }[];
  created_at: string;
  read_by: string[];
};

export type GlobalCopy = { key: string; value: string };

export type ReportEntry = {
  id: string;
  client_id: string;
  period: string;
  content: string;
  display_order: number;
  created_at: string;
};

export type CurrentWork = {
  id: string;
  client_id: string;
  title: string;
  detail: string | null;
  display_order: number;
  created_at: string;
};
