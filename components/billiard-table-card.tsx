"use client";

import React from "react"

import { useEffect, useState } from "react";
import { usePOSStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Play, Square, X, Edit2, Trash2, DollarSign } from "lucide-react";
import type { BilliardTable } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const flashStyle = `
  @keyframes flash-red {
    0%, 100% { border-color: rgb(239, 68, 68); background-color: rgba(239, 68, 68, 0.1); }
    50% { border-color: rgb(220, 38, 38); background-color: rgba(220, 38, 38, 0.2); }
  }
  @keyframes flash-yellow {
    0%, 100% { border-color: rgb(234, 179, 8); background-color: rgba(234, 179, 8, 0.1); }
    50% { border-color: rgb(202, 138, 4); background-color: rgba(202, 138, 4, 0.2); }
  }
  .animate-flash-red {
    animation: flash-red 0.6s infinite;
  }
  .animate-flash-yellow {
    animation: flash-yellow 0.8s infinite;
  }
`;

interface BilliardTableCardProps {
  table: BilliardTable;
  onSelect: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchResizeStart?: (e: React.TouchEvent) => void;
  isDragging: boolean;
  isResizing: boolean;
  isLocked: boolean;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function calculateAmount(elapsedMs: number, sessionType: "open" | "fixed", fixedDuration: number | undefined, hourlyRate: number): number {
  if (sessionType === "fixed" && fixedDuration) {
    return fixedDuration * hourlyRate;
  }
  // For open sessions, round up to nearest quarter hour (15 minutes)
  const durationHours = elapsedMs / (1000 * 60 * 60);
  return Math.ceil(durationHours * 4) / 4 * hourlyRate;
}

export function BilliardTableCard({
  table,
  onSelect,
  onMouseDown,
  onResizeStart,
  onTouchStart,
  onTouchResizeStart,
  isDragging,
  isResizing,
  isLocked,
}: BilliardTableCardProps) {
  const { removeTable, renameTable, setTableStatus, priceCategories, updateTablePriceCategory, hourlyRate } = usePOSStore();
  const [elapsed, setElapsed] = useState(0);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newName, setNewName] = useState(table.name);
  const [selectedCategoryId, setSelectedCategoryId] = useState(table.priceCategoryId);

  useEffect(() => {
    if (table.status === "running" && table.currentSession) {
      const startTime = new Date(table.currentSession.startTime).getTime();
      const interval = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 1000);
      return () => clearInterval(interval);
    }
    setElapsed(0);
  }, [table.status, table.currentSession]);

  const handleEdit = () => {
    if (newName.trim()) {
      renameTable(table.id, newName.trim());
      updateTablePriceCategory(table.id, selectedCategoryId);
      setIsEditOpen(false);
    }
  };

  const statusColors = {
    available: "border-blue-500/50 bg-blue-500/10",
    running: "border-green-500/50 bg-green-500/10",
    closed: "border-destructive/50 bg-destructive/10",
  };

  const statusDotColors = {
    available: "bg-blue-500",
    running: "bg-green-500 animate-pulse",
    closed: "bg-destructive",
  };

  // Check if fixed session has exceeded its duration
  const isExceeded =
    table.status === "running" &&
    table.currentSession?.sessionType === "fixed" &&
    table.currentSession?.fixedDuration &&
    elapsed > table.currentSession.fixedDuration * 3600000;

  // Check if 5 mins or less remaining on fixed session
  const timeRemaining =
    table.status === "running" &&
    table.currentSession?.sessionType === "fixed" &&
    table.currentSession?.fixedDuration
      ? table.currentSession.fixedDuration * 3600000 - elapsed
      : null;

  const isNearTimeLimit = timeRemaining !== null && timeRemaining > 0 && timeRemaining <= 5 * 60 * 1000;

  return (
    <>
      <style>{flashStyle}</style>
      <Card
        className={cn(
          "absolute cursor-pointer transition-all select-none flex flex-col",
          "border-2 hover:shadow-lg",
          table.status === "closed" && table.currentSession
            ? "border-destructive bg-destructive/20 animate-flash-red"
            : isExceeded 
            ? "border-destructive bg-destructive/20 animate-flash-red" 
            : isNearTimeLimit 
            ? "border-yellow-500 bg-yellow-500/20 animate-flash-yellow"
            : statusColors[table.status],
          (isDragging || isResizing) && "shadow-xl z-50",
          isDragging && "scale-105",
          !isLocked && "cursor-move"
        )}
        style={{
          left: table.position.x,
          top: table.position.y,
          width: table.size?.width || 176,
          height: table.size?.height || 140,
          touchAction: "none",
        }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onClick={(e) => {
          if (isLocked && !isDragging && !isResizing) {
            e.stopPropagation();
            onSelect();
          }
        }}
      >
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", statusDotColors[table.status])} />
            <span className="font-semibold text-sm text-card-foreground">{table.name}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 rounded hover:bg-muted"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.status === "available" && (
                <DropdownMenuItem onClick={onSelect}>
                  <Play className="h-4 w-4 mr-2" /> Start Session
                </DropdownMenuItem>
              )}
              {table.status === "running" && (
                <DropdownMenuItem onClick={onSelect}>
                  <Square className="h-4 w-4 mr-2" /> End Session
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }}>
                <Edit2 className="h-4 w-4 mr-2" /> Edit Table
              </DropdownMenuItem>
              {table.status === "available" && (
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); setTableStatus(table.id, "closed"); }}
                >
                  <X className="h-4 w-4 mr-2" /> Close Table
                </DropdownMenuItem>
              )}
              {table.status === "closed" && !table.currentSession && (
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); setTableStatus(table.id, "available"); }}
                >
                  <Play className="h-4 w-4 mr-2" /> Open Table
                </DropdownMenuItem>
              )}
              {table.status === "closed" && table.currentSession && (
                <DropdownMenuItem onClick={onSelect}>
                  <DollarSign className="h-4 w-4 mr-2" /> Pay
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => { e.stopPropagation(); removeTable(table.id); }}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Body */}
        <div className="p-3 flex-1 relative flex flex-col justify-center min-h-0">
          {table.status === "running" && table.currentSession ? (
            <div className="space-y-1 relative z-20">
              <div className="text-xl font-mono font-bold text-warning text-center truncate">
                {formatDuration(elapsed)}
              </div>
              <div className="text-xs text-muted-foreground text-center truncate">
                ₱{table.currentSession.hourlyRate}/hr
                {table.currentSession.sessionType === "fixed" &&
                  ` (${table.currentSession.fixedDuration}h)`}
              </div>
              <div className="text-sm font-medium text-center text-card-foreground truncate">
                ₱{calculateAmount(elapsed, table.currentSession.sessionType, table.currentSession.fixedDuration, table.currentSession.hourlyRate).toFixed(2)}
              </div>
            </div>
          ) : table.status === "closed" && table.currentSession ? (
            <div className="space-y-1 relative z-20">
              <div className="text-xs text-muted-foreground text-center truncate">TO PAY</div>
              <div className="text-lg font-bold text-destructive text-center truncate">
                ₱{calculateAmount(
                  table.currentSession.endedElapsedMs ?? elapsed,
                  table.currentSession.sessionType,
                  table.currentSession.fixedDuration,
                  table.currentSession.hourlyRate
                ).toFixed(2)}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-1">
              <p className="text-sm font-medium capitalize text-card-foreground truncate">
                {table.status}
              </p>
              {(() => {
                if (table.priceCategoryId) {
                  const category = priceCategories.find(c => c.id === table.priceCategoryId);
                  return (
                    <p className="text-xs text-muted-foreground truncate">
                      {category ? `${category.name} - ₱${category.hourlyRate}/hr` : "No category"}
                    </p>
                  );
                } else {
                  // No category assigned, show the hourly rate from store
                  const { hourlyRate: defaultRate } = usePOSStore.getState();
                  return (
                    <p className="text-xs text-muted-foreground truncate">
                      Default - ₱{defaultRate}/hr
                    </p>
                  );
                }
              })()}
            </div>
          )}
        </div>

        {/* Resize Handle - only visible when unlocked */}
        {!isLocked && (
          <div
            className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize group hover:bg-accent hover:bg-opacity-50 rounded-tl transition-colors"
            onMouseDown={onResizeStart}
            onTouchStart={onTouchResizeStart}
            style={{ touchAction: "none" }}
          >
            <svg
              className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M14 14H10V12H12V10H14V14Z" />
              <path d="M14 8H12V6H14V8Z" />
              <path d="M8 14H6V12H8V14Z" />
            </svg>
          </div>
        )}
      </Card>

      {/* Edit Table Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="table-name">Table Name</Label>
              <Input
                id="table-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter table name"
                onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-category">Price Category</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger id="price-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priceCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} (₱{cat.hourlyRate}/hr)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
