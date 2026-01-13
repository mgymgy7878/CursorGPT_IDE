'use client'

/**
 * SparkMark - Official Spark Trading brand mark
 * Single source of truth for brand icon (Figma parity)
 */
export function SparkMark({ className = "h-3.5 w-3.5 text-white/80" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Spark mark - simplified geometric shape */}
      <path
        d="M8 2L9.5 5.5L13 6L10.5 8.5L11.5 12L8 10L4.5 12L5.5 8.5L3 6L6.5 5.5L8 2Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  )
}

