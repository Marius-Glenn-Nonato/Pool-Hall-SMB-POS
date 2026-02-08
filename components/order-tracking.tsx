"use client";

import { useState, useMemo } from "react";
import { usePOSStore } from "@/lib/store";
import { getDaysRemainingInMonth } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Download, Search, Calendar, Trash2, Edit2 } from "lucide-react";
import { utils, writeFile } from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Order } from "@/lib/types";

export function OrderTracking() {
  const { orders, deleteOrder, voidOrder, editOrder } = usePOSStore();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("today");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editedItems, setEditedItems] = useState<Order["items"] | null>(null);

  const daysRemaining = getDaysRemainingInMonth();

  const filteredOrders = useMemo(() => {
    let filtered = [...orders].reverse();

    // Search filter
    if (search) {
      filtered = filtered.filter(
        (o) =>
          o.id.toLowerCase().includes(search.toLowerCase()) ||
          o.notes?.toLowerCase().includes(search.toLowerCase()) ||
          o.items.some((item) =>
            item.itemName.toLowerCase().includes(search.toLowerCase())
          )
      );
    }

    // Date filter
    const now = new Date();
    if (dateFilter === "today") {
      filtered = filtered.filter((o) => {
        const orderDate = new Date(o.timestamp);
        return orderDate.toDateString() === now.toDateString();
      });
    } else if (dateFilter === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      filtered = filtered.filter((o) => {
        const orderDate = new Date(o.timestamp);
        return orderDate.toDateString() === yesterday.toDateString();
      });
    } else if (dateFilter === "week") {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter((o) => new Date(o.timestamp) >= sevenDaysAgo);
    } else if (dateFilter === "month") {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter((o) => new Date(o.timestamp) >= thirtyDaysAgo);
    } else if (dateFilter === "lastMonth") {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      filtered = filtered.filter((o) => {
        const orderDate = new Date(o.timestamp);
        return orderDate >= lastMonthStart && orderDate <= lastMonthEnd;
      });
    }

    return filtered;
  }, [orders, search, dateFilter]);

  const totalSales = filteredOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const handleExport = () => {
    const ordersToExport = filteredOrders.filter((o) =>
      selectedOrders.size > 0 ? selectedOrders.has(o.id) : true
    );

    const data = ordersToExport.flatMap((order) => [
      {
        "Order ID": order.id,
        "Date/Time": new Date(order.timestamp).toLocaleString(),
        "Item Name": order.items.map((i) => i.itemName).join(", "),
        Quantity: order.items.map((i) => i.quantity).join(", "),
        "Unit Price": order.items.map((i) => `₱${i.unitPrice}`).join(", "),
        "Total Price": `₱${order.totalPrice.toFixed(2)}`,
        Notes: order.notes || "",
        Status: order.status,
      },
    ]);

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Orders");
    writeFile(wb, `orders-${dateFilter}-${Date.now()}.xlsx`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-2xl font-bold text-card-foreground mb-4">
          Order Tracking
        </h2>

        <div className="flex gap-4 flex-col lg:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders by ID, items, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full lg:w-48">
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
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Total Sales Display */}
      <div className="px-4 py-3 bg-muted/50 border-b border-border">
        <div className="text-2xl font-bold text-card-foreground">
          Total Sales = ₱{totalSales.toFixed(2)}
        </div>
      </div>

      {/* Month Ending Reminder */}
      <div className="px-4 py-3 bg-muted/50 border-b border-border">
        <p className="text-sm font-medium text-muted-foreground">
          {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left in this month
        </p>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={
                    selectedOrders.size === filteredOrders.length &&
                    filteredOrders.length > 0
                  }
                  onChange={handleSelectAll}
                  className="w-4 h-4"
                />
              </TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Date/Time</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Total Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order.id)}
                      onChange={() => handleSelectOrder(order.id)}
                      className="w-4 h-4"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {order.id}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(order.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.items.map((i) => i.itemName).join(", ")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.items.map((i) => i.quantity).join(", ")}
                  </TableCell>
                  <TableCell className="font-medium">
                    ₱{order.totalPrice.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="flex gap-2">
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingOrder(order);
                        setEditedItems([...order.items]);
                      }}
                      disabled={order.status === "voided"}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteOrder(order.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      {editingOrder && editedItems !== null && (
        <Dialog
          open={!!editingOrder}
          onOpenChange={() => {
            setEditingOrder(null);
            setEditedItems(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Order: {editingOrder.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <h4 className="font-medium">Items in Order</h4>
                <div className="space-y-3">
                  {editedItems.map((item, idx) => {
                    const updatedItem = editedItems[idx];
                    const newTotal = updatedItem.unitPrice * updatedItem.quantity;
                    return (
                      <div key={item.itemId} className="bg-muted p-3 rounded space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium text-sm">{item.itemName}</span>
                          <span className="text-sm">₱{updatedItem.unitPrice.toFixed(2)}/unit</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`qty-${idx}`} className="text-sm">Qty:</Label>
                          <Input
                            id={`qty-${idx}`}
                            type="number"
                            min="1"
                            value={updatedItem.quantity}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 1;
                              const newItems = [...editedItems];
                              newItems[idx] = {
                                ...newItems[idx],
                                quantity: newQty,
                                totalPrice: newQty * newItems[idx].unitPrice,
                              };
                              setEditedItems(newItems);
                            }}
                            className="w-20"
                          />
                          <span className="text-sm">= ₱{newTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>₱{editedItems.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}</span>
                </div>
              </div>
              {editingOrder.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes:</p>
                  <p className="text-sm">{editingOrder.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setEditingOrder(null);
                setEditedItems(null);
              }}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  editOrder(editingOrder.id, editedItems, editingOrder.notes || "");
                  setEditingOrder(null);
                  setEditedItems(null);
                }}
              >
                Save Changes
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  voidOrder(editingOrder.id);
                  setEditingOrder(null);
                  setEditedItems(null);
                }}
              >
                Void Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
