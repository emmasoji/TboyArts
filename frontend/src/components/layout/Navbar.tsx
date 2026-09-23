import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Menu,
  X,
  ChevronsRight,
  House,
  ShoppingBag,
  Palette,
  PackageSearch,
} from "lucide-react";

import ThemeToggle from "../common/ThemeToggle";
import { useCurrency } from "../../contexts/CurrencyContext";
import usFlag from "../../assets/flags/us.svg";
import ngFlag from "../../assets/flags/ng.svg";
import { useTheme } from "../../contexts/ThemeContext";
import { useTrackOrder } from "../../contexts/TrackOrderContext";
import { useCart } from "../../contexts/CartContext";

const navigation = [
  {
    label: "Home",
    path: "/",
    icon: House,
  },
  {
    label: "Shop",
    path: "/shop",
    icon: ShoppingBag,
  },
  {
    label: "Artist",
    path: "/artist",
    icon: Palette,
  },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [navbarLoading, setNavbarLoading] = useState(true);
  const getLogoUrl = () =>
    `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/Logo/logo.png`;

  const [logoUrl, setLogoUrl] = useState(getLogoUrl);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNavbarLoading(false);
    }, 450);

    const handleLogoUpdate = () => {
      setLogoUrl(getLogoUrl());
    };

    window.addEventListener(
      "tboyarts-logo-updated",
      handleLogoUpdate,
    );

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(
        "tboyarts-logo-updated",
        handleLogoUpdate,
      );
    };
  }, []);

  const { openTrackOrder } = useTrackOrder();
  const { itemCount, openCart } = useCart();
  const { theme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const light = theme === "light";

  const closeMenu = () => {
    setMenuOpen(false);

    window.setTimeout(() => {
      setMenuVisible(false);
    }, 350);
  };

  const toggleMenu = () => {
    if (menuOpen) {
      closeMenu();
      return;
    }

    setMenuVisible(true);

    window.requestAnimationFrame(() => {
      setMenuOpen(true);
    });
  };

  const handleTrackOrder = () => {
    closeMenu();
    openTrackOrder();
  };

  return (
    <>
      {/* =====================================================
          MAIN NAVBAR
          ===================================================== */}

      <header
        className={[
          "fixed inset-x-0 top-0 z-50",
          "flex h-[70px] items-center justify-between",
          "border-b px-4 sm:px-6 lg:px-8",
          "backdrop-blur-xl",
          "transition-colors duration-300",
          "tboyarts-navbar-drop",
          light
            ? "border-black/10 bg-white/75 text-neutral-950"
            : "border-white/10 bg-black/55 text-white",
        ].join(" ")}
      >
        {navbarLoading && (
          <div className="tboyarts-navbar-skeleton">
            <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2">
                <div className="h-11 w-11 rounded-full bg-black/10 dark:bg-white/10 sm:h-12 sm:w-12" />
                <div className="h-4 w-24 rounded-full bg-black/10 dark:bg-white/10" />
              </div>

              <div className="hidden items-center gap-8 lg:flex">
                <div className="h-3 w-12 rounded-full bg-black/10 dark:bg-white/10" />
                <div className="h-3 w-12 rounded-full bg-black/10 dark:bg-white/10" />
                <div className="h-3 w-14 rounded-full bg-black/10 dark:bg-white/10" />
                <div className="h-3 w-20 rounded-full bg-black/10 dark:bg-white/10" />
              </div>

              <div className="flex items-center gap-4 sm:gap-5">
                <div className="h-10 w-10 rounded-full bg-black/10 dark:bg-white/10" />
                <div className="h-10 w-10 rounded-full bg-black/10 dark:bg-white/10 lg:hidden" />
              </div>
            </div>
          </div>
        )}

        <div
          className={[
            "flex w-full items-center justify-between",
            navbarLoading
              ? "opacity-0"
              : "tboyarts-navbar-content-in opacity-100",
          ].join(" ")}
        >
        {/* Brand */}

        <Link
          to="/"
          onClick={closeMenu}
          aria-label="TboyArts home"
          className="flex shrink-0 items-center gap-2"
        >
          <img
            src={logoUrl}
            alt="TboyArts"
            className="h-11 w-11 object-contain sm:h-12 sm:w-12"
          />

          <span className="font-serif text-lg tracking-tight sm:text-xl">
            TboyArts
          </span>
        </Link>


        {/* =====================================================
            DESKTOP NAVIGATION
            ===================================================== */}

        <nav
          className="hidden items-center gap-8 lg:flex"
          aria-label="Main navigation"
        >
          {navigation.map(({ label, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                [
                  "relative py-2 text-sm font-medium",
                  "transition-colors duration-200",
                  "after:absolute after:bottom-0 after:left-0",
                  "after:h-px after:w-full",
                  "after:origin-left after:transition-transform",
                  isActive
                    ? "after:scale-x-100"
                    : "after:scale-x-0 hover:after:scale-x-100",
                  light
                    ? "text-neutral-600 hover:text-neutral-950 after:bg-neutral-950"
                    : "text-white/60 hover:text-white after:bg-white",
                ].join(" ")
              }
            >
              {label}
            </NavLink>
          ))}

          <button
            type="button"
            onClick={handleTrackOrder}
            className={[
              "relative py-2 text-sm font-medium",
              "transition-colors duration-200",
              "after:absolute after:bottom-0 after:left-0",
              "after:h-px after:w-full after:origin-left",
              "after:scale-x-0 after:transition-transform",
              "hover:after:scale-x-100",
              light
                ? "text-neutral-600 hover:text-neutral-950 after:bg-neutral-950"
                : "text-white/60 hover:text-white after:bg-white",
            ].join(" ")}
          >
            Track Order
          </button>
        </nav>


        {/* =====================================================
            NAVBAR ACTIONS
            ===================================================== */}

        <div className="flex shrink-0 items-center gap-4 sm:gap-5">

          {/* Cart */}

          {/* Desktop appearance + currency */}
          <div className="hidden items-center gap-3 lg:flex">
            <ThemeToggle />

            <div className="relative">
              <button
                type="button"
                onClick={() => setCurrencyOpen((open) => !open)}
                aria-label={`Select currency. Current currency: ${currency}`}
                aria-expanded={currencyOpen}
                className={[
                  "flex h-10 items-center gap-2 rounded-full border px-3",
                  "text-xs font-medium transition-all duration-200",
                  light
                    ? "border-black/10 bg-black/[0.04] text-neutral-900 hover:bg-black/[0.08]"
                    : "border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.10]",
                ].join(" ")}
              >
                <img
                  src={currency === "USD" ? usFlag : ngFlag}
                  alt=""
                  className="h-3.5 w-5 rounded-[2px] object-cover"
                />
                <span>{currency}</span>
              </button>

              {currencyOpen && (
                <div
                  className={[
                    "absolute right-0 top-12 z-[3100] w-24 overflow-hidden rounded-xl border p-1",
                    "shadow-xl backdrop-blur-xl",
                    light
                      ? "border-black/10 bg-white/95"
                      : "border-white/10 bg-neutral-950/95",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setCurrency("USD");
                      setCurrencyOpen(false);
                    }}
                    className={[
                      "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs transition-colors",
                      light
                        ? "hover:bg-black/[0.06]"
                        : "hover:bg-white/[0.08]",
                    ].join(" ")}
                  >
                    <img
                      src={usFlag}
                      alt=""
                      className="h-3.5 w-5 rounded-[2px] object-cover"
                    />
                    <span>USD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrency("NGN");
                      setCurrencyOpen(false);
                    }}
                    className={[
                      "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs transition-colors",
                      light
                        ? "hover:bg-black/[0.06]"
                        : "hover:bg-white/[0.08]",
                    ].join(" ")}
                  >
                    <img
                      src={ngFlag}
                      alt=""
                      className="h-3.5 w-5 rounded-[2px] object-cover"
                    />
                    <span>NGN</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Cart */}
          <button
            type="button"
            onClick={openCart}
            aria-label={`Shopping cart, ${itemCount} ${
              itemCount === 1 ? "item" : "items"
            }`}
            className={[
              "relative flex h-10 w-10 items-center justify-center",
              "rounded-full border",
              "transition-all duration-200",
              "hover:scale-[1.03]",
              light
                ? "border-black/10 bg-black/[0.04] text-neutral-900 hover:bg-black/[0.08]"
                : "border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.12]",
            ].join(" ")}
          >
            <ShoppingBag size={20} strokeWidth={1.8} />

            {itemCount > 0 && (
              <span
                key={itemCount}
                className={[
                  "absolute -right-1 -top-1",
                  "flex min-h-[17px] min-w-[17px] items-center justify-center",
                  "rounded-full px-1",
                  "text-[9px] font-bold leading-none",
                  light
                    ? "bg-neutral-950 text-white"
                    : "bg-white text-neutral-950",
                ].join(" ")}
              >
                {itemCount}
              </span>
            )}
          </button>


          {/* Mobile menu */}

          <button
            type="button"
            onClick={toggleMenu}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className={[
              "flex h-10 w-10 items-center justify-center",
              "rounded-full border",
              "transition-all duration-200",
              "lg:hidden",
              light
                ? "border-black/10 bg-black/[0.06] text-neutral-900 hover:bg-black/[0.11]"
                : "border-white/10 bg-white/[0.08] text-white hover:bg-white/[0.14]",
            ].join(" ")}
          >
            {menuOpen ? (
              <X size={21} strokeWidth={1.9} />
            ) : (
              <Menu size={21} strokeWidth={1.9} />
            )}
          </button>

        </div>
        </div>
      </header>


      {/* =====================================================
          MOBILE SIDE DRAWER
          ===================================================== */}

      {menuVisible && (
        <div
          className={[
            "fixed inset-0 z-[60] lg:hidden",
            "transition-opacity duration-300 ease-out",
            menuOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >

          {/* LEFT 50% — GLASS BACKDROP */}

          <button
            type="button"
            onClick={closeMenu}
            aria-label="Close menu"
            className={[
              "absolute inset-0 right-1/2",
              "bg-black/35 backdrop-blur-md",
              light ? "bg-black/20" : "bg-black/45",
            ].join(" ")}
          />


          {/* RIGHT 50% — SIDEBAR */}

          <aside
            className={[
              "absolute inset-y-0 right-0",
              "flex w-1/2 min-w-[260px] max-w-[420px]",
              "flex-col border-l shadow-2xl",
              "transition-[transform,opacity,background-color,border-color] duration-300 ease-out",
              menuOpen
                ? "translate-x-0 opacity-100"
                : "translate-x-full opacity-0",
              light
                ? "border-black/10 bg-white/95 text-neutral-950"
                : "border-white/10 bg-neutral-950/95 text-white",
            ].join(" ")}
          >

            {/* Sidebar header */}

            <div
  className={[
    "relative flex h-[70px] shrink-0 items-center",
    "transition-all duration-500 ease-out",
    menuOpen
      ? "translate-x-0 opacity-100"
      : "translate-x-10 opacity-0",
    "border-b px-5",
    light ? "border-black/10" : "border-white/10",
  ].join(" ")}
>
  <button
    type="button"
    onClick={closeMenu}
    aria-label="Close menu"
    className={[
      "absolute left-5 flex h-12 w-12 items-center justify-center rounded-full",
      "border shadow-lg transition-all duration-200",
      light
        ? "border-black/10 bg-black/[0.08] text-neutral-950 hover:bg-black/[0.14]"
        : "border-white/10 bg-white/[0.10] text-white hover:bg-white/[0.16]",
    ].join(" ")}
  >
    <ChevronsRight size={30} strokeWidth={1.8} />
  </button>
</div>


            {/* Navigation */}

            <nav
              className={[
                "flex-1 overflow-y-auto px-4 py-6",
                "transition-all duration-500 ease-out delay-75",
                menuOpen
                  ? "translate-x-0 opacity-100"
                  : "translate-x-10 opacity-0",
              ].join(" ")}
              aria-label="Mobile navigation"
            >
              <div className="space-y-1">

                {navigation.map(
                  ({ label, path, icon: Icon }) => (
                    <NavLink
                      key={path}
                      to={path}
                      onClick={closeMenu}
                      className={({ isActive }) =>
                        [
                          "flex items-center gap-3 rounded-xl px-4 py-3.5",
                          "text-sm font-medium",
                          "transition-all duration-200",
                          "hover:translate-x-1",
                          isActive
                            ? light
                              ? "bg-neutral-950 !text-white hover:!text-white"
                              : "bg-white !text-neutral-950 hover:!text-neutral-950"
                            : light
                              ? "text-neutral-600 hover:bg-black/[0.05] hover:text-neutral-950"
                              : "text-white/60 hover:bg-white/[0.06] hover:text-white",
                        ].join(" ")
                      }
                    >
                      <Icon size={19} strokeWidth={1.8} />
                      <span>{label}</span>
                    </NavLink>
                  ),
                )}


                <button
                  type="button"
                  onClick={handleTrackOrder}
                  className={[
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3.5",
                    "text-left text-sm font-medium",
                    "transition-all duration-200",
                    "hover:translate-x-1",
                    light
                      ? "text-neutral-600 hover:bg-black/[0.05] hover:text-neutral-950"
                      : "text-white/60 hover:bg-white/[0.06] hover:text-white",
                  ].join(" ")}
                >
                  <PackageSearch size={19} strokeWidth={1.8} />
                  <span>Track Order</span>
                </button>

              </div>
            </nav>


            {/* Appearance + Currency */}
<div
  className={[
    "relative flex shrink-0 items-center justify-between",
    "transition-all duration-500 ease-out delay-150",
    menuOpen
      ? "translate-x-0 opacity-100"
      : "translate-x-10 opacity-0",
    "border-t px-5 py-5",
    light ? "border-black/10" : "border-white/10",
  ].join(" ")}
>
  <ThemeToggle />

  <div className="relative">
    <button
      type="button"
      onClick={() => setCurrencyOpen((open) => !open)}
      aria-label={`Select currency. Current currency: ${currency}`}
      aria-expanded={currencyOpen}
      className={[
        "flex h-9 items-center gap-2 rounded-full border px-3",
        "text-xs font-medium transition-all duration-200",
        light
          ? "border-black/10 bg-black/[0.04] text-neutral-900 hover:bg-black/[0.08]"
          : "border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.10]",
      ].join(" ")}
    >
      <img
        src={currency === "USD" ? usFlag : ngFlag}
        alt=""
        className="h-3.5 w-5 rounded-[2px] object-cover"
      />
      <span>{currency}</span>
      {currency === "USD" && (
        <span className="text-[9px] opacity-50">
        </span>
      )}
    </button>

    {currencyOpen && (
      <div
        className={[
          "absolute bottom-11 right-0 z-[3100] w-24 overflow-hidden rounded-xl border p-1",
          "shadow-xl backdrop-blur-xl",
          light
            ? "border-black/10 bg-white/95"
            : "border-white/10 bg-neutral-950/95",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => {
            setCurrency("USD");
            setCurrencyOpen(false);
          }}
          className={[
            "flex w-full items-center gap-2 rounded-lg px-2.5 py-2",
            "text-xs transition-colors",
            currency === "USD"
              ? light
                ? "bg-black/[0.06] text-neutral-950"
                : "bg-white/[0.08] text-white"
              : light
                ? "text-neutral-600 hover:bg-black/[0.04]"
                : "text-white/60 hover:bg-white/[0.06]",
          ].join(" ")}
        >
          <img
            src={usFlag}
            alt=""
            className="h-3.5 w-5 rounded-[2px] object-cover"
          />
          <span>USD</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrency("NGN");
            setCurrencyOpen(false);
          }}
          className={[
            "flex w-full items-center gap-2 rounded-lg px-2.5 py-2",
            "text-xs transition-colors",
            currency === "NGN"
              ? light
                ? "bg-black/[0.06] text-neutral-950"
                : "bg-white/[0.08] text-white"
              : light
                ? "text-neutral-600 hover:bg-black/[0.04]"
                : "text-white/60 hover:bg-white/[0.06]",
          ].join(" ")}
        >
          <img
            src={ngFlag}
            alt=""
            className="h-3.5 w-5 rounded-[2px] object-cover"
          />
          <span>NGN</span>
        </button>
      </div>
    )}
  </div>
</div>

</aside>
        </div>
      )}
    </>
  );
}
