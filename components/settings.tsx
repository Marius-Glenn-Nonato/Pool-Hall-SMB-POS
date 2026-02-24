"use client";

import { useState } from "react";
import { usePOSStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Save, RotateCcw, AlertTriangle, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function Settings() {
  const { hourlyRate, setHourlyRate, tables, priceCategories, addPriceCategory, updatePriceCategory, deletePriceCategory } = usePOSStore();
  const [rate, setRate] = useState(hourlyRate.toString());
  const [saved, setSaved] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryRate, setNewCategoryRate] = useState("");

  const handleSaveRate = () => {
    const newRate = parseFloat(rate);
    if (!isNaN(newRate) && newRate > 0) {
      setHourlyRate(newRate);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleAddCategory = () => {
    const categoryRate = parseFloat(newCategoryRate);
    if (newCategoryName.trim() && !isNaN(categoryRate) && categoryRate > 0) {
      addPriceCategory(newCategoryName.trim(), categoryRate);
      setNewCategoryName("");
      setNewCategoryRate("");
      setIsAddCategoryOpen(false);
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
        {/* Price Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Price Categories
                </CardTitle>
                <CardDescription>
                  Manage table price categories (Regular, VIP, VVIP, etc.)
                </CardDescription>
              </div>
              <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                <Button onClick={() => setIsAddCategoryOpen(true)} className="gap-2">
                  + Add Category
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Price Category</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="cat-name">Category Name</Label>
                      <Input
                        id="cat-name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="e.g., VIP, Regular, VVIP"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cat-rate">Hourly Rate (₱)</Label>
                      <Input
                        id="cat-rate"
                        type="number"
                        min="0"
                        step="0.5"
                        value={newCategoryRate}
                        onChange={(e) => setNewCategoryRate(e.target.value)}
                        placeholder="e.g., 25.50"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCategory}>Add Category</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {priceCategories.length > 0 ? (
                priceCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{cat.name}</p>
                      <p className="text-sm text-muted-foreground">₱{cat.hourlyRate}/hr</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePriceCategory(cat.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No price categories created</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Default Hourly Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Default Hourly Rate
            </CardTitle>
            <CardDescription>
              Fallback rate for tables without an assigned price category
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="rate">Default Rate (₱)</Label>
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
                  Used when a table has no price category assigned
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
