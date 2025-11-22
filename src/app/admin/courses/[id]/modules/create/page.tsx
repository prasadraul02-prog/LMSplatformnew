'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateModulePage({ params }: { params: { id: string } }) {
    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Add Module</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Module Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Module creation is currently under maintenance.</p>
                    <Button className="mt-4" disabled>Add Module</Button>
                </CardContent>
            </Card>
        </div>
    );
}
