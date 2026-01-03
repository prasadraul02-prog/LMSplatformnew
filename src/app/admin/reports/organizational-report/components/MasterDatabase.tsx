'use client'

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    uploadMasterDatabase,
    resetSystem,
    getMasterEmployees,
    updateMasterEmployee,
    deleteMasterEmployee,
    unhighlightAll
} from '../actions';
import { toast } from "sonner";
import {
    Loader2,
    Upload,
    Download,
    Trash2,
    Search,
    Edit,
    ChevronLeft,
    ChevronRight,
    Filter,
    MoreHorizontal,
    Table as TableIcon
} from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Zap } from "lucide-react";

// Helper for DD-MMM-YY
const formatDate = (date: any) => {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = String(d.getFullYear()).slice(-2);

    return `${day}-${month}-${year}`;
};

export default function MasterDatabase({ initialData, initialMetadata }: { initialData: any[], initialMetadata: any }) {
    const [data, setData] = useState(initialData);
    const [metadata, setMetadata] = useState(initialMetadata);
    const [isUploading, setIsUploading] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<any>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchData = useCallback(async (p: number, s: string) => {
        setIsLoading(true);
        const result = await getMasterEmployees(p, 50, s);
        if (result.success) {
            setData(result.data!);
            setMetadata(result.metadata);
        }
        setIsLoading(false);
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchData(1, search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, fetchData]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchData(newPage, search);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', e.target.files[0]);

        const result = await uploadMasterDatabase(formData);
        if (result.success) {
            toast.success(result.message);
            fetchData(1, search);
        } else {
            toast.error(result.error);
        }
        setIsUploading(true); // Keep it true briefly to show loading
        setTimeout(() => setIsUploading(false), 500);
        e.target.value = ''; // Reset input
    };

    const [isUnhighlighting, setIsUnhighlighting] = useState(false);

    const handleUnhighlight = async () => {
        if (!confirm("Are you sure you want to clear all highlights? This cannot be undone.")) return;
        setIsUnhighlighting(true);
        const result = await unhighlightAll();
        if (result.success) {
            toast.success(result.message);
            fetchData(page, search);
        } else {
            toast.error(result.error);
        }
        setIsUnhighlighting(false);
    };

    const handleReset = async () => {
        if (!confirm("Are you sure you want to RESET the entire system? This will delete all Master HR Data.")) return;

        setIsResetting(true);
        const result = await resetSystem();
        if (result.success) {
            toast.success(result.message);
            setData([]);
            setMetadata({ total: 0, page: 1, limit: 50, totalPages: 0 });
        } else {
            toast.error(result.error);
        }
        setIsResetting(false);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEmployee) return;

        setIsUpdating(true);
        const result = await updateMasterEmployee(editingEmployee.id, editingEmployee);
        if (result.success) {
            toast.success("Employee updated successfully");
            setEditingEmployee(null);
            fetchData(page, search);
        } else {
            toast.error(result.error);
        }
        setIsUpdating(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        const result = await deleteMasterEmployee(id);
        if (result.success) {
            toast.success("Employee deleted successfully");
            fetchData(page, search);
        } else {
            toast.error(result.error);
        }
    };

    const handleExport = () => {
        // Collect all possible headers from the current data
        const coreColsMap: Record<string, string> = {
            'uniqueId': 'Unique ID',
            'employeeId': 'Employee ID',
            'name': 'Employee Name',
            'department': 'Department',
            'dateOfJoining': 'DOJ',
            'branch': 'Branch',
            'designation': 'Designation',
            'employmentStatus': 'Status'
        };

        const dynamicHeaders = new Set<string>();
        data.forEach(emp => {
            if (emp.additionalData) {
                try {
                    const extra = JSON.parse(emp.additionalData);
                    Object.keys(extra).forEach(k => dynamicHeaders.add(k));
                } catch (e) { }
            }
        });

        const allHeaders = [
            ...Object.values(coreColsMap),
            ...Array.from(dynamicHeaders)
        ];

        const rows = data.map(emp => {
            const extraData = emp.additionalData ? JSON.parse(emp.additionalData) : {};
            const coreValues = [
                emp.uniqueId,
                emp.employeeId || '',
                `"${emp.name}"`,
                `"${emp.department || 'Unknown'}"`,
                formatDate(emp.dateOfJoining),
                `"${emp.branch}"`,
                `"${emp.designation}"`,
                emp.employmentStatus
            ];
            const dynamicValues = Array.from(dynamicHeaders).map(h => `"${extraData[h] || ''}"`);
            return [...coreValues, ...dynamicValues].join(',');
        });

        const csvContent = [allHeaders.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `HR_Master_Export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Current view extracted successfully");
    };

    // Calculate dynamic headers for display
    const visibleDynamicHeaders = useMemo(() => {
        const headers = new Set<string>();
        data.forEach(emp => {
            if (emp.additionalData) {
                try {
                    const extra = JSON.parse(emp.additionalData);
                    Object.keys(extra).forEach(k => headers.add(k));
                } catch (e) { }
            }
        });
        return Array.from(headers);
    }, [data]);

    return (
        <Card className="w-full shadow-lg border-t-4 border-t-primary">
            <CardHeader className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <TableIcon className="h-6 w-6 text-primary" />
                            Master HR Database
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Showing {metadata.total > 0 ? (page - 1) * metadata.limit + 1 : 0} to {Math.min(page * metadata.limit, metadata.total)} of {metadata.total} entries
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <div className="relative group">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                disabled={isUploading}
                            />
                            <Button variant="outline" className="group-hover:bg-primary group-hover:text-white transition-colors" disabled={isUploading}>
                                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                Import Excel
                            </Button>
                        </div>
                        <Button variant="outline" onClick={handleExport} disabled={data.length === 0}>
                            <Download className="mr-2 h-4 w-4" />
                            Export Page
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleUnhighlight}
                            disabled={isUnhighlighting || isLoading}
                            className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
                        >
                            <Zap className={`mr-2 h-4 w-4 ${isUnhighlighting ? 'animate-pulse' : ''}`} />
                            Unhighlight Employees
                        </Button>
                        <Button variant="outline" onClick={() => fetchData(page, search)} disabled={isLoading}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button variant="destructive" onClick={handleReset} disabled={isResetting}>
                            {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Reset
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 max-w-md bg-muted px-3 py-1 rounded-full border focus-within:ring-2 focus-within:ring-primary transition-all">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by Name, ID, Organization, Branch..."
                        className="border-none bg-transparent focus-visible:ring-0 px-0 h-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
                <div className="relative overflow-hidden rounded-xl border bg-card">
                    <div className="max-h-[600px] overflow-auto custom-scrollbar">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="sticky top-0 z-20 bg-muted/80 backdrop-blur-md border-b">
                                <tr>
                                    <th className="p-4 font-bold text-primary w-[50px]">#</th>
                                    {(() => {
                                        // Define core columns that we always want to show if they exist
                                        const coreColsMap: Record<string, string> = {
                                            'uniqueId': 'Unique ID',
                                            'employeeId': 'Employee ID',
                                            'name': 'Employee Name',
                                            'department': 'Department',
                                            'dateOfJoining': 'DOJ',
                                            'branch': 'Branch',
                                            'designation': 'Designation',
                                            'employmentStatus': 'Status'
                                        };

                                        // Identify all unique extra data keys
                                        const extraKeys = new Set<string>();
                                        data.forEach(emp => {
                                            if (emp.additionalData) {
                                                try {
                                                    const extra = JSON.parse(emp.additionalData);
                                                    Object.keys(extra).forEach(k => extraKeys.add(k));
                                                } catch (e) { }
                                            }
                                        });

                                        const dynamicRows = [
                                            ...Object.values(coreColsMap),
                                            ...Array.from(extraKeys)
                                        ];

                                        return dynamicRows.map(header => (
                                            <th key={header} className="p-4 font-bold text-primary min-w-[120px] whitespace-nowrap">{header}</th>
                                        ));
                                    })()}
                                    <th className="p-4 font-bold text-primary sticky right-0 bg-muted/80 backdrop-blur-md border-l w-[80px] text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={20} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                                <p className="text-lg font-medium animate-pulse">Loading employee data...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={20} className="p-20 text-center text-muted-foreground italic">
                                            No employee records found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((emp, index) => {
                                        const isNew = emp.createdAt && (new Date().getTime() - new Date(emp.createdAt).getTime() < 24 * 60 * 60 * 1000);
                                        const extraData = emp.additionalData ? JSON.parse(emp.additionalData) : {};

                                        // Same logic for headers to match cells
                                        const coreCols = ['uniqueId', 'employeeId', 'name', 'department', 'dateOfJoining', 'branch', 'designation', 'employmentStatus'];
                                        const extraKeys = new Set<string>();
                                        data.forEach(e => {
                                            if (e.additionalData) {
                                                try {
                                                    const extra = JSON.parse(e.additionalData);
                                                    Object.keys(extra).forEach(k => extraKeys.add(k));
                                                } catch (e) { }
                                            }
                                        });

                                        return (
                                            <tr key={emp.id} className={`group border-b hover:bg-muted/50 transition-colors ${isNew ? 'bg-green-50/50' : ''}`}>
                                                <td className="p-4 text-xs text-muted-foreground">{(page - 1) * metadata.limit + index + 1}</td>

                                                {/* Render Core Fields */}
                                                {coreCols.map(col => (
                                                    <td key={col} className="p-4">
                                                        {col === 'uniqueId' ? (
                                                            <div className="flex flex-col gap-1">
                                                                <span className="font-mono text-xs">{emp[col]}</span>
                                                                {isNew && <span className="text-[8px] bg-green-500 text-white px-1 rounded w-fit font-bold text-center">NEW JOINED</span>}
                                                            </div>
                                                        ) : col === 'name' ? (
                                                            <div className="font-semibold text-primary">{emp[col]}</div>
                                                        ) : col === 'dateOfJoining' ? (
                                                            <span className="text-xs text-muted-foreground">{formatDate(emp[col])}</span>
                                                        ) : col === 'employmentStatus' ? (
                                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${emp[col].toLowerCase() === 'deactive' || emp[col].toLowerCase().includes('resigned') || emp[col].toLowerCase().includes('terminated') ? 'bg-slate-100 text-slate-700' :
                                                                'bg-green-100 text-green-700'
                                                                }`}>
                                                                {emp[col].toLowerCase() === 'deactive' || emp[col].toLowerCase().includes('resigned') || emp[col].toLowerCase().includes('terminated') ? 'DEACTIVE' : 'ACTIVE'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-medium text-slate-700">{emp[col] || '-'}</span>
                                                        )}
                                                    </td>
                                                ))}

                                                {/* Render Extra Fields */}
                                                {Array.from(extraKeys).map(key => (
                                                    <td key={key} className="p-4 text-xs text-slate-600">
                                                        {extraData[key] || '-'}
                                                    </td>
                                                ))}

                                                <td className="p-4 sticky right-0 bg-card group-hover:bg-muted/50 border-l text-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => setEditingEmployee(emp)}>
                                                                <Edit className="mr-2 h-4 w-4" /> Edit Record
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(emp.id)}>
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {metadata.totalPages > 1 && (
                    <div className="flex items-center justify-between py-6">
                        <div className="hidden sm:block text-sm text-muted-foreground font-medium">
                            Rows per page: {metadata.limit}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1 || isLoading}
                                className="h-9 px-4"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                            </Button>

                            <div className="flex items-center gap-1 mx-2">
                                <span className="text-sm font-bold text-primary">Page {page}</span>
                                <span className="text-sm text-muted-foreground">of {metadata.totalPages}</span>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === metadata.totalPages || isLoading}
                                className="h-9 px-4"
                            >
                                Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Edit Employee Sheet */}
            <Sheet open={!!editingEmployee} onOpenChange={(open) => !open && setEditingEmployee(null)}>
                <SheetContent className="sm:max-w-xl overflow-y-auto">
                    <SheetHeader className="border-b pb-4 mb-6">
                        <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                            <Edit className="h-6 w-6 text-primary" />
                            Edit Employee Details
                        </SheetTitle>
                        <SheetDescription>
                            Modify information for {editingEmployee?.name}. Changes will be saved directly to the Master Database.
                        </SheetDescription>
                    </SheetHeader>

                    {editingEmployee && (
                        <form onSubmit={handleUpdate} className="space-y-8 pb-10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Name</Label>
                                    <Input
                                        value={editingEmployee.name || ''}
                                        onChange={e => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                                        className="h-11 focus:ring-primary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Unique ID</Label>
                                    <Input
                                        value={editingEmployee.uniqueId || ''}
                                        onChange={e => setEditingEmployee({ ...editingEmployee, uniqueId: e.target.value })}
                                        className="h-11 focus:ring-primary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Organization</Label>
                                    <Input
                                        value={editingEmployee.organizationName || ''}
                                        onChange={e => setEditingEmployee({ ...editingEmployee, organizationName: e.target.value })}
                                        className="h-11 focus:ring-primary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</Label>
                                    <Input
                                        value={editingEmployee.employmentStatus || ''}
                                        onChange={e => setEditingEmployee({ ...editingEmployee, employmentStatus: e.target.value })}
                                        className="h-11 focus:ring-primary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Designation</Label>
                                    <Input
                                        value={editingEmployee.designation || ''}
                                        onChange={e => setEditingEmployee({ ...editingEmployee, designation: e.target.value })}
                                        className="h-11 focus:ring-primary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Branch</Label>
                                    <Input
                                        value={editingEmployee.branch || ''}
                                        onChange={e => setEditingEmployee({ ...editingEmployee, branch: e.target.value })}
                                        className="h-11 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            {/* Dynamic Fields (All fields including DOB, Email, etc. will appear here automatically) */}
                            {(() => {
                                const extra = editingEmployee.additionalData ? JSON.parse(editingEmployee.additionalData) : {};
                                if (Object.keys(extra).length === 0) return null;

                                return (
                                    <div className="pt-6 border-t">
                                        <h3 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
                                            <Filter className="h-4 w-4" />
                                            Employee Attributes
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            {Object.keys(extra).map(key => (
                                                <div key={key} className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{key}</Label>
                                                    <Input
                                                        value={extra[key] || ''}
                                                        onChange={e => {
                                                            const newExtra = { ...extra, [key]: e.target.value };
                                                            setEditingEmployee({ ...editingEmployee, additionalData: JSON.stringify(newExtra) });
                                                        }}
                                                        className="h-11 border-dashed border-primary/40 focus:ring-primary"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            <SheetFooter className="pt-8 border-t sticky bottom-0 bg-background pb-6">
                                <Button type="button" variant="outline" onClick={() => setEditingEmployee(null)} className="h-11 px-8">
                                    Cancel
                                </Button>
                                <Button type="submit" className="h-11 px-10 font-bold" disabled={isUpdating}>
                                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Save Changes
                                </Button>
                            </SheetFooter>
                        </form>
                    )}
                </SheetContent>
            </Sheet>
        </Card>
    );
}
