/* eslint-disable @typescript-eslint/no-explicit-any */
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { INodeProperty } from '@/types/workflow'
import { Info } from 'lucide-react'
import JsonEditor from '../../JsonEditor'
import EventTypeItems from './event-type-items'

interface IProps {
  property: INodeProperty
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameter: any
  onChange: (field: string, value: string) => void
  eventTypes?: string[]
  isLoading?: boolean
}

export default function NodeProperty({
  property,
  onChange,
  parameter,
  eventTypes,
  isLoading,
}: IProps) {
  return (
    <>
      <Label className="flex items-center gap-2">
        {property.display_name}
        {property.description && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger>
                <Info size={13} className="text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="right">{property.description}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </Label>
      <div className="mb-3 mt-2">
        {property.type === 'string' && property.name === 'event_type' && (
          <EventTypeItems
            property={property}
            parameter={parameter}
            onChange={onChange}
            eventTypes={eventTypes}
            isLoading={isLoading}
          />
        )}

        {property.type === 'string' && property.name !== 'event_type' && (
          <Input
            defaultValue={parameter?.[property.name] || property.default}
            onChange={(e) => onChange(property.name, e.target.value)}
            className="bg-card"
          />
        )}

        {property.type === 'options' && (
          <Select
            defaultValue={parameter?.[property.name] || property.default}
            onValueChange={(value) => onChange(property.name, value)}>
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {property.options?.map((option) => (
                <SelectItem key={option.name} value={option.value}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {property.type === 'json' && (
          <JsonEditor
            initialValue={parameter?.[property.name] || property.default}
            onChange={(value) => onChange(property.name, value as any)}
          />
        )}
      </div>
    </>
  )
}
