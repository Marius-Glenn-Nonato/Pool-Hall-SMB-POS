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
import { MoreVertical, Play, Square, X, Edit2, Trash2 } from "lucide-react";
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
  const { removeTable, renameTable, setTableStatus } = usePOSStore();
  const [elapsed, setElapsed] = useState(0);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newName, setNewName] = useState(table.name);

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

  const handleRename = () => {
    if (newName.trim()) {
      renameTable(table.id, newName.trim());
      setIsRenameOpen(false);
    }
  };

  const statusColors = {
    available: "border-success/50 bg-success/10",
    running: "border-warning/50 bg-warning/10",
    closed: "border-destructive/50 bg-destructive/10",
  };

  const statusDotColors = {
    available: "bg-success",
    running: "bg-warning animate-pulse",
    closed: "bg-destructive",
  };

  return (
    <>
      <Card
        className={cn(
          "absolute cursor-pointer transition-all select-none flex flex-col",
          "border-2 hover:shadow-lg",
          statusColors[table.status],
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
              <DropdownMenuItem onClick={() => setIsRenameOpen(true)}>
                <Edit2 className="h-4 w-4 mr-2" /> Rename
              </DropdownMenuItem>
              {table.status === "available" && (
                <DropdownMenuItem
                  onClick={() => setTableStatus(table.id, "closed")}
                >
                  <X className="h-4 w-4 mr-2" /> Close Table
                </DropdownMenuItem>
              )}
              {table.status === "closed" && (
                <DropdownMenuItem
                  onClick={() => setTableStatus(table.id, "available")}
                >
                  <Play className="h-4 w-4 mr-2" /> Open Table
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => removeTable(table.id)}
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
                ₱{((elapsed / 3600000) * table.currentSession.hourlyRate).toFixed(2)}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-medium capitalize text-card-foreground truncate">
                {table.status}
              </p>
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

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Table</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
