'use client'

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { compareOrgSheet, applyChanges } from '../actions';
import { toast } from "sonner";
import { Loader2, Upload, ArrowRight, UserPlus, UserMinus } from "lucide-react";

interface Organization {
    id: string;
    name: string;
    order: number;
}

interface OrgComparisonProps {
    organizations: Organization[];
}

export default function OrgComparison({ organizations }: OrgComparisonProps) {
    const [activeOrg, setActiveOrg] = useState(organizations[0]?.name || '');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [comparisonResult, setComparisonResult] = useState<any>(null);
    const [isApplying, setIsApplying] = useState(false);

    // Update active org if organizations change (e.g. after add/delete)
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
            toast.success("Analysis complete. Please review changes.");
        } else {
            toast.error(result.error);
        }
        setIsAnalyzing(false);
        e.target.value = '';
    };

    const handleApply = async (type: 'new' | 'status' | 'transfer', items: any[]) => {
        if (items.length === 0) return;

        setIsApplying(true);
        const payload: any = { orgName: activeOrg };
        if (type === 'new') payload.newEmployees = items;
        if (type === 'status') payload.statusChanges = items;
        if (type === 'transfer') payload.transfers = items;

        const result = await applyChanges(payload);
        if (result.success) {
            toast.success(result.message);
            // Remove applied items from local state
            setComparisonResult((prev: any) => {
                if (!prev) return null;
                const newState = { ...prev };
                if (type === 'new') newState.newEmployees = [];
                if (type === 'status') newState.statusChanges = [];
                if (type === 'transfer') newState.transfers = [];
                return newState;
            });
        } else {
            toast.error(result.error);
        }
        setIsApplying(false);
    };

    const getAnalyserName = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('trucking')) return `${name} Analyser`;
        if (lower.includes('terrago')) return `Autobahn Trucking Analyser`;
        if (lower.includes('mumbai')) return `Autobahn Trucking Mumbai Analyser`;
        if (lower.includes('ambegaon')) return `Autobahn VoltiGo Ambegaon Analyser`;
        return `${name} Analyser`;
    };

    if (organizations.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    No organizations configured. Please add an organization in the settings below.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Organizational Analyser</h2>
            <Tabs value={activeOrg} onValueChange={setActiveOrg} className="w-full">
                <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
                    {organizations.map(org => (
                        <TabsTrigger
                            key={org.id}
                            value={org.name}
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background"
                        >
                            {getAnalyserName(org.name)}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {organizations.map(org => (
                    <TabsContent key={org.id} value={org.name} className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{getAnalyserName(org.name)}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/10">
                                    <div className="text-center space-y-4">
                                        <p className="text-muted-foreground">Upload the latest organizational sheet (Staff, Trial, Contract)</p>
                                        <div className="relative inline-block">
                                            <input
                                                type="file"
                                                accept=".xlsx, .xls"
                                                onChange={handleFileUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                disabled={isAnalyzing}
                                            />
                                            <Button size="lg" disabled={isAnalyzing}>
                                                {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                                Import & Analyze Sheet
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {comparisonResult && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                {/* New Employees */}
                                {comparisonResult.newEmployees.length > 0 && (
                                    <Card className="border-l-4 border-l-success">
                                        <CardHeader>
                                            <CardTitle className="flex items-center text-success">
                                                <UserPlus className="mr-2 h-5 w-5" />
                                                New Employees Found ({comparisonResult.newEmployees.length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="mb-4 text-sm text-muted-foreground">
                                                These employees are present in the uploaded sheet but NOT in the Master Database.
                                            </p>
                                            <div className="max-h-80 overflow-auto border rounded-md mb-4 bg-background">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-muted sticky top-0 z-10 shadow-sm">
                                                        <tr>
                                                            <th className="p-3 font-bold border-b">Sr. No</th>
                                                            <th className="p-3 font-bold border-b">Unique ID</th>
                                                            <th className="p-3 font-bold border-b">Employee ID</th>
                                                            <th className="p-3 font-bold border-b">Employee Name</th>
                                                            <th className="p-3 font-bold border-b">Organization</th>
                                                            <th className="p-3 font-bold border-b">DOJ</th>
                                                            <th className="p-3 font-bold border-b">Branch</th>
                                                            <th className="p-3 font-bold border-b">Designation</th>
                                                            <th className="p-3 font-bold border-b">Status</th>
                                                            <th className="p-3 font-bold border-b">Mobile Number</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {comparisonResult.newEmployees.map((emp: any, i: number) => {
                                                            const extra = emp.additionalData ? JSON.parse(emp.additionalData) : {};
                                                            return (
                                                                <tr key={i} className="border-t hover:bg-muted/30 transition-colors">
                                                                    <td className="p-3 text-muted-foreground">{i + 1}</td>
                                                                    <td className="p-3 font-mono">{emp.uniqueId}</td>
                                                                    <td className="p-3">{emp.employeeId || '-'}</td>
                                                                    <td className="p-3 font-semibold text-primary">{emp.name}</td>
                                                                    <td className="p-3">{activeOrg}</td>
                                                                    <td className="p-3">{emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : '-'}</td>
                                                                    <td className="p-3">{emp.branch}</td>
                                                                    <td className="p-3">{emp.designation}</td>
                                                                    <td className="p-3 text-xs font-bold uppercase">{emp.status}</td>
                                                                    <td className="p-3">
                                                                        {extra['Mobile Number'] || '-'}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="flex gap-4">
                                                <Button onClick={() => handleApply('new', comparisonResult.newEmployees)} disabled={isApplying}>
                                                    Yes, Add to Master Database
                                                </Button>
                                                <Button variant="outline" onClick={() => setComparisonResult({ ...comparisonResult, newEmployees: [] })}>
                                                    No, Ignore
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Resigned Employees */}
                                {comparisonResult.resignedEmployees.length > 0 && (
                                    <Card className="border-l-4 border-l-destructive">
                                        <CardHeader>
                                            <CardTitle className="flex items-center text-destructive">
                                                <UserMinus className="mr-2 h-5 w-5" />
                                                Potential Resignations ({comparisonResult.resignedEmployees.length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="mb-4 text-sm text-muted-foreground">
                                                These employees are in the Master Database for {org.name} but NOT in the uploaded sheet.
                                            </p>
                                            <div className="max-h-80 overflow-auto border rounded-md mb-4 bg-background">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-muted sticky top-0 z-10 shadow-sm">
                                                        <tr>
                                                            <th className="p-3 font-bold border-b">Sr. No</th>
                                                            <th className="p-3 font-bold border-b">Unique ID</th>
                                                            <th className="p-3 font-bold border-b">Employee ID</th>
                                                            <th className="p-3 font-bold border-b">Employee Name</th>
                                                            <th className="p-3 font-bold border-b">Organization</th>
                                                            <th className="p-3 font-bold border-b">DOJ</th>
                                                            <th className="p-3 font-bold border-b">Branch</th>
                                                            <th className="p-3 font-bold border-b">Designation</th>
                                                            <th className="p-3 font-bold border-b">Status</th>
                                                            <th className="p-3 font-bold border-b">Mobile Number</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {comparisonResult.resignedEmployees.map((emp: any, i: number) => {
                                                            const extra = emp.additionalData ? JSON.parse(emp.additionalData) : {};
                                                            return (
                                                                <tr key={i} className="border-t hover:bg-muted/30 transition-colors">
                                                                    <td className="p-3 text-muted-foreground">{i + 1}</td>
                                                                    <td className="p-3 font-mono">{emp.uniqueId}</td>
                                                                    <td className="p-3">{emp.employeeId || '-'}</td>
                                                                    <td className="p-3 font-semibold text-primary">{emp.name}</td>
                                                                    <td className="p-3">{emp.organizationName}</td>
                                                                    <td className="p-3">{emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : '-'}</td>
                                                                    <td className="p-3">{emp.branch}</td>
                                                                    <td className="p-3">{emp.designation}</td>
                                                                    <td className="p-3 text-xs font-bold uppercase">{emp.employmentStatus}</td>
                                                                    <td className="p-3">
                                                                        {(() => {
                                                                            const m = Object.keys(extra).find(k => ['mobile', 'phone', 'contact', 'tele'].some(kw => k.toLowerCase().includes(kw)));
                                                                            return m ? extra[m] : '-';
                                                                        })()}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <Button variant="secondary" disabled>
                                                Marked as Resigned (Display Only)
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Status Changes */}
                                {comparisonResult.statusChanges.length > 0 && (
                                    <Card className="border-l-4 border-l-primary">
                                        <CardHeader>
                                            <CardTitle className="flex items-center text-primary">
                                                <ArrowRight className="mr-2 h-5 w-5" />
                                                Status Changes ({comparisonResult.statusChanges.length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="mb-4 text-sm text-muted-foreground">
                                                Employees moved from ON TRIAL to PERMANENT.
                                            </p>
                                            <div className="max-h-80 overflow-auto border rounded-md mb-4 bg-background">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-muted sticky top-0 z-10 shadow-sm">
                                                        <tr>
                                                            <th className="p-3 font-bold border-b">Sr. No</th>
                                                            <th className="p-3 font-bold border-b">Unique ID</th>
                                                            <th className="p-3 font-bold border-b">Employee ID</th>
                                                            <th className="p-3 font-bold border-b">Employee Name</th>
                                                            <th className="p-3 font-bold border-b">Organization</th>
                                                            <th className="p-3 font-bold border-b">DOJ</th>
                                                            <th className="p-3 font-bold border-b">Branch</th>
                                                            <th className="p-3 font-bold border-b">Designation</th>
                                                            <th className="p-3 font-bold border-b">Status</th>
                                                            <th className="p-3 font-bold border-b">Mobile Number</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {comparisonResult.statusChanges.map((emp: any, i: number) => {
                                                            const extra = emp.additionalData ? JSON.parse(emp.additionalData) : {};
                                                            return (
                                                                <tr key={i} className="border-t hover:bg-muted/30 transition-colors">
                                                                    <td className="p-3 text-muted-foreground">{i + 1}</td>
                                                                    <td className="p-3 font-mono">{emp.uniqueId}</td>
                                                                    <td className="p-3">{emp.employeeId || '-'}</td>
                                                                    <td className="p-3 font-semibold text-primary">{emp.name}</td>
                                                                    <td className="p-3">{activeOrg}</td>
                                                                    <td className="p-3">{emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : '-'}</td>
                                                                    <td className="p-3">{emp.branch}</td>
                                                                    <td className="p-3">{emp.designation}</td>
                                                                    <td className="p-3 text-xs font-bold uppercase">
                                                                        <span className="text-destructive">{emp.oldStatus}</span>
                                                                        <ArrowRight className="inline mx-2 h-3 w-3" />
                                                                        <span className="text-success">{emp.newStatus}</span>
                                                                    </td>
                                                                    <td className="p-3">
                                                                        {extra['Mobile Number'] || '-'}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="flex gap-4">
                                                <Button onClick={() => handleApply('status', comparisonResult.statusChanges)} disabled={isApplying}>
                                                    Yes, Update Status
                                                </Button>
                                                <Button variant="outline" onClick={() => setComparisonResult({ ...comparisonResult, statusChanges: [] })}>
                                                    No, Keep Old Status
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Transfers */}
                                {comparisonResult.transfers.length > 0 && (
                                    <Card className="border-l-4 border-l-accent">
                                        <CardHeader>
                                            <CardTitle className="flex items-center text-accent">
                                                <ArrowRight className="mr-2 h-5 w-5" />
                                                Inter-Organization Transfers ({comparisonResult.transfers.length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="mb-4 text-sm text-muted-foreground">
                                                Employees transferred from other organizations to {org.name}.
                                            </p>
                                            <div className="max-h-80 overflow-auto border rounded-md mb-4 bg-background">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-muted sticky top-0 z-10 shadow-sm">
                                                        <tr>
                                                            <th className="p-3 font-bold border-b">Sr. No</th>
                                                            <th className="p-3 font-bold border-b">Unique ID</th>
                                                            <th className="p-3 font-bold border-b">Employee ID</th>
                                                            <th className="p-3 font-bold border-b">Employee Name</th>
                                                            <th className="p-3 font-bold border-b">Organization</th>
                                                            <th className="p-3 font-bold border-b">DOJ</th>
                                                            <th className="p-3 font-bold border-b">Branch</th>
                                                            <th className="p-3 font-bold border-b">Designation</th>
                                                            <th className="p-3 font-bold border-b">Status</th>
                                                            <th className="p-3 font-bold border-b">Mobile Number</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {comparisonResult.transfers.map((emp: any, i: number) => {
                                                            const extra = emp.additionalData ? JSON.parse(emp.additionalData) : {};
                                                            return (
                                                                <tr key={i} className="border-t hover:bg-muted/30 transition-colors">
                                                                    <td className="p-3 text-muted-foreground">{i + 1}</td>
                                                                    <td className="p-3 font-mono">{emp.uniqueId}</td>
                                                                    <td className="p-3">{emp.employeeId || '-'}</td>
                                                                    <td className="p-3 font-semibold text-primary">{emp.name}</td>
                                                                    <td className="p-3">
                                                                        <span className="text-muted-foreground">{emp.oldOrg}</span>
                                                                        <ArrowRight className="inline mx-2 h-3 w-3" />
                                                                        <span className="font-bold">{emp.newOrg}</span>
                                                                    </td>
                                                                    <td className="p-3">{emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : '-'}</td>
                                                                    <td className="p-3">{emp.branch}</td>
                                                                    <td className="p-3">{emp.designation}</td>
                                                                    <td className="p-3 text-xs font-bold uppercase">{emp.status}</td>
                                                                    <td className="p-3">
                                                                        {extra['Mobile Number'] || '-'}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="flex gap-4">
                                                <Button onClick={() => handleApply('transfer', comparisonResult.transfers)} disabled={isApplying}>
                                                    Yes, Confirm Transfer
                                                </Button>
                                                <Button variant="outline" onClick={() => setComparisonResult({ ...comparisonResult, transfers: [] })}>
                                                    No, Ignore
                                                </Button>
                                            </div>
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
