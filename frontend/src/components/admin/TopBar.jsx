import { Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function TopBar() {
  return (
    <header
      data-testid="admin-topbar"
      className="h-14 sticky top-0 z-20 bg-background/85 backdrop-blur border-b border-border flex items-center justify-between px-5"
    >
      <div className="flex items-center gap-4">
        <button
          data-testid="topbar-menu-btn"
          className="p-1.5 rounded-md hover:bg-secondary text-foreground/70"
          aria-label="Toggle menu"
        >
          <Menu className="size-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-full bg-gradient-to-br from-[hsl(88,65%,55%)] to-[hsl(170,70%,45%)] grid place-items-center text-white font-bold text-xs shadow-sm">
            K
          </div>
          <span className="font-bold text-lg tracking-tight">Konnectify</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          data-testid="topbar-new-btn"
          className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm font-semibold"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          New
        </Button>
        <Avatar className="size-9 ring-2 ring-accent">
          <AvatarFallback className="bg-[hsl(38,92%,75%)] text-[hsl(38,92%,25%)] font-bold text-sm">
            A
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
