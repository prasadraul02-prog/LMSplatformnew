"use client";

import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, Loader2, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Region Mapping Configuration
const REGION_MAPPING: Record<string, string> = {
    "Nasik": "R1",
    "Ahilyanagar": "R1",
    "Alephata": "R1",
    "Chakan": "R1",
    "Tathawade": "R1",
    "Loni": "R2",
    "Baramati": "R2",
    "Indapur": "R2",
    "Osmanabad": "R2",
    "Solapur": "R2",
    "Kolhapur": "R3",
    "Kudal": "R3",
    "Ratnagiri": "R3",
    "Sangli": "R3",
    "Satara": "R3",
    "Verna": "R3"
};

interface LocationStats {
    region: string;
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
    totalEmployees: number;
    totalBasic: number;
    avgBasicPercent: number;
    totalAdvance: number;
    avgAdvancePercent: number;
    totalExpert: number;
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
                const locationRaw = row[locationCol];
                const location = locationRaw ? String(locationRaw).trim() : "";
                if (!location) return; // Skip rows without location

                if (!locationMap.has(location)) {
                    locationMap.set(location, { total: 0, basic: 0, advance: 0, expert: 0, untrained: 0 });
                }

                const stats = locationMap.get(location)!;
                stats.total += 1;

                const levelRaw = row[trainingLevelCol];
                const level = levelRaw ? String(levelRaw).trim().toLowerCase() : "";

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
            let grandTotalEmployees = 0;
            let grandTotalBasic = 0;
            let grandTotalAdvance = 0;
            let grandTotalExpert = 0;
            let grandTotalUntrained = 0;

            locationMap.forEach((val, key) => {
                const basicPercent = val.total > 0 ? Math.round((val.basic / val.total) * 100) : 0;
                const advancePercent = val.total > 0 ? Math.round((val.advance / val.total) * 100) : 0;
                const expertPercent = val.total > 0 ? Math.round((val.expert / val.total) * 100) : 0;

                // Determine Region
                // Check for exact match or partial match in our mapping
                let region = "Other";
                const locationKey = Object.keys(REGION_MAPPING).find(k => key.toLowerCase().includes(k.toLowerCase()));
                if (locationKey) {
                    region = REGION_MAPPING[locationKey];
                }

                locationStats.push({
                    region,
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

                grandTotalEmployees += val.total;
                grandTotalBasic += val.basic;
                grandTotalAdvance += val.advance;
                grandTotalExpert += val.expert;
                grandTotalUntrained += val.untrained;
            });

            // Sort by Region (R1, R2, R3, Other) then by Location name
            locationStats.sort((a, b) => {
                if (a.region < b.region) return -1;
                if (a.region > b.region) return 1;
                return a.location.localeCompare(b.location);
            });

            // Calculate Grand Total Percentages
            const avgBasicPercent = grandTotalEmployees > 0 ? Math.round((grandTotalBasic / grandTotalEmployees) * 100) : 0;
            const avgAdvancePercent = grandTotalEmployees > 0 ? Math.round((grandTotalAdvance / grandTotalEmployees) * 100) : 0;
            const avgExpertPercent = grandTotalEmployees > 0 ? Math.round((grandTotalExpert / grandTotalEmployees) * 100) : 0;

            setOverallStats({
                totalEmployees: grandTotalEmployees,
                totalBasic: grandTotalBasic,
                avgBasicPercent,
                totalAdvance: grandTotalAdvance,
                avgAdvancePercent,
                totalExpert: grandTotalExpert,
                avgExpertPercent,
                totalUntrained: grandTotalUntrained,
            });

            setStats(locationStats);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to process the file. Please ensure it is a valid Excel file.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Group stats by region for the table rendering to handle rowspans if needed, 
    // but for simplicity and sorting, a flat list with a region column is also fine.
    // We will render a flat list but visually group if needed. 
    // The requirement asks for a specific column "Region".

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 p-6 md:p-12 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-4"
                >
                    <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20 mb-4">
                        <FileSpreadsheet className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                        KPI Report Generator
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Upload your training data to automatically generate comprehensive regional performance reports.
                    </p>
                </motion.div>

                {/* Upload Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-gray-700 p-8 backdrop-blur-sm"
                >
                    <div className="flex flex-col items-center justify-center space-y-8">
                        <div className="w-full max-w-2xl">
                            <label
                                htmlFor="file-upload"
                                className={`group flex flex-col items-center justify-center w-full h-52 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300
                  ${file
                                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800'
                                    }`}
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                    {file ? (
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="flex flex-col items-center"
                                        >
                                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full mb-3">
                                                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                                            </div>
                                            <p className="mb-1 text-lg text-gray-900 dark:text-white font-semibold">
                                                {file.name}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {(file.size / 1024).toFixed(1)} KB • Ready to process
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <>
                                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                                                <Upload className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                                            </div>
                                            <p className="mb-2 text-lg text-gray-700 dark:text-gray-200 font-medium">
                                                Click to upload or drag and drop
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white transition-all duration-200 rounded-xl
                ${!file || isProcessing
                                    ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5'
                                }
              `}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Processing Data...
                                </>
                            ) : (
                                <>
                                    Generate Analysis
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
                                className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex items-center justify-center gap-2"
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
                                    { label: "Avg Basic %", value: `${overallStats.avgBasicPercent}%`, color: "blue", sub: "Foundation" },
                                    { label: "Avg Advance %", value: `${overallStats.avgAdvancePercent}%`, color: "green", sub: "Intermediate" },
                                    { label: "Avg Expert %", value: `${overallStats.avgExpertPercent}%`, color: "purple", sub: "Mastery" },
                                    { label: "Total Untrained", value: overallStats.totalUntrained, color: "red", sub: "Needs Action" },
                                ].map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.3 + idx * 0.1 }}
                                        className={`
                      relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700
                      hover:shadow-md transition-shadow duration-300
                    `}
                                    >
                                        <div className={`absolute top-0 left-0 w-1 h-full bg-${item.color}-500`} />
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    {item.label}
                                                </p>
                                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                                    {item.value}
                                                </h3>
                                            </div>
                                            <div className={`p-2 bg-${item.color}-50 dark:bg-${item.color}-900/20 rounded-lg`}>
                                                <div className={`w-4 h-4 rounded-full bg-${item.color}-500`} />
                                            </div>
                                        </div>
                                        <p className="mt-2 text-xs font-medium text-gray-400 dark:text-gray-500">
                                            {item.sub}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Detailed Table */}
                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[800px]">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm flex flex-col sm:flex-row justify-between items-center gap-4 z-20">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                            <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            Detailed Location Report
                                        </h2>
                                    </div>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-4 py-1.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-600">
                                        {stats.length} Locations Found
                                    </span>
                                </div>

                                <div className="overflow-auto flex-1 relative">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 backdrop-blur-md shadow-sm">
                                            <tr>
                                                <th className="px-6 py-4 font-bold tracking-wider">Region</th>
                                                <th className="px-6 py-4 font-bold tracking-wider">Dealer Location</th>
                                                <th className="px-6 py-4 text-center font-bold tracking-wider">Total Emp</th>
                                                <th className="px-6 py-4 text-center font-bold tracking-wider text-blue-600 dark:text-blue-400">Basic</th>
                                                <th className="px-6 py-4 text-center font-bold tracking-wider text-blue-600 dark:text-blue-400">%</th>
                                                <th className="px-6 py-4 text-center font-bold tracking-wider text-green-600 dark:text-green-400">Advance</th>
                                                <th className="px-6 py-4 text-center font-bold tracking-wider text-green-600 dark:text-green-400">%</th>
                                                <th className="px-6 py-4 text-center font-bold tracking-wider text-purple-600 dark:text-purple-400">Expert</th>
                                                <th className="px-6 py-4 text-center font-bold tracking-wider text-purple-600 dark:text-purple-400">%</th>
                                                <th className="px-6 py-4 text-center font-bold tracking-wider text-red-600 dark:text-red-400">Untrained</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {stats.map((stat, index) => (
                                                <motion.tr
                                                    key={index}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.05 * Math.min(index, 20) }}
                                                    className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                                                >
                                                    <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">
                                                        {stat.region}
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        {stat.location}
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300 font-medium">
                                                        {stat.totalEmployees}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-medium text-blue-600 dark:text-blue-400">
                                                        {stat.basicTrained}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center justify-center w-12 h-8 rounded-lg font-bold text-xs
                              ${stat.basicPercent === 100
                                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                            }`}>
                                                            {stat.basicPercent}%
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-medium text-green-600 dark:text-green-400">
                                                        {stat.advanceTrained}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center justify-center w-12 h-8 rounded-lg font-bold text-xs
                              ${stat.advancePercent >= 75
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                            }`}>
                                                            {stat.advancePercent}%
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-medium text-purple-600 dark:text-purple-400">
                                                        {stat.expertTrained}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center justify-center w-12 h-8 rounded-lg font-bold text-xs
                              ${stat.expertPercent >= 50
                                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                            }`}>
                                                            {stat.expertPercent}%
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-medium text-red-600 dark:text-red-400">
                                                        {stat.untrained > 0 ? stat.untrained : "-"}
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                        {/* Sticky Footer / Summary Row */}
                                        <tfoot className="sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                                            <tr className="bg-blue-50 dark:bg-blue-900/40 border-t-2 border-blue-200 dark:border-blue-800">
                                                <td colSpan={2} className="px-6 py-5 font-bold text-gray-900 dark:text-white text-right uppercase tracking-wider">
                                                    Grand Total
                                                </td>
                                                <td className="px-6 py-5 text-center font-bold text-gray-900 dark:text-white text-lg">
                                                    {overallStats.totalEmployees}
                                                </td>
                                                <td className="px-6 py-5 text-center font-bold text-blue-700 dark:text-blue-300 text-lg">
                                                    {overallStats.totalBasic}
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-600 text-white font-bold text-sm shadow-sm">
                                                        {overallStats.avgBasicPercent}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-center font-bold text-green-700 dark:text-green-300 text-lg">
                                                    {overallStats.totalAdvance}
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-green-600 text-white font-bold text-sm shadow-sm">
                                                        {overallStats.avgAdvancePercent}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-center font-bold text-purple-700 dark:text-purple-300 text-lg">
                                                    {overallStats.totalExpert}
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-purple-600 text-white font-bold text-sm shadow-sm">
                                                        {overallStats.avgExpertPercent}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-center font-bold text-red-600 dark:text-red-400 text-lg">
                                                    {overallStats.totalUntrained}
                                                </td>
                                            </tr>
                                        </tfoot>
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
