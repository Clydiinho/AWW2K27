import { cn } from "../../lib/utils";
import "./shine-border.css";

type TColorProp = string | string[];

interface ShineBorderProps {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: TColorProp;
  className?: string;
  children: React.ReactNode;
}

/**
 * @name Shine Border
 * @description Animated background border effect (vendored from Magic UI's
 * shine-border, ported from Tailwind utilities to plain CSS with the project's
 * no-dependency rules).
 * @param borderRadius defines the radius of the border.
 * @param borderWidth defines the width of the border.
 * @param duration defines the animation duration to be applied on the shining border.
 * @param color a string or string array to define border color.
 * @param className defines the class name to be applied to the component.
 * @param children contains react node elements.
 */
export function ShineBorder({
  borderRadius = 8,
  borderWidth = 1,
  duration = 14,
  color = "#000000",
  className,
  children,
}: ShineBorderProps) {
  return (
    <div
      style={
        {
          "--border-radius": `${borderRadius}px`,
          "--border-width": `${borderWidth}px`,
          "--duration": `${duration}s`,
          "--shine-mask": "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          "--shine-gradient": `radial-gradient(transparent,transparent, ${
            color instanceof Array ? color.join(",") : color
          },transparent,transparent)`,
        } as React.CSSProperties
      }
      className={cn("shine-border", className)}
    >
      {children}
    </div>
  );
}
