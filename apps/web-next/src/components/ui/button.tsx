import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "destructive" | "default" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variantClasses = {
      primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
      secondary: "bg-neutral-700 hover:bg-neutral-600 text-white focus:ring-neutral-500",
      success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
      destructive: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
      default: "bg-neutral-800 hover:bg-neutral-700 text-white focus:ring-neutral-500",
      outline: "border border-neutral-700 hover:bg-neutral-800 text-white focus:ring-neutral-500",
      ghost: "hover:bg-neutral-800 text-white focus:ring-neutral-500",
      link: "text-blue-400 hover:text-blue-300 underline focus:ring-blue-500"
    };

    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base"
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;