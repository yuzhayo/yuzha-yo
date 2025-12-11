import React, { useState, useMemo, useEffect, Suspense, Component, type ReactNode } from "react";
import { CheckIcon, CopyIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon, AlertCircleIcon, SunIcon, MoonIcon, RefreshCwIcon } from "lucide-react";
import { TooltipProvider } from "@shared/components/ui/tooltip";
import "./componentViewer.css";

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

const componentModules = import.meta.glob("../../../shared/components/*.tsx", { eager: false }) as Record<string, () => Promise<{ default: React.ComponentType; title?: string }>>;

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
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
    </div>
  );
}

function ErrorFallback({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-4">
      <AlertCircleIcon className="w-10 h-10 text-red-400 mb-3" />
      <div className="text-base text-red-500 font-medium">Failed to load component</div>
      <div className="text-sm text-slate-500 mt-1">{name}</div>
    </div>
  );
}

function DynamicComponent({ path, name }: { path: string; name: string }) {
  const [LoadedComponent, setLoadedComponent] = useState<React.ComponentType | null>(null);
  const [componentTitle, setComponentTitle] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoadedComponent(null);
    setError(false);
    setComponentTitle(null);
    
    const loader = componentModules[path];
    if (loader) {
      loader()
        .then((mod) => {
          setLoadedComponent(() => mod.default);
          if (mod.title) {
            setComponentTitle(mod.title);
          }
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

export default function ComponentViewerScreen({ onBack }: ComponentViewerScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<ComponentInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkPreview, setIsDarkPreview] = useState(false);

  const categories = useMemo(() => {
    const cats = new Map<string, ComponentInfo[]>();
    COMPONENT_FILES.forEach((c) => {
      if (!cats.has(c.category)) {
        cats.set(c.category, []);
      }
      cats.get(c.category)!.push(c);
    });
    return Array.from(cats.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  const filteredComponents = useMemo(() => {
    return COMPONENT_FILES.filter((c) => {
      const matchesCategory = !selectedCategory || c.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.file.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const currentIndex = useMemo(() => {
    if (!selectedComponent) return -1;
    return filteredComponents.findIndex((c) => c.file === selectedComponent.file);
  }, [selectedComponent, filteredComponents]);

  const goToPrev = () => {
    if (currentIndex > 0) {
      setSelectedComponent(filteredComponents[currentIndex - 1]!);
    }
  };

  const goToNext = () => {
    if (currentIndex < filteredComponents.length - 1) {
      setSelectedComponent(filteredComponents[currentIndex + 1]!);
    }
  };

  useEffect(() => {
    if (!selectedComponent && filteredComponents.length > 0) {
      setSelectedComponent(filteredComponents[0]!);
    } else if (selectedComponent && !filteredComponents.find((c) => c.file === selectedComponent.file)) {
      setSelectedComponent(filteredComponents[0] || null);
    }
  }, [filteredComponents, selectedComponent]);

  const filePath = selectedComponent ? `@shared/components/${selectedComponent.file.replace('.tsx', '')}` : '';

  return (
    <div className="flex h-screen bg-slate-900">
      <div className="w-72 bg-slate-900 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-white">Component Viewer</h1>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Refresh to scan for new components"
            >
              <RefreshCwIcon className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">{COMPONENT_FILES.length} components</p>
        </div>

        <div className="p-3 border-b border-slate-700">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-slate-800 ${
              selectedCategory === null
                ? "bg-slate-800 text-white font-medium"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            All Categories
            <span className="float-right text-slate-500">{COMPONENT_FILES.length}</span>
          </button>

          {categories.map(([cat, components]) => (
            <div key={cat}>
              <button
                type="button"
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors capitalize border-b border-slate-800 ${
                  selectedCategory === cat
                    ? "bg-slate-800 text-white font-medium"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {cat.replace(/-/g, " ")}
                <span className="float-right text-slate-500">{components.length}</span>
              </button>
              
              {selectedCategory === cat && (
                <div className="bg-slate-950">
                  {components.map((comp) => (
                    <button
                      key={comp.file}
                      type="button"
                      onClick={() => setSelectedComponent(comp)}
                      className={`w-full text-left px-6 py-2 text-sm transition-colors ${
                        selectedComponent?.file === comp.file
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {comp.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {onBack && (
          <div className="p-3 border-t border-slate-700">
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

      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedComponent ? (
          <>
            <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white capitalize">
                    {selectedComponent.name}
                  </h2>
                  <p className="text-sm text-slate-400 capitalize mt-0.5">
                    {selectedComponent.category.replace(/-/g, " ")}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDarkPreview(!isDarkPreview)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
                  >
                    {isDarkPreview ? (
                      <>
                        <MoonIcon className="w-4 h-4" />
                        Dark
                      </>
                    ) : (
                      <>
                        <SunIcon className="w-4 h-4" />
                        Light
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={goToPrev}
                      disabled={currentIndex <= 0}
                      className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-slate-400 px-2">
                      {currentIndex + 1} / {filteredComponents.length}
                    </span>
                    <button
                      type="button"
                      onClick={goToNext}
                      disabled={currentIndex >= filteredComponents.length - 1}
                      className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 bg-slate-900 rounded-lg px-3 py-2">
                <code className="text-sm text-slate-300 flex-1 truncate font-mono">{filePath}</code>
                <CopyButton text={filePath} />
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div
                className={`component-preview min-h-full rounded-xl border shadow-lg overflow-hidden ${
                  isDarkPreview ? "dark" : ""
                }`}
              >
                <div className="flex items-center justify-center p-8 min-h-[400px]">
                  <Suspense fallback={<LoadingSpinner />}>
                    <DynamicComponent
                      key={selectedComponent.path}
                      path={selectedComponent.path}
                      name={selectedComponent.name}
                    />
                  </Suspense>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400 text-lg">No component selected</p>
              <p className="text-slate-500 text-sm mt-1">Choose a component from the sidebar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
