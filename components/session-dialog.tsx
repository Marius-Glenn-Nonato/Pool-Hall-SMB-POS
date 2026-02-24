"use client";

import { useState, useEffect } from "react";
import { usePOSStore } from "@/lib/store";
import type { BilliardTable } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Clock, Timer, DollarSign, AlertCircle } from "lucide-react";

interface SessionDialogProps {
  table: BilliardTable;
  open: boolean;
  onClose: () => void;
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

export function SessionDialog({ table: initialTable, open, onClose }: SessionDialogProps) {
  const { tables, hourlyRate, priceCategories, startSession, endSession, completePayment, updateFixedDuration } = usePOSStore();
  const [sessionType, setSessionType] = useState<"open" | "fixed">("open");
  const [fixedDuration, setFixedDuration] = useState("1");
  const [editingDuration, setEditingDuration] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Get the current table from store to ensure we have the latest data
  const table = tables.find(t => t.id === initialTable.id) || initialTable;
  
  // Get the table's price category hourly rate (if assigned), otherwise use default
  let tableHourlyRate = hourlyRate;
  if (table.priceCategoryId) {
    const category = priceCategories.find(c => c.id === table.priceCategoryId);
    if (category) {
      tableHourlyRate = category.hourlyRate;
    }
  }
  
  const isRunning = table.status === "running" && table.currentSession;
  const isClosed = table.status === "closed" && table.currentSession;

  useEffect(() => {
    if ((isRunning || isClosed) && table.currentSession) {
      const startTime = new Date(table.currentSession.startTime).getTime();
      setElapsed(Date.now() - startTime);
      const interval = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRunning, isClosed, table.currentSession]);

  const handleStartSession = () => {
    const duration = sessionType === "fixed" ? parseFloat(fixedDuration) : undefined;
    startSession(table.id, sessionType, duration);
    onClose();
  };

  const handleEndSession = () => {
    endSession(table.id, elapsed);
    onClose();
  };

  const handleConfirmPayment = () => {
    completePayment(table.id);
    onClose();
  };

  // Use frozen elapsed time for closed tables, live elapsed for running tables
  const displayElapsed = isClosed && table.currentSession?.endedElapsedMs !== undefined 
    ? table.currentSession.endedElapsedMs 
    : elapsed;

  // Calculate final amount for payment using the same logic as records
  let finalAmount = 0;
  if ((isRunning || isClosed) && table.currentSession) {
    finalAmount = calculateAmount(displayElapsed, table.currentSession.sessionType, table.currentSession.fixedDuration, table.currentSession.hourlyRate);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                table.status === "running"
                  ? "bg-warning animate-pulse"
                  : table.status === "available"
                  ? "bg-success"
                  : "bg-destructive"
              }`}
            />
            {table.name}
          </DialogTitle>
        </DialogHeader>

        {isClosed && table.currentSession ? (
          // Payment Screen - shown when clicking a closed table
          <div className="space-y-6 py-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Total Due</p>
              <p className="text-5xl font-bold text-primary">₱{finalAmount.toFixed(2)}</p>
            </div>

            <div className="space-y-3 bg-muted rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Table</span>
                <span className="font-medium">{table.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time Started</span>
                <span className="font-medium">
                  {new Date(table.currentSession.startTime).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time Consumed</span>
                <span className="font-medium">{formatDuration(displayElapsed)}</span>
              </div>
              {table.currentSession.sessionType === "fixed" && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Contract Duration</span>
                  <span className="font-medium">{table.currentSession.fixedDuration}h</span>
                </div>
              )}
            </div>
          </div>
        ) : isRunning && table.currentSession ? (
          // Running Session Screen
          <div className="space-y-6 py-4">
            {/* Timer Display */}
            <div className="text-center">
              <div className="text-5xl font-mono font-bold text-warning">
                {formatDuration(elapsed)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Started at{" "}
                {new Date(table.currentSession.startTime).toLocaleTimeString()}
              </p>
            </div>

            {/* Session Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Session Type</p>
                <p className="text-sm font-medium capitalize mt-1">
                  {table.currentSession.sessionType === "fixed"
                    ? `Fixed (${table.currentSession.fixedDuration}h)`
                    : "Open"}
                </p>
              </div>
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Hourly Rate</p>
                <p className="text-sm font-medium mt-1">
                  ₱{table.currentSession.hourlyRate}/hr
                </p>
              </div>
            </div>

            {/* Estimated Cost */}
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-warning" />
                  <span className="text-sm font-medium">Current Total</span>
                </div>
                <span className="text-2xl font-bold text-warning">
                  ₱{finalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Edit Fixed Duration */}
            {table.currentSession.sessionType === "fixed" && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                {editingDuration === null ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Contract Duration</p>
                      <p className="text-lg font-semibold">
                        {table.currentSession.fixedDuration}h
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingDuration(table.currentSession?.fixedDuration?.toString() || "1")}
                    >
                      Edit
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="edit-duration">New Duration (hours)</Label>
                      <Input
                        id="edit-duration"
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={editingDuration}
                        onChange={(e) => setEditingDuration(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      New Total: ₱{(parseFloat(editingDuration || "0") * tableHourlyRate).toFixed(2)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingDuration(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          updateFixedDuration(table.id, parseFloat(editingDuration || "1"));
                          setEditingDuration(null);
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Fixed Time Warning */}
            {table.currentSession.sessionType === "fixed" &&
              table.currentSession.fixedDuration &&
              elapsed >= table.currentSession.fixedDuration * 3600000 && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-sm text-destructive">
                    Fixed time session has exceeded its duration!
                  </p>
                </div>
              )}
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Session Type Selection */}
            <div className="space-y-3">
              <Label>Session Type</Label>
              <RadioGroup
                value={sessionType}
                onValueChange={(v) => setSessionType(v as "open" | "fixed")}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="open"
                    id="open"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="open"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Clock className="mb-2 h-6 w-6" />
                    <span className="text-sm font-medium">Open Time</span>
                    <span className="text-xs text-muted-foreground">
                      Until closed
                    </span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="fixed"
                    id="fixed"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="fixed"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Timer className="mb-2 h-6 w-6" />
                    <span className="text-sm font-medium">Fixed Time</span>
                    <span className="text-xs text-muted-foreground">
                      Set duration
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Fixed Duration Input */}
            {sessionType === "fixed" && (
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (hours)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={fixedDuration}
                  onChange={(e) => setFixedDuration(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Estimated: ₱{(parseFloat(fixedDuration || "0") * tableHourlyRate).toFixed(2)}
                </p>
              </div>
            )}

            {/* Rate Display */}
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Hourly Rate</span>
                <span className="font-medium">₱{tableHourlyRate}/hr</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {isClosed && table.currentSession ? (
            <Button onClick={handleConfirmPayment} className="bg-green-600 hover:bg-green-700">
              Pay ₱{finalAmount.toFixed(2)}
            </Button>
          ) : isRunning ? (
            <Button variant="destructive" onClick={handleEndSession}>
              End Session
            </Button>
          ) : (
            <Button onClick={handleStartSession} disabled={table.status === "closed"}>
              Start Session
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
