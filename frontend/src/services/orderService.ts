import { supabase } from "../lib/supabase";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipping"
  | "completed"
  | "cancelled";

export interface OrderItem {
  artwork_id: string;
  title: string;
  image: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  order_number: string | null;

  customer: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  address: string | null;

  subtotal: number | null;
  shipping: number | null;
  total: number | null;

  payment_status: string | null;
  status: OrderStatus;

  note: string | null;

  created_at: string;
  updated_at: string;

  payment_reference: string | null;
  flutterwave_charge: string | null;

  transfer_account: string | null;
  transfer_bank: string | null;
  transfer_amount: number | null;
  account_expiration: string | null;

  payment_method: string | null;

  bank_transfer_ref: string | null;
  card_reference: string | null;
  bank_reference: string | null;

  items: OrderItem[];
}

/*
 * Convert the Supabase row into the
 * frontend Order structure.
 *
 * Supabase uses customer_name.
 * Frontend uses customer.
 */
function mapOrder(row: any): Order {
  return {
    id: row.id,

    order_number:
      row.order_number ?? null,

    customer:
      row.customer_name ?? null,

    email:
      row.email ?? null,

    phone:
      row.phone ?? null,

    country:
      row.country ?? null,

    city: row.city ?? null,
        address: row.address ?? null,

    subtotal:
      row.subtotal ?? null,

    shipping:
      row.shipping ?? null,

    total:
      row.total ?? null,

    payment_status:
      row.payment_status ?? null,

    status:
      row.status ?? "pending",

    note:
      row.note ?? null,

    created_at:
      row.created_at,

    updated_at:
      row.updated_at,

    payment_reference:
      row.payment_reference ?? null,

    flutterwave_charge:
      row.flutterwave_charge ?? null,

    transfer_account:
      row.transfer_account ?? null,

    transfer_bank:
      row.transfer_bank ?? null,

    transfer_amount:
      row.transfer_amount ?? null,

    account_expiration:
      row.account_expiration ?? null,

    payment_method:
      row.payment_method ?? null,

    bank_transfer_ref:
      row.bank_transfer_ref ?? null,

    card_reference:
      row.card_reference ?? null,

    bank_reference:
      row.bank_reference ?? null,

    items:
      row.items ?? [],
  };
}

/*
 * GET ALL ORDERS
 */

export async function getOrders(): Promise<Order[]> {
  const { data, error } =
    await supabase
      .from("orders")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    console.error(
      "GET ORDERS ERROR:",
      error,
    );

    throw new Error(
      error.message ||
        "Failed to load orders.",
    );
  }

  return (data ?? []).map(mapOrder);
}

/*
 * GET ONE ORDER
 */

export async function getOrder(
  id: string,
): Promise<Order> {
  const { data, error } =
    await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

  if (error) {
    console.error(
      "GET ORDER ERROR:",
      error,
    );

    throw new Error(
      error.message ||
        "Failed to load order.",
    );
  }

  const { data: items, error: itemsError } =
    await supabase
      .from("order_items")
      .select(
        "artwork_id,title,image,quantity,price",
      )
      .eq("order_id", id);

  if (itemsError) {
    console.error(
      "GET ORDER ITEMS ERROR:",
      itemsError,
    );

    throw new Error(
      itemsError.message ||
        "Failed to load order items.",
    );
  }

  return mapOrder({
    ...data,
    items: (items ?? []).map((item: any) => {
      const quantity = Number(item.quantity ?? 0);
      const unitPrice = Number(item.price ?? 0);

      return {
        artwork_id: item.artwork_id,
        title: item.title ?? "Untitled Artwork",
        image: item.image ?? null,
        quantity,
        unit_price: unitPrice,
        subtotal: unitPrice * quantity,
      };
    }),
  });
}

/*
 * UPDATE ORDER STATUS
 */

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order> {
  const { data, error } =
    await supabase
      .from("orders")
      .update({
        status,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

  if (error) {
    console.error(
      "UPDATE ORDER STATUS ERROR:",
      error,
    );

    throw new Error(
      error.message ||
        "Failed to update order status.",
    );
  }

  return mapOrder(data);
}

/*
 * CANCEL ORDER
 */

export async function cancelOrder(
  id: string,
): Promise<Order> {
  return updateOrderStatus(
    id,
    "cancelled",
  );
}

/*
 * DELETE ORDER
 */

export async function deleteOrder(
  id: string,
): Promise<void> {
  const { error } =
    await supabase
      .from("orders")
      .delete()
      .eq("id", id);

  if (error) {
    console.error(
      "DELETE ORDER ERROR:",
      error,
    );

    throw new Error(
      error.message ||
        "Failed to delete order.",
    );
  }
}
