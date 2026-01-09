/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { Button } from '@shadcn/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@shadcn/ui/command'
import { ChevronsUpDown, Loader2 } from 'lucide-react'
import { INodeProperty } from '@/types/workflow'

interface IEventTypeItemsProps {
  property: INodeProperty
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameter: any
  onChange: (field: string, value: string) => void
  eventTypes?: string[]
  isLoading?: boolean
}

export default function EventTypeItems({
  property,
  onChange,
  parameter,
  eventTypes,
  isLoading,
}: IEventTypeItemsProps) {
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false)
  const [eventType, setEventType] = useState<string>('')
  const [combinedEventTypes, setCombinedEventTypes] = useState<string[]>([])

  useEffect(() => {
    if (eventTypes) {
      setCombinedEventTypes(eventTypes)
    }
  }, [eventTypes])

  // Check if the typed value exists in the list (case-insensitive)
  const doesEventTypeExist = (value: string): boolean => {
    if (!value.trim()) return false
    return combinedEventTypes.some((type) => type.toLowerCase() === value.toLowerCase().trim())
  }

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between bg-card"
          disabled={isLoading}>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin" />
              Loading...
            </div>
          ) : (
            parameter?.[property.name] || property.default || 'Select an event type'
          )}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-full p-0">
        <Command>
          <CommandInput
            value={eventType}
            onValueChange={(value) => setEventType(value)}
            placeholder="Search event types..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && eventType.trim()) {
                const trimmedValue = eventType.trim()
                if (!doesEventTypeExist(trimmedValue)) {
                  setCombinedEventTypes((prev) => [...prev, trimmedValue])
                }
                onChange(property.name, trimmedValue)
                setPopoverOpen(false)
                setEventType('')
              }
            }}
          />
          <CommandList>
            <CommandEmpty>No event types found</CommandEmpty>
            <CommandGroup>
              {combinedEventTypes
                ?.filter((type) => type.toLowerCase().includes(eventType.toLowerCase()))
                .map((type) => {
                  return (
                    <CommandItem
                      key={type}
                      value={type}
                      className="cursor-pointer hover:bg-slate-300/20"
                      onSelect={() => {
                        onChange(property.name, type)
                        setPopoverOpen(false)
                        setEventType('')
                      }}>
                      {type}
                    </CommandItem>
                  )
                })}
              {eventType.trim() && !doesEventTypeExist(eventType) && (
                <CommandItem
                  value={eventType.trim()}
                  className="cursor-pointer font-semibold hover:bg-slate-300/20"
                  onSelect={() => {
                    const newEventType = eventType.trim()
                    setCombinedEventTypes((prev) => [...prev, newEventType])
                    onChange(property.name, newEventType)
                    setPopoverOpen(false)
                    setEventType('')
                  }}>
                  Add &quot;{eventType.trim()}&quot;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
