import type { ComponentProps } from "react";

type ProtectedImageProps = ComponentProps<"img">;

export default function ProtectedImage({
  onContextMenu,
  onDragStart,
  draggable,
  style,
  ...props
}: ProtectedImageProps) {
  return (
    <img
      {...props}
      draggable={false}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu?.(event);
      }}
      onDragStart={(event) => {
        event.preventDefault();
        onDragStart?.(event);
      }}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        ...style,
      }}
    />
  );
}
