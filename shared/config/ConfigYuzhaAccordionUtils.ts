// Type definitions for accordion data structure
export interface AccordionChildItem {
  id: string;
  label: string;
  value: string | number | number[] | null;
  type: "dropdown" | "number" | "array" | "text";
  options?: string[];
  level: 3;
  hidden?: boolean;
}

export interface AccordionSubParentItem {
  id: string;
  label: string;
  level: 2;
  children: AccordionChildItem[];
}

export interface AccordionParentItem {
  id: string;
  label: string;
  level: 1;
  children: AccordionSubParentItem[];
}

// Get styling for different accordion levels
export const getLevelStyles = (level: number) => {
  const styles = {
    1: {
      trigger: "bg-blue-600 text-white font-bold text-lg px-4 py-4 border-l-4 border-blue-800",
      content: "bg-blue-50",
    },
    2: {
      trigger:
        "bg-blue-400 text-gray-900 font-semibold text-base px-6 py-3 border-l-2 border-blue-600 ml-2",
      content: "bg-blue-100",
    },
    3: {
      trigger:
        "bg-gray-300 text-gray-900 font-medium text-sm px-8 py-2 border-l-2 border-gray-600 ml-4",
      content: "bg-white",
    },
  };
  return styles[level as keyof typeof styles] || styles[1];
};