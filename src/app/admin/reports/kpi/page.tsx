"use client";

import { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import {
    Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, Loader2, Search,
    Printer, Filter, X, ChevronRight, UserX, Phone, Copy, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// --- Configuration & Types ---

const REGION_MAPPING: Record<string, string> = {
    "Nasik": "R1", "Ahilyanagar": "R1", "Alephata": "R1", "Chakan": "R1", "Tathawade": "R1",
    "Loni": "R2", "Baramati": "R2", "Indapur": "R2", "Osmanabad": "R2", "Solapur": "R2",
    "Kolhapur": "R3", "Kudal": "R3", "Ratnagiri": "R3", "Sangli": "R3", "Satara": "R3", "Verna": "R3"
};

const THRESHOLDS = {
    BASIC: 100,
    ADVANCE: 60,
    EXPERT: 40
};

interface Employee {
    id: string;
    name: string;
    designation: string;
    mobile: string;
    location: string;
    doj: string;
    subCategory: string;
    level: string;
    isUntrained: boolean;
}

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
    untrainedList: Employee[];
    failures: string[]; // "Basic", "Advance", "Expert"
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

// --- Helper Functions ---

const findColumnName = (headers: string[], possibleNames: string[]): string | undefined => {
    const lowerHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const lowerPossibleNames = possibleNames.map(n => n.toLowerCase().replace(/[^a-z0-9]/g, ""));

    for (const name of lowerPossibleNames) {
        const index = lowerHeaders.findIndex(h => h.includes(name));
        if (index !== -1) return headers[index];
    }
    return undefined;
};

const normalizeString = (val: any) => val ? String(val).trim() : "";

// --- Components ---

export default function KPIReportPage() {
    // State
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [stats, setStats] = useState<LocationStats[] | null>(null);
    const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
    const [untrainedModalData, setUntrainedModalData] = useState<{ location: string, employees: Employee[] } | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRegion, setFilterRegion] = useState<string>("All");
    const [showExceptionsOnly, setShowExceptionsOnly] = useState(false);

    // --- Processing Logic ---

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (uploadedFile) {
            setFile(uploadedFile);
            setStats(null);
            setOverallStats(null);
        }
    };

    const processFile = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonDataRaw = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (jsonDataRaw.length === 0) throw new Error("Empty file");
            const headers = jsonDataRaw[0] as string[];

            // Column Detection
            // Column Detection Strategy:
            // 1. Try fuzzy header matching
            // 2. If failed, try content-based detection by scanning first 50 rows

            let locationCol = findColumnName(headers, ['dealerlocation', 'location', 'branch', 'city', 'site', 'dealer', 'region', 'zone']);
            let levelCol = findColumnName(headers, ['traininglevel', 'level', 'status', 'grade', 'competency', 'training', 'course']);

            // Other columns (less critical for core logic but needed for details)
            const idCol = findColumnName(headers, ['employeeid', 'empid', 'id', 'code', 'user']);
            const nameCol = findColumnName(headers, ['employeename', 'name', 'fullname', 'empname', 'employee']);
            const designationCol = findColumnName(headers, ['designation', 'role', 'position', 'job']);
            const mobileCol = findColumnName(headers, ['mobile', 'phone', 'contact', 'cell', 'no']);
            const dojCol = findColumnName(headers, ['doj', 'dateofjoining', 'joining', 'date']);
            const subCategoryCol = findColumnName(headers, ['subcategory', 'category', 'dept', 'department']);

            const cols = {
                location: locationCol,
                level: levelCol,
                id: idCol,
                name: nameCol,
                designation: designationCol,
                mobile: mobileCol,
                doj: dojCol,
                subCategory: subCategoryCol
            };

            // Content-Based Fallback
            if (!locationCol || !levelCol) {
                const jsonDataForDetection = XLSX.utils.sheet_to_json(worksheet);
                const sampleSize = Math.min(jsonDataForDetection.length, 50);
                const scores: Record<string, { location: number, level: number }> = {};

                headers.forEach(h => scores[h] = { location: 0, level: 0 });

                for (let i = 0; i < sampleSize; i++) {
                    const row: any = jsonDataForDetection[i];
                    headers.forEach(header => {
                        const val = String(row[header] || "").toLowerCase();

                        // Check Location (match against known regions)
                        if (Object.keys(REGION_MAPPING).some(k => val.includes(k.toLowerCase()))) {
                            scores[header].location++;
                        }

                        // Check Level (match against keywords)
                        if (val.includes("basic") || val.includes("advance") || val.includes("expert")) {
                            scores[header].level++;
                        }
                    });
                }

                // Find best matches
                let bestLoc = { header: "", score: 0 };
                let bestLevel = { header: "", score: 0 };

                Object.entries(scores).forEach(([header, score]) => {
                    if (score.location > bestLoc.score) bestLoc = { header, score: score.location };
                    if (score.level > bestLevel.score) bestLevel = { header, score: score.level };
                });

                // Threshold: at least 10% of sample rows must match
                const threshold = Math.ceil(sampleSize * 0.1);

                if (!locationCol && bestLoc.score >= threshold) {
                    locationCol = bestLoc.header;
                    cols.location = locationCol;
                }
                if (!levelCol && bestLevel.score >= threshold) {
                    levelCol = bestLevel.header;
                    cols.level = levelCol;
                }
            }

            if (!cols.location || !cols.level) {
                throw new Error(`Could not detect required columns. Found headers: ${headers.join(", ")}. Please ensure columns for 'Location' and 'Training Level' exist.`);
            }

            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            const locationMap = new Map<string, LocationStats>();

            jsonData.forEach((row: any) => {
                const loc = normalizeString(row[locationCol]);
                if (!loc) return;

                if (!locationMap.has(loc)) {
                    // Determine Region
                    let region = "Other";
                    const locationKey = Object.keys(REGION_MAPPING).find(k => loc.toLowerCase().includes(k.toLowerCase()));
                    if (locationKey) region = REGION_MAPPING[locationKey];

                    locationMap.set(loc, {
                        region, location: loc, totalEmployees: 0,
                        basicTrained: 0, basicPercent: 0,
                        advanceTrained: 0, advancePercent: 0,
                        expertTrained: 0, expertPercent: 0,
                        untrained: 0, untrainedList: [], failures: []
                    });
                }

                const stat = locationMap.get(loc)!;
                stat.totalEmployees++;

                const level = normalizeString(row[levelCol]).toLowerCase();
                const emp: Employee = {
                    id: cols.id ? normalizeString(row[cols.id]) : "N/A",
                    name: cols.name ? normalizeString(row[cols.name]) : "Unknown",
                    designation: cols.designation ? normalizeString(row[cols.designation]) : "-",
                    mobile: cols.mobile ? normalizeString(row[cols.mobile]) : "-",
                    doj: cols.doj ? normalizeString(row[cols.doj]) : "-",
                    subCategory: cols.subCategory ? normalizeString(row[cols.subCategory]) : "-",
                    location: loc,
                    level: level,
                    isUntrained: false
                };

                if (level.includes("expert")) {
                    stat.expertTrained++;
                    stat.advanceTrained++;
                    stat.basicTrained++;
                } else if (level.includes("advance")) {
                    stat.advanceTrained++;
                    stat.basicTrained++;
                } else if (level.includes("basic")) {
                    stat.basicTrained++;
                } else {
                    stat.untrained++;
                    emp.isUntrained = true;
                    stat.untrainedList.push(emp);
                }
            });

            // Calculate Percentages & Failures
            const finalStats: LocationStats[] = [];
            const overall = {
                totalEmployees: 0, totalBasic: 0, totalAdvance: 0, totalExpert: 0, totalUntrained: 0,
                avgBasicPercent: 0, avgAdvancePercent: 0, avgExpertPercent: 0
            };

            locationMap.forEach(stat => {
                if (stat.totalEmployees > 0) {
                    stat.basicPercent = Math.round((stat.basicTrained / stat.totalEmployees) * 100);
                    stat.advancePercent = Math.round((stat.advanceTrained / stat.totalEmployees) * 100);
                    stat.expertPercent = Math.round((stat.expertTrained / stat.totalEmployees) * 100);
                }

                if (stat.basicPercent < THRESHOLDS.BASIC) stat.failures.push("Basic");
                if (stat.advancePercent < THRESHOLDS.ADVANCE) stat.failures.push("Advance");
                if (stat.expertPercent < THRESHOLDS.EXPERT) stat.failures.push("Expert");

                finalStats.push(stat);

                overall.totalEmployees += stat.totalEmployees;
                overall.totalBasic += stat.basicTrained;
                overall.totalAdvance += stat.advanceTrained;
                overall.totalExpert += stat.expertTrained;
                overall.totalUntrained += stat.untrained;
            });

            if (overall.totalEmployees > 0) {
                overall.avgBasicPercent = Math.round((overall.totalBasic / overall.totalEmployees) * 100);
                overall.avgAdvancePercent = Math.round((overall.totalAdvance / overall.totalEmployees) * 100);
                overall.avgExpertPercent = Math.round((overall.totalExpert / overall.totalEmployees) * 100);
            }

            // Sort
            finalStats.sort((a, b) => {
                if (a.region < b.region) return -1;
                if (a.region > b.region) return 1;
                return a.location.localeCompare(b.location);
            });

            setStats(finalStats);
            setOverallStats(overall);

            // Check for failures and notify
            const failureCount = finalStats.filter(s => s.failures.length > 0).length;
            if (failureCount > 0) {
                toast.error(`${failureCount} locations are below KPI targets.`, {
                    action: { label: "View", onClick: () => document.getElementById('exceptions-panel')?.scrollIntoView({ behavior: 'smooth' }) }
                });
            } else {
                toast.success("All locations met KPI targets!");
            }

        } catch (err: any) {
            toast.error(err.message || "Failed to process file");
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Export Logic ---

    const exportExcel = () => {
        if (!stats) return;
        const wb = XLSX.utils.book_new();

        // Sheet 1: Main Report
        const mainData = stats.map(s => ({
            Region: s.region,
            Location: s.location,
            "Total Emp": s.totalEmployees,
            "Basic %": s.basicPercent + "%",
            "Advance %": s.advancePercent + "%",
            "Expert %": s.expertPercent + "%",
            "Untrained": s.untrained,
            "Status": s.failures.length > 0 ? "Below Target" : "On Track"
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mainData), "KPI Report");

        // Sheet 2: Exceptions
        const exceptionsData = stats.filter(s => s.failures.length > 0).map(s => ({
            Location: s.location,
            "Failing Levels": s.failures.join(", "),
            "Basic %": s.basicPercent + "%",
            "Advance %": s.advancePercent + "%",
            "Expert %": s.expertPercent + "%"
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exceptionsData), "KPI Exceptions");

        // Sheet 3: Untrained
        const untrainedData: any[] = [];
        stats.forEach(s => {
            s.untrainedList.forEach(u => {
                untrainedData.push({
                    "Dealer Location": s.location,
                    "Employee ID": u.id,
                    "Name": u.name,
                    "Designation": u.designation,
                    "Mobile": u.mobile,
                    "DOJ": u.doj,
                    "Sub Category": u.subCategory
                });
            });
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(untrainedData), "Untrained Employees");

        XLSX.writeFile(wb, "KPI_Analysis_Report.xlsx");
    };

    // --- Filtered Data ---

    const filteredStats = useMemo(() => {
        if (!stats) return [];
        return stats.filter(s => {
            const matchesSearch = s.location.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRegion = filterRegion === "All" || s.region === filterRegion;
            const matchesException = !showExceptionsOnly || s.failures.length > 0;
            return matchesSearch && matchesRegion && matchesException;
        });
    }, [stats, searchTerm, filterRegion, showExceptionsOnly]);

    const exceptionsList = useMemo(() => stats?.filter(s => s.failures.length > 0) || [], [stats]);

    // --- Render ---

    return (
        <div className="min-h-screen bg-[#F7F9FB] dark:bg-gray-900 p-4 md:p-8 font-sans text-gray-800 dark:text-gray-100 print:bg-white print:p-0">

            {/* Header */}
            <div className="max-w-[1600px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                            <FileSpreadsheet className="w-6 h-6 text-white" />
                        </div>
                        KPI Report Dashboard
                    </h1>
                    <p className="text-gray-500 mt-1 ml-1">
                        {stats ? `Analysis generated on ${new Date().toLocaleTimeString()}` : "Upload training data to begin analysis"}
                    </p>
                </div>

                {stats && (
                    <div className="flex gap-3">
                        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm font-medium text-sm">
                            <Printer className="w-4 h-4" /> Print PDF
                        </button>
                        <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 font-medium text-sm">
                            <Download className="w-4 h-4" /> Export Excel
                        </button>
                    </div>
                )}
            </div>

            {/* Upload Area (Hidden if stats exist) */}
            {!stats && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto mt-20">
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group shadow-xl shadow-gray-200/50 dark:shadow-none">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {file ? (
                                <div className="text-center">
                                    <CheckCircle className="w-12 h-12 text-green-500 mb-3 mx-auto" />
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{file.name}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                        <Upload className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <p className="mb-2 text-lg font-medium text-gray-700 dark:text-gray-200">Drop your Excel file here</p>
                                    <p className="text-sm text-gray-500">Supports .xlsx, .xls</p>
                                </>
                            )}
                        </div>
                        <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileUpload} />
                    </label>

                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={processFile}
                            disabled={!file || isProcessing}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                        >
                            {isProcessing ? <Loader2 className="animate-spin" /> : "Generate Report"}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Dashboard Content */}
            {stats && overallStats && (
                <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">

                    {/* Left Sidebar: Controls & Exceptions */}
                    <div className="lg:col-span-3 space-y-6 print:hidden">
                        {/* Filters */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Filter className="w-4 h-4" /> Filters
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">Search Location</label>
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="e.g. Pune..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">Region</label>
                                    <select
                                        value={filterRegion}
                                        onChange={(e) => setFilterRegion(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none"
                                    >
                                        <option value="All">All Regions</option>
                                        <option value="R1">Region 1</option>
                                        <option value="R2">Region 2</option>
                                        <option value="R3">Region 3</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="exceptions"
                                        checked={showExceptionsOnly}
                                        onChange={(e) => setShowExceptionsOnly(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="exceptions" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                                        Show Exceptions Only
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Exceptions Summary Panel */}
                        <div id="exceptions-panel" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 overflow-hidden">
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30 flex justify-between items-center">
                                <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> KPI Exceptions
                                </h3>
                                <span className="bg-white dark:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-bold px-2 py-1 rounded-full">
                                    {exceptionsList.length}
                                </span>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto p-2">
                                {exceptionsList.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">No exceptions found. Great job!</div>
                                ) : (
                                    <div className="space-y-2">
                                        {exceptionsList.map((ex, idx) => (
                                            <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-semibold text-gray-900 dark:text-white text-sm">{ex.location}</span>
                                                    <span className="text-xs text-gray-500">{ex.region}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {ex.failures.map(f => (
                                                        <span key={f} className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded">
                                                            {f} Failed
                                                        </span>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => setUntrainedModalData({ location: ex.location, employees: ex.untrainedList })}
                                                    className="w-full text-xs text-blue-600 dark:text-blue-400 hover:underline text-left flex items-center gap-1"
                                                >
                                                    View {ex.untrained} Untrained <ChevronRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Main Table */}
                    <div className="lg:col-span-9 space-y-6">

                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
                            {[
                                { label: "Basic Avg", val: overallStats.avgBasicPercent, color: "blue", target: 100 },
                                { label: "Advance Avg", val: overallStats.avgAdvancePercent, color: "green", target: 60 },
                                { label: "Expert Avg", val: overallStats.avgExpertPercent, color: "purple", target: 40 },
                                { label: "Untrained", val: overallStats.totalUntrained, color: "red", target: 0, isCount: true },
                            ].map((item, i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.label}</span>
                                    <div className="flex items-end gap-2 mt-2">
                                        <span className={`text-3xl font-bold text-${item.color}-600 dark:text-${item.color}-400`}>
                                            {item.val}{item.isCount ? "" : "%"}
                                        </span>
                                        {!item.isCount && (
                                            <span className="text-xs text-gray-400 mb-1">/ {item.target}%</span>
                                        )}
                                    </div>
                                    {!item.isCount && (
                                        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-3 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }} animate={{ width: `${item.val}%` }}
                                                className={`h-full bg-${item.color}-500 rounded-full`}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Main Table */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[700px] print:max-h-none print:shadow-none print:border-none">
                            <div className="overflow-auto flex-1 relative">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 backdrop-blur-md shadow-sm print:static">
                                        <tr>
                                            <th className="px-4 py-4 font-bold w-16">Reg</th>
                                            <th className="px-4 py-4 font-bold">Location</th>
                                            <th className="px-4 py-4 text-center font-bold">Total</th>
                                            <th className="px-4 py-4 text-center font-bold text-blue-600">Basic</th>
                                            <th className="px-4 py-4 text-center font-bold text-blue-600">%</th>
                                            <th className="px-4 py-4 text-center font-bold text-green-600">Adv</th>
                                            <th className="px-4 py-4 text-center font-bold text-green-600">%</th>
                                            <th className="px-4 py-4 text-center font-bold text-purple-600">Exp</th>
                                            <th className="px-4 py-4 text-center font-bold text-purple-600">%</th>
                                            <th className="px-4 py-4 text-center font-bold text-red-600">Untrained</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredStats.map((stat, idx) => {
                                            const isFail = stat.failures.length > 0;
                                            return (
                                                <motion.tr
                                                    key={idx}
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                    className={`
                            group transition-colors
                            ${isFail ? 'bg-[#FFECEC] dark:bg-red-900/10 hover:bg-[#FFE0E0]' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                          `}
                                                >
                                                    <td className="px-4 py-3 font-medium text-gray-500">{stat.region}</td>
                                                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                                                        {stat.location}
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{stat.totalEmployees}</td>

                                                    {/* Basic */}
                                                    <td className="px-4 py-3 text-center text-gray-600">{stat.basicTrained}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`font-bold ${stat.basicPercent < THRESHOLDS.BASIC ? 'text-[#FF4C4C]' : 'text-blue-600'}`}>
                                                            {stat.basicPercent}%
                                                        </span>
                                                    </td>

                                                    {/* Advance */}
                                                    <td className="px-4 py-3 text-center text-gray-600">{stat.advanceTrained}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`font-bold ${stat.advancePercent < THRESHOLDS.ADVANCE ? 'text-[#FF4C4C]' : 'text-green-600'}`}>
                                                            {stat.advancePercent}%
                                                        </span>
                                                    </td>

                                                    {/* Expert */}
                                                    <td className="px-4 py-3 text-center text-gray-600">{stat.expertTrained}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`font-bold ${stat.expertPercent < THRESHOLDS.EXPERT ? 'text-[#FF4C4C]' : 'text-purple-600'}`}>
                                                            {stat.expertPercent}%
                                                        </span>
                                                    </td>

                                                    {/* Untrained Action */}
                                                    <td className="px-4 py-3 text-center">
                                                        {stat.untrained > 0 ? (
                                                            <button
                                                                onClick={() => setUntrainedModalData({ location: stat.location, employees: stat.untrainedList })}
                                                                className="inline-flex items-center justify-center px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold hover:bg-red-200 transition-colors"
                                                            >
                                                                {stat.untrained} <UserX className="w-3 h-3 ml-1" />
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] print:table-row-group">
                                        <tr className="bg-blue-50 dark:bg-blue-900/40 border-t-2 border-blue-200 dark:border-blue-800">
                                            <td colSpan={2} className="px-4 py-4 font-bold text-right uppercase text-gray-700 dark:text-gray-200">Grand Total</td>
                                            <td className="px-4 py-4 text-center font-bold text-lg">{overallStats.totalEmployees}</td>
                                            <td className="px-4 py-4 text-center font-bold text-blue-700">{overallStats.totalBasic}</td>
                                            <td className="px-4 py-4 text-center font-bold bg-blue-100/50">{overallStats.avgBasicPercent}%</td>
                                            <td className="px-4 py-4 text-center font-bold text-green-700">{overallStats.totalAdvance}</td>
                                            <td className="px-4 py-4 text-center font-bold bg-green-100/50">{overallStats.avgAdvancePercent}%</td>
                                            <td className="px-4 py-4 text-center font-bold text-purple-700">{overallStats.totalExpert}</td>
                                            <td className="px-4 py-4 text-center font-bold bg-purple-100/50">{overallStats.avgExpertPercent}%</td>
                                            <td className="px-4 py-4 text-center font-bold text-red-600">{overallStats.totalUntrained}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Untrained Modal */}
            <AnimatePresence>
                {untrainedModalData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Untrained Employees</h2>
                                    <p className="text-sm text-gray-500">Location: {untrainedModalData.location}</p>
                                </div>
                                <button onClick={() => setUntrainedModalData(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto p-6">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">ID</th>
                                            <th className="px-4 py-3">Name</th>
                                            <th className="px-4 py-3">Designation</th>
                                            <th className="px-4 py-3">Mobile</th>
                                            <th className="px-4 py-3">DOJ</th>
                                            <th className="px-4 py-3 rounded-r-lg">Sub Category</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {untrainedModalData.employees.map((emp, i) => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-3 font-mono text-xs text-gray-500">{emp.id}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{emp.name}</td>
                                                <td className="px-4 py-3 text-gray-600">{emp.designation}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-600">{emp.mobile}</span>
                                                        {emp.mobile !== "-" && (
                                                            <a href={`tel:${emp.mobile}`} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                                                <Phone className="w-3 h-3" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">{emp.doj}</td>
                                                <td className="px-4 py-3 text-gray-600">{emp.subCategory}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
                                <button
                                    onClick={() => {
                                        const text = untrainedModalData.employees.map(e => `${e.name} (${e.mobile})`).join('\n');
                                        navigator.clipboard.writeText(text);
                                        toast.success("Copied to clipboard");
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    <Copy className="w-4 h-4" /> Copy List
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Print Styles */}
            <style jsx global>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { background: white; color: black; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:table-row-group { display: table-row-group !important; }
          .print\\:max-h-none { max-height: none !important; overflow: visible !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          /* Ensure colors print */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
        </div>
    );
}
