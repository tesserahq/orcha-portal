import { Card, CardContent } from '@/components/ui/card'
import { IconName } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Position, Handle, Node } from '@xyflow/react'
import { NodeBasicData } from './basic'

type NodeBasicProps = Node<NodeBasicData>

export default function NodeIf({ data, id }: NodeBasicProps) {
  return (
    <Card className="group relative overflow-visible rounded-sm shadow-none hover:border-primary hover:bg-accent hover:text-primary">
      <CardContent className="cursor-pointer p-2 transition-colors duration-200">
        <FontAwesomeIcon
          icon={['fas', data?.icon?.split(':')[1].toString() as IconName]}
          className="text-muted-foreground group-hover:text-primary"
        />
      </CardContent>
      {!data?.firstNode && <Handle type="target" position={Position.Left} id={id} />}
      <Handle type="source" position={Position.Right} id={id} />

      <span className="absolute -bottom-5 left-1/2 z-50 w-20 -translate-x-1/2 text-center !text-[7px] font-medium">
        {data?.displayName}
      </span>
    </Card>
  )
}
