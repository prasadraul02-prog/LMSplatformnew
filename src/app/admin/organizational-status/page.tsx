import { Suspense } from 'react';
import MasterDatabase from './components/MasterDatabase';
import OrgComparison from './components/OrgComparison';
import OrgSettings from './components/OrgSettings';
import { getMasterEmployees, getOrganizations } from './actions';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BarChart3, Settings } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function OrganizationalStatusPage() {
    const { data: masterEmployees } = await getMasterEmployees();
    const { data: organizations } = await getOrganizations();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Organizational Employee Status</h1>
                <p className="text-muted-foreground mt-2">
                    Manage Master HR Database and compare with organizational sheets.
                </p>
            </div>

            {/* Top Cards */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                <Card className="border-l-4 border-l-blue-600 bg-blue-50/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Organizational Employee Status</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{masterEmployees?.length || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total Employees in Master DB</p>
                    </CardContent>
                </Card>
                <Card className="opacity-60 cursor-not-allowed">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reports & Analytics</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">-</div>
                        <p className="text-xs text-muted-foreground mt-1">Coming Soon</p>
                    </CardContent>
                </Card>
                <Card className="opacity-60 cursor-not-allowed">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">KPI Generator</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">-</div>
                        <p className="text-xs text-muted-foreground mt-1">Coming Soon</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold mb-4">Master HR Database</h2>
                        <MasterDatabase data={masterEmployees || []} />
                    </section>

                    <section>
                        <OrgComparison organizations={organizations || []} />
                    </section>
                </div>

                <div className="space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold mb-4">Settings</h2>
                        <OrgSettings organizations={organizations || []} />
                    </section>
                </div>
            </div>
        </div>
    );
}
