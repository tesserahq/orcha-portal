/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button'
import Separator from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useApp } from '@/context/AppContext'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { fetchApi, NodeENVType } from '@/libraries/fetch'
import { IWorkflowNodeCategory } from '@/types/workflow'
import { cn } from '@/utils/misc'
import { IconName } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Node } from '@xyflow/react'
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  GitBranch,
  Globe2,
  Pencil,
  PlusSquare,
  X,
  Zap,
} from 'lucide-react'
import { forwardRef, useImperativeHandle, useState } from 'react'

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
      return <Zap size={18} className={className} />

    case 'flow':
      return <GitBranch size={18} className={className} />

    case 'core':
      return <BriefcaseBusiness size={18} className={className} />

    case 'data_transformation':
      return <Pencil size={18} className={className} />

    default:
      return <Globe2 size={18} className={className} />
  }
}

const NodeCategoriesDrawer: React.ForwardRefRenderFunction<FuncProps, IProps> = (
  { apiUrl, nodeEnv, onSave }: IProps,
  ref,
) => {
  const [open, setOpen] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [categories, setCategories] = useState<IWorkflowNodeCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<IWorkflowNodeCategory | null>(
    null,
  )
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
    },
  }))

  return (
    <div
      className={cn(
        'fixed right-0 top-0 h-full w-full !max-w-screen-sm bg-card pt-32 shadow transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : 'pointer-events-none translate-x-full',
      )}>
      <div className="h-full overflow-auto">
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-3">
            {selectedCategory && (
              <ArrowLeft
                size={20}
                className="cursor-pointer text-muted-foreground hover:text-primary"
                onClick={() => setSelectedCategory(null)}
              />
            )}
            {selectedCategory && <CategoryIcon category={selectedCategory.key} />}
            <h2 className="text-xl font-semibold">
              {!selectedCategory ? 'Nodes' : selectedCategory.name}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              setOpen(false)
              setIsLoading(true)
              setSelectedCategory(null)
            }}>
            <X size={18} />
          </Button>
        </div>
        {isLoading && (
          <div className="mt-3 space-y-5 px-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 max-w-[25%] flex-1" />
                  <Skeleton className="h-4 max-w-[75%]" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && categories.length > 0 && (
          <div className="px-5">
            {selectedCategory ? (
              <div className="flex animate-slide-up flex-col">
                {selectedCategory.nodes?.map((node, index) => (
                  <div
                    key={node.id}
                    onClick={() => {
                      const nodeData = {
                        name: node.name as string,
                        description: node.description as string,
                        icon: node.icon as string,
                        displayName: node.display_name as string,
                        properties: node.properties as any,
                        icon_color: node.icon_color as string,
                        kind: node.id,
                      }

                      onSave(nodeData, currentNode ?? undefined, nodeAddId ?? undefined)
                    }}>
                    <div className="group flex cursor-pointer items-center space-x-3 py-3">
                      <FontAwesomeIcon
                        icon={['fas', node.icon.split(':')[1].toString() as IconName]}
                        className="text-xl transition-colors duration-200 group-hover:text-primary"
                      />
                      <div className="flex-1">
                        <h2 className="text-sm font-semibold transition-colors duration-200 group-hover:text-primary">
                          {node.display_name}
                        </h2>
                        <p className="text-xs text-muted-foreground transition-colors duration-200 group-hover:text-primary">
                          {node.subtitle}
                        </p>
                      </div>
                      <PlusSquare
                        size={18}
                        className="transition-colors duration-200 group-hover:border-primary group-hover:text-primary"
                      />
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
          </div>
        )}
      </div>
    </div>
  )
}

export default forwardRef(NodeCategoriesDrawer)
