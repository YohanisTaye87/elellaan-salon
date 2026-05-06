export type Category = {
  id: string;
  name: string;
  sort_order: number;
};

export type Service = {
  id: string;
  category_id: string;
  name: string;
  price_min: number;
  price_max: number | null; // null when fixed price; non-null when range like "5000-7000"
  sort_order: number;
};

export type ServiceWithCategory = Service & { category: Category };

export type Order = {
  id: string;
  created_at: string;
  customer_name: string | null;
  phone: string | null;
  comment: string | null;
  total: number;
};

export type OrderItem = {
  id: string;
  order_id: string;
  service_id: string | null;
  service_name: string;   // snapshot
  category_name: string;  // snapshot
  price: number;          // snapshot (we record price_min for ranges)
};

export type OrderWithItems = Order & { items: OrderItem[] };
