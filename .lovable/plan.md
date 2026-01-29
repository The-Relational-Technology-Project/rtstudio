
# Refactoring & Code Cleanup Plan

This plan addresses all high-priority items identified in the codebase review: fixing non-functional code, consolidating duplicate types, standardizing loading patterns, and adding consistent footers.

---

## Summary of Changes

1. **Fix unused Profile edit mode** - Remove the non-functional `isEditing` state and "Edit Profile" button
2. **Create shared `types/library.ts`** - Consolidate the `LibraryItem` interface used in 3 files
3. **Add consistent footer to authenticated pages** - Add Privacy & Terms footer to Sidekick, Library, and Profile pages
4. **Create reusable `LoadingSpinner` component** - Standardize the loading pattern used in 7+ files

---

## Detailed Implementation

### 1. Fix Unused Profile Edit Mode

The Profile page has an `isEditing` state and "Edit Profile" button that do nothing. Since profile editing requires significant additional UI work, we'll remove this non-functional code to prevent user confusion.

**File: `src/pages/Profile.tsx`**
- Remove the `isEditing` state and `setIsEditing` function
- Remove the "Edit Profile" button from the header
- Remove the `Settings` icon import

---

### 2. Create Shared Types File

The `LibraryItem` interface is duplicated in three files:
- `src/pages/Library.tsx` (lines 12-25)
- `src/components/LibraryCard.tsx` (lines 11-24)
- `src/components/Sidekick.tsx` (uses a similar but different `LibraryItemData` interface)

**New file: `src/types/library.ts`**
```typescript
export type ItemType = "story" | "prompt" | "tool";

export interface LibraryItem {
  id: string;
  type: ItemType;
  title: string;
  summary: string;
  author?: string;
  category?: string;
  url?: string;
  fullContent?: string;
  examplePrompt?: string;
  imageUrls?: string[];
}
```

**Files to update:**
- `src/pages/Library.tsx` - Import from shared types, remove local definition
- `src/components/LibraryCard.tsx` - Import from shared types, remove local definition
- `src/components/LibraryItemPreview.tsx` - Import `ItemType` from shared types

---

### 3. Create Reusable LoadingSpinner Component

Found 7+ files with duplicate loading patterns using `Loader2` with `animate-spin`. We'll create a standardized component.

**New file: `src/components/ui/loading-spinner.tsx`**
```typescript
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
  fullPage?: boolean;
}

export const LoadingSpinner = ({ 
  size = "md", 
  className,
  text,
  fullPage = false 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  const spinner = (
    <Loader2 className={cn(
      "animate-spin text-muted-foreground",
      sizeClasses[size],
      className
    )} />
  );

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          {text && <p className="text-muted-foreground">{text}</p>}
        </div>
      </div>
    );
  }

  if (text) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2">
          {spinner}
          <p className="text-sm text-muted-foreground">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {spinner}
    </div>
  );
};
```

**Files to update with the new component:**
- `src/components/VisionBoard.tsx` - Replace loading state (line 333-338)
- `src/components/CommitmentsList.tsx` - Replace loading state (line 142-148)
- `src/components/ServiceberriesCounter.tsx` - Replace loading state (line 147-152)
- `src/components/ProtectedRoute.tsx` - Replace loading state with `fullPage` variant

---

### 4. Add Consistent Footer to Authenticated Pages

Create a reusable footer component and add it to all authenticated pages.

**New file: `src/components/Footer.tsx`**
```typescript
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border mt-auto">
      <p className="flex items-center justify-center gap-2 flex-wrap">
        <span>Made with care for neighbors everywhere</span>
        <span className="hidden sm:inline">·</span>
        <Link to="/privacy" className="text-primary hover:underline">
          Privacy & Terms
        </Link>
      </p>
    </footer>
  );
};
```

**Files to update:**
- `src/pages/Landing.tsx` - Use the new `Footer` component
- `src/pages/SidekickPage.tsx` - Add Footer component
- `src/pages/Library.tsx` - Add Footer component
- `src/pages/Profile.tsx` - Add Footer component

---

## Files Created
| File | Purpose |
|------|---------|
| `src/types/library.ts` | Shared LibraryItem types |
| `src/components/ui/loading-spinner.tsx` | Reusable loading component |
| `src/components/Footer.tsx` | Reusable footer component |

## Files Modified
| File | Changes |
|------|---------|
| `src/pages/Profile.tsx` | Remove unused isEditing code, add Footer |
| `src/pages/Library.tsx` | Use shared types, add Footer |
| `src/components/LibraryCard.tsx` | Use shared types |
| `src/components/LibraryItemPreview.tsx` | Use shared ItemType |
| `src/pages/SidekickPage.tsx` | Add Footer |
| `src/pages/Landing.tsx` | Use Footer component |
| `src/components/VisionBoard.tsx` | Use LoadingSpinner |
| `src/components/CommitmentsList.tsx` | Use LoadingSpinner |
| `src/components/ServiceberriesCounter.tsx` | Use LoadingSpinner |
| `src/components/ProtectedRoute.tsx` | Use LoadingSpinner |

---

## Benefits

- **Reduced code duplication** - Type definitions and UI patterns in single locations
- **Better maintainability** - Changes to loading or footer only need to happen once
- **Cleaner Profile page** - No confusing non-functional button
- **Consistent user experience** - Same footer on all authenticated pages
- **Type safety** - Single source of truth for library item types
