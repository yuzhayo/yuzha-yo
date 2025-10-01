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
      trigger: "bg-blue-600 text-white font-bold text-lg px-4 py-4 border-l-4 border-blue-800",
      content: "bg-blue-50",
    },
    2: {
      trigger: "bg-blue-400 text-gray-900 font-semibold text-base px-6 py-3 border-l-2 border-blue-600 ml-2",
      content: "bg-blue-100",
    },
    3: {
      trigger: "bg-gray-300 text-gray-900 font-medium text-sm px-8 py-2 border-l-2 border-gray-600 ml-4",
      content: "bg-white",
    },
  };
  return styles[level as keyof typeof styles] || styles[1];
};

export function NestedAccordion({ data, level = 1 }: NestedAccordionProps) {
  const styles = getLevelStyles(level);

  if (!data || data.length === 0) {
    return <div className="p-4 text-red-500 font-bold">No data to display</div>;
  }

  return (
    <Accordion.Root type="multiple" className="w-full space-y-2">
      {data.map((item) => (
        <Accordion.Item key={item.id} value={item.id} className="border-2 border-gray-400 rounded-md overflow-hidden">
          <Accordion.Trigger
            className={`
              ${styles.trigger}
              w-full
              flex items-center justify-between
              hover:opacity-90
              transition-all duration-200
              group
              cursor-pointer
            `}
            style={{
              minHeight: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span className="text-left flex-1" style={{ fontSize: '16px', fontWeight: 600 }}>
              {item.label}
            </span>
            <ChevronDownIcon
              className="
                transition-transform duration-300 ease-in-out
                group-data-[state=open]:rotate-180
                flex-shrink-0
                ml-2
              "
              style={{ width: '20px', height: '20px' }}
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
    label: "🎯 PARENT 1 - Configuration Settings",
    level: 1,
    children: [
      {
        id: "parent-1-sub-1",
        label: "⚙️ Sub Parent 1 - General Settings",
        level: 2,
        children: [
          { id: "child-1", label: "📝 Child 1 - Theme Configuration", level: 3 },
          { id: "child-2", label: "🌐 Child 2 - Language Settings", level: 3 },
          { id: "child-1-3", label: "🔔 Child 3 - Notification Preferences", level: 3 },
        ],
      },
      {
        id: "parent-1-sub-2",
        label: "🔐 Sub Parent 2 - Security Settings",
        level: 2,
        children: [
          { id: "child-3", label: "🔑 Child 3 - Password Policy", level: 3 },
          { id: "child-4", label: "🛡️ Child 4 - Two-Factor Auth", level: 3 },
          { id: "child-4-3", label: "📱 Child 5 - Device Management", level: 3 },
        ],
      },
      {
        id: "parent-1-sub-3",
        label: "👤 Sub Parent 3 - User Preferences",
        level: 2,
        children: [
          { id: "child-5-1", label: "🎨 Child 6 - Display Options", level: 3 },
          { id: "child-5-2", label: "📊 Child 7 - Dashboard Layout", level: 3 },
        ],
      },
    ],
  },
  {
    id: "parent-2",
    label: "📦 PARENT 2 - Data Management",
    level: 1,
    children: [
      {
        id: "parent-2-sub-1",
        label: "💾 Sub Parent 1 - Storage Options",
        level: 2,
        children: [
          { id: "child-5", label: "☁️ Child 5 - Cloud Storage", level: 3 },
          { id: "child-6", label: "💽 Child 6 - Local Storage", level: 3 },
          { id: "child-6-3", label: "🗄️ Child 7 - Backup Settings", level: 3 },
        ],
      },
      {
        id: "parent-2-sub-2",
        label: "📊 Sub Parent 2 - Data Export",
        level: 2,
        children: [
          { id: "child-7", label: "📄 Child 7 - CSV Export", level: 3 },
          { id: "child-8", label: "📋 Child 8 - JSON Export", level: 3 },
          { id: "child-8-3", label: "📊 Child 9 - Excel Export", level: 3 },
        ],
      },
    ],
  },
  {
    id: "parent-3",
    label: "🚀 PARENT 3 - Advanced Features",
    level: 1,
    children: [
      {
        id: "parent-3-sub-1",
        label: "🔧 Sub Parent 1 - API Configuration",
        level: 2,
        children: [
          { id: "child-9", label: "🔗 Child 10 - API Keys", level: 3 },
          { id: "child-10", label: "⚡ Child 11 - Rate Limiting", level: 3 },
        ],
      },
      {
        id: "parent-3-sub-2",
        label: "🎨 Sub Parent 2 - Customization",
        level: 2,
        children: [
          { id: "child-11", label: "🖼️ Child 12 - Custom Branding", level: 3 },
          { id: "child-12", label: "🎭 Child 13 - Widget Settings", level: 3 },
        ],
      },
    ],
  },
];
