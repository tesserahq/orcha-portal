import { format } from 'date-fns'

interface DatePreviewProps {
  date: string
}

export default function DatePreview({ date }: DatePreviewProps) {
  return (
    <span className="text-sm text-muted-foreground">
      {format(new Date(date + 'z'), 'PPpp')}
    </span>
  )
}
