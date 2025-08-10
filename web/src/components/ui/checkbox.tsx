import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, disabled = false, id, ...props }, ref) => {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        data-state={checked ? "checked" : "unchecked"}
        disabled={disabled}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer relative flex items-center justify-center",
          checked ? "bg-green-600 border-green-600 text-white" : "bg-background hover:bg-gray-50",
          className
        )}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onCheckedChange?.(!checked)
        }}
        ref={ref}
        id={id}
        {...props}
      >
        {checked && (
          <Check className="h-4 w-4 text-white stroke-[3] absolute" style={{ transform: 'scale(1.2)' }} />
        )}
      </button>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
