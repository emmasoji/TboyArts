import API_URL from "../config/api";

import type { CartItem } from "../contexts/CartContext";

const API_BASE_URL =
  API_URL;

export interface CustomerDetails {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
}

export interface CreateOrderResponse {
  order_id: string;
  reference: string;
  amount: number;
  currency: string;
  customer: CustomerDetails;
  items: {
    artwork_id: string;
    title: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[];
  status: string;
  payment_status: string;
  payment_reference: string | null;
}

function getArtworkId(item: CartItem): string {
  return item.id;
}

export async function createOrder(
  customer: CustomerDetails,
  items: CartItem[],
): Promise<CreateOrderResponse> {
  const response = await fetch(`${API_BASE_URL}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer,
      items: items.map((item) => ({
        artwork_id: getArtworkId(item),
        quantity: item.quantity,
      })),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "Unable to create order.",
    );
  }

  return data;
}

export async function initializePayment(
  orderId: string,
  email: string,
  paymentMethod: "card" | "transfer" | "bank" | "ussd",
) {
  const response = await fetch(`${API_BASE_URL}/api/payments/initialize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      order_id: orderId,
      email,
      payment_method: paymentMethod,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "Unable to initialize payment.",
    );
  }

  return data;
}

export async function verifyPayment(reference: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/payments/verify/${encodeURIComponent(reference)}`,
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "Unable to verify payment.",
    );
  }

  return data;
}

export async function getCheckoutOrder(
  orderId: string,
  email: string,
): Promise<CreateOrderResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/orders/${encodeURIComponent(orderId)}/checkout?email=${encodeURIComponent(email)}`,
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "Unable to recover your order.",
    );
  }

  return data;
}

export async function cancelPendingOrder(
  orderId: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/orders/${encodeURIComponent(orderId)}/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "Unable to cancel your order.",
    );
  }
}

