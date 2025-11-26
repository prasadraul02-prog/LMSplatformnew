import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AmbientCardProps {
    children: ReactNode;
    className?: string;
    variant?: "glass" | "elevated" | "glow";
    hover?: boolean;
}

export function AmbientCard({
    children,
    className,
    variant = "elevated",
    hover = true,
}: AmbientCardProps) {
    const variantClasses = {
        glass: "glass",
        elevated: "elevated bg-card",
        glow: "elevated-lg bg-card glow-primary",
    };

    return (
        <div
            className={cn(
                "rounded-lg border border-border p-6 transition-all duration-300",
                variantClasses[variant],
                hover && "hover:scale-[1.02] hover:shadow-xl",
                className
            )}
        >
            {children}
        </div>
    );
}
