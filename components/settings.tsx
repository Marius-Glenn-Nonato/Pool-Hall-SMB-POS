"use client";

import { useState } from "react";
import { usePOSStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Save, RotateCcw, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function Settings() {
  const { hourlyRate, setHourlyRate, tables } = usePOSStore();
  const [rate, setRate] = useState(hourlyRate.toString());
  const [saved, setSaved] = useState(false);

  const handleSaveRate = () => {
    const newRate = parseFloat(rate);
    if (!isNaN(newRate) && newRate > 0) {
      setHourlyRate(newRate);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleResetAll = () => {
    localStorage.removeItem("pool-hall-pos");
    window.location.reload();
  };

  const activeSessions = tables.filter((t) => t.status === "running").length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-border bg-card">
        <h2 className="text-2xl font-bold text-card-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure your POS system
        </p>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Pricing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Pricing
            </CardTitle>
            <CardDescription>
              Set the default hourly rate for table sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="rate">Default Hourly Rate (₱)</Label>
                <Input
                  id="rate"
                  type="number"
                  min="0"
                  step="0.5"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  This rate will be applied to all new table sessions
                </p>
              </div>
              <Button onClick={handleSaveRate} className="gap-2">
                <Save className="h-4 w-4" />
                {saved ? "Saved!" : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Total Tables</p>
                <p className="text-2xl font-bold">{tables.length}</p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold text-warning">{activeSessions}</p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-success">
                  {tables.filter((t) => t.status === "available").length}
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Closed</p>
                <p className="text-2xl font-bold text-destructive">
                  {tables.filter((t) => t.status === "closed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions - proceed with caution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg">
              <div>
                <p className="font-medium">Reset All Data</p>
                <p className="text-sm text-muted-foreground">
                  This will delete all tables, sessions, inventory, and sales data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <RotateCcw className="h-4 w-4" /> Reset
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all
                      your data including tables, session records, inventory items,
                      and sales history.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleResetAll}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, reset everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pool Hall POS - A modern point of sale system for billiard halls.
              Manage table sessions, track retail sales, and view analytics all
              in one place.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Data is stored locally in your browser. Export regularly to avoid
              data loss.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
