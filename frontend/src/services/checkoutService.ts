import API_URL from "../config/api";

import type { CartItem } from "../contexts/CartContext";
import type { Currency } from "../contexts/CurrencyContext";

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

export interface ShippingCourier {
  courier_id: string;
  courier_name: string;
  service_code: string;
  service_type: string;
  rate_card_amount: number;
  currency: string;
  pickup_eta: string;
  delivery_eta: string;
  tracking_level: string;
}

export interface ShippingQuoteResponse {
  request_token: string;
  couriers: ShippingCourier[];
}

export interface SelectedShipping {
  receiver_address_code: number;
  shipping_courier_id: string;
  shipping_service_code: string;
  shipping_rate_amount: number;
  delivery_instructions?: string;
}

export interface CreateOrderResponse {
  order_id: string;
  reference: string;
  amount: number;
  shipping: number;
  tax: number;
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
  payment_amount?: number;
  payment_currency?: Currency;
  payment_exchange_rate?: number;
}

function getArtworkId(item: CartItem): string {
  return item.id;
}

export async function validateShippingAddress(
  customer: CustomerDetails,
): Promise<{
  address_code: number;
  formatted_address?: string;
  country?: string;
  country_code?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/shipping/validate-address`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: customer.full_name,
      email: customer.email,
      phone: customer.phone,
      address: [customer.address, customer.city, customer.state, customer.country].filter(Boolean).join(", "),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "Unable to validate the delivery address.",
    );
  }
  return data;
}

export async function fetchShippingRates(
  artworkIds: string[],
  receiverAddressCode: number,
  deliveryInstructions = "",
): Promise<ShippingQuoteResponse> {
  const response = await fetch(`${API_BASE_URL}/api/shipping/rates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      artwork_ids: artworkIds,
      receiver_address_code: receiverAddressCode,
      delivery_instructions: deliveryInstructions,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "Unable to fetch shipping rates.",
    );
  }
  return data;
}

export async function createOrder(
  customer: CustomerDetails,
  items: CartItem[],
  shipping: SelectedShipping,
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
      ...shipping,
      payment_currency: "NGN",
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

