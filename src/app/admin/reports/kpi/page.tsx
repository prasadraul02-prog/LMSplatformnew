"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download } from "lucide-react";
import styles from "../../dashboard.module.css"; // Reusing dashboard styles if possible, or I'll create inline/new styles

interface KPIEntry {
    "Employee ID": string | number;
    "Dealer Location": string;
    "Training Level"?: "Basic" | "Advance" | "Expert" | string;
}

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
            const jsonData = XLSX.utils.sheet_to_json<KPIEntry>(worksheet);

            if (jsonData.length === 0) {
                setError("The uploaded file is empty or invalid.");
                setIsProcessing(false);
                return;
            }

            // Check for required columns
            const firstRow = jsonData[0];
            if (!("Dealer Location" in firstRow) || !("Training Level" in firstRow)) {
                setError("Missing required columns: 'Dealer Location' or 'Training Level'. Please check the file format.");
                setIsProcessing(false);
                return;
            }

            const locationMap = new Map<string, {
                total: number;
                basic: number;
                advance: number;
                expert: number;
                untrained: number;
            }>();

            jsonData.forEach((row) => {
                const location = row["Dealer Location"] ? String(row["Dealer Location"]).trim() : "";
                if (!location) return; // Skip rows without location

                if (!locationMap.has(location)) {
                    locationMap.set(location, { total: 0, basic: 0, advance: 0, expert: 0, untrained: 0 });
                }

                const stats = locationMap.get(location)!;
                stats.total += 1;

                const level = row["Training Level"] ? String(row["Training Level"]).trim().toLowerCase() : "";

                if (level === "expert") {
                    stats.expert += 1;
                    stats.advance += 1; // Expert implies Advance
                    stats.basic += 1;   // Expert implies Basic
                } else if (level === "advance") {
                    stats.advance += 1;
                    stats.basic += 1;   // Advance implies Basic
                } else if (level === "basic") {
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
        } catch (err) {
            console.error(err);
            setError("Failed to process the file. Please ensure it is a valid Excel file.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">KPI Report Generator</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Upload an Excel file containing Employee ID, Dealer Location, and Training Level to generate a KPI report.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                <div className="flex flex-col md:flex-row items-end gap-4">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Upload Excel Report (.xlsx)
                        </label>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileUpload}
                                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                            />
                        </div>
                    </div>
                    <button
                        onClick={processFile}
                        disabled={!file || isProcessing}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                        {isProcessing ? (
                            "Processing..."
                        ) : (
                            <>
                                <FileSpreadsheet className="w-5 h-5" />
                                Generate Report
                            </>
                        )}
                    </button>
                </div>
                {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}
            </div>

            {overallStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-blue-500">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Basic %</h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{overallStats.avgBasicPercent}%</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-green-500">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Advance %</h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{overallStats.avgAdvancePercent}%</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-purple-500">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Expert %</h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{overallStats.avgExpertPercent}%</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-red-500">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Untrained</h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{overallStats.totalUntrained}</p>
                    </div>
                </div>
            )}

            {stats && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Location-wise KPI Report</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">Dealer Location</th>
                                    <th className="px-6 py-3 text-center">Total Emp</th>
                                    <th className="px-6 py-3 text-center">Basic Trained</th>
                                    <th className="px-6 py-3 text-center">Basic %</th>
                                    <th className="px-6 py-3 text-center">Advance Trained</th>
                                    <th className="px-6 py-3 text-center">Advance %</th>
                                    <th className="px-6 py-3 text-center">Expert Trained</th>
                                    <th className="px-6 py-3 text-center">Expert %</th>
                                    <th className="px-6 py-3 text-center">Untrained</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map((stat, index) => (
                                    <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{stat.location}</td>
                                        <td className="px-6 py-4 text-center">{stat.totalEmployees}</td>
                                        <td className="px-6 py-4 text-center text-blue-600 font-medium">{stat.basicTrained}</td>
                                        <td className="px-6 py-4 text-center text-blue-600 font-bold">{stat.basicPercent}%</td>
                                        <td className="px-6 py-4 text-center text-green-600 font-medium">{stat.advanceTrained}</td>
                                        <td className="px-6 py-4 text-center text-green-600 font-bold">{stat.advancePercent}%</td>
                                        <td className="px-6 py-4 text-center text-purple-600 font-medium">{stat.expertTrained}</td>
                                        <td className="px-6 py-4 text-center text-purple-600 font-bold">{stat.expertPercent}%</td>
                                        <td className="px-6 py-4 text-center text-red-600 font-medium">{stat.untrained}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
