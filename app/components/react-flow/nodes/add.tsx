import { Card, CardContent } from '@shadcn/ui/card'
import { Handle, Node, Position } from '@xyflow/react'
import { Plus } from 'lucide-react'

type NodeAddData = {
  onAddNode?: () => void
}

type NodeAddProps = Node<NodeAddData>

const NodeAdd = ({ id, data }: NodeAddProps) => {
  const handleAddClick = () => {
    if (data?.onAddNode) {
      data.onAddNode()
    }
  }

  return (
    <Card className="relative overflow-visible rounded shadow-none hover:border-primary">
      <CardContent
        className="cursor-pointer p-1 hover:bg-accent hover:text-primary"
        onClick={handleAddClick}>
        <Plus size={10} />
      </CardContent>
      <Handle type="target" position={Position.Left} id={id ?? undefined} />
    </Card>
  )
}

export default NodeAdd
