import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

export type HoldToggleOptions = {
  holdMs?: number;
  moveTolerancePx?: number;
};

export type HoldToggleResult = {
  open: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
  bindTargetProps: () => HTMLAttributes<HTMLElement>;
};

type PressState = {
  active: boolean;
  id: number | null;
  startX: number;
  startY: number;
  startedAt: number;
  timer: number | null;
  consumed: boolean;
};

export function useHoldToggle(options?: HoldToggleOptions): HoldToggleResult {
  const holdMs = Math.max(120, Math.floor(options?.holdMs ?? 450));
  const moveTolerance = Math.max(2, Math.floor(options?.moveTolerancePx ?? 8));

  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((value) => !value), []);

  const pressRef = useRef<PressState>({
    active: false,
    id: null,
    startX: 0,
    startY: 0,
    startedAt: 0,
    timer: null,
    consumed: false,
  });

  const clearTimer = useCallback(() => {
    const state = pressRef.current;
    if (state.timer !== null) {
      window.clearTimeout(state.timer);
      state.timer = null;
    }
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!event.isPrimary) return;

      event.currentTarget.setPointerCapture?.(event.pointerId);

      const state = pressRef.current;
      state.active = true;
      state.id = event.pointerId;
      state.startX = event.clientX;
      state.startY = event.clientY;
      state.startedAt = performance.now();
      state.consumed = false;

      clearTimer();
      state.timer = window.setTimeout(() => {
        if (state.active && !state.consumed) {
          state.consumed = true;
          toggle();
        }
      }, holdMs);
    },
    [clearTimer, holdMs, toggle],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const state = pressRef.current;
      if (!state.active || state.id !== event.pointerId) return;

      const dx = event.clientX - state.startX;
      const dy = event.clientY - state.startY;
      if (dx * dx + dy * dy > moveTolerance * moveTolerance) {
        state.active = false;
        state.id = null;
        state.consumed = false;
        clearTimer();
      }
    },
    [clearTimer, moveTolerance],
  );

  const endPress = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const state = pressRef.current;
      if (!state.active || (state.id !== null && state.id !== event.pointerId)) return;

      state.active = false;
      state.id = null;
      clearTimer();

      try {
        event.currentTarget.releasePointerCapture?.(event.pointerId);
      } catch {
        // Swallow failures, pointer capture is best-effort.
      }
    },
    [clearTimer],
  );

  const bindTargetProps = useCallback((): HTMLAttributes<HTMLElement> => {
    return {
      onPointerDown,
      onPointerMove,
      onPointerUp: endPress,
      onPointerCancel: endPress,
    };
  }, [endPress, onPointerDown, onPointerMove]);

  useEffect(() => clearTimer, [clearTimer]);

  return { open, setOpen, toggle, bindTargetProps };
}

export type HoldToggleAreaProps = {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode | ((state: HoldToggleResult) => ReactNode);
  options?: HoldToggleOptions;
  onOpenChange?: (open: boolean) => void;
};

export function HoldToggleArea({
  className,
  style,
  children,
  options,
  onOpenChange,
}: HoldToggleAreaProps) {
  const gesture = useHoldToggle(options);

  useEffect(() => {
    onOpenChange?.(gesture.open);
  }, [gesture.open, onOpenChange]);

  const content =
    typeof children === "function"
      ? (children as (state: HoldToggleResult) => ReactNode)(gesture)
      : children;

  return (
    <div className={className} style={style} {...gesture.bindTargetProps()}>
      {content}
    </div>
  );
}
