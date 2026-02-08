"use client";

import { useMemo } from "react";
import { usePOSStore } from "@/lib/store";
import { getDaysRemainingInMonth } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  Clock,
  ShoppingBag,
  Download,
  BarChart3,
} from "lucide-react";
import { utils, writeFile } from "xlsx";

export function SalesAnalytics() {
  const { sessions, retailSales, retailItems } = usePOSStore();
  
  const daysRemaining = getDaysRemainingInMonth();

  const analytics = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();

    // Table analytics
    const todaySessions = sessions.filter(
      (s) => new Date(s.startTime).toDateString() === today
    );
    const todayTableRevenue = todaySessions.reduce(
      (sum, s) => sum + (s.totalAmount || 0),
      0
    );
    const totalTableRevenue = sessions.reduce(
      (sum, s) => sum + (s.totalAmount || 0),
      0
    );

    // Calculate average session duration
    const completedSessions = sessions.filter((s) => s.endTime);
    const avgDurationMs = completedSessions.length
      ? completedSessions.reduce((sum, s) => {
          const duration =
            new Date(s.endTime!).getTime() - new Date(s.startTime).getTime();
          return sum + duration;
        }, 0) / completedSessions.length
      : 0;
    const avgDurationMins = Math.round(avgDurationMs / 60000);

    // Retail analytics
    const todayRetailSales = retailSales.filter(
      (s) => new Date(s.timestamp).toDateString() === today
    );
    const todayRetailRevenue = todayRetailSales.reduce(
      (sum, s) => sum + s.totalPrice,
      0
    );
    const totalRetailRevenue = retailSales.reduce(
      (sum, s) => sum + s.totalPrice,
      0
    );

    // Best sellers
    const itemSales: Record<string, { name: string; qty: number; revenue: number }> = {};
    retailSales.forEach((sale) => {
      if (!itemSales[sale.itemId]) {
        itemSales[sale.itemId] = { name: sale.itemName, qty: 0, revenue: 0 };
      }
      itemSales[sale.itemId].qty += sale.quantity;
      itemSales[sale.itemId].revenue += sale.totalPrice;
    });
    const bestSellers = Object.values(itemSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Daily breakdown (last 7 days)
    const dailyData: Record<string, { tables: number; retail: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      dailyData[dateStr] = { tables: 0, retail: 0 };

      sessions.forEach((s) => {
        if (new Date(s.startTime).toDateString() === date.toDateString()) {
          dailyData[dateStr].tables += s.totalAmount || 0;
        }
      });

      retailSales.forEach((s) => {
        if (new Date(s.timestamp).toDateString() === date.toDateString()) {
          dailyData[dateStr].retail += s.totalPrice;
        }
      });
    }

    return {
      todayTableRevenue,
      todayRetailRevenue,
      todayTotal: todayTableRevenue + todayRetailRevenue,
      totalTableRevenue,
      totalRetailRevenue,
      totalRevenue: totalTableRevenue + totalRetailRevenue,
      todaySessions: todaySessions.length,
      totalSessions: sessions.length,
      avgDurationMins,
      todayTransactions: todayRetailSales.length,
      totalTransactions: retailSales.length,
      bestSellers,
      dailyData,
    };
  }, [sessions, retailSales]);

  const exportReport = () => {
    // Summary sheet
    const summaryData = [
      { Metric: "Today's Table Revenue", Value: `₱${analytics.todayTableRevenue.toFixed(2)}` },
      { Metric: "Today's Retail Revenue", Value: `₱${analytics.todayRetailRevenue.toFixed(2)}` },
      { Metric: "Today's Total Revenue", Value: `₱${analytics.todayTotal.toFixed(2)}` },
      { Metric: "Total Table Revenue (All Time)", Value: `₱${analytics.totalTableRevenue.toFixed(2)}` },
      { Metric: "Total Retail Revenue (All Time)", Value: `₱${analytics.totalRetailRevenue.toFixed(2)}` },
      { Metric: "Grand Total Revenue", Value: `₱${analytics.totalRevenue.toFixed(2)}` },
      { Metric: "Total Table Sessions", Value: analytics.totalSessions },
      { Metric: "Total Retail Transactions", Value: analytics.totalTransactions },
      { Metric: "Average Session Duration", Value: `${analytics.avgDurationMins} minutes` },
    ];

    // Daily breakdown sheet
    const dailyBreakdown = Object.entries(analytics.dailyData).map(([date, data]) => ({
      Date: date,
      "Table Revenue": `₱${data.tables.toFixed(2)}`,
      "Retail Revenue": `₱${data.retail.toFixed(2)}`,
      Total: `₱${(data.tables + data.retail).toFixed(2)}`,
    }));

    // Best sellers sheet
    const bestSellersData = analytics.bestSellers.map((item, i) => ({
      Rank: i + 1,
      Item: item.name,
      "Units Sold": item.qty,
      Revenue: `₱${item.revenue.toFixed(2)}`,
    }));

    const wb = utils.book_new();
    utils.book_append_sheet(wb, utils.json_to_sheet(summaryData), "Summary");
    utils.book_append_sheet(wb, utils.json_to_sheet(dailyBreakdown), "Daily Breakdown");
    utils.book_append_sheet(wb, utils.json_to_sheet(bestSellersData), "Best Sellers");

    writeFile(wb, `sales-report-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const maxDaily = Math.max(
    ...Object.values(analytics.dailyData).map((d) => d.tables + d.retail),
    1
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-card-foreground">Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Sales overview and reports
            </p>
          </div>
          <Button onClick={exportReport} className="gap-2">
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </div>
      </header>

      {/* Month Ending Reminder */}
      <div className="px-4 py-3 bg-muted/50 border-b border-border">
        <p className="text-sm font-medium text-muted-foreground">
          {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left in this month
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                ₱{analytics.todayTotal.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Tables: ₱{analytics.todayTableRevenue.toFixed(2)} | Retail: ₱
                {analytics.todayRetailRevenue.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₱{analytics.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.totalSessions} sessions | {analytics.totalTransactions}{" "}
                sales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Session
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.avgDurationMins} min
              </div>
              <p className="text-xs text-muted-foreground">
                Today: {analytics.todaySessions} sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Retail Sales
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.todayTransactions}
              </div>
              <p className="text-xs text-muted-foreground">
                Today / {analytics.totalTransactions} total
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Last 7 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.dailyData).map(([date, data]) => {
                  const total = data.tables + data.retail;
                  const percentage = (total / maxDaily) * 100;
                  return (
                    <div key={date} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{date}</span>
                        <span className="font-medium">₱{total.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full flex">
                          <div
                            className="bg-primary h-full"
                            style={{
                              width: `${(data.tables / maxDaily) * 100}%`,
                            }}
                          />
                          <div
                            className="bg-chart-2 h-full"
                            style={{
                              width: `${(data.retail / maxDaily) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-primary" />
                  <span className="text-muted-foreground">Tables</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-chart-2" />
                  <span className="text-muted-foreground">Retail</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best Sellers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> Best Sellers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.bestSellers.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/30" />
                  <p className="text-muted-foreground mt-2">No sales yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.bestSellers.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">{item.qty}</TableCell>
                        <TableCell className="text-right font-medium text-success">
                          ₱{item.revenue.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
