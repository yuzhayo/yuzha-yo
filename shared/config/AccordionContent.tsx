import React from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "@radix-ui/react-icons";

interface AccordionItem {
  id: string;
  label: string;
  level: 1 | 2 | 3;
  children?: AccordionItem[];
}

interface NestedAccordionProps {
  data: AccordionItem[];
  level?: 1 | 2 | 3;
}

const getLevelStyles = (level: number) => {
  const styles = {
    1: {
      trigger: "bg-blue-500 text-white font-semibold text-base px-4 py-3 border-l-4 border-blue-700",
      content: "bg-blue-50",
    },
    2: {
      trigger: "bg-blue-300 text-gray-900 font-medium text-sm px-6 py-2.5 border-l-3 border-blue-500 ml-2",
      content: "bg-blue-25",
    },
    3: {
      trigger: "bg-gray-100 text-gray-700 font-normal text-xs px-8 py-2 border-l-2 border-gray-400 ml-4",
      content: "bg-white",
    },
  };
  return styles[level as keyof typeof styles] || styles[1];
};

export function NestedAccordion({ data, level = 1 }: NestedAccordionProps) {
  const styles = getLevelStyles(level);

  return (
    <Accordion.Root type="multiple" className="w-full space-y-1">
      {data.map((item) => (
        <Accordion.Item key={item.id} value={item.id} className="overflow-hidden">
          <Accordion.Trigger
            className={`
              ${styles.trigger}
              w-full
              flex items-center justify-between
              hover:opacity-90
              transition-all duration-200
              group
            `}
          >
            <span>{item.label}</span>
            <ChevronDownIcon
              className="
                transition-transform duration-300 ease-in-out
                group-data-[state=open]:rotate-180
              "
              aria-hidden
            />
          </Accordion.Trigger>

          {item.children && item.children.length > 0 && (
            <Accordion.Content
              className={`
                ${styles.content}
                overflow-hidden
                data-[state=open]:animate-slideDown
                data-[state=closed]:animate-slideUp
              `}
            >
              <div className="py-2">
                {level < 3 ? (
                  <NestedAccordion data={item.children} level={(level + 1) as 1 | 2 | 3} />
                ) : (
                  <div className="space-y-1">
                    {item.children.map((child) => (
                      <div
                        key={child.id}
                        className="bg-white px-10 py-2 text-xs text-gray-600 ml-6 border-l-2 border-gray-300"
                      >
                        • {child.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Accordion.Content>
          )}
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

export const sampleAccordionData: AccordionItem[] = [
  {
    id: "parent-1",
    label: "PARENT 1",
    level: 1,
    children: [
      {
        id: "parent-1-sub-1",
        label: "Sub Parent 1",
        level: 2,
        children: [
          { id: "child-1", label: "Child 1", level: 3 },
          { id: "child-2", label: "Child 2", level: 3 },
        ],
      },
      {
        id: "parent-1-sub-2",
        label: "Sub Parent 2",
        level: 2,
        children: [
          { id: "child-3", label: "Child 3", level: 3 },
          { id: "child-4", label: "Child 4", level: 3 },
        ],
      },
    ],
  },
  {
    id: "parent-2",
    label: "PARENT 2",
    level: 1,
    children: [
      {
        id: "parent-2-sub-1",
        label: "Sub Parent 1",
        level: 2,
        children: [
          { id: "child-5", label: "Child 5", level: 3 },
          { id: "child-6", label: "Child 6", level: 3 },
        ],
      },
      {
        id: "parent-2-sub-2",
        label: "Sub Parent 2",
        level: 2,
        children: [
          { id: "child-7", label: "Child 7", level: 3 },
          { id: "child-8", label: "Child 8", level: 3 },
        ],
      },
    ],
  },
];
