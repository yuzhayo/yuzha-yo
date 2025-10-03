/**
 * NavScreen.example.tsx - Usage Examples
 *
 * Demonstrates how to use NavScreen components for building
 * image-based UI layouts with the 2048×2048 stage system.
 */

import React from "react";
import {
  NavScreenLayout,
  NavSlot,
  NAV_STAGE_CENTER_X,
  NAV_STAGE_CENTER_Y,
} from "./NavScreen";

// ===================================================================
// EXAMPLE 1: Basic NavScreen with Images
// ===================================================================

export function ExampleBasicNavScreen() {
  const handleMenuClick = () => {
    console.log("Menu clicked!");
  };

  const handleBackClick = () => {
    console.log("Back clicked!");
  };

  return (
    <NavScreenLayout>
      {/* Center menu button with images */}
      <NavSlot
        position={{ x: NAV_STAGE_CENTER_X, y: 200 }} // Adjust position: center-top area
        size={{ width: 300, height: 80 }} // Adjust size: button dimensions
        normalImage="/shared/Asset/Img_List_Defalt.png"
        pressedImage="/shared/Asset/Img_List_Select.png"
        hoverImage={null} // No hover for mobile
        fitMode="cover"
        onClick={handleMenuClick}
        testId="menu-button"
      />

      {/* Bottom-left back button with default styling (no images) */}
      <NavSlot
        position={{ x: 150, y: 1900 }} // Adjust position: bottom-left
        size={{ width: 150, height: 60 }} // Adjust size: button dimensions
        normalImage={null} // No image = use default styling
        onClick={handleBackClick}
        testId="back-button"
      >
        ← Back
      </NavSlot>
    </NavScreenLayout>
  );
}

// ===================================================================
// EXAMPLE 2: NavScreen with Multiple Slots
// ===================================================================

export function ExampleMultiSlotNavScreen() {
  const slots = [
    {
      id: "slot-1",
      position: { x: 512, y: 512 }, // Adjust position: top-left quadrant center
      label: "Slot 1",
    },
    {
      id: "slot-2",
      position: { x: 1536, y: 512 }, // Adjust position: top-right quadrant center
      label: "Slot 2",
    },
    {
      id: "slot-3",
      position: { x: 512, y: 1536 }, // Adjust position: bottom-left quadrant center
      label: "Slot 3",
    },
    {
      id: "slot-4",
      position: { x: 1536, y: 1536 }, // Adjust position: bottom-right quadrant center
      label: "Slot 4",
    },
  ];

  return (
    <NavScreenLayout>
      {slots.map((slot) => (
        <NavSlot
          key={slot.id}
          position={slot.position}
          size={{ width: 200, height: 80 }} // Adjust size: consistent button size
          normalImage={null} // Using default styling
          onClick={() => console.log(`${slot.label} clicked`)}
          testId={slot.id}
        >
          {slot.label}
        </NavSlot>
      ))}
    </NavScreenLayout>
  );
}

// ===================================================================
// EXAMPLE 3: NavScreen with Mixed Image and Default Slots
// ===================================================================

export function ExampleMixedNavScreen() {
  return (
    <NavScreenLayout>
      {/* Image-based slot */}
      <NavSlot
        position={{ x: NAV_STAGE_CENTER_X, y: 300 }} // Adjust position: top center
        size={{ width: 400, height: 100 }} // Adjust size: large header button
        normalImage="/shared/Asset/SystemMessageBg.png"
        pressedImage="/shared/Asset/SystemMessageBg.png"
        fitMode="contain"
        onClick={() => console.log("Title clicked")}
        testId="title-slot"
      />

      {/* Default styled slots arranged vertically */}
      {["Option 1", "Option 2", "Option 3"].map((option, index) => (
        <NavSlot
          key={option}
          position={{ x: NAV_STAGE_CENTER_X, y: 800 + index * 150 }} // Adjust position: vertical stack
          size={{ width: 300, height: 80 }} // Adjust size: menu item dimensions
          normalImage={null}
          onClick={() => console.log(`${option} clicked`)}
          testId={`option-${index + 1}`}
        >
          {option}
        </NavSlot>
      ))}

      {/* Bottom navigation */}
      <NavSlot
        position={{ x: 200, y: 1850 }} // Adjust position: bottom-left corner
        size={{ width: 150, height: 150 }} // Adjust size: square icon button
        normalImage="/shared/Asset/Prestige_SlotBase.png"
        pressedImage="/shared/Asset/Prestige_SlotBase_Off.png"
        fitMode="cover"
        onClick={() => console.log("Left nav clicked")}
        testId="left-nav"
      />

      <NavSlot
        position={{ x: NAV_STAGE_CENTER_X, y: 1850 }} // Adjust position: bottom center
        size={{ width: 150, height: 150 }} // Adjust size: square icon button
        normalImage="/shared/Asset/Prestige_SlotBase.png"
        pressedImage="/shared/Asset/Prestige_SlotBase_Off.png"
        fitMode="cover"
        onClick={() => console.log("Center nav clicked")}
        testId="center-nav"
      />

      <NavSlot
        position={{ x: 1848, y: 1850 }} // Adjust position: bottom-right corner
        size={{ width: 150, height: 150 }} // Adjust size: square icon button
        normalImage="/shared/Asset/Prestige_SlotBase.png"
        pressedImage="/shared/Asset/Prestige_SlotBase_Off.png"
        fitMode="cover"
        onClick={() => console.log("Right nav clicked")}
        testId="right-nav"
      />
    </NavScreenLayout>
  );
}

// ===================================================================
// EXAMPLE 4: NavScreen with Dynamic Images from Registry
// ===================================================================

export function ExampleDynamicNavScreen() {
  // In real usage, you would import and use ImageRegistry
  // import { ImageRegistry } from "@shared/config/ImageRegistry";

  const menuItems = [
    {
      id: "item-1",
      normalImg: "shared/Asset/UI_ItemIcon_221.png",
      pressedImg: "shared/Asset/UI_ItemIcon_222.png",
      position: { x: NAV_STAGE_CENTER_X - 200, y: NAV_STAGE_CENTER_Y }, // Adjust position: left of center
    },
    {
      id: "item-2",
      normalImg: "shared/Asset/UI_ItemIcon_222.png",
      pressedImg: "shared/Asset/UI_ItemIcon_221.png",
      position: { x: NAV_STAGE_CENTER_X, y: NAV_STAGE_CENTER_Y }, // Adjust position: center
    },
    {
      id: "item-3",
      normalImg: "shared/Asset/UI_ItemIcon_221.png",
      pressedImg: "shared/Asset/UI_ItemIcon_222.png",
      position: { x: NAV_STAGE_CENTER_X + 200, y: NAV_STAGE_CENTER_Y }, // Adjust position: right of center
    },
  ];

  return (
    <NavScreenLayout>
      {menuItems.map((item) => (
        <NavSlot
          key={item.id}
          position={item.position}
          size={{ width: 150, height: 150 }} // Adjust size: icon button size
          normalImage={`/${item.normalImg}`}
          pressedImage={`/${item.pressedImg}`}
          hoverImage={null}
          fitMode="contain"
          onClick={() => console.log(`${item.id} clicked`)}
          testId={item.id}
        />
      ))}
    </NavScreenLayout>
  );
}

// ===================================================================
// EXAMPLE 5: Responsive Grid Layout
// ===================================================================

export function ExampleGridNavScreen() {
  const gridItems = Array.from({ length: 9 }, (_, i) => ({
    id: `grid-${i}`,
    label: `Item ${i + 1}`,
    position: {
      x: 512 + (i % 3) * 512, // Adjust position: 3-column grid (512, 1024, 1536)
      y: 512 + Math.floor(i / 3) * 512, // Adjust position: 3-row grid (512, 1024, 1536)
    },
  }));

  return (
    <NavScreenLayout>
      {gridItems.map((item) => (
        <NavSlot
          key={item.id}
          position={item.position}
          size={{ width: 250, height: 250 }} // Adjust size: grid cell size
          normalImage={null}
          onClick={() => console.log(`${item.label} clicked`)}
          testId={item.id}
        >
          {item.label}
        </NavSlot>
      ))}
    </NavScreenLayout>
  );
}

// ===================================================================
// EXAMPLE 6: Circular Menu Layout
// ===================================================================

export function ExampleCircularNavScreen() {
  const radius = 600; // Radius of the circular menu
  const itemCount = 6;

  const circularItems = Array.from({ length: itemCount }, (_, i) => {
    const angle = (i / itemCount) * Math.PI * 2 - Math.PI / 2; // Start from top
    return {
      id: `circular-${i}`,
      label: `Option ${i + 1}`,
      position: {
        x: NAV_STAGE_CENTER_X + Math.cos(angle) * radius, // Adjust position: circular layout
        y: NAV_STAGE_CENTER_Y + Math.sin(angle) * radius, // Adjust position: circular layout
      },
    };
  });

  return (
    <NavScreenLayout>
      {/* Center button */}
      <NavSlot
        position={{ x: NAV_STAGE_CENTER_X, y: NAV_STAGE_CENTER_Y }} // Adjust position: exact center
        size={{ width: 200, height: 200 }} // Adjust size: large center button
        normalImage={null}
        onClick={() => console.log("Center clicked")}
        testId="center-button"
      >
        Menu
      </NavSlot>

      {/* Circular items */}
      {circularItems.map((item) => (
        <NavSlot
          key={item.id}
          position={item.position}
          size={{ width: 150, height: 150 }} // Adjust size: circular menu items
          normalImage={null}
          onClick={() => console.log(`${item.label} clicked`)}
          testId={item.id}
        >
          {item.label}
        </NavSlot>
      ))}
    </NavScreenLayout>
  );
}
