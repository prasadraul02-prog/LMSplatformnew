'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ChevronRight, Keyboard } from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface EmployeeRequest {
    id: string;
    employeeId: string;
    name: string;
    department: string | null;
    designation: string | null;
    location: string;
    email: string | null;
    phone: string | null;
    approveToken: string;
    rejectToken: string;
}

export default function QuickApprovePage() {
    const params = useParams();
    const requestId = params.requestId as string;

    const [requests, setRequests] = useState<EmployeeRequest[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [wmName, setWmName] = useState('');
    const [location, setLocation] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, [requestId]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (processing || requests.length === 0) return;

            if (e.key === 'a' || e.key === 'A') {
                handleAction('approve');
            } else if (e.key === 'r' || e.key === 'R') {
                handleAction('reject');
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentIndex, processing, requests]);

    const fetchRequests = async () => {
        try {
            const response = await fetch(`/api/training/quick-approve/${requestId}`);
            const data = await response.json();

            if (data.success) {
                setRequests(data.requests);
                setWmName(data.wmName);
                setLocation(data.location);
            } else {
                toast.error(data.error || 'Failed to load requests');
            }
        } catch (error) {
            toast.error('Failed to load approval requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'approve' | 'reject') => {
        if (currentIndex >= requests.length || processing) return;

        const currentRequest = requests[currentIndex];
        const token = action === 'approve' ? currentRequest.approveToken : currentRequest.rejectToken;

        setProcessing(true);

        try {
            const response = await fetch(`/api/training/action/${token}/${action}`);
            const result = await response.json();

            if (result.success) {
                toast.success(`${currentRequest.name} ${action === 'approve' ? 'approved' : 'rejected'}!`);

                // Move to next employee
                if (currentIndex < requests.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                } else {
                    toast.success('All employees processed! 🎉');
                }
            } else {
                toast.error(result.error || 'Action failed');
            }
        } catch (error) {
            toast.error('Network error. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/10 to-accent/10">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading approval requests...</p>
                </div>
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/10 to-accent/10">
                <div className="text-center bg-white p-12 rounded-2xl shadow-xl">
                    <CheckCircle className="h-20 w-20 text-success mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">All Done!</h2>
                    <p className="text-gray-600">No pending approval requests found.</p>
                </div>
            </div>
        );
    }

    const currentEmployee = requests[currentIndex];
    const progress = ((currentIndex) / requests.length) * 100;
    const remaining = requests.length - currentIndex;

    return (
        <>
            <Toaster position="top-center" richColors />
            <div className="min-h-screen bg-gradient-to-br from-background via-primary/10 to-accent/10 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-xl p-6 mb-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                    Quick Approval
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Hello <span className="font-semibold">{wmName}</span> • {location}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-primary">{remaining}</div>
                                <div className="text-sm text-gray-500">Remaining</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-2 text-center">
                            {currentIndex + 1} of {requests.length} employees
                        </p>
                    </motion.div>

                    {/* Employee Card */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="bg-white rounded-2xl shadow-xl p-8"
                        >
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Employee ID</p>
                                    <p className="text-lg font-bold text-gray-800">{currentEmployee.employeeId}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Name</p>
                                    <p className="text-lg font-bold text-gray-800">{currentEmployee.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Department</p>
                                    <p className="text-md text-gray-700">{currentEmployee.department || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Designation</p>
                                    <p className="text-md text-gray-700">{currentEmployee.designation || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Location</p>
                                    <p className="text-md text-gray-700">{currentEmployee.location}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                                    <p className="text-md text-gray-700">{currentEmployee.phone || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAction('approve')}
                                    disabled={processing}
                                    className="flex-1 bg-gradient-to-r from-success to-success/90 text-success-foreground py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="h-6 w-6" />
                                    Approve
                                    <span className="text-sm opacity-80">(Press A)</span>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAction('reject')}
                                    disabled={processing}
                                    className="flex-1 bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <XCircle className="h-6 w-6" />
                                    Reject
                                    <span className="text-sm opacity-80">(Press R)</span>
                                </motion.button>
                            </div>

                            {processing && (
                                <div className="mt-4 text-center">
                                    <div className="inline-flex items-center gap-2 text-primary">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                        <span className="font-medium">Processing...</span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Keyboard Shortcuts Help */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-6 bg-white rounded-xl shadow-lg p-4"
                    >
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Keyboard className="h-5 w-5 text-primary" />
                            <span className="font-semibold">Keyboard Shortcuts:</span>
                            <kbd className="px-2 py-1 bg-gray-100 rounded">A</kbd>
                            <span>Approve</span>
                            <kbd className="px-2 py-1 bg-gray-100 rounded">R</kbd>
                            <span>Reject</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
}
