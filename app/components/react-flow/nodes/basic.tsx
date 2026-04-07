import { Card, CardContent } from '@shadcn/ui/card'
import { cn } from '@shadcn/lib/utils'
import { IconName } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Handle, Node, Position } from '@xyflow/react'
import { Globe2 } from 'lucide-react'

export type NodeBasicData = {
  firstNode: boolean
  lastNode: boolean
  name: string
  kind: string
  isSelected: boolean
  icon: string
  displayName: string
  isExecution: boolean
  icon_color: string
  status?: string
  error_message?: string
  timestamp?: string
}

type NodeBasicProps = Node<NodeBasicData>

const getIconColorClass = (iconColor: string | undefined): string => {
  const colorMap: Record<string, string> = {
    red: 'text-red-500',
    blue: 'text-blue-500',
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    purple: 'text-purple-500',
    pink: 'text-pink-500',
    indigo: 'text-indigo-500',
    orange: 'text-orange-500',
    teal: 'text-teal-500',
    cyan: 'text-cyan-500',
    emerald: 'text-emerald-500',
    violet: 'text-violet-500',
    fuchsia: 'text-fuchsia-500',
    rose: 'text-rose-500',
    amber: 'text-amber-500',
    lime: 'text-lime-500',
    sky: 'text-sky-500',
  }

  if (!iconColor) return 'text-muted-foreground'
  return colorMap[iconColor.toLowerCase()] || 'text-muted-foreground'
}

export default function NodeBasic({ data, id }: NodeBasicProps) {
  return (
    <Card
      className={cn(
        `group relative overflow-visible rounded-sm border shadow-none hover:border-primary
        hover:bg-accent hover:text-primary`,
        data.isSelected ? 'border-primary bg-accent text-primary' : '',
        data?.status === 'error' &&
          `border-destructive bg-destructive/10 text-destructive hover:border-destructive
          hover:bg-destructive/10 hover:text-destructive`
      )}>
      <CardContent
        className={cn(
          'cursor-pointer p-2 transition-colors duration-200',
          data?.isExecution ? 'pointer-events-none' : ''
        )}>
        {data?.icon === 'action_app' ? (
          <Globe2 size={20} className={cn('text-muted-foreground, group-hover:text-primary')} />
        ) : (
          <FontAwesomeIcon
            icon={['fas', data?.icon?.split(':')[1].toString() as IconName]}
            className={cn(
              getIconColorClass(data?.icon_color),
              'group-hover:text-primary',
              data?.status === 'error' && 'text-destructive group-hover:text-destructive'
            )}
          />
        )}
      </CardContent>
      {!data?.lastNode && <Handle type="source" position={Position.Right} id={id} />}
      {!data?.firstNode && <Handle type="target" position={Position.Left} id={id} />}
      <span
        className={cn(
          `absolute -bottom-5 left-1/2 z-50 w-20 -translate-x-1/2 text-center text-[7px]!
          font-medium`,
          data?.status === 'error' && 'text-destructive'
        )}>
        {data?.displayName}
      </span>
      {data.error_message && (
        <div
          className="absolute left-1/2 top-full -translate-x-1/2 z-50 w-max max-w-32
            bg-destructive/10 p-1 mt-5 text-center text-[6px]! font-medium text-destructive
            leading-tight rounded overflow-y-auto wrap-break-word"
          title={data.error_message}>
          <span>{data.error_message}</span>
        </div>
      )}
    </Card>
  )
}
