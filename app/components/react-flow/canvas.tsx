/* eslint-disable @typescript-eslint/no-explicit-any */
import { NodeCategoriesDrawer, NodePropertyDrawer } from '@/components/react-flow/drawer'
import { NodeAdd, NodeBasic, NodeIf, NodeInitial } from '@/components/react-flow/nodes'
import { WorkflowCreatedBy } from '@/components/workflows/workflow-created-by'
import {
  WorkflowExecutionHistoryPanel,
  type WorkflowExecutionHistoryPanelProps,
} from '@/components/workflows/workflow-execution-history-panel'
import { useApp } from '@/context/AppContext'
import { NodeENVType } from '@/libraries/fetch'
import { Badge } from '@/modules/shadcn/ui/badge'
import {
  useCreateWorkflow,
  useExecuteWorkflow,
  useUpdateWorkflow,
} from '@/resources/hooks/workflows/use-workflows'
import {
  CreateWorkflowInput,
  ExecuteWorkflowInput,
  UpdateWorkflowInput,
} from '@/resources/queries/workflows/workflow.schema'
import { WorkflowType } from '@/resources/queries/workflows/workflow.type'
import { INodeInput } from '@/types/workflow'
import { cn } from '@shadcn/lib/utils'
import { Button } from '@shadcn/ui/button'
import { Switch } from '@shadcn/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@shadcn/ui/tabs'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Connection,
  Controls,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  ReactFlow,
} from '@xyflow/react'
import { FlaskConical } from 'lucide-react'
import {
  Activity,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'

export type ReactFlowCanvasHandle = {
  save: (options?: { shouldRedirect?: boolean }) => Promise<boolean>
}

interface IProps {
  apiUrl: string
  nodeEnv: NodeENVType
  initialNodes: INodeInput[]
  initialEdges: Edge[]
  workflow?: WorkflowType
  isExecution?: boolean
  executionHistory?: WorkflowExecutionHistoryPanelProps
  onDirtyChange?: (isDirty: boolean) => void
}

const ReactFlowCanvasInner = (
  {
    apiUrl,
    nodeEnv,
    initialNodes,
    initialEdges,
    workflow,
    isExecution,
    executionHistory,
    onDirtyChange,
  }: IProps,
  ref: React.ForwardedRef<ReactFlowCanvasHandle>
) => {
  const params = useParams()
  const { token } = useApp()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const configurationNodeRef = useRef<React.ElementRef<typeof NodePropertyDrawer>>(null)
  const nodeCategoriesRef = useRef<React.ElementRef<typeof NodeCategoriesDrawer>>(null)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)
  const [nodes, setNodes] = useState<Node[]>([])
  const nodesRef = useRef<Node[]>([])
  const edgesRef = useRef<Edge[]>(initialEdges)
  const [isExecuting, setIsExecuting] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'executions'>(
    pathname.includes('executions') ? 'executions' : 'editor'
  )
  const [workflowPayload, setWorkflowPayload] = useState<WorkflowType>({
    name: workflow?.name || 'My Workflow',
    description: workflow?.description || '',
    is_active: workflow?.is_active || false,
    nodes: workflow?.nodes || [],
  })
  const [isNodeCategoriesOpen, setIsNodeCategoriesOpen] = useState(false)
  const [isNodePropertiesOpen, setIsNodePropertiesOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const skipInitialDirtyRef = useRef(true)
  const config = {
    apiUrl,
    token: token!,
    nodeEnv,
  }

  const { mutateAsync: createWorkflow, isPending: isCreating } = useCreateWorkflow(config, {
    onError: () => {
      setIsExecuting(false)
    },
  })
  const { mutateAsync: updateWorkflow, isPending: isUpdating } = useUpdateWorkflow(config, {
    onError: () => {
      setIsExecuting(false)
    },
  })
  const { mutateAsync: executeWorkflow } = useExecuteWorkflow(config, {
    showToast: false,
    onError: () => {
      setIsExecuting(false)
    },
  })
  const isSaving = isCreating || isUpdating
  const shouldHideSaveButton = isNodeCategoriesOpen || isNodePropertiesOpen
  const nodeTypes = {
    add: NodeAdd as any,
    addIf: NodeAdd as any,
    basic: NodeBasic as any,
    initial: NodeInitial as any,
    if: NodeIf as any,
  }

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      skipInitialDirtyRef.current = false
    })

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [])

  const markDirty = useCallback(() => {
    if (isExecution || isDirty || skipInitialDirtyRef.current) return
    setIsDirty(true)
  }, [isExecution, isDirty])

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  useEffect(() => {
    edgesRef.current = edges
  }, [edges])

  const shouldMarkDirtyFromNodes = useCallback((changes: NodeChange<Node>[]) => {
    return changes.some((change) => {
      if (change.type === 'position') {
        return change.dragging === true
      }

      if (change.type === 'dimensions') {
        return change.resizing === true
      }

      return change.type === 'add' || change.type === 'remove'
    })
  }, [])

  const shouldMarkDirtyFromEdges = useCallback((changes: EdgeChange<Edge>[]) => {
    return changes.some((change) => change.type === 'add' || change.type === 'remove')
  }, [])

  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      if (shouldMarkDirtyFromNodes(changes)) {
        markDirty()
      }
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot))
    },
    [markDirty, shouldMarkDirtyFromNodes]
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      if (shouldMarkDirtyFromEdges(changes)) {
        markDirty()
      }
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot))
    },
    [markDirty, shouldMarkDirtyFromEdges]
  )

  const onConnect = useCallback(
    (params: Connection) => {
      markDirty()
      const customParams: Edge = {
        ...params,
        id: `${params.source}->${params.target}`,
      }

      if (params.target !== 'add') {
        customParams.type = ''
      }

      setEdges((edgesSnapshot) => addEdge(customParams, edgesSnapshot))
    },
    [markDirty]
  )

  const handleOpenAddDialog = useCallback(
    (node?: Node, nodeAddId?: string) => nodeCategoriesRef.current?.onOpen(node, nodeAddId),
    []
  )

  const createInitialNode = useCallback(
    (): Node => ({
      id: 'initial',
      type: 'initial',
      position: { x: 0, y: 0 },
      data: { onAddNode: handleOpenAddDialog },
    }),
    [handleOpenAddDialog]
  )

  const convertInitialNodesToReactFlowNodes = useCallback(
    (nodesToConvert: INodeInput[]): Node[] => {
      const reactFlowNodes = nodesToConvert.map((node: INodeInput) => {
        const { edges, ...uiSettingsWithoutEdges } = node.ui_settings

        return {
          ...uiSettingsWithoutEdges,
          data: {
            name: node.name,
            description: node.description,
            kind: node.kind,
            isExecution: isExecution,
            parameters: node.parameters,
            firstNode: node.ui_settings.firstNode,
            icon: node?.ui_settings?.icon,
            displayName: node?.ui_settings?.displayName,
            icon_color: node.ui_settings.icon_color,
          },
        }
      })

      if (reactFlowNodes.length === 0) {
        return []
      }

      if (isExecution) {
        return reactFlowNodes
      }

      const lastNode = reactFlowNodes[reactFlowNodes.length - 1]
      const addNode: Node = {
        id: 'add',
        type: 'add',
        position: { x: lastNode.position.x + 100, y: 10 },
        data: {
          onAddNode: handleOpenAddDialog,
        },
      }

      return [...reactFlowNodes, addNode]
    },
    [isExecution, handleOpenAddDialog]
  )

  const collectNodesForRemoval = useCallback((deleted: Node[], nodesSnapshot: Node[]): Node[] => {
    const placeholders = ['-add', '-add-true', '-add-false']
    const nodesById = new Map(nodesSnapshot.map((nodeItem) => [nodeItem.id, nodeItem]))
    const removalMap = new Map<string, Node>()
    const lastFlowNode = [...nodesSnapshot]
      .reverse()
      .find(
        (nodeItem) =>
          nodeItem.type !== 'add' && nodeItem.type !== 'addIf' && nodeItem.type !== 'initial'
      )

    deleted.forEach((nodeItem) => {
      const normalizedId = placeholders.reduce(
        (acc, suffix) => (acc.endsWith(suffix) ? acc.replace(suffix, '') : acc),
        nodeItem.id
      )

      removalMap.set(nodeItem.id, nodeItem)

      placeholders.forEach((suffix) => {
        const placeholder = nodesById.get(`${normalizedId}${suffix}`)
        if (placeholder) {
          removalMap.set(placeholder.id, placeholder)
        }
      })

      if (lastFlowNode?.id === normalizedId) {
        const trailingAddNode = nodesById.get('add')
        if (trailingAddNode) {
          removalMap.set(trailingAddNode.id, trailingAddNode)
        }
      }
    })

    return Array.from(removalMap.values())
  }, [])

  const createAddPlaceholder = useCallback(
    (referenceNode: Node): Node => ({
      id: `${referenceNode.id}-add`,
      type: 'add',
      position: {
        x: referenceNode.position.x + 100,
        y: referenceNode.position.y + 9,
      },
      data: {
        onAddNode: () => handleOpenAddDialog(referenceNode, `${referenceNode.id}-add`),
      },
    }),
    [handleOpenAddDialog]
  )

  const createAddIfPlaceholder = useCallback(
    (referenceNode: Node, branch: 'true' | 'false'): Node => ({
      id: `${referenceNode.id}-add-${branch}`,
      type: 'addIf',
      position: {
        x: referenceNode.position.x + 100,
        y: branch === 'true' ? referenceNode.position.y - 50 : referenceNode.position.y + 50,
      },
      data: {
        onAddNode: () => handleOpenAddDialog(referenceNode, `${referenceNode.id}-add-${branch}`),
      },
    }),
    [handleOpenAddDialog]
  )

  const ensurePlaceholderNodes = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      const nodesAccumulator = [...currentNodes]
      const edgesAccumulator = [...currentEdges]

      const nonPlaceholderNodes = nodesAccumulator.filter(
        (nodeItem) => nodeItem.type !== 'add' && nodeItem.type !== 'addIf'
      )
      const lastFlowNode = [...nonPlaceholderNodes]
        .reverse()
        .find((nodeItem) => nodeItem.type !== 'initial')

      if (!lastFlowNode) {
        return {
          nodes: nodesAccumulator,
          edges: edgesAccumulator,
        }
      }

      const upsertNode = (nodeItem: Node) => {
        const nodeIndex = nodesAccumulator.findIndex((existing) => existing.id === nodeItem.id)
        if (nodeIndex >= 0) {
          nodesAccumulator[nodeIndex] = {
            ...nodesAccumulator[nodeIndex],
            position: nodeItem.position,
            data: nodeItem.data,
          }
          return
        }

        nodesAccumulator.push(nodeItem)
      }

      const upsertEdge = (edgeItem: Edge) => {
        const edgeIndex = edgesAccumulator.findIndex((existing) => existing.id === edgeItem.id)
        if (edgeIndex >= 0) {
          edgesAccumulator[edgeIndex] = {
            ...edgesAccumulator[edgeIndex],
            type: edgeItem.type,
            data: edgeItem.data,
          }
          return
        }

        edgesAccumulator.push(edgeItem)
      }

      if (lastFlowNode.type === 'if') {
        const addTrueNode = createAddIfPlaceholder(lastFlowNode, 'true')
        const addFalseNode = createAddIfPlaceholder(lastFlowNode, 'false')

        upsertNode(addTrueNode)
        upsertNode(addFalseNode)

        upsertEdge({
          id: `${lastFlowNode.id}-true->${lastFlowNode.id}`,
          source: lastFlowNode.id,
          target: addTrueNode.id,
          type: 'label',
          data: {
            label: 'true',
          },
        })

        upsertEdge({
          id: `${lastFlowNode.id}-false->${lastFlowNode.id}`,
          source: lastFlowNode.id,
          target: addFalseNode.id,
          type: 'label',
          data: {
            label: 'false',
          },
        })
      } else {
        const addNode = createAddPlaceholder(lastFlowNode)

        upsertNode(addNode)

        upsertEdge({
          id: `${lastFlowNode.id}->${addNode.id}`,
          source: lastFlowNode.id,
          target: addNode.id,
        })
      }

      return {
        nodes: nodesAccumulator,
        edges: edgesAccumulator,
      }
    },
    [createAddIfPlaceholder, createAddPlaceholder]
  )

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      if (deleted.length === 0) {
        return
      }
      markDirty()

      const nodesSnapshot = [...nodes]
      const edgesSnapshot = [...edges]
      const nodesToRemove = collectNodesForRemoval(deleted, nodesSnapshot)
      const idsToRemove = new Set(nodesToRemove.map((nodeItem) => nodeItem.id))

      const remainingNodes = nodesSnapshot.filter((nodeItem) => !idsToRemove.has(nodeItem.id))
      const remainingFlowNodes = remainingNodes.filter(
        (nodeItem) =>
          nodeItem.type !== 'add' && nodeItem.type !== 'addIf' && nodeItem.type !== 'initial'
      )

      let nextEdges = edgesSnapshot.filter(
        (edgeItem) => !idsToRemove.has(edgeItem.source) && !idsToRemove.has(edgeItem.target)
      )

      nodesToRemove.forEach((nodeItem) => {
        if (nodeItem.type === 'add' || nodeItem.type === 'addIf' || nodeItem.type === 'initial') {
          return
        }

        const incomingEdges = edgesSnapshot.filter(
          (edgeItem) => edgeItem.target === nodeItem.id && !idsToRemove.has(edgeItem.source)
        )
        const outgoingEdges = edgesSnapshot.filter(
          (edgeItem) => edgeItem.source === nodeItem.id && !idsToRemove.has(edgeItem.target)
        )

        incomingEdges.forEach((incomingEdge) => {
          outgoingEdges.forEach((outgoingEdge) => {
            const edgeId = `${incomingEdge.source}->${outgoingEdge.target}`
            if (nextEdges.some((existingEdge) => existingEdge.id === edgeId)) {
              return
            }

            nextEdges = [
              ...nextEdges,
              {
                id: edgeId,
                source: incomingEdge.source,
                target: outgoingEdge.target,
                type: outgoingEdge.type ?? incomingEdge.type,
                data: outgoingEdge.data ?? incomingEdge.data,
              },
            ]
          })
        })
      })

      if (remainingFlowNodes.length === 0) {
        const initialNode = createInitialNode()
        nodesRef.current = [initialNode]
        edgesRef.current = []
        setNodes([initialNode])
        setEdges([])
        return
      }

      const { nodes: nodesWithPlaceholders, edges: edgesWithPlaceholders } = ensurePlaceholderNodes(
        remainingNodes,
        nextEdges
      )

      nodesRef.current = nodesWithPlaceholders
      edgesRef.current = edgesWithPlaceholders
      setNodes(nodesWithPlaceholders)
      setEdges(edgesWithPlaceholders)
    },
    [collectNodesForRemoval, createInitialNode, ensurePlaceholderNodes, nodes, edges, markDirty]
  )

  const onSaveNode = (
    node: INodeInput,
    currentNode?: Node | undefined,
    nodeAddId?: string | undefined
  ) => {
    markDirty()

    const placeholderNodeId = nodeAddId ?? 'add'
    const branchLabel = nodeAddId?.endsWith('-add-true')
      ? 'true'
      : nodeAddId?.endsWith('-add-false')
        ? 'false'
        : null

    const nodesSnapshot = nodesRef.current
    const edgesSnapshot = edgesRef.current
    const nonInitialNodes = nodesSnapshot.filter((nodeItem) => nodeItem.type !== 'initial')
    const actualFlowNodes = nonInitialNodes.filter(
      (nodeItem) => nodeItem.type !== 'add' && nodeItem.type !== 'addIf'
    )
    const referenceNodeFromState =
      currentNode?.id != null
        ? actualFlowNodes.find((nodeItem) => nodeItem.id === currentNode.id)
        : undefined
    const fallbackReferenceNode = actualFlowNodes[actualFlowNodes.length - 1]
    const referenceNode = referenceNodeFromState ?? currentNode ?? fallbackReferenceNode
    const targetPlaceholder = placeholderNodeId
      ? nonInitialNodes.find((nodeItem) => nodeItem.id === placeholderNodeId)
      : undefined
    const isNodeIf = node.name === 'if'
    const defaultX = referenceNode ? referenceNode.position.x + 100 : 0
    const defaultY = referenceNode ? referenceNode.position.y : 0
    const nextPositionY =
      branchLabel != null
        ? (targetPlaceholder?.position.y ?? defaultY)
        : (referenceNode?.position.y ?? 0)
    const nextPosition = {
      x: targetPlaceholder?.position.x ?? defaultX,
      y: nextPositionY,
    }
    const newNodeId = `${node.name}-${Date.now()}`
    const previousNodeId = referenceNode?.id ?? null
    const newWorkflowNode: Node = {
      id: newNodeId,
      type: isNodeIf ? 'if' : 'basic',
      position: nextPosition,
      data: {
        ...(node as INodeInput),
        firstNode: actualFlowNodes.length === 0,
        isSelected: true,
      },
    }
    const addNode: Node = {
      id: `${newNodeId}-add`,
      type: 'add',
      position: {
        x: newWorkflowNode.position.x + 100,
        y: newWorkflowNode.position.y + 9,
      },
      data: {
        onAddNode: () => handleOpenAddDialog(newWorkflowNode, `${newNodeId}-add`),
      },
    }
    const addIfNodes: Node[] = [
      {
        id: `${newNodeId}-add-true`,
        type: 'addIf',
        position: {
          x: newWorkflowNode.position.x + 100,
          y: newWorkflowNode.position.y - 50,
        },
        data: {
          onAddNode: () => handleOpenAddDialog(newWorkflowNode, `${newNodeId}-add-true`),
        },
      },
      {
        id: `${newNodeId}-add-false`,
        type: 'addIf',
        position: {
          x: newWorkflowNode.position.x + 100,
          y: newWorkflowNode.position.y + 50,
        },
        data: {
          onAddNode: () => handleOpenAddDialog(newWorkflowNode, `${newNodeId}-add-false`),
        },
      },
    ]
    const nodesWithoutPlaceholder = nonInitialNodes.filter((nodeItem) => {
      if (!placeholderNodeId) {
        return true
      }

      return nodeItem.id !== placeholderNodeId
    })
    const nextNodes = isNodeIf
      ? [...nodesWithoutPlaceholder, newWorkflowNode, ...addIfNodes]
      : [...nodesWithoutPlaceholder, newWorkflowNode, addNode]
    const edgesWithoutPlaceholder = edgesSnapshot.filter((edge) => {
      if (!placeholderNodeId) {
        return true
      }

      return edge.source !== placeholderNodeId && edge.target !== placeholderNodeId
    })
    const filteredEdges = edgesWithoutPlaceholder.filter((edge) => edge.id !== 'first-edge')
    const addEdgeForIfNode: Edge[] = [
      {
        id: `${newNodeId}-true->${newNodeId}-add-true`,
        source: newNodeId,
        target: `${newNodeId}-add-true`,
        type: 'label',
        data: {
          label: 'true',
        },
      },
      {
        id: `${newNodeId}-false->${newNodeId}-add-false`,
        source: newNodeId,
        target: `${newNodeId}-add-false`,
        type: 'label',
        data: {
          label: 'false',
        },
      },
    ]

    const nextEdges = (() => {
      if (!previousNodeId) {
        if (isNodeIf) {
          return addEdgeForIfNode
        }

        return [
          {
            id: 'first-edge',
            source: newNodeId,
            target: addNode.id,
          },
        ]
      }

      const connectingEdgeBase: Edge = {
        id: `${previousNodeId}->${newNodeId}`,
        source: previousNodeId,
        target: newNodeId,
      }
      const connectingEdge: Edge =
        branchLabel != null
          ? {
              ...connectingEdgeBase,
              type: 'label',
              data: {
                label: branchLabel,
              },
            }
          : connectingEdgeBase

      if (isNodeIf) {
        return [...filteredEdges, connectingEdge, ...addEdgeForIfNode]
      }

      return [
        ...filteredEdges,
        connectingEdge,
        {
          id: `${newNodeId}->${addNode.id}`,
          source: newNodeId,
          target: addNode.id,
        },
      ]
    })()

    nodesRef.current = nextNodes
    edgesRef.current = nextEdges
    setNodes(nextNodes)
    setEdges(nextEdges)

    if (!isNodeIf && !isExecution) {
      configurationNodeRef.current?.onOpen({
        node: newWorkflowNode,
        title: newWorkflowNode?.data.displayName as string,
        description: node.description,
      })
    }

    nodeCategoriesRef.current?.onClose()
  }

  const onSaveWorkflow = async ({
    isExecution,
    shouldRedirect = true,
  }: {
    isExecution: boolean
    shouldRedirect?: boolean
  }) => {
    setIsDirty(false)

    // check if last nodes have node type addIf, its mean we have node if but don't have node after true/false
    if (nodes[nodes.length - 1].type === 'addIf') {
      toast.error('You must add node after If node')
      return false
    }

    const payload = {
      ...workflowPayload,
      nodes: nodes
        .filter((node) => node.type !== 'add' && node.type !== 'initial')
        .map((node) => {
          // extract all data from node reactflow to send into API and save configuration from react flow into ui_settings
          const nodeEdges = edges
            .filter((edge) => edge.source === node.id && !edge.target.includes('-add'))
            .map((edge) => ({
              id: edge.id,
              source: edge.source,
              target: edge.target,
              type: edge.type,
              data: edge.data,
            }))

          return {
            name: node.data.name,
            description: node.data.description,
            kind: node.data.kind,
            parameters: node.data.parameters,
            ui_settings: {
              icon: node.data.icon, //(node?.data as any)?.ui_settings?.icon as string,
              displayName: node.data.displayName, //(node?.data as any)?.ui_settings?.displayName as string,
              edges: nodeEdges,
              position: node.position,
              type: node.type,
              id: node.id,
              firstNode: node.data.firstNode,
              icon_color: node.data.icon_color,
            },
          }
        }),
    }

    if (isExecution) {
      setIsExecuting(true)
    }

    try {
      if (params?.workflow_id) {
        await updateWorkflow({
          id: params.workflow_id,
          data: payload as UpdateWorkflowInput,
        })

        return true
      }

      const response = await createWorkflow(payload as CreateWorkflowInput)
      if (response?.id) {
        if (shouldRedirect) {
          const redirectUrl = isExecution
            ? `/workflows/${response.id}/executions`
            : `/workflows/${response.id}`
          navigate(redirectUrl)
        }
        return true
      }
    } catch (error) {
      setIsExecuting(false)
    }

    return false
  }

  useImperativeHandle(ref, () => ({
    save: async (options) => {
      return onSaveWorkflow({ isExecution: false, shouldRedirect: options?.shouldRedirect })
    },
  }))

  const onChangeTab = (tab: 'editor' | 'executions') => {
    setActiveTab(tab)

    if (tab === 'editor') {
      navigate(`/workflows/${params?.workflow_id}`)
    } else {
      navigate(`/workflows/${params?.workflow_id}/executions`)
    }
  }

  const onExecuteWorkflow = async () => {
    const workflowId = params?.workflow_id
    if (!workflowId) return

    setIsExecuting(true)
    try {
      const didSave = await onSaveWorkflow({ isExecution: false, shouldRedirect: false })
      if (!didSave) {
        setIsExecuting(false)
        return
      }

      const payload: ExecuteWorkflowInput = {
        initial_data: { additionalProp1: {} },
        manual: false,
      }

      await executeWorkflow({ id: workflowId, data: payload })
      navigate(`/workflows/${workflowId}/executions`)
    } catch (error: any) {
      setIsExecuting(false)
      toast.error('Failed to execute workflow', {
        description: error?.message || 'Unknown error',
      })
    }
  }

  const handleNodeClick = useCallback(
    (_: any, node: Node) => {
      if (isExecution) return

      // state selected node
      setNodes((prevNodes) =>
        prevNodes.map((val) => ({
          ...val,
          data: { ...val.data, isSelected: val.id === node.id },
        }))
      )

      const excludedNodes = ['add', 'addIf', 'initial']

      if (!excludedNodes.includes(node.type as string)) {
        const selectedNode = nodes.find((val) => val.id === node.id) || node

        // Call custom onOpen callback if provided, passing node data
        if (node.data?.onOpen && typeof node.data.onOpen === 'function') {
          node.data.onOpen(node.id, node.data)
        }

        configurationNodeRef.current?.onOpen({
          node: selectedNode as Node,
          title: node?.data.displayName as string,
          description: node?.data.description as string,
        })
      } else {
        // close configuration node
        configurationNodeRef.current?.onClose()
      }
    },
    [isExecution, nodes]
  )

  const handleNodeUpdate = useCallback(
    (nodeId: string, parameters: any, displayName: string) => {
      markDirty()
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  parameters,
                  displayName,
                  isSelected: false,
                },
              }
            : node
        )
      )
    },
    [markDirty]
  )

  const handleConfigurationClose = useCallback(() => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => ({
        ...node,
        data: { ...node.data, isSelected: false },
      }))
    )
  }, [])

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      const nodeToDelete = nodes.find((node) => node.id === nodeId)
      if (nodeToDelete) {
        onNodesDelete([nodeToDelete])
      }
    },
    [nodes, onNodesDelete]
  )

  useEffect(() => {
    return () => {
      // reset default when user leave the page
      setNodes([])
      setWorkflowPayload({
        name: 'My Workflow',
        description: 'My Workflow',
        is_active: true,
        nodes: [],
      })
    }
  }, [])

  useEffect(() => {
    if (isExecution) return
    // handle delete initial node or add node when user delete all nodes
    if (nodes.length === 0 || nodes[0].type === 'add') {
      setNodes([createInitialNode()])
    }
  }, [createInitialNode, nodes, isExecution])

  useEffect(() => {
    if (initialNodes.length > 0) {
      const reactFlowNodes = convertInitialNodesToReactFlowNodes(initialNodes)
      setNodes(reactFlowNodes)
      return
    }
    if (isExecution) {
      setNodes([])
    }
  }, [initialNodes, convertInitialNodesToReactFlowNodes, isExecution])

  useEffect(() => {
    if (workflow) {
      setWorkflowPayload(workflow)
    }
  }, [workflow])

  return (
    <div
      className="relative flex min-h-0 h-full w-full flex-col overflow-hidden bg-stone-100
        dark:bg-slate-900">
      <div
        className="absolute -top-1 left-0 z-1 flex w-full animate-slide-down items-center
          justify-between border-b bg-card py-3 pl-4 pr-8">
        <div className="max-w-[70%] shrink-0">
          {isExecution ? (
            <h1 className="text-lg font-semibold">{workflowPayload?.name}</h1>
          ) : (
            <input
              value={workflowPayload?.name}
              aria-label="Workflow name"
              readOnly={isExecution}
              onChange={(e) => {
                if (!isExecution) {
                  markDirty()
                }
                setWorkflowPayload({
                  ...workflowPayload,
                  name: e.target.value || '',
                })
              }}
              onBlur={() => {}}
              className="w-full border-none border-transparent bg-transparent text-lg! font-semibold
                outline-hidden focus-visible:outline-0 focus-visible:ring-0 truncate"
            />
          )}

          {(workflow?.created_by || workflow?.created_at) && (
            <div
              className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500
                dark:text-slate-400">
              <WorkflowCreatedBy
                creator={workflow?.created_by}
                className="max-w-full"
                textClassName="text-xs text-slate-500 dark:text-slate-400"
                showEmail={false}
              />
            </div>
          )}
        </div>

        <div
          className={cn(
            'absolute left-[42%] top-10',
            params?.workflow_id && 'left-[44%]' && 'top-14'
          )}>
          <Tabs
            value={activeTab}
            onValueChange={(value) => onChangeTab(value as 'editor' | 'executions')}>
            <TabsList>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="executions" disabled={pathname.includes('new')}>
                Executions
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Activity
          mode={
            isExecution && ['error', 'completed'].includes(workflow?.execution_status || '')
              ? 'visible'
              : 'hidden'
          }>
          <div className="flex flex-col items-end gap-1">
            <Badge
              variant={workflow?.execution_status === 'error' ? 'destructive' : 'default'}
              className="text-xs font-medium uppercase">
              {workflow?.execution_status || 'Unknown'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {workflow?.execution_status_message || 'Unknown'}
            </span>
          </div>
        </Activity>

        <Activity mode={!isExecution ? 'visible' : 'hidden'}>
          <div className="flex items-center gap-2">
            <span>{!workflowPayload?.is_active ? 'Inactive' : 'Active'}</span>
            <Switch
              disabled={isExecution}
              checked={workflowPayload?.is_active}
              onCheckedChange={(value) => {
                setWorkflowPayload({
                  ...workflowPayload,
                  is_active: value,
                })
              }}
            />

            <Button
              onClick={() => onSaveWorkflow({ isExecution: false })}
              size="sm"
              className={cn('ml-3', shouldHideSaveButton && 'hidden')}
              disabled={nodes.length <= 1 || isSaving || isExecution}>
              {isSaving ? 'Saving...' : 'Save Workflow'}
            </Button>
          </div>
        </Activity>
      </div>

      {isExecution && executionHistory ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:flex-row">
          <WorkflowExecutionHistoryPanel {...executionHistory} />
          <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
            <ReactFlow
              className="animate-slide-up h-full"
              nodes={nodes.filter((node) => node.type !== 'add')}
              edges={edges}
              deleteKeyCode={null}
              disableKeyboardA11y
              elementsSelectable={false}
              nodesConnectable={false}
              nodesDraggable={false}
              onNodeClick={handleNodeClick}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodesDelete={onNodesDelete}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView>
              <Controls />
            </ReactFlow>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <ReactFlow
            className="animate-slide-up h-full"
            nodes={isExecution ? nodes.filter((node) => node.type !== 'add') : nodes}
            edges={edges}
            deleteKeyCode={isExecution ? null : undefined}
            disableKeyboardA11y
            elementsSelectable={!isExecution}
            nodesConnectable={!isExecution}
            nodesDraggable={!isExecution}
            onNodeClick={handleNodeClick}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodesDelete={onNodesDelete}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView>
            {!isExecution && <Background />}
            <Controls />
          </ReactFlow>
        </div>
      )}

      <div
        className={cn(
          'absolute bottom-10 left-[44%]',
          nodes.length === 1 || isExecution ? 'hidden' : 'block',
          isSaving && isExecuting && 'left-[40%]'
        )}>
        <Button
          onClick={() =>
            params?.workflow_id
              ? onExecuteWorkflow()
              : onSaveWorkflow({ isExecution: true, shouldRedirect: true })
          }
          disabled={isSaving || isExecuting}>
          <FlaskConical />
          <span>
            {/* cek if user on new page and click execute button, show 'Save and Executing Workflow' */}
            {isSaving && !params?.workflow_id && isExecuting
              ? 'Save and Executing Workflow'
              : 'Execute Workflow'}
          </span>
        </Button>
      </div>

      {!isExecution && (
        <NodeCategoriesDrawer
          ref={nodeCategoriesRef}
          apiUrl={apiUrl!}
          nodeEnv={nodeEnv}
          onSave={onSaveNode}
          onOpenChange={setIsNodeCategoriesOpen}
        />
      )}

      {!isExecution && (
        <NodePropertyDrawer
          ref={configurationNodeRef}
          apiUrl={apiUrl!}
          nodeEnv={nodeEnv}
          callback={handleNodeUpdate}
          onClose={handleConfigurationClose}
          onDelete={handleNodeDelete}
          onOpenChange={setIsNodePropertiesOpen}
        />
      )}
    </div>
  )
}

const ReactFlowCanvas = forwardRef(ReactFlowCanvasInner)

ReactFlowCanvas.displayName = 'ReactFlowCanvas'

export default ReactFlowCanvas
