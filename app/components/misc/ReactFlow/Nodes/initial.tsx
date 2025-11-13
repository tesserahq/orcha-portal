import { Card, CardContent } from '@/components/ui/card'
import { Node } from '@xyflow/react'
import { Plus } from 'lucide-react'

type NodeAddData = {
  onAddNode?: () => void
}

type NodeAddProps = Node<NodeAddData>

const NodeAdd = ({ data }: NodeAddProps) => {
  const handleAddClick = () => {
    if (data?.onAddNode) {
      data.onAddNode()
    }
  }

  return (
    <Card className="group relative overflow-visible rounded-sm shadow-none transition-colors duration-200 hover:border-primary">
      <CardContent
        className="cursor-pointer p-2 group-hover:bg-accent group-hover:text-primary"
        onClick={handleAddClick}>
        <Plus />
      </CardContent>

      <span className="absolute -bottom-5 left-1/2 z-50 w-20 -translate-x-1/2 text-center !text-[8px] font-medium">
        Add first step
      </span>
    </Card>
  )
}

export default NodeAdd
