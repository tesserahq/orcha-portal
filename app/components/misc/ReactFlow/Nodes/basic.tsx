import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/utils/misc'
import { IconName } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Handle, Node, Position } from '@xyflow/react'
import { Globe2 } from 'lucide-react'

export type NodeBasicData = {
  firstNode: boolean
  name: string
  kind: string
  isHovered: boolean
  icon: string
  displayName: string
  isExecution: boolean
  icon_color: string
}

type NodeBasicProps = Node<NodeBasicData>

export default function NodeBasic({ data, id }: NodeBasicProps) {
  return (
    <Card
      className={`group relative overflow-visible rounded-sm border shadow-none hover:border-primary hover:bg-accent hover:text-primary`}>
      <CardContent
        className={cn(
          'cursor-pointer p-2 transition-colors duration-200',
          data?.isExecution ? 'pointer-events-none' : '',
        )}>
        {data?.icon === 'action_app' ? (
          <Globe2
            size={20}
            className={cn('text-muted-foreground, group-hover:text-primary')}
          />
        ) : (
          <FontAwesomeIcon
            icon={['fas', data?.icon?.split(':')[1].toString() as IconName]}
            className={cn(`text-${data?.icon_color}-500 group-hover:text-primary`)}
          />
        )}
      </CardContent>
      <Handle type="source" position={Position.Right} id={id} />
      {!data?.firstNode && <Handle type="target" position={Position.Left} id={id} />}
      <span className="absolute -bottom-5 left-1/2 z-50 w-20 -translate-x-1/2 text-center !text-[7px] font-medium">
        {data?.displayName}
      </span>
    </Card>
  )
}
