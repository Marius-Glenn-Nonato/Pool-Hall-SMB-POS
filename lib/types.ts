export type TableStatus = "available" | "running" | "closed";

export type SessionType = "fixed" | "open";

export interface PriceCategory {
  id: string;
  name: string;
  hourlyRate: number;
}

export interface BilliardTable {
  id: string;
  name: string;
  status: TableStatus;
  position: { x: number; y: number };
  size: { width: number; height: number };
  priceCategoryId?: string; // Reference to price category (optional)
  currentSession?: TableSession;
}

export interface TableSession {
  id: string;
  tableId: string;
  tableName: string;
  startTime: Date;
  endTime?: Date;
  sessionType: SessionType;
  fixedDuration?: number; // in hours
  hourlyRate: number;
  totalAmount?: number;
  endedElapsedMs?: number; // elapsed time in ms when session was ended
}

export interface RetailItem {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
}

export interface RetailSale {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  timestamp: Date;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalPrice: number;
  timestamp: Date;
  notes?: string;
  status: "completed" | "voided"; // completed or voided
}

export interface OrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface DailySalesReport {
  date: string;
  totalTableRevenue: number;
  totalRetailRevenue: number;
  totalRevenue: number;
  tableSessions: number;
  retailTransactions: number;
}
