import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

interface CartAnimationDetail {
  image: string;
  startX: number;
  startY: number;
  width: number;
  height: number;
}

interface FlightStyle extends CSSProperties {
  "--cart-x"?: string;
  "--cart-y"?: string;
}

export default function AddToCartAnimation() {
  const [animation, setAnimation] =
    useState<CartAnimationDetail | null>(null);

  useEffect(() => {
    let timer: number | undefined;

    const handleAddToCart = (event: Event) => {
      const customEvent =
        event as CustomEvent<CartAnimationDetail>;

      if (timer) {
        window.clearTimeout(timer);
      }

      setAnimation(customEvent.detail);

      timer = window.setTimeout(() => {
        setAnimation(null);
      }, 750);
    };

    window.addEventListener(
      "tboyarts:add-to-cart",
      handleAddToCart,
    );

    return () => {
      window.removeEventListener(
        "tboyarts:add-to-cart",
        handleAddToCart,
      );

      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  if (!animation) {
    return null;
  }

  const cart = document.querySelector(
    "[data-tboyarts-cart-target]",
  );

  if (!cart) {
    return null;
  }

  const rect = cart.getBoundingClientRect();

  const endX = rect.left + rect.width / 2;
  const endY = rect.top + rect.height / 2;

  const deltaX = endX - animation.startX;
  const deltaY = endY - animation.startY;

  const style: FlightStyle = {
    left: `${animation.startX - animation.width / 2}px`,
    top: `${animation.startY - animation.height / 2}px`,
    width: `${animation.width}px`,
    height: `${animation.height}px`,
    "--cart-x": `${deltaX}px`,
    "--cart-y": `${deltaY}px`,
  };

  return (
    <div
      className="tboyarts-add-to-cart-flight"
      style={style}
    >
      <img
        src={animation.image}
        alt=""
        className="h-full w-full rounded-full object-cover"
      />
    </div>
  );
}
