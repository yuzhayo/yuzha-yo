import * as React from "react"
import { cn } from "@shared/lib/utils"
import { Input } from "@shared/components/ui/input"
import { Textarea } from "@shared/components/ui/textarea"
import { Button, type ButtonProps } from "@shared/components/ui/button"

type InputGroupProps = React.HTMLAttributes<HTMLDivElement>

const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center rounded-md border border-input bg-transparent shadow-sm focus-within:ring-1 focus-within:ring-ring",
          "[&>input]:border-0 [&>input]:bg-transparent [&>input]:shadow-none [&>input]:focus-visible:ring-0",
          "[&>textarea]:border-0 [&>textarea]:bg-transparent [&>textarea]:shadow-none [&>textarea]:focus-visible:ring-0",
          className
        )}
        {...props}
      />
    )
  }
)
InputGroup.displayName = "InputGroup"

type InputGroupTextProps = React.HTMLAttributes<HTMLSpanElement>

const InputGroupText = React.forwardRef<HTMLSpanElement, InputGroupTextProps>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "flex h-9 items-center px-3 text-sm text-muted-foreground",
          className
        )}
        {...props}
      />
    )
  }
)
InputGroupText.displayName = "InputGroupText"

interface InputGroupAddonProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "inline-start" | "inline-end" | "block-start" | "block-end"
}

const InputGroupAddon = React.forwardRef<HTMLDivElement, InputGroupAddonProps>(
  ({ className, align = "inline-end", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center",
          align === "inline-start" && "order-first",
          align === "inline-end" && "order-last",
          align === "block-start" && "order-first w-full",
          align === "block-end" && "order-last w-full",
          className
        )}
        {...props}
      />
    )
  }
)
InputGroupAddon.displayName = "InputGroupAddon"

type InputGroupButtonProps = ButtonProps

const InputGroupButton = React.forwardRef<HTMLButtonElement, InputGroupButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn("shrink-0", className)}
        {...props}
      />
    )
  }
)
InputGroupButton.displayName = "InputGroupButton"

type InputGroupInputProps = React.InputHTMLAttributes<HTMLInputElement>

const InputGroupInput = React.forwardRef<HTMLInputElement, InputGroupInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        className={cn("flex-1", className)}
        {...props}
      />
    )
  }
)
InputGroupInput.displayName = "InputGroupInput"

type InputGroupTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const InputGroupTextarea = React.forwardRef<HTMLTextAreaElement, InputGroupTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <Textarea
        ref={ref}
        className={cn("flex-1", className)}
        {...props}
      />
    )
  }
)
InputGroupTextarea.displayName = "InputGroupTextarea"

export { 
  InputGroup, 
  InputGroupText, 
  InputGroupAddon, 
  InputGroupButton, 
  InputGroupInput,
  InputGroupTextarea
}
