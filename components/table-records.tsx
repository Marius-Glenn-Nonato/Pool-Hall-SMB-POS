"use client";

import { useState, useMemo } from "react";
import { usePOSStore } from "@/lib/store";
import { getDaysRemainingInMonth } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


import { Download, Search, Calendar } from "lucide-react";
import { utils, writeFile } from "xlsx";

export function TableRecords() {
  const { sessions } = usePOSStore();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("today");

  const daysRemaining = getDaysRemainingInMonth();

  const filteredSessions = useMemo(() => {
    let filtered = [...sessions].reverse();

    // Search filter
    if (search) {
      filtered = filtered.filter((s) =>
        s.tableName.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Date filter
    const now = new Date();
    if (dateFilter === "today") {
      filtered = filtered.filter((s) => {
        const sessionDate = new Date(s.startTime);
        return sessionDate.toDateString() === now.toDateString();
      });
    } else if (dateFilter === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      filtered = filtered.filter((s) => {
        const sessionDate = new Date(s.startTime);
        return sessionDate.toDateString() === yesterday.toDateString();
      });
    } else if (dateFilter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((s) => new Date(s.startTime) >= weekAgo);
    } else if (dateFilter === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((s) => new Date(s.startTime) >= monthAgo);
    } else if (dateFilter === "lastMonth") {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      filtered = filtered.filter((s) => {
        const sessionDate = new Date(s.startTime);
        return sessionDate >= lastMonthStart && sessionDate <= lastMonthEnd;
      });
    }

    return filtered;
  }, [sessions, search, dateFilter]);

  const totalRevenue = filteredSessions.reduce(
    (sum, s) => sum + (s.totalAmount || 0),
    0
  );

  const formatDuration = (start: Date, end?: Date) => {
    if (!end) return "—";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const exportToExcel = () => {
    const grandTotalRevenue = filteredSessions.reduce(
      (sum, s) => sum + (s.totalAmount || 0),
      0
    );


      const data = filteredSessions.map((s) => ({
      "Table": s.tableName,
      "Start Time": new Date(s.startTime).toLocaleString(),
      "End Time": s.endTime ? new Date(s.endTime).toLocaleString() : "—",
      "Duration": formatDuration(s.startTime, s.endTime),
      "Session Type":
        s.sessionType === "fixed"
          ? `Fixed (${s.fixedDuration}h)`
          : "Open",
      "Rate (₱/hr)": s.hourlyRate,
      "Total (₱)": s.totalAmount?.toFixed(2) || "—",
      }));

    data.push({
      "Table": "",
      "Start Time": "",
      "End Time": "",
      "Duration": "",
      "Session Type": "",
      "Rate (₱/hr)": "GRAND TOTAL REVENUE",
      "Total (₱)": grandTotalRevenue.toFixed(2),
    });

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Table Sessions");

    // Set column widths
    ws["!cols"] = [
      { wch: 12 },
      { wch: 20 },
      { wch: 20 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 18 }, // TOTAL REVENUE
    ];

    writeFile(wb, `table-records-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-border bg-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-card-foreground">Table Records</h2>
            <p className="text-sm text-muted-foreground">
              {filteredSessions.length} sessions / ₱{totalRevenue.toFixed(2)} total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tables..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-36">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportToExcel} className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </div>
      </header>

      {/* Total Sales Display */}
      <div className="px-4 py-3 bg-muted/50 border-b border-border">
        <div className="text-2xl font-bold text-card-foreground">
          Total Sales = ₱{totalRevenue.toFixed(2)}
        </div>
      </div>

      {/* Month Ending Reminder */}
      <div className="px-4 py-3 bg-muted/50 border-b border-border">
        <p className="text-sm font-medium text-muted-foreground">
          {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left in this month
        </p>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Table</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <p className="text-muted-foreground">No records found</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Completed table sessions will appear here
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.tableName}</TableCell>
                    <TableCell>
                      {new Date(session.startTime).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {session.endTime
                        ? new Date(session.endTime).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {formatDuration(session.startTime, session.endTime)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {session.sessionType === "fixed"
                        ? `Fixed (${session.fixedDuration}h)`
                        : "Open"}
                    </TableCell>
                    <TableCell className="text-right">
                      ${session.hourlyRate}/hr
                    </TableCell>
                    <TableCell className="text-right font-medium text-success">
                      ${session.totalAmount?.toFixed(2) || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
