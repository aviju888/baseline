import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export function Card({ className, glow, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-6 transition-all duration-200",
        glow && "hover:border-accent/50 hover:shadow-lg hover:shadow-accent-glow",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
