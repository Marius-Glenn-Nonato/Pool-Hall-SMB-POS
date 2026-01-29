"use client";

import React from "react"

import { useState, useRef, useEffect, useCallback } from "react";
import { usePOSStore } from "@/lib/store";
import { BilliardTableCard } from "./billiard-table-card";
import { SessionDialog } from "./session-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Lock, Unlock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { BilliardTable } from "@/lib/types";

// Mobile table row component
function MobileTableRow({ table, onSelect }: { table: BilliardTable; onSelect: () => void }) {
  const [elapsed, setElapsed] = useState(0);

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

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-warning/10";
      case "closed":
        return "bg-destructive/10";
      default:
        return "bg-success/10";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "running":
        return "text-warning";
      case "closed":
        return "text-destructive";
      default:
        return "text-success";
    }
  };

  function formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return (
    <div
      onClick={onSelect}
      className={`p-3 rounded-lg border border-border cursor-pointer transition-all hover:shadow-md ${getStatusBgColor(
        table.status
      )}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-semibold text-2xl text-card-foreground">
            {table.name}
          </div>
          <div className={`text-xs font-medium capitalize ${getStatusTextColor(
            table.status
          )}`}>
            {table.status}
          </div>
        </div>
        <div className="text-right">
          {table.status === "running" && table.currentSession ? (
            <div className="space-y-1">
              <div className="text-lg font-mono font-bold text-warning">
                {formatDuration(elapsed)}
              </div>
              <div className="text-xs text-muted-foreground">
                ₱{((elapsed / 3600000) * table.currentSession.hourlyRate).toFixed(2)}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">-</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TableFloor() {
  const isMobile = useIsMobile();
  const { tables, addTable, updateTablePosition, updateTableSize } = usePOSStore();
  const [selectedTable, setSelectedTable] = useState<BilliardTable | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const floorRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
  (
    e: React.MouseEvent,
    tableId: string,
    tablePosition: { x: number; y: number }
  ) => {
    if (isLocked || !floorRef.current) return;

    e.preventDefault();

    const floorRect = floorRef.current.getBoundingClientRect();

    setDraggingId(tableId);
    setDragOffset({
      x: e.clientX - floorRect.left - tablePosition.x,
      y: e.clientY - floorRect.top - tablePosition.y,
    });
  },
  [isLocked]
);


  const handleMouseMove = useCallback(
  (e: MouseEvent) => {
    if (!draggingId || !floorRef.current) return;

    const floorRect = floorRef.current.getBoundingClientRect();
    const table = tables.find((t) => t.id === draggingId);
    if (!table) return;

    // Account for scroll position when dragging
    const scrollLeft = floorRef.current.scrollLeft;
    
    const x =
      e.clientX - floorRect.left + scrollLeft - dragOffset.x;
    const y =
      e.clientY - floorRect.top - dragOffset.y;

    // clamp vertically, limit horizontal expansion to 2x viewport width
    const tableWidth = table.size?.width || 180;
    const tableHeight = table.size?.height || 140;
    const maxScrollWidth = floorRect.width * 2;
    
    const clampedX = Math.max(0, Math.min(x, maxScrollWidth - tableWidth));
    const clampedY = Math.max(
      0,
      Math.min(y, floorRect.height - tableHeight)
    );

    updateTablePosition(draggingId, {
      x: clampedX,
      y: clampedY,
    });
  },
  [draggingId, dragOffset, tables, updateTablePosition]
);


  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
    setResizingId(null);
  }, []);

 const handleResizeStart = useCallback(
  (e: React.MouseEvent, tableId: string, currentSize?: { width: number; height: number }) => {
    if (isLocked || !currentSize) return; // ✅ prevent crash

    e.preventDefault();
    e.stopPropagation();

    setResizingId(tableId);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: currentSize.width,
      height: currentSize.height,
    });
  },
  [isLocked]
);


  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!resizingId) return;

      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      const newWidth = Math.max(140, Math.min(400, resizeStart.width + deltaX));
      const newHeight = Math.max(100, Math.min(300, resizeStart.height + deltaY));

      updateTableSize(resizingId, { width: newWidth, height: newHeight });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resizingId, resizeStart.x, resizeStart.y, resizeStart.width, resizeStart.height]
  );

  // Touch event handlers for mobile/tablet support
  const handleTouchStart = useCallback(
    (
      e: React.TouchEvent,
      tableId: string,
      tablePosition: { x: number; y: number }
    ) => {
      if (isLocked || !floorRef.current) return;

      const floorRect = floorRef.current.getBoundingClientRect();
      const touch = e.touches[0];

      setDraggingId(tableId);
      setDragOffset({
        x: touch.clientX - floorRect.left - tablePosition.x,
        y: touch.clientY - floorRect.top - tablePosition.y,
      });
    },
    [isLocked]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!draggingId || !floorRef.current) return;

      const floorRect = floorRef.current.getBoundingClientRect();
      const table = tables.find((t) => t.id === draggingId);
      if (!table) return;

      const touch = e.touches[0];
      const scrollLeft = floorRef.current.scrollLeft;

      const x =
        touch.clientX - floorRect.left + scrollLeft - dragOffset.x;
      const y =
        touch.clientY - floorRect.top - dragOffset.y;

      const tableWidth = table.size?.width || 180;
      const tableHeight = table.size?.height || 140;
      const maxScrollWidth = floorRect.width * 2;

      const clampedX = Math.max(0, Math.min(x, maxScrollWidth - tableWidth));
      const clampedY = Math.max(
        0,
        Math.min(y, floorRect.height - tableHeight)
      );

      updateTablePosition(draggingId, {
        x: clampedX,
        y: clampedY,
      });
    },
    [draggingId, dragOffset, tables, updateTablePosition]
  );

  const handleTouchEnd = useCallback(() => {
    setDraggingId(null);
    setResizingId(null);
  }, []);

  const handleTouchResizeStart = useCallback(
    (
      e: React.TouchEvent,
      tableId: string,
      currentSize?: { width: number; height: number }
    ) => {
      if (isLocked || !currentSize) return;

      e.preventDefault();
      e.stopPropagation();

      const touch = e.touches[0];

      setResizingId(tableId);
      setResizeStart({
        x: touch.clientX,
        y: touch.clientY,
        width: currentSize.width,
        height: currentSize.height,
      });
    },
    [isLocked]
  );

  const handleTouchResizeMove = useCallback(
    (e: TouchEvent) => {
      if (!resizingId) return;

      e.preventDefault();

      const touch = e.touches[0];
      const deltaX = touch.clientX - resizeStart.x;
      const deltaY = touch.clientY - resizeStart.y;

      const newWidth = Math.max(140, Math.min(400, resizeStart.width + deltaX));
      const newHeight = Math.max(100, Math.min(300, resizeStart.height + deltaY));

      updateTableSize(resizingId, { width: newWidth, height: newHeight });
    },
    [resizingId, resizeStart.x, resizeStart.y, resizeStart.width, resizeStart.height, updateTableSize]
  );

  useEffect(() => {
    if (draggingId) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove as EventListener);
      window.addEventListener("touchend", handleTouchEnd);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("touchmove", handleTouchMove as EventListener);
        window.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [draggingId, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Add constraint to prevent tables from extending too far horizontally
  useEffect(() => {
    const constrainTablePositions = () => {
      if (!floorRef.current) return;

      const maxScrollWidth = floorRef.current.clientWidth * 2; // Allow up to 2x viewport width
      
      tables.forEach((table) => {
        const maxX = maxScrollWidth - (table.size?.width || 180);
        
        if (table.position.x > maxX) {
          updateTablePosition(table.id, {
            x: maxX,
            y: table.position.y,
          });
        }
      });
    };

    const timer = setTimeout(constrainTablePositions, 100);
    return () => clearTimeout(timer);
  }, [tables, updateTablePosition]);

  useEffect(() => {
    if (resizingId) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchResizeMove as EventListener);
      window.addEventListener("touchend", handleTouchEnd);
      return () => {
        window.removeEventListener("mousemove", handleResizeMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("touchmove", handleTouchResizeMove as EventListener);
        window.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [resizingId, handleResizeMove, handleMouseUp, handleTouchResizeMove, handleTouchEnd]);

  const handleAddTable = () => {
    if (newTableName.trim()) {
      addTable(newTableName.trim());
      setNewTableName("");
      setIsAddDialogOpen(false);
    }
  };

  const runningTables = tables.filter((t) => t.status === "running");
  const availableTables = tables.filter((t) => t.status === "available");

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-border flex items-center justify-between bg-card">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">Table Floor</h2>
          <p className="text-sm text-muted-foreground">
            {runningTables.length} running / {availableTables.length} available /{" "}
            {tables.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isMobile && (
            <Button
              variant={isLocked ? "outline" : "default"}
              size="sm"
              onClick={() => setIsLocked(!isLocked)}
              className="gap-2"
            >
              {isLocked ? (
                <>
                  <Lock className="h-4 w-4" /> Locked
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" /> Unlocked
                </>
              )}
            </Button>
          )}
          <Button 
            size="sm" 
            onClick={() => setIsAddDialogOpen(true)} 
            className="gap-2"
            disabled={isMobile}
          >
            <Plus className="h-4 w-4" /> Add Table
          </Button>
        </div>
      </header>

      {/* Mobile Table View */}
      {isMobile ? (
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {tables.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No tables yet</div>
            ) : (
              <div className="space-y-2">
                {tables.map((table) => (
                  <MobileTableRow
                    key={table.id}
                    table={table}
                    onSelect={() => setSelectedTable(table)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Floor Grid */}
          <div
            ref={floorRef}
            className="flex-1 relative bg-background overflow-y-auto overflow-x-auto"
            style={{ minHeight: "500px", position: "relative" }}
          >
            {/* Inner scrollable container with fixed minimum width */}
            <div
              style={{
                minWidth: "100%",
                minHeight: "100%",
                position: "relative",
              }}
            >
              {/* Grid Pattern */}
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, currentColor 1px, transparent 1px),
                    linear-gradient(to bottom, currentColor 1px, transparent 1px)
                  `,
                  backgroundSize: "50px 50px",
                }}
              />

              {tables.map((table) => (
                <BilliardTableCard
                  key={table.id}
                  table={table}
                  onSelect={() => setSelectedTable(table)}
                  onMouseDown={(e) => handleMouseDown(e, table.id, table.position)}
                  onResizeStart={(e) => handleResizeStart(e, table.id, table.size)}
                  onTouchStart={(e) => handleTouchStart(e, table.id, table.position)}
                  onTouchResizeStart={(e) => handleTouchResizeStart(e, table.id, table.size)}
                  isDragging={draggingId === table.id}
                  isResizing={resizingId === table.id}
                  isLocked={isLocked}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Session Dialog */}
      {selectedTable && (
        <SessionDialog
          table={selectedTable}
          open={!!selectedTable}
          onClose={() => setSelectedTable(null)}
        />
      )}

      {/* Add Table Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Table name (e.g., Table 5)"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTable()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTable}>Add Table</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
