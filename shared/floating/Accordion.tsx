import React, { useState, useCallback } from "react";

export type AccordionSection = {
  id: string;
  title: string;
  content: React.ReactNode;
  defaultOpen?: boolean;
};

export type AccordionProps = {
  sections: AccordionSection[];
  allowMultiple?: boolean;
  className?: string;
  sectionClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  openIds?: Set<string>;
  onToggle?: (id: string, isOpen: boolean) => void;
  renderHeader?: (section: AccordionSection, isOpen: boolean) => React.ReactNode;
  renderIcon?: (isOpen: boolean) => React.ReactNode;
};

const defaultRenderIcon = (isOpen: boolean) => (
  <svg
    className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default function Accordion({
  sections,
  allowMultiple = true,
  className,
  sectionClassName,
  headerClassName,
  bodyClassName,
  openIds: controlledOpenIds,
  onToggle,
  renderHeader,
  renderIcon = defaultRenderIcon,
}: AccordionProps) {
  const [internalOpenIds, setInternalOpenIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    sections.forEach((s) => {
      if (s.defaultOpen) initial.add(s.id);
    });
    return initial;
  });

  const isControlled = controlledOpenIds !== undefined;
  const openIds = isControlled ? controlledOpenIds : internalOpenIds;

  const toggle = useCallback(
    (id: string) => {
      const isCurrentlyOpen = openIds.has(id);
      const willBeOpen = !isCurrentlyOpen;

      if (isControlled) {
        onToggle?.(id, willBeOpen);
      } else {
        setInternalOpenIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            if (!allowMultiple) next.clear();
            next.add(id);
          }
          return next;
        });
        onToggle?.(id, willBeOpen);
      }
    },
    [openIds, isControlled, allowMultiple, onToggle]
  );

  const containerClass = className ?? "space-y-2";

  return (
    <div className={containerClass}>
      {sections.map((section) => {
        const isOpen = openIds.has(section.id);
        const headerId = `accordion-header-${section.id}`;
        const contentId = `accordion-content-${section.id}`;

        const sectionClass =
          sectionClassName ?? "border border-slate-300 rounded overflow-hidden";
        const headerClass =
          headerClassName ??
          "w-full flex items-center justify-between px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-colors";
        const bodyClass = bodyClassName ?? "px-3 py-3 bg-white";

        return (
          <div key={section.id} className={sectionClass}>
            <button
              type="button"
              id={headerId}
              aria-expanded={isOpen}
              aria-controls={contentId}
              onClick={() => toggle(section.id)}
              className={headerClass}
            >
              {renderHeader ? (
                renderHeader(section, isOpen)
              ) : (
                <>
                  <span>{section.title}</span>
                  {renderIcon(isOpen)}
                </>
              )}
            </button>
            {isOpen && (
              <div id={contentId} role="region" aria-labelledby={headerId} className={bodyClass}>
                {section.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
