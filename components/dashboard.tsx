"use client";

import React from "react"

import { useState } from "react";
import { TableFloor } from "./table-floor";
import { TableRecords } from "./table-records";
import { RetailPOS } from "./retail-pos";
import { RetailInventory } from "./retail-inventory";
import { SalesAnalytics } from "./sales-analytics";
import { Settings } from "./settings";
import {
  LayoutGrid,
  ClipboardList,
  ShoppingCart,
  Package,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  User,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type View =
  | "floor"
  | "records"
  | "retail"
  | "inventory"
  | "analytics"
  | "settings";

const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: "floor", label: "Floor", icon: <LayoutGrid className="h-5 w-5" /> },
  { id: "records", label: "Records", icon: <ClipboardList className="h-5 w-5" /> },
  { id: "retail", label: "Sales", icon: <ShoppingCart className="h-5 w-5" /> },
  { id: "inventory", label: "Inventory", icon: <Package className="h-5 w-5" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-5 w-5" /> },
  { id: "settings", label: "Settings", icon: <SettingsIcon className="h-5 w-5" /> },
];

export function Dashboard() {
  const [currentView, setCurrentView] = useState<View>("floor");
  const { currentUser, logout } = useAuthStore();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <h1 className="text-xl font-bold text-sidebar-foreground hidden lg:block">
            Pool Hall POS
          </h1>
          <div className="lg:hidden flex justify-center">
            <span className="text-2xl font-bold text-primary">PH</span>
          </div>
        </div>

        <nav className="flex-1 p-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors",
                "hover:bg-sidebar-accent",
                currentView === item.id
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70"
              )}
            >
              {item.icon}
              <span className="hidden lg:block">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-3">
          <div className="flex items-center gap-2 text-sidebar-foreground">
            <User className="h-4 w-4" />
            <span className="hidden lg:block text-sm font-medium truncate">
              {currentUser?.username}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="w-full flex items-center gap-2 justify-center lg:justify-start bg-transparent"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:block">Sign Out</span>
          </Button>
          <p className="text-xs text-muted-foreground hidden lg:block">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {currentView === "floor" && <TableFloor />}
        {currentView === "records" && <TableRecords />}
        {currentView === "retail" && <RetailPOS />}
        {currentView === "inventory" && <RetailInventory />}
        {currentView === "analytics" && <SalesAnalytics />}
        {currentView === "settings" && <Settings />}
      </main>
    </div>
  );
}
