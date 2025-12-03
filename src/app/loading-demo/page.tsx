'use client';

import { useState } from 'react';
import { useLoading, usePageLoading } from '@/hooks/use-loading';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { PageLoader } from '@/components/ui/page-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function LoadingDemo() {
    // Page loading demo
    const isPageLoading = usePageLoading(2000);

    // Button action loading
    const { isLoading: isButtonLoading, withLoading: withButtonLoading } = useLoading();

    // Form submission loading
    const { isLoading: isFormLoading, withLoading: withFormLoading } = useLoading();
    const [formData, setFormData] = useState({ name: '', email: '' });

    // Section loading
    const { isLoading: isSectionLoading, withLoading: withSectionLoading } = useLoading();

    // Show page loader on initial load
    if (isPageLoading) {
        return <PageLoader />;
    }

    const simulateButtonAction = async () => {
        await withButtonLoading(async () => {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 3000));
            alert('Action completed!');
        });
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await withFormLoading(async () => {
            // Simulate form submission
            await new Promise(resolve => setTimeout(resolve, 2500));
            alert(`Form submitted for ${formData.name}`);
            setFormData({ name: '', email: '' });
        });
    };

    const loadSectionData = async () => {
        await withSectionLoading(async () => {
            // Simulate data loading
            await new Promise(resolve => setTimeout(resolve, 2000));
        });
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold">Loading Animation Demo</h1>
                <p className="text-muted-foreground">
                    Demonstration of the truck loading animation in various scenarios
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Button Action Demo */}
                <Card>
                    <CardHeader>
                        <CardTitle>Button Action Loading</CardTitle>
                        <CardDescription>
                            Click the button to see loading animation during an async action
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="relative min-h-[150px]">
                        <LoadingOverlay
                            isLoading={isButtonLoading}
                            message="Processing action..."
                            fullScreen={false}
                        />
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                This simulates a 3-second API call with loading overlay.
                            </p>
                            <Button
                                onClick={simulateButtonAction}
                                disabled={isButtonLoading}
                                className="w-full"
                            >
                                {isButtonLoading ? 'Processing...' : 'Trigger Action'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Form Submission Demo */}
                <Card>
                    <CardHeader>
                        <CardTitle>Form Submission Loading</CardTitle>
                        <CardDescription>
                            Submit the form to see loading animation
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="relative min-h-[150px]">
                        <LoadingOverlay
                            isLoading={isFormLoading}
                            message="Submitting form..."
                            fullScreen={false}
                        />
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <Input
                                placeholder="Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                disabled={isFormLoading}
                                required
                            />
                            <Input
                                placeholder="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={isFormLoading}
                                required
                            />
                            <Button type="submit" disabled={isFormLoading} className="w-full">
                                {isFormLoading ? 'Submitting...' : 'Submit Form'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Section Loading Demo */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Section Data Loading</CardTitle>
                        <CardDescription>
                            Load data for a specific section with inline loading overlay
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="relative min-h-[200px]">
                        <LoadingOverlay
                            isLoading={isSectionLoading}
                            message="Loading section data..."
                            fullScreen={false}
                        />
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                This demonstrates loading state for a specific section without blocking the entire page.
                            </p>
                            <Button
                                onClick={loadSectionData}
                                disabled={isSectionLoading}
                            >
                                {isSectionLoading ? 'Loading...' : 'Load Section Data'}
                            </Button>

                            {!isSectionLoading && (
                                <div className="mt-4 p-4 bg-muted rounded-lg">
                                    <p className="text-sm">Section content loaded successfully!</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Usage Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle>Implementation Guide</CardTitle>
                    <CardDescription>
                        How to use the loading animation in your components
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 text-sm">
                        <div>
                            <h3 className="font-semibold mb-2">1. Page Load Loading</h3>
                            <code className="block bg-muted p-2 rounded">
                                const isLoading = usePageLoading(1000);
                            </code>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">2. Button/Action Loading</h3>
                            <code className="block bg-muted p-2 rounded">
                                const {`{ isLoading, withLoading }`} = useLoading();
                            </code>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">3. Add Loading Overlay</h3>
                            <code className="block bg-muted p-2 rounded">
                                {`<LoadingOverlay isLoading={isLoading} message="Loading..." />`}
                            </code>
                        </div>

                        <div className="pt-4 border-t">
                            <p className="text-muted-foreground">
                                📖 See <code className="bg-muted px-2 py-1 rounded">LOADING_ANIMATION_GUIDE.md</code> for complete documentation and examples.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
