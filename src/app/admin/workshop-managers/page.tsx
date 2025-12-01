'use client';

import { useState, useEffect } from 'react';
import { UserCog, Plus, Edit2, Trash2, Mail, MapPin, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkshopManager {
    id: string;
    name: string;
    email: string;
    location: string;
    isActive: boolean;
    createdAt: string;
}

export default function WorkshopManagersPage() {
    const [managers, setManagers] = useState<WorkshopManager[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingManager, setEditingManager] = useState<WorkshopManager | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        location: '',
    });

    const fetchManagers = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/training/workshop-managers');
            const data = await response.json();
            setManagers(data.workshopManagers || []);
        } catch (error) {
            console.error('Error fetching managers:', error);
            toast.error('Failed to load workshop managers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManagers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const toastId = toast.loading(editingManager ? 'Updating...' : 'Creating...');

        try {
            if (editingManager) {
                const response = await fetch('/api/training/workshop-managers', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingManager.id, ...formData }),
                });

                if (response.ok) {
                    toast.success('Workshop Manager updated successfully! ✅', { id: toastId });
                    fetchManagers();
                    closeModal();
                } else {
                    const data = await response.json();
                    toast.error(data.error || 'Failed to update', { id: toastId });
                }
            } else {
                const response = await fetch('/api/training/workshop-managers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    toast.success('Workshop Manager created successfully! 🎉', { id: toastId });
                    fetchManagers();
                    closeModal();
                } else {
                    const data = await response.json();
                    toast.error(data.error || 'Failed to create', { id: toastId });
                }
            }
        } catch (error) {
            toast.error('An error occurred', { id: toastId });
        }
    };

    const handleDelete = async (id: string, name: string) => {
        const toastId = toast.loading('Deleting...');

        try {
            const response = await fetch(`/api/training/workshop-managers?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success(`${name} deleted successfully!`, { id: toastId });
                fetchManagers();
            } else {
                toast.error('Failed to delete', { id: toastId });
            }
        } catch (error) {
            toast.error('An error occurred', { id: toastId });
        }
    };

    const toggleActive = async (manager: WorkshopManager) => {
        const toastId = toast.loading('Updating status...');

        try {
            const response = await fetch('/api/training/workshop-managers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: manager.id, isActive: !manager.isActive }),
            });

            if (response.ok) {
                toast.success(
                    `${manager.name} is now ${!manager.isActive ? 'active' : 'inactive'}`,
                    { id: toastId }
                );
                fetchManagers();
            } else {
                toast.error('Failed to update status', { id: toastId });
            }
        } catch (error) {
            toast.error('An error occurred', { id: toastId });
        }
    };

    const openModal = (manager?: WorkshopManager) => {
        if (manager) {
            setEditingManager(manager);
            setFormData({
                name: manager.name,
                email: manager.email,
                location: manager.location,
            });
        } else {
            setEditingManager(null);
            setFormData({ name: '', email: '', location: '' });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingManager(null);
        setFormData({ name: '', email: '', location: '' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/10 to-accent/10 p-8">
            <Toaster position="top-right" richColors />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-6xl mx-auto"
            >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-indigo-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-3">
                                <UserCog className="text-primary" size={40} />
                                Workshop Managers
                            </h1>
                            <p className="text-gray-600 mt-2 flex items-center gap-2">
                                <Sparkles size={16} className="text-accent" />
                                Manage Workshop Managers for each location
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openModal()}
                            className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground px-5 py-3 rounded-xl hover:from-primary/90 hover:to-accent/90 transition-all shadow-lg font-semibold"
                        >
                            <Plus size={18} />
                            Add New
                        </motion.button>
                    </div>

                    {loading ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16"
                        >
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-gray-600 text-lg">Loading workshop managers...</p>
                        </motion.div>
                    ) : managers.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-300"
                        >
                            <UserCog className="mx-auto text-gray-400 mb-4" size={56} />
                            <p className="text-gray-600 text-lg font-medium">No Workshop Managers configured yet</p>
                            <p className="text-gray-500 text-sm mt-2">Click "Add New" to create your first workshop manager</p>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <AnimatePresence>
                                {managers.map((manager, idx) => (
                                    <motion.div
                                        key={manager.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`relative border-2 rounded-xl p-6 transition-all hover:shadow-xl ${manager.isActive
                                                ? 'bg-gradient-to-br from-background to-primary/10 border-primary/20 shadow-lg'
                                                : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 opacity-75'
                                            }`}
                                    >
                                        {manager.isActive && (
                                            <div className="absolute top-3 right-3">
                                                <span className="flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-xl text-gray-800 mb-2">{manager.name}</h3>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-gray-600 text-sm bg-white/50 px-3 py-2 rounded-lg">
                                                        <Mail size={14} className="text-indigo-600" />
                                                        {manager.email}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600 text-sm bg-white/50 px-3 py-2 rounded-lg">
                                                        <MapPin size={14} className="text-purple-600" />
                                                        {manager.location}
                                                    </div>
                                                </div>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => toggleActive(manager)}
                                                className="ml-3 p-2 rounded-lg hover:bg-white/50 transition-colors"
                                            >
                                                {manager.isActive ? (
                                                    <CheckCircle size={24} className="text-green-600" />
                                                ) : (
                                                    <XCircle size={24} className="text-red-400" />
                                                )}
                                            </motion.button>
                                        </div>

                                        <div className="flex gap-2 mt-4">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => openModal(manager)}
                                                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 text-sm font-semibold shadow-md"
                                            >
                                                <Edit2 size={14} />
                                                Edit
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    if (confirm(`Are you sure you want to delete ${manager.name}?`)) {
                                                        handleDelete(manager.id, manager.name);
                                                    }
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 text-sm font-semibold shadow-md"
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200"
                        >
                            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                {editingManager ? 'Edit Workshop Manager' : 'Add Workshop Manager'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-5">
                                    <label className="block text-gray-700 font-semibold mb-2">Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="Enter full name"
                                        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div className="mb-5">
                                    <label className="block text-gray-700 font-semibold mb-2">Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        placeholder="manager@company.com"
                                        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-gray-700 font-semibold mb-2">Location *</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        required
                                        placeholder="Mumbai, Delhi, etc."
                                        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                                    >
                                        {editingManager ? 'Update' : 'Create'}
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300"
                                    >
                                        Cancel
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
