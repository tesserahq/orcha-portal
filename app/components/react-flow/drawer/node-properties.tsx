/* eslint-disable @typescript-eslint/no-explicit-any */
import NodeProperty from '@/components/react-flow/nodes/property'
import { Button } from '@shadcn/ui/button'
import { Input } from '@shadcn/ui/input'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shadcn/ui/dialog'
import { fetchApi, NodeENVType } from '@/libraries/fetch'
import { INodeProperty } from '@/types/workflow'
import { cn } from '@shadcn/lib/utils'
import { Node } from '@xyflow/react'
import { Trash2, X } from 'lucide-react'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { useApp } from 'tessera-ui'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { useParams } from 'react-router'

interface ParamProps {
  node: Node
  title: string
  description: string
}

interface FuncProps {
  onOpen: ({ node, title, description }: ParamProps) => void
  onClose: () => void
}

interface IProps {
  apiUrl: string
  nodeEnv: NodeENVType
  callback: (nodeId: string, parameters: any, displayName: string) => void
  onDelete?: (nodeId: string) => void
  onClose?: () => void
  onOpenChange?: (open: boolean) => void
  onNameChange?: (nodeId: string, displayName: string) => void
}

const isJsonLikeValue = (value: unknown): boolean => {
  if (value !== null && typeof value === 'object') return true
  if (typeof value !== 'string') return false

  const trimmed = value.trim()
  if (!trimmed || !/^[[{]/.test(trimmed)) return false

  try {
    const parsed = JSON.parse(trimmed)
    return parsed !== null && typeof parsed === 'object'
  } catch {
    return false
  }
}

const getFallbackPropertiesFromParameters = (
  parameters: Record<string, any> = {}
): INodeProperty[] => {
  return Object.entries(parameters).map(([name, value]) => ({
    name,
    display_name: name.replace(/_/g, ' '),
    type: isJsonLikeValue(value) ? 'json' : 'string',
    default: value as never,
    description: '',
  }))
}

const NodePropertyDrawer: React.ForwardRefRenderFunction<FuncProps, IProps> = (
  { apiUrl, nodeEnv, callback, onDelete, onClose, onOpenChange, onNameChange }: IProps,
  ref
) => {
  const params = useParams()
  const { token } = useApp()
  const handleApiError = useHandleApiError()
  const [open, setOpen] = useState<boolean>(false)
  const [nodeData, setNodeData] = useState<ParamProps>()
  const [parameters, setParameters] = useState<any>()
  const [displayName, setDisplayName] = useState<string>('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
  const [eventTypes, setEventTypes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const handleDrawerOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    onOpenChange?.(nextOpen)

    // Reset state when closing the drawer
    if (!nextOpen) {
      setParameters(undefined)
      setNodeData(undefined)
      setDisplayName('')
      setShowDeleteConfirm(false)
      setEventTypes([])
      setIsLoading(true)
    }
  }

  const fetchEventTypes = async () => {
    try {
      const response = await fetchApi(`${apiUrl}/event-types`, token!, nodeEnv)
      setEventTypes(response.items)
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const revertNameIfUnsaved = () => {
    if (nodeData?.node.id) {
      onNameChange?.(nodeData.node.id, nodeData.title)
    }
  }

  useImperativeHandle(ref, () => ({
    onOpen(args: ParamProps) {
      // Switching directly from one node to another without saving:
      // revert the previous node's live-previewed name first
      if (nodeData?.node.id && nodeData.node.id !== args.node.id) {
        revertNameIfUnsaved()
      }

      handleDrawerOpenChange(true)
      setNodeData(args)
      setDisplayName(args.title)
      const properties = args.node.data.properties as INodeProperty[]
      const parameters = args.node.data.parameters

      // Get list of event types when node data has name event_received
      if (args.node.data?.name === 'event_received') {
        fetchEventTypes()
      }

      // Initialize parameters: use existing if available, otherwise create from properties
      if (parameters) {
        setParameters(parameters)
      } else if (properties && properties.length > 0) {
        const initialParameters = properties.reduce((acc: any, property: INodeProperty) => {
          return {
            ...acc,
            [property.name]: property.default,
          }
        }, {})
        setParameters(initialParameters)
      }
    },

    onClose() {
      handleDrawerOpenChange(false)
      setIsLoading(true)
    },
  }))

  const onChangeParameters = (field: string, value: any) => {
    setParameters({
      ...parameters,
      [field]: value,
    })
  }

  const handleDeleteConfirm = () => {
    if (onDelete && nodeData?.node.id) {
      onDelete(nodeData.node.id)
      setShowDeleteConfirm(false)
      handleDrawerOpenChange(false)
    }
  }

  const handleClose = () => {
    revertNameIfUnsaved()
    handleDrawerOpenChange(false)
    setIsLoading(true) // to trigger loading when fetching event-types

    if (onClose) {
      onClose()
    }
  }

  const nodeProperties = (nodeData?.node.data?.properties as INodeProperty[]) || []
  const properties =
    nodeProperties.length > 0
      ? nodeProperties
      : getFallbackPropertiesFromParameters(
          (nodeData?.node.data?.parameters as Record<string, any>) || {}
        )

  return (
    <div
      className={cn(
        `fixed right-0 top-0 h-full w-full max-w-(--breakpoint-sm)! overflow-auto bg-card shadow-sm
        transition-transform duration-300 ease-in-out`,
        open ? 'translate-x-0' : 'pointer-events-none translate-x-full',
        params?.workflow_id ? 'pt-36' : 'pt-28'
      )}>
      <div className="flex h-full flex-col overflow-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5">
          <div className="flex-1">
            <Input
              value={displayName}
              autoFocus
              className="mb-1 h-auto w-full border-none p-0 text-xl! font-semibold outline-hidden
                focus-visible:bg-white"
              onChange={(e) => {
                setDisplayName(e.target.value)
                if (nodeData?.node.id) {
                  onNameChange?.(nodeData.node.id, e.target.value)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                }
              }}
            />
            <p>{nodeData?.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {onDelete && nodeData?.node.data?.isExecution !== true && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10
                  hover:text-destructive"
                onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 size={18} />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleClose}>
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-2 flex-1 px-5">
          {properties.map((property: INodeProperty) => {
            return (
              <NodeProperty
                key={`${nodeData?.node.id}-${property.name}`}
                property={property}
                parameter={parameters}
                onChange={onChangeParameters}
                eventTypes={eventTypes || []}
                isLoading={isLoading}
              />
            )
          })}
        </div>

        {/* Footer */}
        <div
          className="sticky bottom-0 flex flex-row items-center justify-end gap-2 bg-transparent
            px-5 py-3 shadow-sm backdrop-blur-sm supports-backdrop-filter:bg-white/20">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            disabled={displayName.trim() === ''}
            onClick={() => {
              handleDrawerOpenChange(false)
              callback(nodeData?.node.id as string, parameters, displayName)
            }}>
            Save
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md border-t-4 border-t-destructive">
          <DialogHeader className="flex flex-col items-center">
            <div
              className="-mt-16 flex h-16 w-16 items-center justify-center rounded-full
                bg-destructive p-3">
              <Trash2 size={32} className="text-white" />
            </div>
            <DialogTitle className="hidden"></DialogTitle>
          </DialogHeader>
          <DialogDescription className="px-3" asChild>
            <div className="flex flex-col items-center">
              <h1 className="text-3xl font-semibold text-black dark:text-secondary-foreground">
                Delete Node
              </h1>
              <p className="mb-3 mt-3 text-center text-base text-secondary-foreground">
                Are you sure you want to delete &quot;{nodeData?.title}&quot;? This action cannot be
                undone.
              </p>
            </div>
          </DialogDescription>

          <DialogFooter className="mt-3">
            <div className="flex w-full justify-center gap-2">
              <DialogClose asChild>
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </DialogClose>

              <Button variant="destructive" className="w-full" onClick={handleDeleteConfirm}>
                Confirm Delete
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default forwardRef(NodePropertyDrawer)
