'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadMasterDatabase, resetSystem } from '../actions';
import { toast } from "sonner";
import { Loader2, Upload, Download, Trash2 } from "lucide-react";

export default function MasterDatabase({ data }: { data: any[] }) {
    const [isUploading, setIsUploading] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', e.target.files[0]);

        const result = await uploadMasterDatabase(formData);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.error);
        }
        setIsUploading(false);
        e.target.value = ''; // Reset input
    };

    const handleReset = async () => {
        if (!confirm("Are you sure you want to RESET the entire system? This will delete all Master HR Data.")) return;

        setIsResetting(true);
        const result = await resetSystem();
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.error);
        }
        setIsResetting(false);
    };

    const handleExport = () => {
        const headers = ["Unique ID", "Name", "Organization", "Status", "Branch", "Designation", "DOJ"];
        const csvContent = [
            headers.join(","),
            ...data.map(emp => [
                emp.uniqueId,
                `"${emp.name}"`,
                `"${emp.organizationName}"`,
                emp.employmentStatus,
                `"${emp.branch}"`,
                `"${emp.designation}"`,
                emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : ''
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "master_hr_database.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card className="w-full mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Master HR Database ({data.length} Employees)</CardTitle>
                <div className="flex gap-2">
                    <div className="relative">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isUploading}
                        />
                        <Button variant="outline" disabled={isUploading}>
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Import Excel
                        </Button>
                    </div>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button variant="destructive" onClick={handleReset} disabled={isResetting}>
                        {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Reset System
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="p-3 font-medium">Unique ID</th>
                                <th className="p-3 font-medium">Name</th>
                                <th className="p-3 font-medium">Organization</th>
                                <th className="p-3 font-medium">Status</th>
                                <th className="p-3 font-medium">Branch</th>
                                <th className="p-3 font-medium">Designation</th>
                                <th className="p-3 font-medium">DOJ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                        No data found. Please import the Master HR Database.
                                    </td>
                                </tr>
                            ) : (
                                data.slice(0, 100).map((emp) => (
                                    <tr key={emp.id} className="border-t hover:bg-muted/50">
                                        <td className="p-3">{emp.uniqueId}</td>
                                        <td className="p-3 font-medium">{emp.name}</td>
                                        <td className="p-3">{emp.organizationName}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs ${emp.employmentStatus.toLowerCase().includes('permanent') ? 'bg-green-100 text-green-700' :
                                                    emp.employmentStatus.toLowerCase().includes('trial') ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {emp.employmentStatus}
                                            </span>
                                        </td>
                                        <td className="p-3">{emp.branch}</td>
                                        <td className="p-3">{emp.designation}</td>
                                        <td className="p-3">{emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : '-'}</td>
                                    </tr>
                                ))
                            )}
                            {data.length > 100 && (
                                <tr>
                                    <td colSpan={7} className="p-3 text-center text-muted-foreground text-xs">
                                        Showing first 100 of {data.length} records
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
