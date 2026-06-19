import { useState } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import Sidebar from "@/components/admin/Sidebar";
import TopBar from "@/components/admin/TopBar";
import TaskUsageTab from "@/components/admin/TaskUsageTab";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "profile", label: "Profile" },
  { key: "users", label: "Users" },
  { key: "konnectors", label: "Konnectors" },
  { key: "event-logs", label: "Event Logs" },
  { key: "feature-customization", label: "Feature Customization" },
  { key: "task-usage", label: "Task Usage", isNew: true },
];

function PlaceholderTab({ label }) {
  return (
    <div
      data-testid={`tab-placeholder-${label.toLowerCase().replace(/\s/g, "-")}`}
      className="rounded-xl border border-dashed border-border bg-card p-12 text-center"
    >
      <div className="text-sm font-semibold text-muted-foreground">
        {label} (mocked content)
      </div>
      <p className="mt-1 text-xs text-muted-foreground/80">
        This is part of the existing page — left static for the demo.
      </p>
    </div>
  );
}

export default function AdminTenantPage() {
  const [activeTab, setActiveTab] = useState("task-usage");

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-w-0 px-6 sm:px-10 lg:px-16 py-8 lg:py-10">
          {/* Back link */}
          <button
            data-testid="back-to-customers"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="size-4" />
            Back to Customers
          </button>

          {/* Title + badge */}
          <div className="flex items-center gap-3 mb-7">
            <h1 className="text-3xl font-bold tracking-tight">arunganesh</h1>
            <Badge
              data-testid="trial-badge"
              variant="secondary"
              className="bg-[hsl(217,91%,93%)] text-[hsl(217,91%,38%)] hover:bg-[hsl(217,91%,90%)] border-0 font-semibold"
            >
              Trial
            </Badge>
          </div>

          {/* Tabs row */}
          <div data-testid="tabs-row" className="flex flex-wrap items-center gap-2 mb-8">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                data-testid={`tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {tab.label}
                {tab.isNew && activeTab !== tab.key && (
                  <span className="absolute -top-1 -right-1 size-2 rounded-full bg-primary ring-2 ring-background animate-soft-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div>
            {activeTab === "task-usage" ? (
              <TaskUsageTab />
            ) : activeTab === "feature-customization" ? (
              <FeatureCustomizationMock />
            ) : (
              <PlaceholderTab label={TABS.find((t) => t.key === activeTab)?.label || ""} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function FeatureCustomizationMock() {
  const features = [
    { name: "Agents", lines: ["Active: Unlimited", "Tools Count: 50", "Triggers Count: 5"] },
    { name: "Catch Hook", lines: [] },
    { name: "Code block", lines: ["Unlimited"] },
    { name: "Connections", lines: ["Unlimited"] },
    { name: "Copilot", lines: ["Unlimited"] },
    { name: "Copy paste", lines: [] },
    { name: "Dashboard", lines: [] },
  ];
  return (
    <div className="rounded-xl border border-border bg-card shadow-xs">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div className="flex items-center gap-2 font-semibold">
          <span className="size-5 rounded-md bg-accent grid place-items-center text-[10px] font-bold text-primary-strong">≡</span>
          Plan Features
        </div>
        <Badge variant="secondary" className="bg-accent text-accent-foreground border-0">22 features</Badge>
      </div>
      <div className="divide-y divide-border">
        {features.map((f) => (
          <div key={f.name} className="p-5 flex items-start justify-between">
            <div>
              <div className="font-semibold mb-1">{f.name}</div>
              {f.lines.map((l, i) => (
                <div key={i} className="text-sm text-muted-foreground">{l}</div>
              ))}
            </div>
            <button className="text-muted-foreground/60 hover:text-foreground"><Pencil className="size-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
