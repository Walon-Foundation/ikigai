import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "light" | "outline-light";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-(--w-green-deep)",
  outline: "border-primary text-primary hover:bg-(--w-leaf-soft)",
  light: "bg-white text-(--w-green-deep) hover:bg-(--w-leaf-soft)",
  "outline-light": "border-white/35 text-white hover:bg-white/10",
};

/**
 * Class names for a marketing button, for use on <Link> or <a>. 10px radius,
 * never a pill (docs/05-design-guide.md).
 */
export function buttonClass(
  variant: Variant = "primary",
  { size = "md", className }: { size?: "sm" | "md"; className?: string } = {},
) {
  return cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-transparent font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    size === "md" ? "h-[46px] px-[22px] text-[15px]" : "h-10 px-4 text-sm",
    VARIANTS[variant],
    className,
  );
}
