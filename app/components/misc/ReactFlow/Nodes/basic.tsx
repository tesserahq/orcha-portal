import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/utils/misc'
import { IconName } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  Edge,
  getConnectedEdges,
  getIncomers,
  getOutgoers,
  Handle,
  Node,
  Position,
  useReactFlow,
} from '@xyflow/react'
import { Globe2, Trash2 } from 'lucide-react'
import { useCallback, useRef } from 'react'
import ConfigurationNode, { NodeType } from '@/components/misc/Dialog/Nodes/configuration'

export type NodeBasicData = {
  firstNode: boolean
  name: string
  kind: string
  isHovered: boolean
  icon: string
  displayName: string
  isExecution: boolean
}

type NodeBasicProps = Node<NodeBasicData>

export default function NodeBasic({ data, id }: NodeBasicProps) {
  const reactFlow = useReactFlow()
  const nodes = reactFlow.getNodes()
  const edges = reactFlow.getEdges()
  const configurationNodeRef = useRef<React.ElementRef<typeof ConfigurationNode>>(null)

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      let remainingNodes = [...nodes]
      reactFlow.setEdges(
        deleted.reduce((acc: Edge[], node: Node) => {
          const incomers = getIncomers(node, remainingNodes, acc)
          const outgoers = getOutgoers(node, remainingNodes, acc)
          const connectedEdges = getConnectedEdges([node], acc)

          const remainingEdges = acc.filter((edge) => !connectedEdges.includes(edge))

          const createdEdges = incomers.flatMap(({ id: source }) =>
            outgoers.map(({ id: target }) => ({
              id: `${source}->${target}`,
              source,
              target,
            })),
          )

          remainingNodes = remainingNodes.filter((rn) => rn.id !== node.id)

          return [...remainingEdges, ...createdEdges]
        }, edges),
      )
    },
    [nodes, edges],
  )

  const handleDeleteNode = () => {
    const nodeToDelete = nodes.find((node) => node.id === id)
    if (nodeToDelete) {
      onNodesDelete([nodeToDelete])

      reactFlow.setNodes((prevNodes) => prevNodes.filter((node) => node.id !== id))
    }
  }

  const handleOpenConfiguration = () => {
    const node = nodes.find((node) => node.id === id)

    configurationNodeRef.current?.onOpen({
      node: node as Node,
      nodeType: node?.data.name as NodeType,
      title: node?.data.displayName as string,
      description: node?.data.description as string,
    })
  }

  return (
    <>
      <Card className="group relative overflow-visible rounded-sm shadow-none hover:border-primary hover:bg-accent hover:text-primary">
        {!data?.isExecution && (
          <div className="absolute -top-[18px] left-1/2 z-50 flex -translate-x-1/2 text-center !text-[7px] font-medium opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="rounded-full bg-destructive p-0.5" onClick={handleDeleteNode}>
              <Trash2 size={10} className="cursor-pointer text-white" />
            </div>
          </div>
        )}
        <CardContent
          className={cn(
            'cursor-pointer p-2 transition-colors duration-200',
            data?.isExecution ? 'pointer-events-none' : '',
          )}
          onClick={handleOpenConfiguration}>
          {data?.icon === 'action_app' ? (
            <Globe2
              size={20}
              className={cn('text-muted-foreground, group-hover:text-primary')}
            />
          ) : (
            <FontAwesomeIcon
              icon={['fas', data?.icon?.split(':')[1].toString() as IconName]}
              className={cn('text-muted-foreground, group-hover:text-primary')}
            />
          )}
        </CardContent>
        <Handle type="source" position={Position.Right} id={id} />
        {!data?.firstNode && <Handle type="target" position={Position.Left} id={id} />}
        <span className="absolute -bottom-5 left-1/2 z-50 w-20 -translate-x-1/2 text-center !text-[7px] font-medium">
          {data?.displayName}
        </span>
      </Card>

      <ConfigurationNode
        ref={configurationNodeRef}
        callback={(nodeId, data) => {
          const newNodes = nodes.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  settings: data,
                },
              }
            }

            return node
          })

          reactFlow.setNodes(newNodes)
        }}
      />
    </>
  )
}
