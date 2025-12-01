'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadResult {
    success: boolean;
    batchId?: string;
    totalProcessed?: number;
    successCount?: number;
    failedCount?: number;
    untrainedCount?: number;
    summaryByLocation?: Array<{ location: string; count: number }>;
    errors?: string[];
    error?: string;
}

export default function ExcelUploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
            setFile(droppedFile);
            setResult(null);
            toast.success('File selected successfully!');
        } else {
            toast.error('Please upload an Excel file (.xlsx or .xls)');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
            toast.success('File selected successfully!');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setResult(null);
        toast.loading('Processing Excel file...', { id: 'upload' });

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/training/employees', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            setResult(data);

            if (data.success) {
                toast.success(
                    `Successfully processed ${data.successCount} employees! Found ${data.untrainedCount} untrained.`,
                    { id: 'upload', duration: 5000 }
                );
                setFile(null);
                const fileInput = document.getElementById('file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            } else {
                toast.error(data.error || 'Upload failed', { id: 'upload' });
            }
        } catch (error) {
            toast.error('Failed to upload file. Please try again.', { id: 'upload' });
            setResult({
                success: false,
                error: 'Failed to upload file. Please try again.',
            });
        } finally {
            setUploading(false);
        }
    };

    const handleSendRequests = async (locations?: string[]) => {
        if (!result?.batchId) return;

        const toastId = toast.loading('Sending approval requests to Workshop Managers...');

        try {
            const response = await fetch('/api/training/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batchId: result.batchId,
                    locations,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(
                    `✅ Sent ${data.totalSent} training approval requests to ${data.locationsProcessed} locations!`,
                    { id: toastId, duration: 6000 }
                );
            } else {
                toast.error(`Error: ${data.error || 'Failed to send requests'}`, { id: toastId });
            }
        } catch (error) {
            toast.error('Failed to send requests. Please try again.', { id: toastId });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/10 to-accent/10 p-8">
            <Toaster position="top-right" richColors />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-5xl mx-auto"
            >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-indigo-100">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2 flex items-center gap-3">
                            <FileSpreadsheet className="text-primary" size={40} />
                            Employee Training Management
                        </h1>
                        <p className="text-gray-600 mb-8 flex items-center gap-2">
                            <Sparkles size={16} className="text-accent" />
                            Upload Excel file to identify untrained employees
                        </p>
                    </motion.div>

                    {/* Upload Section */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-2xl p-10 mb-6 text-center transition-all duration-300 ${isDragging
                                ? 'border-primary bg-primary/10 scale-105 shadow-lg'
                                : file
                                    ? 'border-success bg-success/10'
                                    : 'border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-primary/50 hover:shadow-md'
                            }`}
                    >
                        <AnimatePresence mode="wait">
                            {!file ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <Upload className="mx-auto text-primary/50 mb-4" size={56} />
                                    <label htmlFor="file-input" className="cursor-pointer">
                                        <span className="text-xl font-semibold text-primary hover:text-primary/90 transition-colors">
                                            Choose an Excel file
                                        </span>
                                        <p className="text-gray-500 mt-2">or drag and drop here</p>
                                        <input
                                            id="file-input"
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                    <p className="text-sm text-gray-400 mt-4">Supports .xlsx and .xls files</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="file"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex items-center justify-center gap-4"
                                >
                                    <CheckCircle className="text-success" size={40} />
                                    <div className="text-left">
                                        <p className="font-bold text-lg text-gray-800">{file.name}</p>
                                        <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setFile(null);
                                            setResult(null);
                                        }}
                                        className="ml-4 text-destructive hover:text-destructive/90 font-medium"
                                    >
                                        Remove
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:from-primary/90 hover:to-accent/90 disabled:from-muted/50 disabled:to-muted/50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Upload size={24} />
                                Upload & Process
                            </>
                        )}
                    </motion.button>

                    {/* Result Section */}
                    <AnimatePresence>
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                                className="mt-8"
                            >
                                {result.success ? (
                                    <div className="bg-gradient-to-br from-success/10 to-success/5 border-2 border-success/20 rounded-2xl p-8 shadow-lg">
                                        <div className="flex items-start gap-4">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.2, type: 'spring' }}
                                            >
                                                <CheckCircle className="text-success flex-shrink-0" size={32} />
                                            </motion.div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-success text-2xl mb-4 flex items-center gap-2">
                                                    Upload Successful
                                                    <Sparkles size={20} className="text-success" />
                                                </h3>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                                    {[
                                                        { label: 'Total Processed', value: result.totalProcessed, borderColor: 'border-primary', textColor: 'text-primary', textBoldColor: 'text-primary-foreground' },
                                                        { label: 'Successful', value: result.successCount, borderColor: 'border-success', textColor: 'text-success', textBoldColor: 'text-success-foreground' },
                                                        { label: 'Untrained', value: result.untrainedCount, borderColor: 'border-warning', textColor: 'text-warning', textBoldColor: 'text-warning-foreground' },
                                                        { label: 'Failed', value: result.failedCount, borderColor: 'border-destructive', textColor: 'text-destructive', textBoldColor: 'text-destructive-foreground' },
                                                    ].map((stat, idx) => (
                                                        <motion.div
                                                            key={stat.label}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.3 + idx * 0.1 }}
                                                            className={`bg-white rounded-xl p-4 shadow-md border-l-4 ${stat.borderColor}`}
                                                        >
                                                            <p className={`text-sm ${stat.textColor} font-medium mb-1`}>
                                                                {stat.label}
                                                            </p>
                                                            <p className={`text-3xl font-bold ${stat.textBoldColor}`}>
                                                                {stat.value}
                                                            </p>
                                                        </motion.div>
                                                    ))}
                                                </div>

                                                {result.summaryByLocation && result.summaryByLocation.length > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: 0.6 }}
                                                    >
                                                        <h4 className="font-bold text-success mb-3 text-lg flex items-center gap-2">
                                                            <TrendingUp size={20} />
                                                            Untrained by Location
                                                        </h4>
                                                        <div className="bg-white rounded-xl p-5 shadow-md mb-6">
                                                            {result.summaryByLocation.map((item, idx) => (
                                                                <motion.div
                                                                    key={item.location}
                                                                    initial={{ opacity: 0, x: -20 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ delay: 0.7 + idx * 0.1 }}
                                                                    className="flex justify-between items-center py-3 border-b last:border-b-0"
                                                                >
                                                                    <span className="font-semibold text-gray-800 flex items-center gap-2">
                                                                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                                                                        {item.location}
                                                                    </span>
                                                                    <span className="bg-gradient-to-r from-warning to-destructive text-primary-foreground px-4 py-2 rounded-full font-bold shadow-md">
                                                                        {item.count} untrained
                                                                    </span>
                                                                </motion.div>
                                                            ))}
                                                        </div>

                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => handleSendRequests()}
                                                            className="w-full bg-gradient-to-r from-accent via-primary to-primary/90 text-primary-foreground py-4 rounded-xl font-bold text-lg hover:from-accent/90 hover:via-primary/90 hover:to-primary transition-all shadow-xl hover:shadow-2xl"
                                                        >
                                                            📧 Send Approval Requests to Workshop Managers
                                                        </motion.button>
                                                    </motion.div>
                                                )}

                                                {result.errors && result.errors.length > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="mt-4"
                                                    >
                                                        <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                                                            <AlertCircle size={18} />
                                                            Errors Found
                                                        </h4>
                                                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 max-h-40 overflow-y-auto">
                                                            {result.errors.map((err, idx) => (
                                                                <p key={idx} className="text-sm text-destructive mb-1">
                                                                    • {err}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-2 border-destructive/20 rounded-2xl p-8 shadow-lg"
                                    >
                                        <div className="flex items-start gap-4">
                                            <AlertCircle className="text-destructive flex-shrink-0" size={32} />
                                            <div>
                                                <h3 className="font-bold text-destructive text-2xl mb-2">Upload Failed</h3>
                                                <p className="text-destructive text-lg">{result.error || 'An unknown error occurred'}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
