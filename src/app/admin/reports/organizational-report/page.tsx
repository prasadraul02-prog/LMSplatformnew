import { Suspense } from 'react';
import MasterDatabase from './components/MasterDatabase';
import OrgComparison from './components/OrgComparison';
import OrgSettings from './components/OrgSettings';
import IntimationsPanel from './components/IntimationsPanel';
import { getMasterEmployees, getOrganizations } from './actions';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Settings, Filter, LayoutDashboard } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function OrganizationalStatusPage() {
    const { data: masterEmployees, metadata } = await getMasterEmployees(1, 50);
    const { data: organizations } = await getOrganizations();

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/30">
            {/* Ultra-Compact Header */}
            <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b bg-white sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <LayoutDashboard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">HR Master Database</h1>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            Management & Analytics
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Compact Stat */}
                    <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg border">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold">{metadata?.total || 0}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">Employees</span>
                    </div>

                    <IntimationsPanel />

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button size="sm" variant="outline" className="gap-2 border-2 font-bold h-9">
                                <Settings className="h-4 w-4 text-primary" />
                                Config
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-md overflow-y-auto bg-slate-50">
                            <SheetHeader className="mb-6 border-b pb-4">
                                <SheetTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                                    <Settings className="h-5 w-5" />
                                    System Settings
                                </SheetTitle>
                                <SheetDescription>
                                    Manage organizations and system-wide HR settings.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                                        <Users className="h-4 w-4" /> Organizations
                                    </h3>
                                    <OrgSettings organizations={organizations || []} />
                                </section>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="p-4 sm:p-6 space-y-8">
                {/* Main Database - Takes focus */}
                <section>
                    <MasterDatabase
                        initialData={masterEmployees || []}
                        initialMetadata={metadata || { total: 0, page: 1, limit: 50, totalPages: 0 }}
                    />
                </section>

                <div className="grid gap-8 grid-cols-1">
                    <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex items-center gap-2 mb-6 ml-1">
                            <Filter className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Organizational Analyser</h2>
                        </div>
                        <OrgComparison organizations={organizations || []} />
                    </section>
                </div>
            </div>

            {/* Minimalist Footer */}
            <footer className="mt-auto p-10 border-t bg-white text-center">
                <p className="text-sm text-muted-foreground font-medium">
                    &copy; {new Date().getFullYear()} LMS Platform &bull; HR Master Database v2.0
                </p>
            </footer>
        </div>
    );
}
