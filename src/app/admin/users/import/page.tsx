'use client';

import { useFormState } from 'react-dom';
import { importUsers } from '../actions';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from 'react';

const initialState: any = { message: "", error: "", success: false };

export default function ImportUsersPage() {
    const [state, formAction] = useFormState(importUsers, initialState);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Bulk Import Employees</h1>
                <p className="text-muted-foreground mt-2">
                    Upload an Excel file (.xlsx) to add multiple employees at once.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Upload File</CardTitle>
                    <CardDescription>
                        Please ensure your file follows the required format: <strong>Name, Email, Role (optional)</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-6">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <div className="flex items-center justify-center w-full">
                                <label htmlFor="file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">XLSX or XLS (MAX. 5MB)</p>
                                    </div>
                                    <input id="file" name="file" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} required />
                                </label>
                            </div>
                            {fileName && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                                    <FileSpreadsheet className="h-4 w-4" />
                                    {fileName}
                                </div>
                            )}
                        </div>

                        <Button type="submit" className="w-full">
                            <Upload className="mr-2 h-4 w-4" /> Import Employees
                        </Button>

                        {state?.success && (
                            <div className="p-4 rounded-md bg-green-500/10 text-green-600 flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 mt-0.5" />
                                <div className="text-sm">{state.message}</div>
                            </div>
                        )}

                        {state?.error && (
                            <div className="p-4 rounded-md bg-destructive/10 text-destructive flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 mt-0.5" />
                                <div className="text-sm">{state.error}</div>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>

            <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="font-semibold mb-2">Instructions</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>File must be in <strong>.xlsx</strong> format.</li>
                    <li>First row must contain headers: <strong>Name</strong>, <strong>Email</strong>.</li>
                    <li><strong>Role</strong> column is optional (defaults to 'EMPLOYEE').</li>
                    <li>Duplicate emails will be skipped automatically.</li>
                    <li>Default password for new users is <strong>Welcome123!</strong></li>
                </ul>
            </div>
        </div>
    );
}
