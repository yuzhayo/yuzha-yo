/**
 * Shared Button Component
 *
 * AI AGENT NOTES:
 * - Reusable button with consistent styling
 * - Supports multiple variants (primary, secondary, outline, ghost)
 * - Includes loading and disabled states
 * - Fully accessible with proper ARIA attributes
 *
 * Props:
 * - variant: 'primary' | 'secondary' | 'outline' | 'ghost'
 * - size: 'sm' | 'md' | 'lg'
 * - loading: boolean - Shows loading state
 * - disabled: boolean - Disables interaction
 * - fullWidth: boolean - Takes full container width
 * - children: ReactNode - Button content
 * - onClick, className, etc. - Standard button props
 *
 * Usage:
 * <Button variant="primary" onClick={handleClick}>Click Me</Button>
 * <Button variant="outline" size="lg" loading>Loading...</Button>
 *
 * When modifying:
 * - Keep accessibility features (disabled, aria-disabled)
 * - Maintain color consistency with design system
 * - Test all variant combinations
 */

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled = false,
  className = "",
  children,
  ...props
}) => {
  // Base styles
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  // Variant styles
  const variantStyles = {
    primary: "bg-orange text-white hover:bg-opacity-90 focus:ring-orange disabled:bg-opacity-50",
    secondary: "bg-gold text-brown hover:bg-opacity-90 focus:ring-gold disabled:bg-opacity-50",
    outline:
      "border-2 border-orange text-orange hover:bg-orange hover:text-white focus:ring-orange disabled:border-opacity-50 disabled:text-opacity-50",
    ghost:
      "text-orange hover:bg-orange hover:bg-opacity-10 focus:ring-orange disabled:text-opacity-50",
  };

  // Size styles
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  // Width style
  const widthStyle = fullWidth ? "w-full" : "";

  // Combine all styles
  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`;

  return (
    <button
      className={combinedStyles}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};
