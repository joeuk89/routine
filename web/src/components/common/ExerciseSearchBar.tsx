import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface ExerciseSearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  placeholder?: string
  className?: string
}

export function ExerciseSearchBar({ 
  searchQuery, 
  onSearchChange, 
  placeholder = "Search exercises...",
  className = ""
}: ExerciseSearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
      <Input
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
  )
}
