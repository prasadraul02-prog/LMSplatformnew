import { TruckLoader } from "./truck-loader";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
    isLoading: boolean;
    message?: string;
    fullScreen?: boolean;
    className?: string;
}

/**
 * LoadingOverlay component that displays the truck loader
 * Can be used for full-screen loading or inline loading states
 */
export function LoadingOverlay({
    isLoading,
    message = "Loading...",
    fullScreen = false,
    className
}: LoadingOverlayProps) {
    if (!isLoading) return null;

    return (
        <div
            className={cn(
                "flex items-center justify-center bg-background/80 backdrop-blur-sm",
                fullScreen ? "fixed inset-0 z-50" : "absolute inset-0 z-10",
                className
            )}
        >
            <div className="flex flex-col items-center gap-4">
                <TruckLoader />
                {message && (
                    <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
                )}
            </div>
        </div>
    );
}
