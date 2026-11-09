import { Button } from '@shadcn/ui/button'
import { Calendar } from '@shadcn/ui/calendar'
import { Input } from '@shadcn/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import { cn } from '@shadcn/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import { useState } from 'react'

type DateFilterProps = {
  label: string
  value?: Date
  disabled?: React.ComponentProps<typeof Calendar>['disabled']
  onChange: (date?: Date) => void
}

const DateFilter = ({ label, value, disabled, onChange }: DateFilterProps) => {
  const [open, setOpen] = useState(false)

  const handleSelect = (date?: Date) => {
    onChange(date)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-44 shrink-0 justify-start text-left font-normal',
            !value && 'text-muted-foreground'
          )}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'PP') : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={handleSelect} disabled={disabled} />
      </PopoverContent>
    </Popover>
  )
}

export type EventFiltersProps = {
  eventType: string
  onEventTypeChange: (value: string) => void
  createdFrom?: Date
  createdTo?: Date
  onCreatedFromChange: (date?: Date) => void
  onCreatedToChange: (date?: Date) => void
  onClear: () => void
  hasActiveFilters: boolean
}

export const EventFilters = ({
  eventType,
  onEventTypeChange,
  createdFrom,
  createdTo,
  onCreatedFromChange,
  onCreatedToChange,
  onClear,
  hasActiveFilters,
}: EventFiltersProps) => {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Input
        value={eventType}
        onChange={(event) => onEventTypeChange(event.target.value)}
        placeholder="Event type, e.g. user.*"
        aria-label="Filter by event type"
        className="w-64 min-w-0 shrink"
      />
      <DateFilter
        label="Created from"
        value={createdFrom}
        disabled={createdTo ? { after: createdTo } : undefined}
        onChange={onCreatedFromChange}
      />
      <DateFilter
        label="Created to"
        value={createdTo}
        disabled={createdFrom ? { before: createdFrom } : undefined}
        onChange={onCreatedToChange}
      />
      {hasActiveFilters && (
        <Button variant="ghost" onClick={onClear} className="gap-1">
          <X className="h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  )
}
