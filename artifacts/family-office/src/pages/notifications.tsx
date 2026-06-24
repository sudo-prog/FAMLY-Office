import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell, BellOff, Check, CheckCheck, AlertTriangle, Info, Sparkles, Trash2,
} from "lucide-react";

interface Notification {
  id: number;
  userId: number | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch("/api/notifications");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function markRead(id: number): Promise<void> {
  await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
}

async function markAllRead(): Promise<void> {
  await fetch("/api/notifications/mark-all-read", { method: "POST" });
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  alert: AlertTriangle,
  insight: Sparkles,
};

const TYPE_COLORS: Record<string, string> = {
  info: "text-blue-400 bg-blue-500/10",
  warning: "text-amber-400 bg-amber-500/10",
  alert: "text-red-400 bg-red-500/10",
  insight: "text-purple-400 bg-purple-500/10",
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const unreadCount = (notifications ?? []).filter((n) => !n.read).length;

  async function handleMarkRead(id: number) {
    await markRead(id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function handleMarkAllRead() {
    await markAllRead();
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4 mr-2" /> Mark all read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (notifications ?? []).length === 0 ? (
            <div className="py-16 text-center">
              <BellOff className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="divide-y divide-border">
                {(notifications ?? []).map((n) => {
                  const Icon = TYPE_ICONS[n.type] ?? Info;
                  const colorClass = TYPE_COLORS[n.type] ?? "text-muted-foreground bg-muted/50";
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-4 p-4 transition-colors ${n.read ? "opacity-60" : "bg-muted/20"}`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium">{n.title}</h3>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                        <span className="text-xs text-muted-foreground/60 mt-1 block">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {!n.read && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleMarkRead(n.id)}>
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
