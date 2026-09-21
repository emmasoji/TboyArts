;import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCitiesOfState,
  getCountries,
  getStatesOfCountry,
  type ICity,
  type ICountry,
  type IState,
} from "@countrystatecity/countries-browser";
import {
  AsYouType,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";
import { useNavigate } from "react-router-dom";
import SEO from "../components/seo/SEO";
import {
  AlertTriangle,
  ArrowLeftRight,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Loader2,
  Hash,
  MapPin,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";

import { useCart } from "../contexts/CartContext";
import { useCurrency } from "../contexts/CurrencyContext";
import {
  createOrder,
  initializePayment,
  verifyPayment,
  getCheckoutOrder,
  cancelPendingOrder,
  type CustomerDetails,
  type CreateOrderResponse,
} from "../services/checkoutService";

type CheckoutStep = "details" | "preview" | "payment" | "verifying" | "verified";

interface PaidOrder {
  order: CreateOrderResponse;
  paymentReference: string;
}

const PENDING_ORDER_STORAGE_KEY = "tboyarts-pending-checkout-order";





export default function Checkout() {
  const navigate = useNavigate();
  const { items, clearCart } = useCart();
  const { formatPrice } = useCurrency();

  const [step, setStep] = useState<CheckoutStep>("details");

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<"card" | "transfer" | "bank" | "ussd" | null>(null);

  const [customer, setCustomer] = useState<CustomerDetails>({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "Nigeria",
  });

  const [detectedCountryCode, setDetectedCountryCode] =
    useState<CountryCode | null>(null);
  const [countryDetectionLoading, setCountryDetectionLoading] =
    useState(false);

  const [order, setOrder] = useState<CreateOrderResponse | null>(null);
  const [paidOrder, setPaidOrder] = useState<PaidOrder | null>(null);

  const [pendingOrder, setPendingOrder] = useState<{
    orderId: string;
    reference: string;
    email: string;
  } | null>(null);

  const [pendingOrderLoading, setPendingOrderLoading] = useState(false);
  const [pendingOrderDetectionLoading, setPendingOrderDetectionLoading] =
    useState(true);
  const [checkoutInitializing, setCheckoutInitializing] = useState(true);

  useEffect(() => {
    if (!pendingOrderDetectionLoading && !countryDetectionLoading) {
      setCheckoutInitializing(false);
    }
  }, [pendingOrderDetectionLoading, countryDetectionLoading]);

  const [orderCancelledNotice, setOrderCancelledNotice] = useState(false);
  const [orderCancelledFading, setOrderCancelledFading] = useState(false);
  const [orderCancelledCountdown, setOrderCancelledCountdown] = useState(5);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentPreparing, setPaymentPreparing] = useState(false);
  const [error, setError] = useState("");
  const [errorNoticeVisible, setErrorNoticeVisible] = useState(false);
  const [errorNoticeProgress, setErrorNoticeProgress] = useState(100);

  const currentStepHeading = {
    details: { title: "Customer Details" },
    preview: { title: "Preview" },
    payment: { title: "Payment" },
    verifying: { title: "Verifying Payment" },
    verified: { title: "Payment Verified" },
  }[step];

  const [countryOptions, setCountryOptions] = useState<ICountry[]>([]);
  const [stateOptions, setStateOptions] = useState<IState[]>([]);
  const [cityOptions, setCityOptions] = useState<ICity[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);

  const selectedCountry = useMemo(
    () =>
      countryOptions.find(
        (country) => country.name === customer.country,
      ),
    [countryOptions, customer.country],
  );

  const selectedCountryCode =
    selectedCountry?.iso2 as CountryCode | undefined;

  const selectedState = useMemo(
    () =>
      stateOptions.find(
        (state) => state.name === customer.state,
      ),
    [stateOptions, customer.state],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadCountries() {
      setLocationsLoading(true);

      try {
        const countries = await getCountries();

        if (!cancelled) {
          setCountryOptions(countries);
        }
      } catch {
        if (!cancelled) {
          setCountryOptions([]);
        }
      } finally {
        if (!cancelled) {
          setLocationsLoading(false);
        }
      }
    }

    void loadCountries();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadStates() {
      if (!selectedCountry) {
        setStateOptions([]);
        setCityOptions([]);
        return;
      }

      setStatesLoading(true);
      setStateOptions([]);
      setCityOptions([]);

      try {
        const states = await getStatesOfCountry(
          selectedCountry.iso2,
        );

        if (!cancelled) {
          setStateOptions(states);
        }
      } catch {
        if (!cancelled) {
          setStateOptions([]);
        }
      } finally {
        if (!cancelled) {
          setStatesLoading(false);
        }
      }
    }

    void loadStates();

    return () => {
      cancelled = true;
    };
  }, [selectedCountry]);

  useEffect(() => {
    let cancelled = false;

    async function loadCities() {
      if (!selectedCountry || !selectedState) {
        setCityOptions([]);
        return;
      }

      setCitiesLoading(true);
      setCityOptions([]);

      try {
        const cities = await getCitiesOfState(
          selectedCountry.iso2,
          selectedState.iso2,
        );

        if (!cancelled) {
          setCityOptions(cities);
        }
      } catch {
        if (!cancelled) {
          setCityOptions([]);
        }
      } finally {
        if (!cancelled) {
          setCitiesLoading(false);
        }
      }
    }

    void loadCities();

    return () => {
      cancelled = true;
    };
  }, [selectedCountry, selectedState]);

  const phoneCountryCode =
    selectedCountryCode ?? detectedCountryCode ?? "NG";

  const phoneCallingCode = useMemo(() => {
    try {
      return `+${getCountryCallingCode(phoneCountryCode)}`;
    } catch {
      return "";
    }
  }, [phoneCountryCode]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    if (!error) {
      setErrorNoticeVisible(false);
      setErrorNoticeProgress(100);
      return;
    }

    setErrorNoticeVisible(true);
    setErrorNoticeProgress(100);

    const duration = 5000;
    const startedAt = Date.now();

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);

      setErrorNoticeProgress(remaining);

      if (remaining <= 0) {
        window.clearInterval(timer);
        setErrorNoticeVisible(false);
      }
    }, 50);

    return () => {
      window.clearInterval(timer);
    };
  }, [error]);

  useEffect(() => {
    let cancelled = false;

    async function detectCountry() {
      if (customer.country !== "Nigeria") {
        return;
      }

      setCountryDetectionLoading(true);

      try {
        const response = await fetch(
          "https://ipapi.co/json/",
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const code = String(data?.country_code || "").toUpperCase();

        const detected = countryOptions.find(
          (country) => country.iso2 === code,
        );

        if (
          !cancelled &&
          detected &&
          detected.iso2 !== "NG"
        ) {
          setDetectedCountryCode(
            detected.iso2 as CountryCode,
          );
        }
      } catch {
        // Country detection is only a convenience.
      } finally {
        if (!cancelled) {
          setCountryDetectionLoading(false);
        }
      }
    }

    void detectCountry();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function detectPendingOrder() {
      try {
        const stored = localStorage.getItem(
          PENDING_ORDER_STORAGE_KEY,
        );

        if (!stored) {
          if (items.length === 0 && !paidOrder) {
            navigate("/shop", { replace: true });
          }
          return;
        }

        const parsed = JSON.parse(stored);

        if (
          !parsed ||
          typeof parsed.orderId !== "string" ||
          typeof parsed.email !== "string"
        ) {
          localStorage.removeItem(
            PENDING_ORDER_STORAGE_KEY,
          );

          if (items.length === 0 && !paidOrder) {
            navigate("/shop", { replace: true });
          }

          return;
        }

        const recovered = await getCheckoutOrder(
          parsed.orderId,
          parsed.email,
        );

        if (cancelled) {
          return;
        }

        setPendingOrder({
          orderId: recovered.order_id,
          reference: recovered.reference,
          email: recovered.customer.email,
        });
      } catch (error) {
        console.error(
          "Pending order detection failed:",
          error,
        );

        localStorage.removeItem(
          PENDING_ORDER_STORAGE_KEY,
        );

        if (!cancelled && items.length === 0 && !paidOrder) {
          navigate("/shop", { replace: true });
        }
      } finally {
        if (!cancelled) {
          setPendingOrderDetectionLoading(false);
        }
      }
    }

    void detectPendingOrder();

    return () => {
      cancelled = true;
      setPendingOrderDetectionLoading(false);
    };
  }, [navigate, paidOrder, items.length]);

  useEffect(() => {
    if (!orderCancelledNotice) {
      return;
    }

    setOrderCancelledCountdown(5);
    setOrderCancelledFading(false);

    const countdown = window.setInterval(() => {
      setOrderCancelledCountdown((previous) => {
        if (previous <= 1) {
          window.clearInterval(countdown);
          setOrderCancelledFading(true);

          window.setTimeout(() => {
            setOrderCancelledNotice(false);
            setOrderCancelledFading(false);
          }, 700);

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(countdown);
    };
  }, [orderCancelledNotice]);

  async function handleContinuePendingOrder() {
    if (!pendingOrder) {
      return;
    }

    setPendingOrderLoading(true);
    setError("");

    try {
      const recovered = await getCheckoutOrder(
        pendingOrder.orderId,
        pendingOrder.email,
      );

      setOrder(recovered);
      setCustomer(recovered.customer);
      setSelectedPaymentMethod(null);
      setPendingOrder(null);

      if (
        recovered.payment_status === "paid" &&
        recovered.payment_reference
      ) {
        const verified = await verifyPayment(
          recovered.payment_reference,
        );

        if (verified.success) {
          setPaidOrder({
            order: recovered,
            paymentReference: verified.reference,
          });

          clearCart();

          localStorage.removeItem(
            PENDING_ORDER_STORAGE_KEY,
          );

          setStep("verified");
          return;
        }

        throw new Error(
          "This payment could not be verified. Please try again.",
        );
      }

      setStep("payment");
    } catch (error) {
      console.error(
        "Pending order recovery failed:",
        error,
      );

      localStorage.removeItem(
        PENDING_ORDER_STORAGE_KEY,
      );

      clearCart();
      setPendingOrder(null);
      setOrder(null);

      setError(
        error instanceof Error
          ? error.message
          : "This pending order could not be recovered.",
      );
    } finally {
      setPendingOrderLoading(false);
    }
  }

  async function handleCancelPendingOrder() {
    if (!pendingOrder) {
      return;
    }

    setPendingOrderLoading(true);
    setError("");

    try {
      await cancelPendingOrder(
        pendingOrder.orderId,
      );

      localStorage.removeItem(
        PENDING_ORDER_STORAGE_KEY,
      );

      clearCart();

      setPendingOrder(null);
      setOrder(null);

      setOrderCancelledNotice(true);

      navigate("/shop", { replace: true });
    } catch (error) {
      console.error(
        "Failed to cancel pending order:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to cancel the pending order.",
      );
    } finally {
      setPendingOrderLoading(false);
    }
  }

  function updateCustomer(
    field: keyof CustomerDetails,
    value: string,
  ) {
    setCustomer((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleCountryChange(countryName: string) {
    const country = countryOptions.find(
      (item) => item.name === countryName,
    );

    setCustomer((previous) => ({
      ...previous,
      country: countryName,
      state: "",
      city: "",
      phone: "",
    }));

    if (country) {
      setDetectedCountryCode(
        country.iso2 as CountryCode,
      );
    }
  }

  function handleStateChange(stateName: string) {
    setCustomer((previous) => ({
      ...previous,
      state: stateName,
      city: "",
    }));
  }

  function handlePhoneChange(value: string) {
    const formatter = new AsYouType(phoneCountryCode);
    const formatted = formatter.input(value);

    setCustomer((previous) => ({
      ...previous,
      phone: formatted,
    }));
  }

  function validateCustomer() {
    if (!customer.full_name.trim()) {
      return "Please enter your full name.";
    }

    if (!customer.email.trim()) {
      return "Please enter your email address.";
    }

    if (!customer.country.trim()) {
      return "Please select your country.";
    }

    if (!customer.phone.trim()) {
      return "Please enter your phone number.";
    }

    try {
      const parsedPhone = parsePhoneNumberFromString(
        customer.phone,
        phoneCountryCode,
      );

      if (
        !parsedPhone ||
        !isValidPhoneNumber(customer.phone, phoneCountryCode)
      ) {
        return `Please enter a valid phone number for ${customer.country}.`;
      }
    } catch {
      return "Please enter a valid phone number.";
    }

    if (!customer.state.trim()) {
      return "Please select your state or region.";
    }

    if (!customer.city.trim()) {
      return "Please select your city.";
    }

    if (!customer.address.trim()) {
      return "Please enter your delivery address.";
    }

    if (!customer.city.trim()) {
      return "Please enter your city.";
    }

    return "";
  }

  async function handleDetailsSubmit() {
    const validationError = validateCustomer();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setStep("preview");
  }

  async function handlePayment(paymentOrder = order) {
    if (!paymentOrder) {
      setError("Order information is missing. Please try again.");
      return;
    }

    if (!selectedPaymentMethod) {
      setError("Please select a payment method.");
      return;
    }

    setPaymentPreparing(true);
    setPaymentLoading(true);
    setError("");

    try {
      const payment = await initializePayment(
        paymentOrder.order_id,
        customer.email,
        selectedPaymentMethod,
      );

      if (!payment.access_code) {
        throw new Error(
          "Paystack did not return a payment access code.",
        );
      }

      const { default: PaystackPop } =
        await import("@paystack/inline-js");

      const paystack = new PaystackPop();

      let verificationStarted = false;
      let verificationTimer: ReturnType<typeof setInterval> | null =
        null;

      const stopVerification = () => {
        if (verificationTimer) {
          clearInterval(verificationTimer);
          verificationTimer = null;
        }
      };

      const verify = async () => {
        if (verificationStarted) {
          return;
        }

        verificationStarted = true;

        try {
          const result = await verifyPayment(payment.reference);

          if (result.success) {
            stopVerification();

            setPaidOrder({
              order: paymentOrder,
              paymentReference: result.reference,
            });

            clearCart();

            localStorage.removeItem(
              PENDING_ORDER_STORAGE_KEY,
            );

            setStep("verified");
            setPaymentLoading(false);
          } else {
            verificationStarted = false;
          }
        } catch {
          verificationStarted = false;
        }
      };

      const startVerificationPolling = () => {
        if (verificationTimer) {
          return;
        }

        verificationTimer = setInterval(() => {
          void verify();
        }, 3000);

        window.setTimeout(() => {
          stopVerification();

          if (verificationStarted === false) {
            setPaymentLoading(false);
            setStep("payment");
            setError(
              "We could not confirm the payment yet. If you completed the payment, please wait a moment and try again.",
            );
          }
        }, 120000);
      };

      /*
       * Our TboyArts processing screen is shown while the real
       * Paystack initialization request is running.
       *
       * Once we have the access code, remove our screen immediately
       * and hand control to Paystack.
       */
      setPaymentPreparing(false);

      paystack.resumeTransaction(
        payment.access_code,
        {
          onSuccess: () => {
            setStep("verifying");
            void verify();
          },
          onCancel: () => {
            stopVerification();

            void cancelPendingOrder(
              paymentOrder.order_id,
            ).catch((error) => {
              console.error(
                "Failed to cancel pending order:",
                error,
              );
            });

            localStorage.removeItem(
              PENDING_ORDER_STORAGE_KEY,
            );

            setPaymentLoading(false);
            setError(
              "Payment was cancelled. You can try again.",
            );
          },
        },
      );

      startVerificationPolling();
    } catch (err) {
      setPaymentPreparing(false);
      setPaymentLoading(false);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start payment.",
      );
    }
  }

  if (checkoutInitializing || pendingOrderDetectionLoading) {
    return (
      <>
        <SEO
          title="Checkout — TboyArts"
          description="Preparing your TboyArts checkout."
          noIndex
        />

        <main className="fixed inset-0 z-[10000] flex min-h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
          <div className="flex flex-col items-center justify-center">
            <Loader2
              size={28}
              className="mb-5 animate-spin opacity-60"
            />
            <p className="text-sm opacity-70">
              Please wait a moment
            </p>
          </div>
        </main>
      </>
    );
  }

  if (step === "verifying") {
    return (
      <>
        <SEO
          title="Verifying Payment — TboyArts"
          description="Your TboyArts payment is being securely verified."
          noIndex
        />
        <TboyArtsProcessing
        title="Verifying Payment"
        message="Your payment has been received. Please wait while we securely confirm your payment."
        detail="Confirming your payment..."
      />
    </>
    );
  }

  if (step === "verified" && paidOrder) {
    return (
      <main className="min-h-screen tboyarts-slide-in-left bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl bg-[var(--bg-secondary)] p-8 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white shadow-lg">
                <Check size={36} strokeWidth={3} />
              </div>
            </div>

            <h1 className="text-3xl font-semibold">
              Payment Verified
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm opacity-70">
              Your payment has been successfully verified and your
              order has been received.
            </p>

            <div className="mt-8 rounded-2xl bg-[var(--bg-primary)] p-5 text-left">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-50">
                    Order
                  </p>
                  <p className="mt-1 font-medium">
                    {paidOrder.order.reference}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest opacity-50">
                    Paid
                  </p>
                  <p className="mt-1 font-semibold text-green-600">
                    {formatPrice(paidOrder.order.amount)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-left">
              {paidOrder.order.items.map((item) => (
                <div
                  key={item.artwork_id}
                  className="flex items-center justify-between rounded-xl bg-[var(--bg-primary)] p-4"
                >
                  <div>
                    <p className="font-medium">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm opacity-60">
                      Quantity: {item.quantity}
                    </p>
                  </div>

                  <p className="font-medium">
                    {formatPrice(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-[var(--bg-primary)] p-5 text-left">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="opacity-60">Subtotal</span>
                  <span>
                    {formatPrice(
                      paidOrder.order.items.reduce(
                        (sum, item) => sum + item.subtotal,
                        0,
                      ),
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="opacity-60">Shipping</span>
                  <span>
                    {paidOrder.order.shipping > 0
                      ? formatPrice(paidOrder.order.shipping)
                      : "Free"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="opacity-60">Tax</span>
                  <span>{formatPrice(paidOrder.order.tax)}</span>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-4 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(paidOrder.order.amount)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/shop")}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--text-primary)] px-7 py-3 text-sm font-medium text-[var(--bg-primary)] transition hover:opacity-90"
            >
              Continue Shopping
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <SEO
        title="Checkout — TboyArts"
        description="Complete your TboyArts artwork order securely."
        noIndex
      />

      {paymentPreparing && (
        <TboyArtsProcessing
          title="Preparing payment environment"
          message="Please wait while we securely prepare your payment."
          detail="Connecting to secure payment..."
        />
      )}

      {pendingOrder && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl md:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)]">
              <ShoppingBag size={23} />
            </div>

            <div className="mt-6 text-center">
              <h2 className="text-2xl font-semibold">
                You have a pending order
              </h2>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 opacity-60">
                We found an order from your previous checkout
                that is still waiting for payment.
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-[var(--bg-primary)] p-4">
              <p className="text-xs uppercase tracking-widest opacity-40">
                Pending Order
              </p>

              <p className="mt-1 text-sm font-medium">
                Order #{pendingOrder.reference}
              </p>

              <p className="mt-1 break-all text-xs opacity-50">
                {pendingOrder.email}
              </p>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={pendingOrderLoading}
                onClick={handleCancelPendingOrder}
                className="inline-flex items-center justify-center rounded-full border border-[var(--border-color)] px-5 py-3 text-sm font-medium transition hover:bg-[var(--text-primary)]/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pendingOrderLoading
                  ? "Please wait..."
                  : "Cancel Order"}
              </button>

              <button
                type="button"
                disabled={pendingOrderLoading}
                onClick={handleContinuePendingOrder}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--text-primary)] px-5 py-3 text-sm font-medium text-[var(--bg-primary)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pendingOrderLoading ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Loading...
                  </>
                ) : (
                  <>
                    Continue Payment
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {orderCancelledNotice && (
        <div
          className={[
            "fixed left-1/2 top-5 z-[9999] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 shadow-xl transition-all duration-700",
            orderCancelledFading
              ? "translate-y-[-10px] opacity-0"
              : "translate-y-0 opacity-100",
          ].join(" ")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600">
              <Check size={16} strokeWidth={2.5} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                Order cancelled
              </p>

              <p className="mt-0.5 text-xs opacity-50">
                Your pending order has been cancelled.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setOrderCancelledFading(true);

                window.setTimeout(() => {
                  setOrderCancelledNotice(false);
                  setOrderCancelledFading(false);
                }, 700);
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full opacity-50 transition hover:bg-[var(--text-primary)]/[0.06] hover:opacity-100"
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-[var(--text-primary)]/[0.08]">
            <div
              className="h-full origin-left rounded-full bg-[var(--text-primary)] transition-all duration-1000 ease-linear"
              style={{
                width: `${(orderCancelledCountdown / 5) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

        <main className="min-h-screen w-full tboyarts-slide-in-left bg-[var(--bg-primary)] text-[var(--text-primary)]">
          <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 md:px-6 md:py-8">
            <div className="sticky top-0 z-40 -mx-4 mb-8 border-b border-[var(--border-color)] bg-[var(--background)] px-4 py-3 md:-mx-6 md:px-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (step === "details") {
                      navigate("/shop");
                      return;
                    }

                    if (step === "preview") {
                      setStep("details");
                      return;
                    }

                    if (step === "payment") {
                      setStep("preview");
                      return;
                    }

                    setStep("payment");
                  }}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] transition hover:bg-[var(--text-primary)]/[0.06]"
                  aria-label={step === "details" ? "Back to Shop" : "Go back"}
                  title={step === "details" ? "Back to Shop" : "Back"}
                >
                  <ChevronLeft size={19} />
                </button>

                <h1 className="text-xl font-semibold tracking-tight">
                  {currentStepHeading.title}
                </h1>
              </div>
            </div>

            {error && errorNoticeVisible && (
              <div
                role="alert"
                className="checkout-error-toast fixed right-4 top-24 z-[100] w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]"
                style={{
                  opacity: errorNoticeProgress / 100,
                }}
              >
                <div className="flex items-start gap-3 px-4 py-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)]">
                    <AlertTriangle
                      size={18}
                      strokeWidth={1.8}
                      className="text-[var(--text)]"
                    />
                  </div>

                  <p className="min-w-0 flex-1 pt-1 text-sm leading-6 text-[var(--text)]">
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setErrorNoticeVisible(false)
                    }
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
                    aria-label="Close error message"
                    title="Close"
                  >
                    <X
                      size={17}
                      strokeWidth={1.8}
                    />
                  </button>
                </div>

                <div
                  className="h-[2px] origin-left bg-[var(--border-strong)]"
                  style={{
                    transform: `scaleX(${
                      errorNoticeProgress / 100
                    })`,
                  }}
                />
              </div>
            )}
        {step === "details" && (
          <section className="tboyarts-slide-in-left w-full">
            <div className="w-full bg-[var(--bg-secondary)] p-6 md:p-8">
              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Full Name"
                  value={customer.full_name}
                  onChange={(value) =>
                    updateCustomer("full_name", value)
                  }
                  placeholder="Your full name"
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={customer.email}
                  onChange={(value) =>
                    updateCustomer("email", value)
                  }
                  placeholder="you@example.com"
                />

                <SearchableSelectField
                  label="Country"
                  value={customer.country}
                  onChange={handleCountryChange}
                  options={countryOptions.map(
                    (country) => country.name,
                  )}
                  placeholder="Select your country"
                  loading={locationsLoading}
                />

                <div>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">
                      Phone Number
                    </span>

                    <div className="relative">
                      <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={customer.phone}
                        onChange={(event) =>
                          handlePhoneChange(
                            event.target.value,
                          )
                        }
                        placeholder={
                          phoneCallingCode
                            ? `${phoneCallingCode} phone number`
                            : "Your phone number"
                        }
                        className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm outline-none transition focus:border-[var(--text-primary)]"
                      />
                    </div>
                  </label>

                  {countryDetectionLoading && (
                    <p className="mt-2 text-xs opacity-45">
                      Detecting your country...
                    </p>
                  )}

                  {!countryDetectionLoading &&
                    detectedCountryCode &&
                    customer.country === "Nigeria" &&
                    detectedCountryCode !== "NG" && (
                      <button
                        type="button"
                        onClick={() => {
                          const detected = countryOptions.find(
                            (country) =>
                              country.iso2 ===
                              detectedCountryCode,
                          );

                          if (detected) {
                            handleCountryChange(
                              detected.name,
                            );
                          }
                        }}
                        className="mt-2 text-left text-xs opacity-60 transition hover:opacity-100"
                      >
                        Detected country:{" "}
                        <span className="font-medium">
                          {countryOptions.find(
                            (country) =>
                              country.iso2 ===
                              detectedCountryCode,
                          )?.name}
                        </span>
                        {" — "}
                        use this?
                      </button>
                    )}
                </div>

                <SearchableSelectField
                  label={
                    selectedCountryCode === "US" ||
                    selectedCountryCode === "CA"
                      ? "State / Province"
                      : "State / Region"
                  }
                  value={customer.state}
                  onChange={handleStateChange}
                  options={stateOptions.map(
                    (state) => state.name,
                  )}
                  placeholder={
                    selectedCountry
                      ? "Select state or region"
                      : "Select a country first"
                  }
                  disabled={!selectedCountry}
                  loading={statesLoading}
                />

                <SearchableSelectField
                  label="City"
                  value={customer.city}
                  onChange={(value) =>
                    updateCustomer("city", value)
                  }
                  options={cityOptions.map(
                    (city) => city.name,
                  )}
                  placeholder={
                    selectedState
                      ? "Select city"
                      : "Select a state or region first"
                  }
                  disabled={!selectedState}
                  loading={citiesLoading}
                />

                <div className="md:col-span-2">
                  <Input
                    label="Street Address"
                    value={customer.address}
                    onChange={(value) =>
                      updateCustomer("address", value)
                    }
                    placeholder="House number, street name, apartment, etc."
                    autoComplete="street-address"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={handleDetailsSubmit}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--text-primary)] px-7 py-3.5 text-sm font-medium text-[var(--bg-primary)] shadow-lg transition hover:scale-[1.02] hover:opacity-90"
                >
                  Continue to Preview
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>

          </section>
        )}

        {step === "preview" && (
          <section className="tboyarts-slide-in-left w-full">
            <div className="w-full space-y-6">
              <div className="rounded-3xl bg-[var(--bg-secondary)] p-6 md:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <MapPin size={20} />
                  <h2 className="text-xl font-semibold">
                    Delivery Information
                  </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 text-sm">
                  <Info label="Name" value={customer.full_name} />
                  <Info label="Email" value={customer.email} />
                  <Info label="Phone" value={customer.phone} />
                  <Info label="Country" value={customer.country} />
                  <Info
                    label="Address"
                    value={customer.address}
                  />

                  <Info
                    label="City"
                    value={customer.city || "Not provided"}
                  />
                  <Info
                    label="State"
                    value={customer.state || "Not provided"}
                  />
                </div>
              </div>

              <div className="rounded-3xl bg-[var(--bg-secondary)] p-6 md:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <ShoppingBag size={20} />
                  <h2 className="text-xl font-semibold">
                    Your Artwork
                  </h2>
                </div>

                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 rounded-2xl border border-[var(--border-color)] p-4"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
            decoding="async"
                        className="h-20 w-20 rounded-xl object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {item.title}
                        </p>

                        <p className="mt-1 text-sm opacity-60">
                          Quantity: {item.quantity}
                        </p>

                        <p className="mt-2 font-medium">
                          {formatPrice(
                            Number(item.price) * item.quantity,
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-[var(--border-color)] pt-5">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="opacity-60">Subtotal</span>
                      <span>
                        {formatPrice(
                          items.reduce(
                            (sum, item) =>
                              sum + Number(item.price) * item.quantity,
                            0,
                          ),
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="opacity-60">Shipping</span>
                      <span>
                        {(() => {
                          const shipping = items.reduce(
                            (sum, item) =>
                              sum + Number(item.shipping_fee || 0),
                            0,
                          );

                          return shipping > 0
                            ? formatPrice(shipping)
                            : "Free";
                        })()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="opacity-60">Tax</span>
                      <span>{formatPrice(0)}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-4 text-base font-semibold">
                      <span>Total</span>
                      <span>
                        {formatPrice(
                          items.reduce(
                            (sum, item) =>
                              sum +
                              Number(item.price) * item.quantity +
                              Number(item.shipping_fee || 0),
                            0,
                          ),
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep("payment")}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--text-primary)] px-7 py-3.5 text-sm font-medium text-[var(--bg-primary)] shadow-lg transition hover:scale-[1.02] hover:opacity-90"
                >
                  Select Payment Method
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </section>
        )}

        {step === "payment" && (
          <section className="tboyarts-slide-in-left w-full">
            <div className="mx-auto w-full max-w-4xl">
              <div className="mb-10">

                <h2 className="text-2xl font-semibold md:text-3xl">
                  Choose Payment Method
                </h2>

                <p className="mt-2 max-w-lg text-sm leading-6 opacity-60">
                  Select your preferred way to pay for your artwork.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    id: "card" as const,
                    title: "Card",
                    description: "Pay securely with your debit or credit card.",
                    icon: CreditCard,
                  },
                  {
                    id: "transfer" as const,
                    title: "Bank Transfer",
                    description: "Make a direct bank transfer to complete your order.",
                    icon: ArrowLeftRight,
                  },
                  {
                    id: "bank" as const,
                    title: "Bank",
                    description: "Pay directly from your bank account.",
                    icon: Building2,
                  },
                  {
                    id: "ussd" as const,
                    title: "USSD",
                    description: "Use your bank's USSD code to make payment.",
                    icon: Hash,
                  },
                ].map((method) => {
                  const Icon = method.icon;
                  const selected = selectedPaymentMethod === method.id;

                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={[
                        "group flex min-h-[108px] w-full items-start gap-4 rounded-3xl border p-4 text-left transition",
                        selected
                          ? "border-[var(--text-primary)] bg-[var(--text-primary)]/[0.06] shadow-md"
                          : "border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--text-primary)]/40 hover:bg-[var(--text-primary)]/[0.03]",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition",
                          selected
                            ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)]"
                            : "border-[var(--border-color)]",
                        ].join(" ")}
                      >
                        <Icon size={20} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-medium">
                            {method.title}
                          </h3>

                          <div
                            className={[
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                              selected
                                ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)]"
                                : "border-[var(--border-color)]",
                            ].join(" ")}
                          >
                            {selected && <Check size={12} />}
                          </div>
                        </div>

                        <p className="mt-2 text-sm leading-6 opacity-55">
                          {method.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  type="button"
                  disabled={
                    !selectedPaymentMethod ||
                    loading ||
                    paymentLoading ||
                    paymentPreparing
                  }
                  onClick={async () => {
                    if (!selectedPaymentMethod) {
                      return;
                    }

                    /*
                     * Show the TboyArts processing experience immediately.
                     * Yield one browser frame so the animation is painted
                     * before any network request begins.
                     */
                    setPaymentPreparing(true);
                    setError("");

                    await new Promise<void>((resolve) => {
                      window.requestAnimationFrame(() => resolve());
                    });

                    if (!order) {
                      setLoading(true);

                      try {
                        const createdOrder = await createOrder(
                          customer,
                          items,
                        );

                        setOrder(createdOrder);

                        localStorage.setItem(
                          PENDING_ORDER_STORAGE_KEY,
                          JSON.stringify({
                            orderId: createdOrder.order_id,
                            email: createdOrder.customer.email,
                          }),
                        );

                        setStep("payment");
                        setLoading(false);

                        await handlePayment(createdOrder);
                      } catch (err) {
                        setPaymentPreparing(false);
                        setError(
                          err instanceof Error
                            ? err.message
                            : "Unable to create your order.",
                        );
                        setLoading(false);
                      }

                      return;
                    }

                    await handlePayment();
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--text-primary)] px-7 py-3.5 text-sm font-medium text-[var(--bg-primary)] shadow-lg transition hover:scale-[1.02] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                >
                  <>
                    Continue
                    <ChevronRight size={17} />
                  </>
                </button>
              </div>
            </div>
          </section>
        )}

      </div>
      </main>
    </>
  );
}

function TboyArtsProcessing({
  title,
  message,
  detail,
}: {
  title: string;
  message: string;
  detail: string;
}) {
  return (
    <main className="fixed inset-0 z-[10000] flex min-h-screen items-center justify-center overflow-hidden bg-black/70 px-4 py-8 text-white backdrop-blur-2xl">
      <style>
        {`
          @keyframes tboyarts-icon-boom {
            0% {
              transform: scale(0.72);
              opacity: 0.4;
              filter:
                grayscale(1)
                brightness(0.7)
                contrast(1.4);
            }

            30% {
              transform: scale(1.1);
              opacity: 1;
              filter:
                grayscale(1)
                brightness(2)
                contrast(1.7);
            }

            50% {
              transform: scale(1);
              opacity: 0.92;
              filter:
                grayscale(1)
                brightness(1.6)
                contrast(1.6);
            }

            100% {
              transform: scale(0.72);
              opacity: 0.4;
              filter:
                grayscale(1)
                brightness(0.7)
                contrast(1.4);
            }
          }

          @keyframes tboyarts-glow {
            0% {
              transform: scale(0.7);
              opacity: 0;
            }

            30% {
              opacity: 0.3;
            }

            100% {
              transform: scale(1.7);
              opacity: 0;
            }
          }

          @keyframes tboyarts-glow-two {
            0% {
              transform: scale(0.7);
              opacity: 0;
            }

            25% {
              opacity: 0.16;
            }

            100% {
              transform: scale(2);
              opacity: 0;
            }
          }

          @keyframes tboyarts-processing-dots {
            0%, 20% {
              opacity: 0.2;
            }

            50% {
              opacity: 1;
            }

            80%, 100% {
              opacity: 0.2;
            }
          }

          .tboyarts-icon-boom {
            animation: tboyarts-icon-boom 2.1s ease-in-out infinite;
          }

          .tboyarts-glow {
            animation: tboyarts-glow 2.1s ease-out infinite;
          }

          .tboyarts-glow-two {
            animation: tboyarts-glow-two 2.1s ease-out infinite 0.45s;
          }

          .tboyarts-processing-dot {
            animation: tboyarts-processing-dots 1.4s ease-in-out infinite;
          }

          .tboyarts-processing-dot:nth-child(2) {
            animation-delay: 0.2s;
          }

          .tboyarts-processing-dot:nth-child(3) {
            animation-delay: 0.4s;
          }
        `}
      </style>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.035] via-transparent to-black/20" />

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <div className="relative mb-9 flex h-36 w-36 items-center justify-center">
          <img
            src="https://qmnamuyhuenialuhbycf.supabase.co/storage/v1/object/public/Logo/logo.png"
            alt="TboyArts"
            className="tboyarts-icon-boom relative z-10 h-24 w-24 object-contain"
          />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/60 md:text-base">
          {message}
        </p>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-white/45">
          <span>{detail}</span>

          <span className="flex items-center gap-1">
            <span className="tboyarts-processing-dot">.</span>
            <span className="tboyarts-processing-dot">.</span>
            <span className="tboyarts-processing-dot">.</span>
          </span>
        </div>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm outline-none transition focus:border-[var(--text-primary)]"
      />
    </label>
  );
}

function SearchableSelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  loading = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }

    const handleOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
        setSearch("");
      }
    };

    document.addEventListener(
      "pointerdown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick,
      );
    };
  }, [open]);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return options;
    }

    return options.filter((option) =>
      option.toLowerCase().includes(query),
    );
  }, [options, search]);

  function handleSelect(option: string) {
    onChange(option);
    setOpen(false);
    setSearch("");
  }

  return (
    <div
      ref={dropdownRef}
      className="relative"
    >
      <span className="mb-2 block text-sm font-medium">
        {label}
      </span>

      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => {
          if (!disabled && !loading) {
            setOpen((previous) => !previous);
          }
        }}
        className="flex w-full items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-left text-sm outline-none transition hover:border-[var(--text-primary)] focus:border-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-45"
      >
        <span className={value ? "" : "opacity-45"}>
          {loading
            ? "Loading..."
            : value || placeholder}
        </span>

        <ChevronDown
          size={17}
          strokeWidth={1.8}
          className={`shrink-0 opacity-50 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] shadow-2xl">
          <div className="border-b border-[var(--border-color)] p-3">
            <div className="relative">
              <Search
                size={16}
                strokeWidth={1.8}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-45"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                onClick={(event) =>
                  event.stopPropagation()
                }
                autoFocus
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[var(--text-primary)]"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-1.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-[var(--bg-secondary)] ${
                    option === value
                      ? "font-medium"
                      : ""
                  }`}
                >
                  <span className="truncate">
                    {option}
                  </span>

                  {option === value && (
                    <Check
                      size={16}
                      strokeWidth={2}
                      className="ml-auto shrink-0 opacity-60"
                    />
                  )}
                </button>
              ))
            ) : (
              <p className="px-3 py-4 text-center text-sm opacity-45">
                No results found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider opacity-40">
        {label}
      </p>
      <p className="mt-1 break-words">{value}</p>
    </div>
  );
}
