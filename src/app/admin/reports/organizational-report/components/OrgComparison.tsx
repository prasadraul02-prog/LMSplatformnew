'use client'

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { compareOrgSheet, applyChanges } from '../actions';
import { toast } from "sonner";
import {
    Loader2,
    Upload,
    ArrowRight,
    UserPlus,
    UserMinus,
    RefreshCw,
    UserCheck,
    AlertCircle,
    Info,
    MoveRight,
    Search,
    FileSpreadsheet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Organization {
    id: string;
    name: string;
    order: number;
}

interface OrgComparisonProps {
    organizations: Organization[];
}

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

export default function OrgComparison({ organizations }: OrgComparisonProps) {
    const [activeOrg, setActiveOrg] = useState(organizations[0]?.name || '');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [comparisonResult, setComparisonResult] = useState<any>(null);
    const [isApplying, setIsApplying] = useState(false);

    useEffect(() => {
        if (organizations.length > 0 && !organizations.find(o => o.name === activeOrg)) {
            setActiveOrg(organizations[0].name);
        }
    }, [organizations, activeOrg]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        setIsAnalyzing(true);
        setComparisonResult(null);
        const formData = new FormData();
        formData.append('file', e.target.files[0]);

        const result = await compareOrgSheet(formData, activeOrg);
        if (result.success) {
            setComparisonResult(result.data);
            toast.success("Analysis complete. Movement detected.");
        } else {
            toast.error(result.error);
        }
        setIsAnalyzing(false);
        e.target.value = '';
    };

    const handleApply = async (type: string, items: any[]) => {
        if (items.length === 0) return;

        setIsApplying(true);
        const payload: any = { orgName: activeOrg };
        payload[type] = items;

        const result = await applyChanges(payload);
        if (result.success) {
            toast.success(result.message);
            setComparisonResult((prev: any) => {
                if (!prev) return null;
                const newState = { ...prev };
                newState[type] = [];
                return newState;
            });
        } else {
            toast.error(result.error);
        }
        setIsApplying(false);
    };

    if (organizations.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    No organizations configured.
                </CardContent>
            </Card>
        );
    }

    const totalChanges = comparisonResult ? (
        comparisonResult.newEmployees.length +
        comparisonResult.statusChanges.length +
        comparisonResult.resignations.length +
        comparisonResult.transfers.length +
        comparisonResult.employeeIdChanges.length
    ) : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800">Organizational Movement Analyser</h2>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">
                        Bi-Directional Synchronization & Audit v2.0
                    </p>
                </div>
                {comparisonResult && totalChanges > 0 && (
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-4 py-1.5 text-sm font-bold gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {totalChanges} Pending Changes Detected
                    </Badge>
                )}
            </div>

            <Tabs value={activeOrg} onValueChange={setActiveOrg} className="w-full">
                <TabsList className="flex flex-wrap h-auto gap-2 bg-slate-100/50 p-1 rounded-xl border mb-6">
                    {organizations.map(org => (
                        <TabsTrigger
                            key={org.id}
                            value={org.name}
                            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4 py-2 font-bold transition-all"
                        >
                            {org.name}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {organizations.map(org => (
                    <TabsContent key={org.id} value={org.name} className="space-y-6 animate-in fade-in duration-500">
                        <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform group-hover:scale-175 group-hover:rotate-6">
                                <FileSpreadsheet className="h-32 w-32" />
                            </div>
                            <CardContent className="p-10">
                                <div className="flex flex-col items-center text-center space-y-4 max-w-lg mx-auto">
                                    <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
                                        <Upload className="h-8 w-8 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold">Synchronize {org.name}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Upload your latest Excel file with Staff, On Trial, or Contract sheets.
                                            The system will automatically detect movement, resignations and ID changes.
                                        </p>
                                    </div>
                                    <div className="relative inline-block mt-4">
                                        <input
                                            type="file"
                                            accept=".xlsx, .xls"
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            disabled={isAnalyzing}
                                        />
                                        <Button size="lg" className="rounded-xl px-10 h-12 font-bold shadow-lg shadow-primary/20" disabled={isAnalyzing}>
                                            {isAnalyzing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                                            {isAnalyzing ? 'Analysing Sheets...' : 'Start Comparative Analysis'}
                                        </Button>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500" /> Multi-Sheet Support
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Bidirectional Detection
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {comparisonResult && (
                            <div className="grid grid-cols-1 gap-8 animate-in slide-in-from-bottom-6 duration-700">

                                {/* New Employees Section */}
                                {comparisonResult.newEmployees && comparisonResult.newEmployees.length > 0 && (
                                    <Card className="border-l-4 border-l-green-500 shadow-sm overflow-hidden">
                                        <CardHeader className="bg-green-50/50 pb-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-green-100 rounded-lg">
                                                        <UserPlus className="h-5 w-5 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg text-green-900">New Onboarding Required</CardTitle>
                                                        <CardDescription>Detected {comparisonResult.newEmployees.length} employees not in Master HR Database.</CardDescription>
                                                    </div>
                                                </div>
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700 font-bold whitespace-nowrap" onClick={() => handleApply('newEmployees', comparisonResult.newEmployees)} disabled={isApplying}>
                                                    Approve & Onboard All
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0 overflow-x-auto">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-slate-50 border-y">
                                                    <tr>
                                                        <th className="p-3 font-bold uppercase tracking-wider text-slate-500">Unique ID</th>
                                                        <th className="p-3 font-bold uppercase tracking-wider text-slate-500">Name</th>
                                                        <th className="p-3 font-bold uppercase tracking-wider text-slate-500">Designation</th>
                                                        <th className="p-3 font-bold uppercase tracking-wider text-slate-500">Branch</th>
                                                        <th className="p-3 font-bold uppercase tracking-wider text-slate-500">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {comparisonResult.newEmployees.map((emp: any, i: number) => (
                                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="p-3 font-mono font-bold">{emp.uniqueId}</td>
                                                            <td className="p-3 font-semibold text-slate-900">{emp.name}</td>
                                                            <td className="p-3">{emp.designation}</td>
                                                            <td className="p-3 text-muted-foreground">{emp.branch}</td>
                                                            <td className="p-3">
                                                                <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] px-1 uppercase">{emp.status}</Badge>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Status Changes */}
                                {comparisonResult.statusChanges && comparisonResult.statusChanges.length > 0 && (
                                    <Card className="border-l-4 border-l-blue-500 shadow-sm overflow-hidden">
                                        <CardHeader className="bg-blue-50/50 pb-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                        <RefreshCw className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg text-blue-900">Employment Transitions</CardTitle>
                                                        <CardDescription>{comparisonResult.statusChanges.length} employees requiring status updates (Staff ↔ Trial ↔ Contract).</CardDescription>
                                                    </div>
                                                </div>
                                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold whitespace-nowrap" onClick={() => handleApply('statusChanges', comparisonResult.statusChanges)} disabled={isApplying}>
                                                    Confirm Transitions
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0 overflow-x-auto">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-slate-50 border-y">
                                                    <tr>
                                                        <th className="p-3 font-bold uppercase tracking-wider text-slate-500">Employee</th>
                                                        <th className="p-3 font-bold uppercase tracking-wider text-slate-500">Transition</th>
                                                        <th className="p-3 font-bold uppercase tracking-wider text-slate-500">ID Update</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {comparisonResult.statusChanges.map((change: any, i: number) => (
                                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="p-3">
                                                                <div className="font-bold text-slate-900">{change.name}</div>
                                                                <div className="text-[10px] font-mono text-muted-foreground">{change.uniqueId}</div>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className="opacity-50 line-through text-[10px] uppercase">{change.oldStatus}</Badge>
                                                                    <MoveRight className="h-3 w-3 text-slate-400" />
                                                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-[10px] px-1 uppercase">{change.newStatus}</Badge>
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                {change.newEmployeeId && change.newEmployeeId !== change.oldEmployeeId ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-muted-foreground line-through font-mono">{change.oldEmployeeId}</span>
                                                                        <ArrowRight className="h-3 w-3 text-primary" />
                                                                        <span className="font-bold text-primary font-mono">{change.newEmployeeId}</span>
                                                                    </div>
                                                                ) : <span className="text-slate-400 italic">No change</span>}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Resignations */}
                                {comparisonResult.resignations && comparisonResult.resignations.length > 0 && (
                                    <Card className="border-l-4 border-l-red-500 shadow-sm overflow-hidden">
                                        <CardHeader className="bg-red-50/50 pb-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-red-100 rounded-lg">
                                                        <UserMinus className="h-5 w-5 text-red-600" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg text-red-900">Resignations & Exits</CardTitle>
                                                        <CardDescription>Detected {comparisonResult.resignations.length} exits or discontinued trials.</CardDescription>
                                                    </div>
                                                </div>
                                                <Button variant="destructive" size="sm" className="font-bold whitespace-nowrap" onClick={() => handleApply('resignations', comparisonResult.resignations)} disabled={isApplying}>
                                                    Process Exits
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0 overflow-x-auto">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-slate-50 border-y">
                                                    <tr>
                                                        <th className="p-3 font-bold uppercase tracking-wider text-slate-500">Employee</th>
                                                        <th className="p-3 font-bold uppercase tracking-wider text-slate-500">Type</th>
                                                        <th className="p-3 font-bold uppercase tracking-wider text-slate-500">Details</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {comparisonResult.resignations.map((exit: any, i: number) => (
                                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="p-3">
                                                                <div className="font-bold text-slate-900">{exit.name}</div>
                                                                <div className="text-[10px] font-mono text-muted-foreground">{exit.uniqueId}</div>
                                                            </td>
                                                            <td className="p-3">
                                                                <Badge variant="outline" className={exit.resignationType === 'ON_TRIAL_DISCONTINUE' ? 'border-orange-200 text-orange-700 bg-orange-50 text-[10px]' : 'border-red-200 text-red-700 bg-red-50 text-[10px]'}>
                                                                    {exit.resignationType === 'ON_TRIAL_DISCONTINUE' ? 'TR. DISCONTINUE' : 'RESIGNED'}
                                                                </Badge>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="text-xs font-medium">{formatDate(exit.resignationDate)}</div>
                                                                <div className="text-[10px] text-slate-500 italic truncate max-w-[150px]">{exit.remarks || '-'}</div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Transfers */}
                                {comparisonResult.transfers && comparisonResult.transfers.length > 0 && (
                                    <Card className="border-l-4 border-l-purple-500 shadow-sm overflow-hidden">
                                        <CardHeader className="bg-purple-50/50 pb-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-purple-100 rounded-lg">
                                                        <ArrowRight className="h-5 w-5 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg text-purple-900">Organizational Transfers</CardTitle>
                                                        <CardDescription>{comparisonResult.transfers.length} movements across locations/companies.</CardDescription>
                                                    </div>
                                                </div>
                                                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 font-bold whitespace-nowrap" onClick={() => handleApply('transfers', comparisonResult.transfers)} disabled={isApplying}>
                                                    Apply Transfers
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0 overflow-x-auto">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-slate-50 border-y">
                                                    <tr>
                                                        <th className="p-3 font-bold uppercase tracking-wider text-slate-500">Employee</th>
                                                        <th className="p-3 font-bold uppercase tracking-wider text-slate-500">Path</th>
                                                        <th className="p-3 font-bold uppercase tracking-wider text-slate-500">New ID</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {comparisonResult.transfers.map((t: any, i: number) => (
                                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="p-3">
                                                                <div className="font-bold text-slate-900">{t.name}</div>
                                                                <div className="text-[10px] font-mono text-muted-foreground">{t.uniqueId}</div>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-muted-foreground text-[10px] uppercase">{t.fromOrg}</span>
                                                                    <MoveRight className="h-3 w-3 text-slate-400" />
                                                                    <span className="font-bold text-slate-900 text-[10px] uppercase">{t.toOrg}</span>
                                                                </div>
                                                                <Badge variant="outline" className="text-[9px] mt-1 p-0 px-1 border-purple-200">{t.transferType.replace(/_/g, ' ')}</Badge>
                                                            </td>
                                                            <td className="p-3 font-mono font-bold text-primary">{t.newEmployeeId || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Employee ID Changes */}
                                {comparisonResult.employeeIdChanges && comparisonResult.employeeIdChanges.length > 0 && (
                                    <Card className="border-l-4 border-l-orange-500 shadow-sm overflow-hidden">
                                        <CardHeader className="bg-orange-50/50 pb-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-orange-100 rounded-lg">
                                                        <UserCheck className="h-5 w-5 text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg text-orange-900">Employee ID Updates</CardTitle>
                                                        <CardDescription>{comparisonResult.employeeIdChanges.length} Registration/Employee ID discrepancies.</CardDescription>
                                                    </div>
                                                </div>
                                                <Button size="sm" className="bg-orange-600 hover:bg-orange-700 font-bold whitespace-nowrap" onClick={() => handleApply('employeeIdChanges', comparisonResult.employeeIdChanges)} disabled={isApplying}>
                                                    Sync All IDs
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0 overflow-x-auto">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-slate-50 border-y">
                                                    <tr>
                                                        <th className="p-3 font-bold uppercase tracking-wider text-slate-500">Employee</th>
                                                        <th className="p-3 font-bold uppercase tracking-wider text-slate-500">ID Delta</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {comparisonResult.employeeIdChanges.map((c: any, i: number) => (
                                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="p-3 font-bold text-slate-900">{c.name}</td>
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-muted-foreground line-through font-mono uppercase text-[10px]">{c.oldEmployeeId}</span>
                                                                    <ArrowRight className="h-3 w-3 text-slate-400" />
                                                                    <span className="font-bold font-mono text-primary uppercase">{c.newEmployeeId}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </CardContent>
                                    </Card>
                                )}

                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
