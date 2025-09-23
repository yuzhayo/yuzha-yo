/**
 * Event handling logic - Child of StagesEngine
 * AI can modify this file to add new event processing logic
 */

import type { StageEvent } from "./StagesTypes";

export class StagesEngineEvents {
  private eventListeners = new Map<string, Array<(event: StageEvent) => void>>();
  private eventHistory: StageEvent[] = [];
  private maxHistorySize = 100;

  /**
   * Add event listener
   */
  addEventListener(type: string, listener: (event: StageEvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(type: string, listener: (event: StageEvent) => void): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Process and dispatch event
   * AI can extend this for custom event processing
   */
  processEvent(
    type: string,
    stageX: number,
    stageY: number,
    originalEvent: PointerEvent | MouseEvent,
    objectId?: string,
  ): void {
    // Create stage event
    const stageEvent: StageEvent = {
      type: type as StageEvent["type"],
      stageX,
      stageY,
      objectId,
      originalEvent,
    };

    // Add custom processing based on event type
    this.enhanceEvent(stageEvent);

    // Store in history
    this.addToHistory(stageEvent);

    // Dispatch to listeners
    this.dispatchEvent(type, stageEvent);
  }

  /**
   * Enhance event with additional data
   * AI can add custom event enhancements here
   */
  private enhanceEvent(event: StageEvent): void {
    // Add timestamp
    (event as any).timestamp = Date.now();

    // Add gesture detection for sequences
    if (event.type === "pointerdown") {
      (event as any).gestureStart = true;
    }

    // Add double-click detection
    if (event.type === "click") {
      const recentClicks = this.getRecentEvents("click", 500); // Within 500ms
      if (recentClicks.length >= 2) {
        (event as any).doubleClick = true;
      }
    }

    // Add drag detection
    if (event.type === "pointermove") {
      const lastPointerDown = this.getLastEvent("pointerdown");
      if (lastPointerDown) {
        const distance = Math.sqrt(
          Math.pow(event.stageX - lastPointerDown.stageX, 2) +
            Math.pow(event.stageY - lastPointerDown.stageY, 2),
        );
        if (distance > 10) {
          (event as any).isDrag = true;
          (event as any).dragDistance = distance;
        }
      }
    }

    // Add hover duration for long hovers
    if (event.type === "pointermove" && event.objectId) {
      const hoverStart = this.getHoverStart(event.objectId);
      if (hoverStart) {
        (event as any).hoverDuration = Date.now() - hoverStart;
      }
    }
  }

  /**
   * Get recent events of specific type
   */
  private getRecentEvents(type: string, timeWindow: number): StageEvent[] {
    const now = Date.now();
    return this.eventHistory.filter(
      (event) => event.type === type && now - ((event as any).timestamp || 0) <= timeWindow,
    );
  }

  /**
   * Get last event of specific type
   */
  private getLastEvent(type: string): StageEvent | null {
    for (let i = this.eventHistory.length - 1; i >= 0; i--) {
      const event = this.eventHistory[i];
      if (event && event.type === type) {
        return event;
      }
    }
    return null;
  }

  /**
   * Get hover start time for object
   */
  private getHoverStart(objectId: string): number | null {
    // Find first recent pointermove event on this object
    for (let i = this.eventHistory.length - 1; i >= 0; i--) {
      const event = this.eventHistory[i];
      if (!event) continue;

      if (event.type === "pointermove" && event.objectId === objectId) {
        return (event as any).timestamp || Date.now();
      }
      // Stop looking if we hit a different object or non-move event
      if (event.objectId !== objectId || event.type !== "pointermove") {
        break;
      }
    }
    return null;
  }

  /**
   * Add event to history
   */
  private addToHistory(event: StageEvent): void {
    this.eventHistory.push(event);

    // Limit history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Dispatch event to listeners
   */
  private dispatchEvent(type: string, event: StageEvent): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${type}:`, error);
        }
      });
    }
  }

  /**
   * Setup DOM event handlers
   * AI can add new event types here
   */
  setupEventHandlers(
    container: HTMLElement,
    transformCoordinates: (
      event: PointerEvent | MouseEvent,
    ) => { stageX: number; stageY: number } | null,
    getObjectsAt: (x: number, y: number) => any[],
  ): void {
    const handleEvent = (type: string, originalEvent: PointerEvent | MouseEvent) => {
      const coords = transformCoordinates(originalEvent);
      if (!coords) return;

      const objectsAt = getObjectsAt(coords.stageX, coords.stageY);
      const objectId = objectsAt.length > 0 ? objectsAt[0].id : undefined;

      this.processEvent(type, coords.stageX, coords.stageY, originalEvent, objectId);
    };

    // Standard pointer events
    container.addEventListener("pointerdown", (e) => handleEvent("pointerdown", e));
    container.addEventListener("pointermove", (e) => handleEvent("pointermove", e));
    container.addEventListener("pointerup", (e) => handleEvent("pointerup", e));
    container.addEventListener("click", (e) => handleEvent("click", e));

    // Additional events AI can enable
    container.addEventListener("wheel", (e) => {
      const coords = transformCoordinates(e as any);
      if (coords) {
        this.processEvent("wheel", coords.stageX, coords.stageY, e as any);
      }
    });

    container.addEventListener("contextmenu", (e) => {
      e.preventDefault(); // Prevent context menu
      const coords = transformCoordinates(e as any);
      if (coords) {
        this.processEvent("rightclick", coords.stageX, coords.stageY, e as any);
      }
    });
  }

  /**
   * Get event statistics
   */
  getEventStats() {
    const stats: Record<string, number> = {};

    for (const event of this.eventHistory) {
      stats[event.type] = (stats[event.type] || 0) + 1;
    }

    return {
      totalEvents: this.eventHistory.length,
      eventTypes: stats,
      listeners: Object.fromEntries(
        Array.from(this.eventListeners.entries()).map(([type, listeners]) => [
          type,
          listeners.length,
        ]),
      ),
    };
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Clear all listeners
   */
  clearListeners(): void {
    this.eventListeners.clear();
  }

  /**
   * Add custom event processor
   * AI can use this to add completely new event types
   */
  addCustomEventProcessor(eventType: string, processor: (event: StageEvent) => void): void {
    this.addEventListener(eventType, processor);
  }
}
