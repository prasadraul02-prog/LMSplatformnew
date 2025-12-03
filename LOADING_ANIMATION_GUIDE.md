# Loading Animation Implementation Guide

This guide shows how to implement the truck loading animation in your LMS app for both page loads and delayed actions.

## Components Created

1. **TruckLoader** (`src/components/ui/truck-loader.tsx`) - The animated truck loader component
2. **LoadingOverlay** (`src/components/ui/loading-overlay.tsx`) - Flexible loading overlay for various use cases
3. **PageLoader** (`src/components/ui/page-loader.tsx`) - Updated to use TruckLoader
4. **useLoading Hook** (`src/hooks/use-loading.ts`) - Custom hooks for managing loading states

## Usage Examples

### 1. Page Load Loading

Show loading animation when a page initially loads:

```tsx
'use client';

import { usePageLoading } from '@/hooks/use-loading';
import { PageLoader } from '@/components/ui/page-loader';

export default function MyPage() {
  const isLoading = usePageLoading(1000); // Show loader for minimum 1 second

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div>
      {/* Your page content */}
    </div>
  );
}
```

### 2. Button Click with Delayed Action

Show loading when a button is clicked and waiting for response:

```tsx
'use client';

import { useLoading } from '@/hooks/use-loading';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { Button } from '@/components/ui/button';

export default function MyComponent() {
  const { isLoading, withLoading } = useLoading();

  const handleSubmit = async () => {
    await withLoading(async () => {
      // Your async operation
      const response = await fetch('/api/some-endpoint', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const result = await response.json();
      // Process result
    });
  };

  return (
    <div className="relative">
      <LoadingOverlay isLoading={isLoading} message="Processing..." />
      
      <Button onClick={handleSubmit} disabled={isLoading}>
        Submit
      </Button>
    </div>
  );
}
```

### 3. Form Submission with Loading

Complete form example with loading state:

```tsx
'use client';

import { useState } from 'react';
import { useLoading } from '@/hooks/use-loading';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function MyForm() {
  const { isLoading, withLoading } = useLoading();
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await withLoading(async () => {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        // Handle success
        console.log('Form submitted successfully');
      }
    });
  };

  return (
    <div className="relative p-6 border rounded-lg">
      <LoadingOverlay isLoading={isLoading} message="Submitting form..." />
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          disabled={isLoading}
        />
        <Input
          placeholder="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          Submit
        </Button>
      </form>
    </div>
  );
}
```

### 4. Full-Screen Loading for Data Fetching

Show full-screen loading while fetching data:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { PageLoader } from '@/components/ui/page-loader';

export default function DataPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/data');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div>
      {/* Render your data */}
    </div>
  );
}
```

### 5. Manual Loading Control

For more control over loading states:

```tsx
'use client';

import { useLoading } from '@/hooks/use-loading';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { Button } from '@/components/ui/button';

export default function ManualLoadingExample() {
  const { isLoading, startLoading, stopLoading } = useLoading();

  const handleAction = async () => {
    startLoading();
    
    try {
      // Your async operations
      await someAsyncOperation();
      await anotherAsyncOperation();
    } catch (error) {
      console.error(error);
    } finally {
      stopLoading();
    }
  };

  return (
    <div className="relative">
      <LoadingOverlay isLoading={isLoading} />
      <Button onClick={handleAction}>Perform Action</Button>
    </div>
  );
}
```

### 6. Inline Loading (Non-Full-Screen)

Use LoadingOverlay for specific sections:

```tsx
'use client';

import { useLoading } from '@/hooks/use-loading';
import { LoadingOverlay } from '@/components/ui/loading-overlay';

export default function SectionWithLoading() {
  const { isLoading, withLoading } = useLoading();

  const loadData = async () => {
    await withLoading(async () => {
      // Fetch data
      await new Promise(resolve => setTimeout(resolve, 2000));
    });
  };

  return (
    <div className="relative min-h-[200px] border rounded-lg p-4">
      {/* fullScreen={false} makes it relative to parent container */}
      <LoadingOverlay 
        isLoading={isLoading} 
        fullScreen={false}
        message="Loading section data..."
      />
      
      <h2>Section Title</h2>
      <button onClick={loadData}>Load Data</button>
    </div>
  );
}
```

## Integration with Existing Code

### Update Your Quiz Edit Page

Here's how to integrate with your existing quiz edit page:

```tsx
'use client';

import { useState } from 'react';
import { useLoading } from '@/hooks/use-loading';
import { LoadingOverlay } from '@/components/ui/loading-overlay';

export default function QuizEditPage() {
  const { isLoading, withLoading } = useLoading();
  
  const handleImageUpload = async (file: File) => {
    await withLoading(async () => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/quiz/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      // Handle result
    });
  };

  const handleSaveQuiz = async () => {
    await withLoading(async () => {
      // Save quiz logic
      await fetch('/api/quiz/save', {
        method: 'POST',
        body: JSON.stringify(quizData),
      });
    });
  };

  return (
    <div className="relative">
      <LoadingOverlay isLoading={isLoading} message="Processing..." />
      
      {/* Your existing quiz edit form */}
    </div>
  );
}
```

## API Reference

### useLoading Hook

```typescript
const {
  isLoading,      // boolean - current loading state
  startLoading,   // () => void - manually start loading
  stopLoading,    // () => void - manually stop loading
  withLoading,    // <T>(fn: () => Promise<T>) => Promise<T> - wrap async function
  setIsLoading,   // (value: boolean) => void - directly set loading state
} = useLoading(initialLoading?: boolean);
```

### usePageLoading Hook

```typescript
const isLoading = usePageLoading(delay?: number); // default delay: 500ms
```

### LoadingOverlay Props

```typescript
interface LoadingOverlayProps {
  isLoading: boolean;      // Whether to show the overlay
  message?: string;        // Loading message (default: "Loading...")
  fullScreen?: boolean;    // Full-screen or relative to parent (default: false)
  className?: string;      // Additional CSS classes
}
```

## Tips

1. **Always disable interactive elements** when loading to prevent multiple submissions
2. **Use appropriate messages** to inform users what's happening
3. **Set minimum delays** for page loads to avoid flashing loaders
4. **Use fullScreen={false}** for section-specific loading states
5. **Combine with error handling** for better user experience

## Styling Customization

The truck loader uses inline styles, but you can customize the LoadingOverlay background:

```tsx
<LoadingOverlay 
  isLoading={isLoading}
  className="bg-black/50" // Custom background
/>
```
