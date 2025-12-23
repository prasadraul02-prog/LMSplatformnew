import { Suspense } from 'react';
import MasterDatabase from './components/MasterDatabase';
import OrgComparison from './components/OrgComparison';
import OrgSettings from './components/OrgSettings';
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
        <div className="flex flex-col min-h-screen bg-slate-50/50">
            {/* Header Area */}
            <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b bg-white/80 backdrop-blur-md sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <LayoutDashboard className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Organizational Status</h1>
                        <p className="text-muted-foreground font-medium">
                            Enterprise Master HR Database & Management
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Card className="flex items-center gap-4 px-6 py-3 border-none bg-primary shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-white">
                        <Users className="h-8 w-8 opacity-80" />
                        <div>
                            <div className="text-2xl font-black">{metadata?.total || 0}</div>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Employees</p>
                        </div>
                    </Card>

                    {/* Collapsible Settings Trigger */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button size="lg" variant="outline" className="h-[68px] px-6 gap-2 border-2 hover:bg-slate-100 transition-all font-bold">
                                <Settings className="h-6 w-6 text-primary" />
                                <span className="hidden sm:inline">Org Settings</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-md overflow-y-auto bg-slate-50/95 backdrop-blur-sm">
                            <SheetHeader className="mb-6 border-b pb-4">
                                <SheetTitle className="text-2xl font-bold flex items-center gap-2 text-primary">
                                    <Settings className="h-6 w-6" />
                                    Organization Config
                                </SheetTitle>
                                <SheetDescription className="font-medium">
                                    Manage your primary organizations and departments here. These are used to categorize the Master Database.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="py-2">
                                <OrgSettings organizations={organizations || []} />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="p-6 md:p-8 space-y-12">
                {/* Main Database Area - Full Width */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <MasterDatabase
                        initialData={masterEmployees || []}
                        initialMetadata={metadata || { total: 0, page: 1, limit: 50, totalPages: 0 }}
                    />
                </section>

                <div className="grid gap-8 grid-cols-1">
                    <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex items-center gap-2 mb-6 ml-1">
                            <Filter className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Data Comparison & Sync</h2>
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
