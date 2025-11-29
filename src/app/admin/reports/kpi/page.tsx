"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LocationStats {
    location: string;
    totalEmployees: number;
    basicTrained: number;
    basicPercent: number;
    advanceTrained: number;
    advancePercent: number;
    expertTrained: number;
    expertPercent: number;
    untrained: number;
}

interface OverallStats {
    avgBasicPercent: number;
    avgAdvancePercent: number;
    avgExpertPercent: number;
    totalUntrained: number;
}

export default function KPIReportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<LocationStats[] | null>(null);
    const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Helper function to find a column name loosely matching a list of possible names
    const findColumnName = (headers: string[], possibleNames: string[]): string | undefined => {
        const lowerHeaders = headers.map(h => h.toLowerCase().trim());
        const lowerPossibleNames = possibleNames.map(n => n.toLowerCase().trim());

        for (const name of lowerPossibleNames) {
            const index = lowerHeaders.findIndex(h => h === name || h.includes(name));
            if (index !== -1) {
                return headers[index];
            }
        }
        return undefined;
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (uploadedFile) {
            setFile(uploadedFile);
            setError(null);
            setStats(null);
            setOverallStats(null);
        }
    };

    const processFile = async () => {
        if (!file) {
            setError("Please upload an Excel file first.");
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Get headers first to perform loose matching
            const jsonDataRaw = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (jsonDataRaw.length === 0) {
                throw new Error("The uploaded file is empty.");
            }

            const headers = jsonDataRaw[0] as string[];

            // Define possible column names
            const locationCol = findColumnName(headers, ['dealer location', 'location', 'branch', 'dealer', 'city', 'site']);
            const trainingLevelCol = findColumnName(headers, ['training level', 'level', 'training', 'status', 'grade', 'competency']);
            // Employee ID is not strictly needed for calculation but good to check if it exists for validation
            // const employeeIdCol = findColumnName(headers, ['employee id', 'emp id', 'id', 'user id', 'code']);

            if (!locationCol || !trainingLevelCol) {
                setError(`Could not automatically detect required columns. Found headers: ${headers.join(", ")}. Please ensure columns for 'Location' and 'Training Level' exist.`);
                setIsProcessing(false);
                return;
            }

            // Now parse with the detected keys
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const locationMap = new Map<string, {
                total: number;
                basic: number;
                advance: number;
                expert: number;
                untrained: number;
            }>();

            jsonData.forEach((row: any) => {
                const location = row[locationCol] ? String(row[locationCol]).trim() : "";
                if (!location) return; // Skip rows without location

                if (!locationMap.has(location)) {
                    locationMap.set(location, { total: 0, basic: 0, advance: 0, expert: 0, untrained: 0 });
                }

                const stats = locationMap.get(location)!;
                stats.total += 1;

                const level = row[trainingLevelCol] ? String(row[trainingLevelCol]).trim().toLowerCase() : "";

                if (level.includes("expert")) {
                    stats.expert += 1;
                    stats.advance += 1; // Expert implies Advance
                    stats.basic += 1;   // Expert implies Basic
                } else if (level.includes("advance")) {
                    stats.advance += 1;
                    stats.basic += 1;   // Advance implies Basic
                } else if (level.includes("basic")) {
                    stats.basic += 1;
                } else {
                    stats.untrained += 1;
                }
            });

            const locationStats: LocationStats[] = [];
            let totalBasicPercent = 0;
            let totalAdvancePercent = 0;
            let totalExpertPercent = 0;
            let totalUntrainedCount = 0;

            locationMap.forEach((val, key) => {
                const basicPercent = val.total > 0 ? Math.round((val.basic / val.total) * 100) : 0;
                const advancePercent = val.total > 0 ? Math.round((val.advance / val.total) * 100) : 0;
                const expertPercent = val.total > 0 ? Math.round((val.expert / val.total) * 100) : 0;

                locationStats.push({
                    location: key,
                    totalEmployees: val.total,
                    basicTrained: val.basic,
                    basicPercent,
                    advanceTrained: val.advance,
                    advancePercent,
                    expertTrained: val.expert,
                    expertPercent,
                    untrained: val.untrained,
                });

                totalBasicPercent += basicPercent;
                totalAdvancePercent += advancePercent;
                totalExpertPercent += expertPercent;
                totalUntrainedCount += val.untrained;
            });

            const numLocations = locationStats.length;
            setOverallStats({
                avgBasicPercent: numLocations > 0 ? Math.round(totalBasicPercent / numLocations) : 0,
                avgAdvancePercent: numLocations > 0 ? Math.round(totalAdvancePercent / numLocations) : 0,
                avgExpertPercent: numLocations > 0 ? Math.round(totalExpertPercent / numLocations) : 0,
                totalUntrained: totalUntrainedCount,
            });

            setStats(locationStats);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to process the file. Please ensure it is a valid Excel file.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 p-6 md:p-12">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-4"
                >
                    <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                        <FileSpreadsheet className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                        KPI Report Generator
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Upload your training data to automatically generate comprehensive location-based performance reports.
                    </p>
                </motion.div>

                {/* Upload Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8"
                >
                    <div className="flex flex-col items-center justify-center space-y-6">
                        <div className="w-full max-w-xl">
                            <label
                                htmlFor="file-upload"
                                className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors
                  ${file
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50 dark:bg-gray-800/50'
                                    }`}
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {file ? (
                                        <>
                                            <CheckCircle className="w-10 h-10 text-blue-500 mb-3" />
                                            <p className="mb-2 text-sm text-gray-700 dark:text-gray-300 font-semibold">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Ready to process
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-10 h-10 text-gray-400 mb-3" />
                                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="font-semibold">Click to upload</span> or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Excel files (.xlsx, .xls)
                                            </p>
                                        </>
                                    )}
                                </div>
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept=".xlsx, .xls"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </label>
                        </div>

                        <button
                            onClick={processFile}
                            disabled={!file || isProcessing}
                            className={`
                group relative inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white transition-all duration-200 rounded-full
                ${!file || isProcessing
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30'
                                }
              `}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Generate Report
                                    <Download className="w-5 h-5 ml-2 group-hover:translate-y-0.5 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl flex items-center justify-center gap-2"
                            >
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm font-medium">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Results Section */}
                <AnimatePresence>
                    {overallStats && stats && (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-8"
                        >
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: "Avg Basic %", value: `${overallStats.avgBasicPercent}%`, color: "blue" },
                                    { label: "Avg Advance %", value: `${overallStats.avgAdvancePercent}%`, color: "green" },
                                    { label: "Avg Expert %", value: `${overallStats.avgExpertPercent}%`, color: "purple" },
                                    { label: "Total Untrained", value: overallStats.totalUntrained, color: "red" },
                                ].map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.3 + idx * 0.1 }}
                                        className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-l-4 border-${item.color}-500`}
                                    >
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            {item.label}
                                        </h3>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                            {item.value}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Detailed Table */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        Detailed Location Report
                                    </h2>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                                        {stats.length} Locations Found
                                    </span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold">Dealer Location</th>
                                                <th className="px-6 py-4 text-center font-semibold">Total Emp</th>
                                                <th className="px-6 py-4 text-center font-semibold text-blue-600 dark:text-blue-400">Basic</th>
                                                <th className="px-6 py-4 text-center font-semibold text-blue-600 dark:text-blue-400">%</th>
                                                <th className="px-6 py-4 text-center font-semibold text-green-600 dark:text-green-400">Advance</th>
                                                <th className="px-6 py-4 text-center font-semibold text-green-600 dark:text-green-400">%</th>
                                                <th className="px-6 py-4 text-center font-semibold text-purple-600 dark:text-purple-400">Expert</th>
                                                <th className="px-6 py-4 text-center font-semibold text-purple-600 dark:text-purple-400">%</th>
                                                <th className="px-6 py-4 text-center font-semibold text-red-600 dark:text-red-400">Untrained</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {stats.map((stat, index) => (
                                                <motion.tr
                                                    key={index}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.1 * (index % 10) }} // Stagger effect for first 10 rows
                                                    className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                                >
                                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                        {stat.location}
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">
                                                        {stat.totalEmployees}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-medium text-blue-600 dark:text-blue-400">
                                                        {stat.basicTrained}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                        {stat.basicPercent}%
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-medium text-green-600 dark:text-green-400">
                                                        {stat.advanceTrained}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                        {stat.advancePercent}%
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-medium text-purple-600 dark:text-purple-400">
                                                        {stat.expertTrained}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                                        {stat.expertPercent}%
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-medium text-red-600 dark:text-red-400">
                                                        {stat.untrained}
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
