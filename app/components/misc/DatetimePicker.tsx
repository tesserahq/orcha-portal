'use client'

import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface IProps {
  currentDate: Date | null
  onChange: (date: Date | null) => void
}

export function DatetimePicker({ currentDate, onChange }: IProps) {
  const [open, setOpen] = React.useState<boolean>(false)
  const [selected, setSelected] = React.useState<Date | undefined>(
    currentDate || undefined,
  )

  const handleDaySelect = (date: Date | undefined) => {
    if (!date) {
      setSelected(undefined)
      onChange(null)
      return
    }

    // Create date in local timezone for consistent display
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()
    const newDate = new Date(year, month, day)

    setSelected(newDate)
    onChange(newDate)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!selected}
          className="justify-start rounded bg-transparent text-left font-normal data-[empty=true]:text-muted-foreground">
          <CalendarIcon />
          {selected ? format(selected, 'PPP') : <span>Pick a date and time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="p-3">
          <Calendar mode="single" selected={selected} onSelect={handleDaySelect} />
        </div>
      </PopoverContent>
    </Popover>
  )
}
