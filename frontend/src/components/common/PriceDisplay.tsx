import { useCurrency } from "../../contexts/CurrencyContext";

interface PriceDisplayProps {
  amount: number;
  className?: string;
  estimateClassName?: string;
}

export default function PriceDisplay({
  amount,
  className,
  estimateClassName,
}: PriceDisplayProps) {
  const { currency, formatAmount } = useCurrency();

  return (
    <span className={className}>
      <span>{formatAmount(amount, "NGN")}</span>
      {currency === "USD" && (
        <span
          className={estimateClassName ?? "ml-2 text-xs font-normal opacity-70"}
        >
          {formatAmount(amount, "USD") === "Price unavailable"
            ? ""
            : `≈ ${formatAmount(amount, "USD")}`}
        </span>
      )}
    </span>
  );
}
