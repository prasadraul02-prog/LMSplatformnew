'use client';

import { useState, useEffect } from 'react';
import { Users, MapPin, CheckCircle, XCircle, Clock, RefreshCw, TrendingUp, Activity } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Employee {
    id: string;
    employeeId: string;
    name: string;
    location: string;
    department?: string;
    designation?: string;
    email?: string;
    phone?: string;
    trainingLevel: string;
}

interface WorkshopManager {
    id: string;
    name: string;
    email: string;
    location: string;
    isActive: boolean;
}

interface TrainingRequest {
    id: string;
    status: string;
    trainingLocation: string;
    respondedAt?: string;
    employee: Employee;
    workshopManager?: WorkshopManager;
}

export default function TrainingMonitor() {
    const [requests, setRequests] = useState<TrainingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'SENT' | 'APPROVED' | 'REJECTED'>('ALL');
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const fetchRequests = async (showToast = false) => {
        setLoading(true);
        try {
            const url = filter === 'ALL'
                ? '/api/training/requests'
                : `/api/training/requests?status=${filter}`;
            const response = await fetch(url);
            const data = await response.json();
            setRequests(data.requests || []);
            setLastRefresh(new Date());
            if (showToast) {
                toast.success('Data refreshed successfully!');
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
            if (showToast) {
                toast.error('Failed to refresh data');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
        const interval = setInterval(() => fetchRequests(), 10000);
        return () => clearInterval(interval);
    }, [filter]);

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { color: string; bgColor: string; icon: any; label: string }> = {
            PENDING: { color: 'text-gray-800', bgColor: 'bg-gray-100', icon: Clock, label: 'Pending' },
            SENT: { color: 'text-blue-800', bgColor: 'bg-blue-100', icon: Activity, label: 'Sent' },
            APPROVED: { color: 'text-green-800', bgColor: 'bg-green-100', icon: CheckCircle, label: 'Approved' },
            REJECTED: { color: 'text-red-800', bgColor: 'bg-red-100', icon: XCircle, label: 'Rejected' },
        };

        const badge = badges[status] || badges.PENDING;
        const Icon = badge.icon;

        return (
            <motion.span
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${badge.bgColor} ${badge.color} shadow-sm`}
            >
                <Icon size={14} />
                {badge.label}
            </motion.span>
        );
    };

    const filterButtons = [
        { value: 'ALL', label: 'All', icon: Users },
        { value: 'PENDING', label: 'Pending', icon: Clock },
        { value: 'SENT', label: 'Sent', icon: Activity },
        { value: 'APPROVED', label: 'Approved', icon: CheckCircle },
        { value: 'REJECTED', label: 'Rejected', icon: XCircle },
    ] as const;

    const stats = {
        total: requests.length,
        pending: requests.filter((r) => r.status === 'SENT' || r.status === 'PENDING').length,
        approved: requests.filter((r) => r.status === 'APPROVED').length,
        rejected: requests.filter((r) => r.status === 'REJECTED').length,
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-100 p-8">
            <Toaster position="top-right" richColors />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto"
            >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-purple-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                                <Users className="text-purple-600" size={40} />
                                Training Request Monitor
                            </h1>
                            <p className="text-gray-600 mt-2 flex items-center gap-2">
                                <Activity size={16} className="text-indigo-500 animate-pulse" />
                                Real-time tracking of training approval requests
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Last updated: {lastRefresh.toLocaleTimeString()}
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => fetchRequests(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg font-semibold"
                        >
                            <RefreshCw size={18} />
                            Refresh
                        </motion.button>
                    </div>

                    {/* Stats Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
                    >
                        {[
                            { label: 'Total', value: stats.total, color: 'gray', icon: Users },
                            { label: 'Pending', value: stats.pending, color: 'blue', icon: Clock },
                            { label: 'Approved', value: stats.approved, color: 'green', icon: CheckCircle },
                            { label: 'Rejected', value: stats.rejected, color: 'red', icon: XCircle },
                        ].map((stat, idx) => {
                            const Icon = stat.icon;
                            return (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 + idx * 0.1 }}
                                    className={`bg-gradient-to-br from-${stat.color}-50 to-white rounded-xl p-5 shadow-md border-l-4 border-${stat.color}-500 hover:shadow-lg transition-shadow`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className={`text-sm text-${stat.color}-700 font-medium mb-1`}>{stat.label}</p>
                                            <p className={`text-3xl font-bold text-${stat.color}-900`}>{stat.value}</p>
                                        </div>
                                        <Icon className={`text-${stat.color}-500 opacity-50`} size={24} />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* Filters */}
                    <div className="flex gap-2 mb-6 flex-wrap">
                        {filterButtons.map((btn, idx) => {
                            const Icon = btn.icon;
                            return (
                                <motion.button
                                    key={btn.value}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + idx * 0.05 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setFilter(btn.value)}
                                    className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${filter === btn.value
                                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                                            : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg border border-gray-200'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {btn.label}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Loading State */}
                    {loading && requests.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16"
                        >
                            <RefreshCw className="animate-spin mx-auto text-purple-600 mb-4" size={48} />
                            <p className="text-gray-600 text-lg">Loading training requests...</p>
                        </motion.div>
                    ) : requests.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-300"
                        >
                            <Users className="mx-auto text-gray-400 mb-4" size={56} />
                            <p className="text-gray-600 text-lg font-medium">No training requests found</p>
                            <p className="text-gray-500 text-sm mt-2">Upload employee data to get started</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="overflow-hidden rounded-xl border border-gray-200 shadow-lg"
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white">
                                        <tr>
                                            <th className="px-4 py-4 text-left font-semibold">Employee ID</th>
                                            <th className="px-4 py-4 text-left font-semibold">Name</th>
                                            <th className="px-4 py-4 text-left font-semibold">Department</th>
                                            <th className="px-4 py-4 text-left font-semibold">Location</th>
                                            <th className="px-4 py-4 text-left font-semibold">Workshop Manager</th>
                                            <th className="px-4 py-4 text-left font-semibold">Status</th>
                                            <th className="px-4 py-4 text-left font-semibold">Responded</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence>
                                            {requests.map((req, idx) => (
                                                <motion.tr
                                                    key={req.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    className="border-b hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent transition-colors"
                                                >
                                                    <td className="px-4 py-4 font-semibold text-gray-800">{req.employee.employeeId}</td>
                                                    <td className="px-4 py-4 font-medium">{req.employee.name}</td>
                                                    <td className="px-4 py-4 text-gray-600">{req.employee.department || 'N/A'}</td>
                                                    <td className="px-4 py-4">
                                                        <span className="flex items-center gap-1 text-gray-700 bg-indigo-50 px-3 py-1 rounded-full w-fit">
                                                            <MapPin size={14} className="text-purple-600" />
                                                            {req.trainingLocation}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-gray-600">
                                                        {req.workshopManager ? (
                                                            <div>
                                                                <p className="font-medium text-gray-800">{req.workshopManager.name}</p>
                                                                <p className="text-xs text-gray-500">{req.workshopManager.email}</p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 italic">Not Assigned</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4">{getStatusBadge(req.status)}</td>
                                                    <td className="px-4 py-4 text-gray-600 text-sm">
                                                        {req.respondedAt
                                                            ? new Date(req.respondedAt).toLocaleString()
                                                            : '-'
                                                        }
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
