"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BilliardTable, TableSession, RetailItem, RetailSale, Order, OrderItem, PriceCategory } from "./types";

interface POSStore {
  // Price Categories
  priceCategories: PriceCategory[];
  addPriceCategory: (name: string, hourlyRate: number) => void;
  updatePriceCategory: (id: string, name: string, hourlyRate: number) => void;
  deletePriceCategory: (id: string) => void;

  // Tables
  tables: BilliardTable[];
  addTable: (name: string, priceCategoryId?: string) => void;
  removeTable: (id: string) => void;
  renameTable: (id: string, name: string) => void;
  updateTablePriceCategory: (id: string, priceCategoryId: string) => void;
  updateTablePosition: (id: string, position: { x: number; y: number }) => void;
  updateTableSize: (id: string, size: { width: number; height: number }) => void;
  setTableStatus: (
    id: string,
    status: "available" | "running" | "closed"
  ) => void;

  // Sessions
  sessions: TableSession[];
  hourlyRate: number;
  setHourlyRate: (rate: number) => void;
  startSession: (
    tableId: string,
    sessionType: "fixed" | "open",
    fixedDuration?: number
  ) => void;
  endSession: (tableId: string, elapsedMs?: number) => void;
  completePayment: (tableId: string) => void;
  updateFixedDuration: (tableId: string, newDuration: number) => void;
  voidSession: (sessionId: string) => void;
  editSession: (sessionId: string, updates: Partial<TableSession>) => void;

  // Retail
  retailItems: RetailItem[];
  addRetailItem: (item: Omit<RetailItem, "id">) => void;
  updateRetailItem: (id: string, item: Partial<RetailItem>) => void;
  removeRetailItem: (id: string) => void;

  // Retail Sales
  retailSales: RetailSale[];
  addRetailSale: (itemId: string, quantity: number) => void;

  // Orders
  orders: Order[];
  createOrder: (items: OrderItem[], notes?: string) => void;
  editOrder: (orderId: string, items: OrderItem[], notes?: string) => void;
  deleteOrder: (orderId: string) => void;
  voidOrder: (orderId: string) => void;
}

export const usePOSStore = create<POSStore>()(
  persist(
    (set, get) => ({
      // Price Categories
      priceCategories: [
        { id: "cat-regular", name: "Regular", hourlyRate: 15 },
        { id: "cat-vip", name: "VIP", hourlyRate: 25 },
        { id: "cat-vvip", name: "VVIP", hourlyRate: 50 },
      ],

      addPriceCategory: (name, hourlyRate) =>
        set((state) => ({
          priceCategories: [
            ...state.priceCategories,
            {
              id: `cat-${Date.now()}`,
              name,
              hourlyRate,
            },
          ],
        })),

      updatePriceCategory: (id, name, hourlyRate) =>
        set((state) => ({
          priceCategories: state.priceCategories.map((cat) =>
            cat.id === id ? { ...cat, name, hourlyRate } : cat
          ),
        })),

      deletePriceCategory: (id) =>
        set((state) => ({
          priceCategories: state.priceCategories.filter((cat) => cat.id !== id),
        })),

      // Initial tables
      tables: [
        {
          id: "table-1",
          name: "Table 1",
          status: "available",
          position: { x: 50, y: 50 },
          size: { width: 176, height: 140 },
        },
        {
          id: "table-2",
          name: "Table 2",
          status: "available",
          position: { x: 250, y: 50 },
          size: { width: 176, height: 140 },
        },
        {
          id: "table-3",
          name: "Table 3",
          status: "available",
          position: { x: 450, y: 50 },
          size: { width: 176, height: 140 },
        },
        {
          id: "table-4",
          name: "Table 4",
          status: "available",
          position: { x: 50, y: 200 },
          size: { width: 176, height: 140 },
        },
      ],

      addTable: (name, priceCategoryId) =>
        set((state) => ({
          tables: [
            ...state.tables,
            {
              id: `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name,
              status: "available",
              position: { x: 50, y: 50 },
              size: { width: 180, height: 140 },
              ...(priceCategoryId ? { priceCategoryId } : {}),
            },
          ],
        })),

      removeTable: (id) =>
        set((state) => ({
          tables: state.tables.filter((t) => t.id !== id),
        })),

      renameTable: (id, name) =>
        set((state) => ({
          tables: state.tables.map((t) => (t.id === id ? { ...t, name } : t)),
        })),

      updateTablePriceCategory: (id, priceCategoryId) =>
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === id ? { ...t, priceCategoryId } : t
          ),
        })),

      updateTablePosition: (id, position) =>
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === id ? { ...t, position } : t
          ),
        })),

      updateTableSize: (id, size) =>
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === id ? { ...t, size } : t
          ),
        })),

      setTableStatus: (id, status) =>
        set((state) => ({
          tables: state.tables.map((t) => (t.id === id ? { ...t, status } : t)),
        })),

      // Sessions
      sessions: [],
      hourlyRate: 15,

      setHourlyRate: (rate) => set({ hourlyRate: rate }),

      startSession: (tableId, sessionType, fixedDuration) => {
        const { tables, priceCategories, hourlyRate } = get();
        const table = tables.find((t) => t.id === tableId);
        if (!table) return;

        // Get the hourly rate from the table's price category if assigned, otherwise use default
        let calculatedRate = hourlyRate;
        if (table.priceCategoryId) {
          const category = priceCategories.find((cat) => cat.id === table.priceCategoryId);
          if (category) {
            calculatedRate = category.hourlyRate;
          }
        }

        const session: TableSession = {
          id: `session-${Date.now()}`,
          tableId,
          tableName: table.name,
          startTime: new Date(),
          sessionType,
          fixedDuration,
          hourlyRate: calculatedRate,
        };

        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId
              ? { ...t, status: "running" as const, currentSession: session }
              : t
          ),
        }));
      },

      endSession: (tableId, elapsedMs) => {
        const { tables } = get();
        const table = tables.find((t) => t.id === tableId);
        if (!table?.currentSession) return;

        // Just set table to "closed" and keep currentSession for payment processing
        // Store the elapsed time at the moment of closing
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId
              ? {
                  ...t,
                  status: "closed" as const,
                  currentSession: {
                    ...t.currentSession!,
                    endedElapsedMs: elapsedMs ?? 0,
                  },
                }
              : t
          ),
        }));
      },

      completePayment: (tableId) => {
        const { tables } = get();
        const table = tables.find((t) => t.id === tableId);
        if (!table?.currentSession) return;

        const session = table.currentSession;
        const endTime = new Date();
        
        // For fixed sessions, charge the full fixed duration
        // For open sessions, calculate based on actual time used (using the frozen elapsed time)
        let totalAmount: number;
        if (session.sessionType === "fixed" && session.fixedDuration) {
          totalAmount = session.fixedDuration * session.hourlyRate;
        } else {
          // Use the endedElapsedMs that was captured when session ended
          const durationMs = session.endedElapsedMs || 0;
          const durationHours = durationMs / (1000 * 60 * 60);
          totalAmount = Math.ceil(durationHours * 4) / 4 * session.hourlyRate; // Round to 15 min
        }

        const completedSession: TableSession = {
          ...session,
          endTime,
          totalAmount,
        };

        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId
              ? { ...t, status: "available" as const, currentSession: undefined }
              : t
          ),
          sessions: [...state.sessions, completedSession],
        }));
      },

      updateFixedDuration: (tableId, newDuration) =>
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId && t.currentSession
              ? {
                  ...t,
                  currentSession: {
                    ...t.currentSession,
                    fixedDuration: newDuration,
                  },
                }
              : t
          ),
        })),

      voidSession: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, status: "voided" } : s
          ),
        })),

      editSession: (sessionId, updates) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, ...updates } : s
          ),
        })),

      // Retail Items
      retailItems: [
        { id: "item-1", name: "Coca-Cola", price: 3.5, category: "Drinks", stock: 50 },
        { id: "item-2", name: "Water Bottle", price: 2.0, category: "Drinks", stock: 100 },
        { id: "item-3", name: "Energy Drink", price: 4.5, category: "Drinks", stock: 30 },
        { id: "item-4", name: "Chips", price: 2.5, category: "Snacks", stock: 40 },
        { id: "item-5", name: "Candy Bar", price: 1.5, category: "Snacks", stock: 60 },
        { id: "item-6", name: "Cigarettes", price: 12.0, category: "Tobacco", stock: 25 },
      ],

      addRetailItem: (item) =>
        set((state) => ({
          retailItems: [
            ...state.retailItems,
            { ...item, id: `item-${Date.now()}` },
          ],
        })),

      updateRetailItem: (id, item) =>
        set((state) => ({
          retailItems: state.retailItems.map((i) =>
            i.id === id ? { ...i, ...item } : i
          ),
        })),

      removeRetailItem: (id) =>
        set((state) => ({
          retailItems: state.retailItems.filter((i) => i.id !== id),
        })),

      // Retail Sales
      retailSales: [],

      addRetailSale: (itemId, quantity) => {
        const { retailItems } = get();
        const item = retailItems.find((i) => i.id === itemId);
        if (!item || item.stock < quantity) return;

        const sale: RetailSale = {
          id: `sale-${Date.now()}`,
          itemId,
          itemName: item.name,
          quantity,
          unitPrice: item.price,
          totalPrice: item.price * quantity,
          timestamp: new Date(),
        };

        // Create order item and order simultaneously
        const orderItem: OrderItem = {
          itemId,
          itemName: item.name,
          quantity,
          unitPrice: item.price,
          totalPrice: item.price * quantity,
        };

        const order: Order = {
          id: `order-${Date.now()}-${itemId}`,
          items: [orderItem],
          totalPrice: item.price * quantity,
          timestamp: new Date(),
          notes: "",
          status: "completed",
        };

        set((state) => ({
          retailSales: [...state.retailSales, sale],
          orders: [...state.orders, order],
          retailItems: state.retailItems.map((i) =>
            i.id === itemId ? { ...i, stock: i.stock - quantity } : i
          ),
        }));
      },

      // Orders
      orders: [],

      createOrder: (items, notes) => {
        const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);
        const order: Order = {
          id: `order-${Date.now()}`,
          items,
          totalPrice,
          timestamp: new Date(),
          notes,
          status: "completed",
        };

        set((state) => ({
          orders: [...state.orders, order],
        }));
      },

      editOrder: (orderId, items, notes) => {
        const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);
        
        set((state) => {
          // Find the old order to get quantity differences
          const oldOrder = state.orders.find((o) => o.id === orderId);
          if (!oldOrder) return state;

          // Calculate quantity changes for each item
          const quantityChanges: Record<string, number> = {}; // itemId -> quantity delta
          
          oldOrder.items.forEach((oldItem) => {
            const newItem = items.find((i) => i.itemId === oldItem.itemId);
            const diff = (newItem?.quantity || 0) - oldItem.quantity;
            if (diff !== 0) {
              quantityChanges[oldItem.itemId] = diff;
            }
          });

          // Update retail sales quantities
          let updatedRetailSales = [...state.retailSales];
          let updatedRetailItems = [...state.retailItems];

          Object.entries(quantityChanges).forEach(([itemId, diff]) => {
            // Find the retail sale for this item that matches the order timestamp
            const saleIndex = updatedRetailSales.findIndex(
              (sale) =>
                sale.itemId === itemId &&
                new Date(sale.timestamp).getTime() === new Date(oldOrder.timestamp).getTime()
            );

            if (saleIndex !== -1) {
              const sale = updatedRetailSales[saleIndex];
              const newQuantity = sale.quantity + diff;
              const newTotalPrice = newQuantity * sale.unitPrice;

              if (newQuantity > 0) {
                updatedRetailSales[saleIndex] = {
                  ...sale,
                  quantity: newQuantity,
                  totalPrice: newTotalPrice,
                };
              } else {
                // Remove sale if quantity goes to 0
                updatedRetailSales = updatedRetailSales.filter((_, i) => i !== saleIndex);
              }

              // Update inventory stock (reverse the quantity delta)
              updatedRetailItems = updatedRetailItems.map((item) =>
                item.id === itemId
                  ? { ...item, stock: item.stock - diff }
                  : item
              );
            }
          });

          return {
            orders: state.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    items,
                    totalPrice,
                    notes,
                  }
                : o
            ),
            retailSales: updatedRetailSales,
            retailItems: updatedRetailItems,
          };
        });
      },

      deleteOrder: (orderId) => {
        set((state) => {
          const orderToDelete = state.orders.find((o) => o.id === orderId);
          if (!orderToDelete) return state;

          // Restore inventory stock and remove retail sales
          let updatedRetailItems = [...state.retailItems];
          let updatedRetailSales = [...state.retailSales];

          orderToDelete.items.forEach((item) => {
            // Find and remove the retail sale for this item
            updatedRetailSales = updatedRetailSales.filter(
              (sale) =>
                !(
                  sale.itemId === item.itemId &&
                  new Date(sale.timestamp).getTime() === new Date(orderToDelete.timestamp).getTime()
                )
            );

            // Restore stock
            updatedRetailItems = updatedRetailItems.map((retailItem) =>
              retailItem.id === item.itemId
                ? { ...retailItem, stock: retailItem.stock + item.quantity }
                : retailItem
            );
          });

          return {
            orders: state.orders.filter((o) => o.id !== orderId),
            retailSales: updatedRetailSales,
            retailItems: updatedRetailItems,
          };
        });
      },

      voidOrder: (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status: "voided" } : o
          ),
        }));
      },
    }),
    {
      name: "pool-hall-pos",
    }
  )
);

// --- Vercel KV (Redis) sync ---
// Loads initial state from Vercel KV and pushes local changes (debounced).
if (typeof window !== "undefined") {
  (function () {
    let applyingRemote = false;
    let pushTimer: ReturnType<typeof setTimeout> | null = null;

    const fetchInitial = async () => {
      try {
        const res = await fetch("/api/kv-state");
        if (!res.ok) return;
        const data = await res.json();
        applyingRemote = true;
        usePOSStore.setState((s) => ({
          tables: data.tables && data.tables.length ? data.tables : s.tables,
          sessions: data.sessions || s.sessions,
          retailItems: data.retailItems || s.retailItems,
          priceCategories: data.priceCategories && data.priceCategories.length ? data.priceCategories : s.priceCategories,
          retailSales: data.retailSales || s.retailSales,
          orders: data.orders || s.orders,
          hourlyRate: data.hourlyRate ?? s.hourlyRate,
        }));
        setTimeout(() => (applyingRemote = false), 300);
      } catch (e) {
        console.warn("Failed to load /api/kv-state:", e);
      }
    };

    fetchInitial();

    usePOSStore.subscribe((state) => {
      if (applyingRemote) return;
      if (pushTimer) clearTimeout(pushTimer);
      pushTimer = setTimeout(async () => {
        try {
          await fetch("/api/kv-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tables: state.tables,
              sessions: state.sessions,
              retailItems: state.retailItems,
              priceCategories: state.priceCategories,
              retailSales: state.retailSales,
              orders: state.orders,
              hourlyRate: state.hourlyRate,
              updatedAt: Date.now(),
            }),
          });
        } catch (err) {
          console.warn("Failed to write /api/kv-state:", err);
        }
      }, 500);
    });
  })();
}
