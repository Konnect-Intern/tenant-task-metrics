import {
  Home, LayoutGrid, Brain, FolderClosed, Users, ScrollText, SlidersHorizontal,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { key: "home", label: "Home", icon: Home },
  { key: "apps", label: "Apps", icon: LayoutGrid },
  { key: "agent-templates", label: "Agent Templates", icon: Brain },
  { key: "template-folders", label: "Template Folders", icon: FolderClosed },
  { key: "customers", label: "Customers", icon: Users, active: true },
  { key: "event-logs", label: "Event logs", icon: ScrollText },
  { key: "settings", label: "Settings", icon: SlidersHorizontal, expandable: true },
];

export default function Sidebar() {
  return (
    <aside
      data-testid="admin-sidebar"
      className="w-[232px] shrink-0 border-r border-sidebar-border bg-sidebar h-[calc(100vh-56px)] sticky top-[56px] hidden md:block"
    >
      <nav className="px-3 py-6 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              data-testid={`sidebar-${item.key}`}
              className={cn(
                "group w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                item.active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="size-[18px]" strokeWidth={1.75} />
                {item.label}
              </span>
              {item.expandable && (
                <ChevronRight className="size-4 opacity-60" />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
