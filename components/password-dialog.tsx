"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface PasswordDialogProps {
  isOpen: boolean;
  onAuthenticate: (password: string) => void;
  onCancel: () => void;
  pageName: string;
}

export function PasswordDialog({
  isOpen,
  onAuthenticate,
  onCancel,
  pageName,
}: PasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { authenticate } = useAuth();

  // Reset form when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setPassword("");
      setError("");
      onCancel();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.trim() === "") {
      setError("Password is required");
      return;
    }

    setError("");
    setIsLoading(true);

    // Simulate a small delay for security (brute force mitigation)
    await new Promise((resolve) => setTimeout(resolve, 300));

    const isValid = authenticate(password);
    if (isValid) {
      // Password is correct - notify parent
      onAuthenticate(password);
      setPassword("");
    } else {
      // Password is incorrect
      setError("Invalid password. Please try again.");
    }
    
    setIsLoading(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" onEscapeKeyDown={(e) => {
        // Prevent closing with ESC key for security
        e.preventDefault();
      }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Access Required
          </DialogTitle>
          <DialogDescription>
            Enter the password to access the {pageName} page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={handlePasswordChange}
              disabled={isLoading}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit(e);
                }
              }}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Access"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
