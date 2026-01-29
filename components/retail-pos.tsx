"use client";

import { useState, useMemo } from "react";
import { usePOSStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

export function RetailPOS() {
  const { retailItems, addRetailSale } = usePOSStore();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(retailItems.map((i) => i.category));
    return Array.from(cats);
  }, [retailItems]);

  const filteredItems = useMemo(() => {
    let items = retailItems;

    if (search) {
      items = items.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedCategory) {
      items = items.filter((i) => i.category === selectedCategory);
    }

    // Sort alphabetically by name
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [retailItems, search, selectedCategory]);

  const addToCart = (itemId: string) => {
    const item = retailItems.find((i) => i.id === itemId);
    if (!item) return;

    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === itemId);
      if (existing) {
        if (existing.quantity >= item.stock) return prev;
        return prev.map((c) =>
          c.itemId === itemId ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        { itemId, name: item.name, price: item.price, quantity: 1 },
      ];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.itemId !== itemId) return c;
          const newQty = c.quantity + delta;
          if (newQty <= 0) return null;
          const item = retailItems.find((i) => i.id === itemId);
          if (item && newQty > item.stock) return c;
          return { ...c, quantity: newQty };
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.itemId !== itemId));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  const handleCheckout = () => {
    cart.forEach((c) => {
      addRetailSale(c.itemId, c.quantity);
    });
    setCart([]);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Products Section */}
      <div className="flex-1 flex flex-col border-r border-border">
        {/* Header */}
        <header className="p-4 border-b border-border bg-card">
          <h2 className="text-2xl font-bold text-card-foreground mb-4">Retail Sales</h2>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </header>

        {/* Products Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary",
                  item.stock === 0 && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => item.stock > 0 && addToCart(item.id)}
              >
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm truncate">{item.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-primary">
                      ₱{item.price.toFixed(2)}
                    </span>
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                      {item.stock} left
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-full lg:w-96 bg-card flex flex-col">
        <header className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Cart</h3>
            {cart.length > 0 && (
              <Badge variant="secondary">{cart.length}</Badge>
            )}
          </div>
        </header>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground mt-2">Cart is empty</p>
              <p className="text-sm text-muted-foreground/70">
                Tap products to add them
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.itemId}
                  className="flex items-center gap-3 bg-muted rounded-lg p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ₱{item.price.toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => updateQuantity(item.itemId, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => updateQuantity(item.itemId, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeFromCart(item.itemId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        <div className="p-4 border-t border-border space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Total</span>
            <span className="text-2xl font-bold text-primary">
              ₱{cartTotal.toFixed(2)}
            </span>
          </div>
          <Button
            className="w-full h-12 text-lg"
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            {showSuccess ? (
              <>
                <CheckCircle className="h-5 w-5 mr-2" /> Sale Complete!
              </>
            ) : (
              "Complete Sale"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
