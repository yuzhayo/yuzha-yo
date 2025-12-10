[x] 1. Install the required packages
[x] 2. Restart the workflow to see if the project is working
[x] 3. Verify the project is working using the feedback tool
[x] 4. Inform user the import is completed and they can start building, mark the import as completed using the complete_project_import tool

## Shared Components Migration (COMPLETED)
[x] Install core shadcn dependencies (class-variance-authority, clsx, tailwind-merge, @radix-ui/react-slot)
[x] Install Radix UI primitives at root level
[x] Install additional dependencies (@tanstack/react-table, cmdk, vaul, date-fns, react-day-picker, embla-carousel-react, @faker-js/faker)
[x] Create shared/lib/utils.ts with cn() helper
[x] Fix all @/components/ui/* imports to @shared/components/ui/*
[x] Fix all @/lib/utils imports to @shared/lib/utils
[x] Fix ESLint errors (empty interfaces, React imports, type imports)
[x] Add icon-xs size variant to button.tsx
[x] Add variant prop to DropdownMenuItem
[x] Fix type safety issues in accordion component
[x] Fix ComponentViewerScreen glob pattern
[x] Update ComponentViewerScreen to dynamically load and render components
[x] Add TooltipProvider wrapper for components
[x] Verify typecheck and lint pass
[x] Both workspaces (yuzha and meng) running successfully