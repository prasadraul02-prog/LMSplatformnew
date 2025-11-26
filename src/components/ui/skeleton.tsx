import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
    variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({ className, variant = "rectangular" }: SkeletonProps) {
    const variantClasses = {
        text: "h-4 w-full rounded",
        circular: "rounded-full",
        rectangular: "rounded-md",
    };

    return (
        <div
            className={cn(
                "animate-pulse bg-muted relative overflow-hidden",
                variantClasses[variant],
                className
            )}
        >
            <div className="shimmer absolute inset-0" />
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="rounded-lg border bg-card p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" variant="text" />
            <Skeleton className="h-4 w-full" variant="text" />
            <Skeleton className="h-4 w-5/6" variant="text" />
            <div className="flex gap-2 mt-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>
        </div>
    );
}

export function StatsCardSkeleton() {
    return (
        <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-24" variant="text" />
                <Skeleton className="h-5 w-5" variant="circular" />
            </div>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" variant="text" />
        </div>
    );
}
