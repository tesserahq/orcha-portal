/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Separator from '@/components/ui/separator'
import { useApp } from '@/context/AppContext'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { fetchApi, NodeENVType } from '@/libraries/fetch'
import { IWorkflowNode, IWorkflowNodeCategory } from '@/types/workflow'
import { cn } from '@/utils/misc'
import { IconName } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle,
  GitBranch,
  Globe2,
  Pencil,
  Zap,
} from 'lucide-react'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { AppPreloader } from '../../AppPreloader'
import { Node } from '@xyflow/react'

interface FuncProps {
  onOpen: (currentNode?: Node, nodeAddId?: string) => void
  onClose: () => void
}

interface IProps {
  apiUrl: string
  nodeEnv: NodeENVType
  onSave: (node: any, currentNode?: Node | undefined, nodeAddId?: string) => void
}

export const CategoryIcon = ({
  category,
  className,
}: {
  category: string
  className?: string
}) => {
  switch (category) {
    case 'trigger':
      return <Zap size={20} className={className} />

    case 'flow':
      return <GitBranch size={20} className={className} />

    case 'core':
      return <BriefcaseBusiness size={20} className={className} />

    case 'data_transformation':
      return <Pencil size={20} className={className} />

    default:
      return <Globe2 size={20} className={className} />
  }
}

const NodeCategories: React.ForwardRefRenderFunction<FuncProps, IProps> = (
  { apiUrl, nodeEnv, onSave }: IProps,
  ref,
) => {
  const [open, setOpen] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [categories, setCategories] = useState<IWorkflowNodeCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<IWorkflowNodeCategory | null>(
    null,
  )
  const [selectedNode, setSelectedNode] = useState<IWorkflowNode | null>(null)
  const [currentNode, setCurrentNode] = useState<Node | null>(null)
  const [nodeAddId, setNodeAddId] = useState<string | null>(null)
  const { token } = useApp()
  const handleApiError = useHandleApiError()

  const fetchData = async () => {
    try {
      const response = await fetchApi(`${apiUrl}/nodes/categories`, token!, nodeEnv)
      setCategories(response.items)
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsLoading(false)
    }
  }

  useImperativeHandle(ref, () => ({
    onOpen(currentNode?: Node, nodeAddId?: string) {
      setCurrentNode(currentNode || null)
      setNodeAddId(nodeAddId || null)
      setOpen(true)
      fetchData()
    },

    onClose() {
      setOpen(false)
      setIsLoading(true)
      setSelectedCategory(null)
      setSelectedNode(null)
    },
  }))

  const onClose = () => {
    setOpen(false)
    setIsLoading(true)
    setSelectedCategory(null)
  }

  useEffect(() => {
    if (selectedCategory && selectedCategory.nodes?.length === 1) {
      setSelectedNode(selectedCategory.nodes[0])
    }
  }, [selectedCategory])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">
            {!selectedCategory ? (
              'Nodes'
            ) : (
              <div className="flex items-center gap-3">
                <CategoryIcon category={selectedCategory.key} />
                <h2 className="text-xl">{selectedCategory.name}</h2>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        {isLoading && <AppPreloader className="h-60" />}
        {!isLoading && categories.length > 0 && (
          <>
            {selectedCategory ? (
              <div className="flex animate-slide-up flex-col">
                {selectedCategory.nodes?.map((node, index) => (
                  <div key={node.id} onClick={() => setSelectedNode(node)}>
                    <div
                      className={cn(
                        'group flex cursor-pointer items-center space-x-3 py-3',
                        selectedNode?.id === node.id && 'bg-accent',
                      )}>
                      <FontAwesomeIcon
                        icon={['fas', node.icon.split(':')[1].toString() as IconName]}
                        className="text-sm text-muted-foreground transition-colors duration-200 group-hover:text-primary"
                      />
                      <div className="flex-1">
                        <h2 className="text-sm font-semibold transition-colors duration-200 group-hover:text-primary">
                          {node.displayName}
                        </h2>
                        <p className="text-xs text-muted-foreground transition-colors duration-200 group-hover:text-primary">
                          {node.subtitle}
                        </p>
                      </div>
                      {selectedNode?.id === node.id && (
                        <CheckCircle size={20} className="text-primary" />
                      )}
                    </div>
                    {Array.isArray(selectedCategory?.nodes) &&
                      selectedCategory.nodes.length > 1 &&
                      index < selectedCategory.nodes.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex animate-slide-up flex-col">
                {categories.map((category, index) => (
                  <div
                    key={category.key}
                    onClick={() => {
                      if (category.nodes?.length === 0) {
                        const node = {
                          name: category.key,
                          description: category.description,
                          kind: category.key,
                          settings: {},
                          icon: category.key,
                          displayName: category.name,
                        }

                        onSave(node, currentNode ?? undefined, nodeAddId ?? undefined)
                      } else {
                        setSelectedCategory(category)
                      }
                    }}>
                    <div className="group flex cursor-pointer items-center space-x-3 py-4">
                      <CategoryIcon
                        category={category.key}
                        className="transition-colors duration-200 group-hover:text-primary"
                      />
                      <div className="flex-1">
                        <h2 className="text-base font-semibold transition-colors duration-200 group-hover:text-primary">
                          {category.name}
                        </h2>
                        <p className="text-xs text-muted-foreground transition-colors duration-200 group-hover:text-primary">
                          {category.description}
                        </p>
                      </div>
                      <div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="transition-colors duration-200 group-hover:text-primary">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {categories.length > 1 && index < categories.length - 1 && (
                      <Separator />
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {selectedCategory && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCategory(null)}>
              Back
            </Button>
            <Button
              onClick={() => {
                const nodeData = {
                  name: selectedNode?.name as string,
                  description: selectedNode?.description as string,
                  kind: selectedNode?.category as string,
                  settings: {},
                  // ui_settings: {
                  icon: selectedNode?.icon as string,
                  displayName: selectedNode?.displayName as string,
                  // },
                }

                onSave(nodeData, currentNode ?? undefined, nodeAddId ?? undefined)
              }}
              disabled={!selectedNode}>
              Save
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default forwardRef(NodeCategories)
