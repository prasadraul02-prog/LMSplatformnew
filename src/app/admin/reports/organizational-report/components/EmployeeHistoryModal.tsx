'use client'

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getEmployeeHistory } from '../actions';
import { Loader2, History, ArrowRight, CornerDownRight, User } from 'lucide-react';
import { format } from 'date-fns';

interface EmployeeHistoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    uniqueId: string;
    employeeName: string;
}

export default function EmployeeHistoryModal({ open, onOpenChange, uniqueId, employeeName }: EmployeeHistoryModalProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open && uniqueId) {
            fetchHistory();
        }
    }, [open, uniqueId]);

    const fetchHistory = async () => {
        setIsLoading(true);
        const result = await getEmployeeHistory(uniqueId);
        if (result.success) {
            setHistory(result.data);
        }
        setIsLoading(false);
    };

    const getDiffDisplay = (change: any) => {
        const oldValue = change.oldValue ? JSON.parse(change.oldValue) : null;
        const newValue = change.newValue ? JSON.parse(change.newValue) : null;

        switch (change.changeType) {
            case 'STATUS_CHANGE':
                return (
                    <div className="flex items-center gap-2 text-sm mt-1">
                        <Badge variant="outline" className="line-through opacity-50 font-normal">{oldValue?.status}</Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="secondary" className="font-bold">{newValue?.status}</Badge>
                    </div>
                );
            case 'TRANSFER':
                return (
                    <div className="space-y-1 mt-1">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground line-through">{change.organizationFrom}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="font-bold">{change.organizationTo}</span>
                        </div>
                        {newValue?.employeeId && newValue.employeeId !== oldValue?.employeeId && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                                <CornerDownRight className="h-3 w-3" />
                                New ID: {newValue.employeeId}
                            </div>
                        )}
                    </div>
                );
            case 'EMPLOYEE_ID_CHANGE':
                return (
                    <div className="flex items-center gap-2 text-sm mt-1">
                        <span className="text-muted-foreground line-through font-mono">{oldValue?.employeeId}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-bold font-mono">{newValue?.employeeId}</span>
                    </div>
                );
            case 'RESIGNATION':
                return (
                    <div className="text-sm font-semibold text-red-600 mt-1">
                        Reason: {newValue?.type === 'ON_TRIAL_DISCONTINUE' ? 'Trial Discontinued' : 'Normal Resignation'}
                    </div>
                );
            case 'NEW_EMPLOYEE':
                return (
                    <div className="text-sm font-medium text-green-600 mt-1">
                        Onboarded to {change.organizationTo}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col p-0 gap-0 border-none bg-slate-50">
                <DialogHeader className="p-6 bg-white border-b shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <History className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">{employeeName}</DialogTitle>
                            <DialogDescription className="font-mono text-xs uppercase tracking-wider">
                                Unique ID: {uniqueId}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-3">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p className="text-sm font-medium">Retrieving audit history...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground text-center border-2 border-dashed rounded-xl">
                            <User className="h-10 w-10 opacity-10 mb-2" />
                            <p className="text-sm font-medium">No movement history found.</p>
                            <p className="text-xs">All records since system launch are indexed here.</p>
                        </div>
                    ) : (
                        <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                            {history.map((item, idx) => (
                                <div key={item.id} className="relative pl-10 group">
                                    {/* Timeline Dot */}
                                    <div className={`absolute left-0 top-1 h-6 w-6 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-sm z-10 transition-transform group-hover:scale-110 ${item.changeType === 'RESIGNATION' ? 'bg-red-500' :
                                            item.changeType === 'NEW_EMPLOYEE' ? 'bg-green-500' :
                                                'bg-primary'
                                        }`} />

                                    <div className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wide">
                                                {item.changeType.replace(/_/g, ' ')}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase">
                                                {format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm')}
                                            </span>
                                        </div>

                                        {getDiffDisplay(item)}

                                        {item.remarks && (
                                            <div className="mt-3 p-2 bg-slate-50 rounded italic text-xs text-slate-500 border-l-2 border-slate-200">
                                                &ldquo;{item.remarks}&rdquo;
                                            </div>
                                        )}

                                        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-muted-foreground font-medium uppercase letter-spacing-wider">
                                            <span>Processed by: {item.processedBy || 'SYSTEM'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white border-t flex justify-end shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mr-auto my-auto">
                        Immutable Audit Trail
                    </p>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-900 px-4 py-2 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
