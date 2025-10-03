import React, { useState, useCallback } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import {
  getLevelStyles,
  type AccordionParentItem,
  type AccordionChildItem,
} from "./ConfigYuzhaAccordionUtils";

interface ConfigYuzhaAccordionProps {
  data: AccordionParentItem[];
  level?: 1 | 2 | 3;
  onSave?: (data: AccordionParentItem[]) => void;
  imageOptions?: string[];
}

// Input components for different field types
function EditableInput({
  child,
  onChange,
  imageOptions,
}: {
  child: AccordionChildItem;
  onChange: (value: string | number | number[] | null) => void;
  imageOptions?: string[];
}) {
  const handleArrayChange = (value: string) => {
    try {
      const parsed = JSON.parse(`[${value}]`);
      if (Array.isArray(parsed)) {
        onChange(parsed);
      }
    } catch {
      // Invalid array format, ignore
    }
  };

  const handleNumberChange = (value: string) => {
    if (value === "" || value === "null") {
      onChange(null);
    } else {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

  switch (child.type) {
    case "dropdown":
      if (child.label.toLowerCase().includes("renderer")) {
        return (
          <select
            value={String(child.value)}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            data-testid={`input-${child.id}`}
          >
            <option value="2D">2D</option>
            <option value="3D">3D</option>
          </select>
        );
      } else if (child.label.toLowerCase().includes("imageid") && imageOptions) {
        return (
          <select
            value={String(child.value)}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            data-testid={`input-${child.id}`}
          >
            {imageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      }
      return (
        <input
          type="text"
          value={String(child.value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          data-testid={`input-${child.id}`}
        />
      );

    case "number":
      return (
        <input
          type="text"
          value={child.value === null ? "null" : String(child.value)}
          onChange={(e) => handleNumberChange(e.target.value)}
          placeholder="number or null"
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          data-testid={`input-${child.id}`}
        />
      );

    case "array":
      return (
        <input
          type="text"
          value={Array.isArray(child.value) ? child.value.join(", ") : ""}
          onChange={(e) => handleArrayChange(e.target.value)}
          placeholder="e.g., 1, 2"
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          data-testid={`input-${child.id}`}
        />
      );

    case "text":
    default:
      return (
        <input
          type="text"
          value={String(child.value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          data-testid={`input-${child.id}`}
        />
      );
  }
}

export function ConfigYuzhaAccordion({
  data,
  level = 1,
  onSave,
  imageOptions,
}: ConfigYuzhaAccordionProps) {
  const [accordionData, setAccordionData] = useState<AccordionParentItem[]>(data);
  const styles = getLevelStyles(level);

  const handleChildValueChange = useCallback(
    (
      parentId: string,
      subParentId: string,
      childId: string,
      newValue: string | number | number[] | null,
    ) => {
      setAccordionData((prevData) => {
        const newData = prevData.map((parent) => {
          if (parent.id === parentId) {
            return {
              ...parent,
              children: parent.children.map((subParent) => {
                if (subParent.id === subParentId) {
                  return {
                    ...subParent,
                    children: subParent.children.map((child) =>
                      child.id === childId ? { ...child, value: newValue } : child,
                    ),
                  };
                }
                return subParent;
              }),
            };
          }
          return parent;
        });
        return newData;
      });
    },
    [],
  );


  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(accordionData);
    }
  }, [accordionData, onSave]);

  if (!accordionData || accordionData.length === 0) {
    return <div className="p-4 text-red-500 font-bold">No data to display</div>;
  }

  return (
    <div className="w-full">
      <Accordion.Root type="multiple" className="w-full space-y-2">
        {accordionData.map((parent) => (
          <Accordion.Item
            key={parent.id}
            value={parent.id}
            className="border-2 border-gray-400 rounded-md"
            data-testid={`accordion-parent-${parent.id}`}
          >
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
                minHeight: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
              data-testid={`accordion-trigger-${parent.id}`}
            >
              <span className="text-left flex-1" style={{ fontSize: "16px", fontWeight: 600 }}>
                {parent.label}
              </span>
              <ChevronDownIcon
                className="
                  transition-transform duration-300 ease-in-out
                  group-data-[state=open]:rotate-180
                  flex-shrink-0
                  ml-2
                "
                style={{ width: "20px", height: "20px" }}
                aria-hidden
              />
            </Accordion.Trigger>

            {parent.children && parent.children.length > 0 && (
              <Accordion.Content
                className={`
                  ${styles.content}
                  overflow-hidden
                  data-[state=open]:animate-slideDown
                  data-[state=closed]:animate-slideUp
                `}
              >
                <div className="py-2">
                  <Accordion.Root type="multiple" className="w-full space-y-1">
                    {parent.children.map((subParent) => (
                      <Accordion.Item
                        key={subParent.id}
                        value={subParent.id}
                        className="border border-gray-300 rounded-md ml-2"
                        data-testid={`accordion-subparent-${subParent.id}`}
                      >
                        <Accordion.Trigger
                          className={`
                            ${getLevelStyles(2).trigger}
                            w-full
                            flex items-center justify-between
                            hover:opacity-90
                            transition-all duration-200
                            group
                            cursor-pointer
                          `}
                          data-testid={`accordion-trigger-${subParent.id}`}
                        >
                          <span className="text-left flex-1">{subParent.label}</span>
                          <ChevronDownIcon
                            className="
                              transition-transform duration-300 ease-in-out
                              group-data-[state=open]:rotate-180
                              flex-shrink-0
                              ml-2
                            "
                            style={{ width: "18px", height: "18px" }}
                            aria-hidden
                          />
                        </Accordion.Trigger>

                        <Accordion.Content
                          className={`
                            ${getLevelStyles(2).content}
                            overflow-hidden
                            data-[state=open]:animate-slideDown
                            data-[state=closed]:animate-slideUp
                          `}
                        >
                          <div className="space-y-1 p-2">
                            {subParent.children.map((child) => (
                              <div
                                key={child.id}
                                className="bg-white px-4 py-2 text-sm text-gray-700 ml-4 border-l-2 border-gray-300 rounded flex items-center justify-between gap-3"
                                data-testid={`accordion-child-${child.id}`}
                              >
                                <span className="font-medium min-w-[100px]">{child.label}:</span>
                                <div className="flex-1">
                                  <EditableInput
                                    child={child}
                                    onChange={(newValue) =>
                                      handleChildValueChange(
                                        parent.id,
                                        subParent.id,
                                        child.id,
                                        newValue,
                                      )
                                    }
                                    imageOptions={imageOptions}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </Accordion.Content>
                      </Accordion.Item>
                    ))}
                  </Accordion.Root>
                </div>
              </Accordion.Content>
            )}
          </Accordion.Item>
        ))}
      </Accordion.Root>

      {onSave && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            data-testid="save-button"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}