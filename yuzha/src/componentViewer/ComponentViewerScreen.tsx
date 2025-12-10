import React, { useState, useMemo, useEffect, Suspense, Component, type ReactNode } from "react";
import { CheckIcon, CopyIcon, ChevronLeftIcon, SearchIcon, AlertCircleIcon } from "lucide-react";
import { TooltipProvider } from "@shared/components/ui/tooltip";

export type ComponentViewerScreenProps = {
  onBack?: () => void;
};

type ComponentInfo = {
  file: string;
  category: string;
  name: string;
  title?: string;
  hasError?: boolean;
  path: string;
};

const componentModules = import.meta.glob("../../../shared/components/*.tsx", { eager: false }) as Record<string, () => Promise<{ default: React.ComponentType }>>;

function parseComponentInfo(path: string): ComponentInfo {
  const fileName = path.split("/").pop() || "";
  const match = fileName.match(/^([a-z-]+)_(.+)\.tsx$/);
  if (match && match[1] && match[2]) {
    const category = match[1];
    const variant = match[2].replace(/-/g, " ").replace(/\d+$/, "").trim();
    const name = variant.charAt(0).toUpperCase() + variant.slice(1);
    return { file: fileName, category, name, path };
  }
  return { file: fileName, category: "other", name: fileName.replace(".tsx", ""), path };
}

const COMPONENT_FILES: ComponentInfo[] = Object.keys(componentModules).map(parseComponentInfo);

const FINAL_COMPONENTS = COMPONENT_FILES;

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1.5 rounded hover:bg-white/10 transition-colors"
      aria-label="Copy path"
    >
      {copied ? (
        <CheckIcon className="w-4 h-4 text-green-400" />
      ) : (
        <CopyIcon className="w-4 h-4 text-slate-400" />
      )}
    </button>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
    </div>
  );
}

function ErrorFallback({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <AlertCircleIcon className="w-8 h-8 text-red-400 mb-2" />
      <div className="text-sm text-red-400">Failed to load</div>
      <div className="text-xs text-slate-500 mt-1">{name}</div>
    </div>
  );
}

function DynamicComponent({ path, name }: { path: string; name: string }) {
  const [LoadedComponent, setLoadedComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loader = componentModules[path];
    if (loader) {
      loader()
        .then((mod) => {
          setLoadedComponent(() => mod.default);
        })
        .catch(() => {
          setError(true);
        });
    } else {
      setError(true);
    }
  }, [path]);

  if (error) {
    return <ErrorFallback name={name} />;
  }

  if (!LoadedComponent) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary fallback={<ErrorFallback name={name} />}>
      <TooltipProvider>
        <LoadedComponent />
      </TooltipProvider>
    </ErrorBoundary>
  );
}

function ComponentCard({ component }: { component: ComponentInfo }) {
  const filePath = `@shared/components/${component.file.replace('.tsx', '')}`;

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-colors">
      <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4 overflow-hidden">
        <div className="w-full h-full flex items-center justify-center transform scale-75 origin-center">
          <Suspense fallback={<LoadingSpinner />}>
            <DynamicComponent path={component.path} name={component.name} />
          </Suspense>
        </div>
      </div>
      <div className="p-3 bg-black/20">
        <div className="text-sm font-medium text-white mb-1">{component.name}</div>
        <div className="text-xs text-slate-400 capitalize mb-2">{component.category.replace("-", " ")}</div>
        <div className="flex items-center gap-2 bg-black/30 rounded px-2 py-1.5">
          <code className="text-xs text-slate-300 flex-1 truncate">{filePath}</code>
          <CopyButton text={filePath} />
        </div>
      </div>
    </div>
  );
}

export default function ComponentViewerScreen({ onBack }: ComponentViewerScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = useMemo(() => {
    const cats = new Map<string, number>();
    FINAL_COMPONENTS.forEach((c) => {
      cats.set(c.category, (cats.get(c.category) || 0) + 1);
    });
    return Array.from(cats.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  const filteredComponents = useMemo(() => {
    return FINAL_COMPONENTS.filter((c) => {
      const matchesCategory = !selectedCategory || c.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-64 bg-black/30 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h1 className="text-lg font-semibold text-white">Components</h1>
          <p className="text-xs text-slate-400 mt-1">{FINAL_COMPONENTS.length} templates</p>
        </div>

        <div className="p-3 border-b border-white/10">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedCategory === null
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            All Components
            <span className="float-right text-slate-500">{FINAL_COMPONENTS.length}</span>
          </button>

          <div className="mt-2 space-y-0.5">
            {categories.map(([cat, count]) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors capitalize ${
                  selectedCategory === cat
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {cat.replace("-", " ")}
                <span className="float-right text-slate-500">{count}</span>
              </button>
            ))}
          </div>
        </div>

        {onBack && (
          <div className="p-3 border-t border-white/10">
            <button
              type="button"
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Back to Main
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white capitalize">
            {selectedCategory?.replace("-", " ") || "All Components"}
          </h2>
          <p className="text-sm text-slate-400 mt-1">{filteredComponents.length} components</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredComponents.map((component) => (
            <ComponentCard key={component.file} component={component} />
          ))}
        </div>

        {filteredComponents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">No components found</p>
          </div>
        )}
      </div>
    </div>
  );
}
