'use client'

import { useState, useEffect } from 'react';
import {
    Bell,
    CheckCircle2,
    Info,
    AlertTriangle,
    ArrowRight,
    UserMinus,
    UserPlus,
    RefreshCw,
    Clock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { getIntimations, markIntimationRead } from '../actions';
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';

export default function IntimationsPanel() {
    const [intimations, setIntimations] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const fetchIntimations = async () => {
        setIsLoading(true);
        const result = await getIntimations();
        if (result.success) {
            setIntimations(result.data);
            setUnreadCount(result.data.filter((i: any) => !i.read).length);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchIntimations();
        // Sync every 5 minutes
        const interval = setInterval(fetchIntimations, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkRead = async (id: string) => {
        const result = await markIntimationRead(id);
        if (result.success) {
            setIntimations(prev => prev.map(i => i.id === id ? { ...i, read: true } : i));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } else {
            toast.error("Failed to mark as read");
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'STATUS_CHANGE': return <RefreshCw className="h-4 w-4 text-blue-500" />;
            case 'TRANSFER': return <ArrowRight className="h-4 w-4 text-purple-500" />;
            case 'RESIGNATION': return <UserMinus className="h-4 w-4 text-red-500" />;
            case 'NEW_EMPLOYEE': return <UserPlus className="h-4 w-4 text-green-500" />;
            case 'EMPLOYEE_ID_CHANGE': return <Clock className="h-4 w-4 text-orange-500" />;
            default: return <Info className="h-4 w-4 text-slate-400" />;
        }
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative h-9 px-3 gap-2 border-2">
                    <Bell className={`h-4 w-4 ${unreadCount > 0 ? 'text-primary animate-pulse' : 'text-slate-500'}`} />
                    <span className="font-bold">Intimations</span>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md bg-slate-50 flex flex-col p-0">
                <SheetHeader className="p-6 border-b bg-white">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-bold flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            HR Intimations
                        </SheetTitle>
                        <Button variant="ghost" size="sm" onClick={fetchIntimations} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                    <SheetDescription>
                        Automated alerts for employee movements across organizations.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {intimations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                            <CheckCircle2 className="h-8 w-8 opacity-20" />
                            <p className="text-sm font-medium">All caught up!</p>
                        </div>
                    ) : (
                        intimations.map((item) => (
                            <div
                                key={item.id}
                                className={`group relative flex gap-4 p-4 rounded-xl border transition-all duration-200 ${item.read
                                    ? 'bg-white border-slate-200 opacity-70'
                                    : 'bg-white border-primary/20 shadow-md scale-[1.02]'
                                    }`}
                            >
                                <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${item.read ? 'bg-slate-100' : 'bg-primary/10'
                                    }`}>
                                    {getTypeIcon(item.type)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <Badge variant={item.priority === 'HIGH' ? 'destructive' : 'secondary'} className="text-[10px] uppercase h-4 px-1">
                                            {item.type.replace(/_/g, ' ')}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <h4 className={`text-sm font-bold leading-tight ${item.read ? 'text-slate-600' : 'text-slate-900'}`}>
                                        {item.relatedEmployeeName}
                                    </h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        {item.message}
                                    </p>
                                    {!item.read && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-7 text-[10px] font-bold mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleMarkRead(item.id)}
                                        >
                                            Mark as Read
                                        </Button>
                                    )}
                                </div>
                                {!item.read && (
                                    <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary" />
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t bg-white bg-slate-100/30">
                    <p className="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-wider">
                        Keeping Employee Movements Synchronized
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    );
}
