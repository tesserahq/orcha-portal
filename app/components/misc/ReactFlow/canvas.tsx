/* eslint-disable @typescript-eslint/no-explicit-any */
import NodeCategories from '@/components/misc/Drawer/NodeCategories'
import NodeAdd from '@/components/misc/ReactFlow/Nodes/add'
import NodeBasic from '@/components/misc/ReactFlow/Nodes/basic'
import NodeIf from '@/components/misc/ReactFlow/Nodes/if'
import NodeInitial from '@/components/misc/ReactFlow/Nodes/initial'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApp } from '@/context/AppContext'
import { NodeENVType } from '@/libraries/fetch'
import { INodeInput, IWorkflow } from '@/types/workflow'
import { cn } from '@/utils/misc'
import {
  FetcherWithComponents,
  useLocation,
  useNavigate,
  useParams,
} from '@remix-run/react'
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
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface IProps {
  apiUrl: string
  nodeEnv: NodeENVType
  initialNodes: INodeInput[]
  initialEdges: Edge[]
  fetcher: FetcherWithComponents<unknown>
  workflow?: IWorkflow
  isExecution?: boolean
}

export default function ReactFlowCanvas({
  apiUrl,
  nodeEnv,
  initialNodes,
  initialEdges,
  workflow,
  fetcher,
  isExecution,
}: IProps) {
  const params = useParams()
  const { token } = useApp()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [edges, setEdges] = useState<Edge[]>(initialEdges)
  const [nodes, setNodes] = useState<Node[]>([])
  const [isExecuting, setIsExecuting] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'executions'>(
    pathname.includes('executions') ? 'executions' : 'editor',
  )
  const [workflowPayload, setWorkflowPayload] = useState<IWorkflow>({
    name: workflow?.name || 'My Workflow',
    description: workflow?.description || 'My Workflow',
    is_active: workflow?.is_active || false,
    nodes: workflow?.nodes || [],
  })
  const nodeCategoriesRef = useRef<React.ElementRef<typeof NodeCategories>>(null)
  const nodeTypes = {
    add: NodeAdd as any,
    addIf: NodeAdd as any,
    basic: NodeBasic as any,
    initial: NodeInitial as any,
    if: NodeIf as any,
  }

  const onNodesChange = useCallback((changes: NodeChange<Node>[]) => {
    setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot))
  }, [])

  const onEdgesChange = useCallback((changes: EdgeChange<Edge>[]) => {
    setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot))
  }, [])

  const onConnect = useCallback((params: Connection) => {
    const customParams: Edge = {
      ...params,
      id: `${params.source}->${params.target}`,
    }

    if (params.target !== 'add') {
      customParams.type = ''
    }

    setEdges((edgesSnapshot) => addEdge(customParams, edgesSnapshot))
  }, [])

  const handleOpenAddDialog = useCallback(
    (node?: Node, nodeAddId?: string) =>
      nodeCategoriesRef.current?.onOpen(node, nodeAddId),
    [],
  )

  const collectNodesForRemoval = useCallback(
    (deleted: Node[], nodesSnapshot: Node[]): Node[] => {
      const placeholders = ['-add', '-add-true', '-add-false']
      const nodesById = new Map(nodesSnapshot.map((nodeItem) => [nodeItem.id, nodeItem]))
      const removalMap = new Map<string, Node>()

      deleted.forEach((nodeItem) => {
        const normalizedId = placeholders.reduce(
          (acc, suffix) => (acc.endsWith(suffix) ? acc.replace(suffix, '') : acc),
          nodeItem.id,
        )

        removalMap.set(nodeItem.id, nodeItem)

        placeholders.forEach((suffix) => {
          const placeholder = nodesById.get(`${normalizedId}${suffix}`)
          if (placeholder) {
            removalMap.set(placeholder.id, placeholder)
          }
        })
      })

      return Array.from(removalMap.values())
    },
    [],
  )

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
    [handleOpenAddDialog],
  )

  const createAddIfPlaceholder = useCallback(
    (referenceNode: Node, branch: 'true' | 'false'): Node => ({
      id: `${referenceNode.id}-add-${branch}`,
      type: 'addIf',
      position: {
        x: referenceNode.position.x + 100,
        y:
          branch === 'true'
            ? referenceNode.position.y - 50
            : referenceNode.position.y + 50,
      },
      data: {
        onAddNode: () =>
          handleOpenAddDialog(referenceNode, `${referenceNode.id}-add-${branch}`),
      },
    }),
    [handleOpenAddDialog],
  )

  const ensurePlaceholderNodes = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      const nodesAccumulator = [...currentNodes]
      const edgesAccumulator = [...currentEdges]

      const nonPlaceholderNodes = nodesAccumulator.filter(
        (nodeItem) => nodeItem.type !== 'add' && nodeItem.type !== 'addIf',
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
        const nodeIndex = nodesAccumulator.findIndex(
          (existing) => existing.id === nodeItem.id,
        )
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
        const edgeIndex = edgesAccumulator.findIndex(
          (existing) => existing.id === edgeItem.id,
        )
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
    [createAddIfPlaceholder, createAddPlaceholder],
  )

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      if (deleted.length === 0) {
        return
      }

      const nodesSnapshot = [...nodes]
      const edgesSnapshot = [...edges]
      const nodesToRemove = collectNodesForRemoval(deleted, nodesSnapshot)
      const idsToRemove = new Set(nodesToRemove.map((nodeItem) => nodeItem.id))

      const remainingNodes = nodesSnapshot.filter(
        (nodeItem) => !idsToRemove.has(nodeItem.id),
      )

      let nextEdges = edgesSnapshot.filter(
        (edgeItem) =>
          !idsToRemove.has(edgeItem.source) && !idsToRemove.has(edgeItem.target),
      )

      nodesToRemove.forEach((nodeItem) => {
        if (
          nodeItem.type === 'add' ||
          nodeItem.type === 'addIf' ||
          nodeItem.type === 'initial'
        ) {
          return
        }

        const incomingEdges = edgesSnapshot.filter(
          (edgeItem) =>
            edgeItem.target === nodeItem.id && !idsToRemove.has(edgeItem.source),
        )
        const outgoingEdges = edgesSnapshot.filter(
          (edgeItem) =>
            edgeItem.source === nodeItem.id && !idsToRemove.has(edgeItem.target),
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

      const { nodes: nodesWithPlaceholders, edges: edgesWithPlaceholders } =
        ensurePlaceholderNodes(remainingNodes, nextEdges)

      setNodes(nodesWithPlaceholders)
      setEdges(edgesWithPlaceholders)
    },
    [collectNodesForRemoval, ensurePlaceholderNodes, nodes, edges],
  )

  const onSaveNode = (
    node: INodeInput,
    currentNode?: Node | undefined,
    nodeAddId?: string | undefined,
  ) => {
    let newNodeId = ''
    let previousNodeId: string | null = null
    let newWorkflowNode: Node
    let newAddNodeId: string | null = null
    const placeholderNodeId = nodeAddId ?? 'add'
    const branchLabel = nodeAddId?.endsWith('-add-true')
      ? 'true'
      : nodeAddId?.endsWith('-add-false')
        ? 'false'
        : null

    setNodes((prevNodeList) => {
      const nonInitialNodes = prevNodeList.filter(
        (nodeItem) => nodeItem.type !== 'initial',
      )
      const actualFlowNodes = nonInitialNodes.filter(
        (nodeItem) => nodeItem.type !== 'add' && nodeItem.type !== 'addIf',
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

      const isNodeIf = node.name === 'if' && node.kind === 'flow'
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

      newNodeId = `${node.name}-${Date.now()}`
      previousNodeId = referenceNode?.id ?? null

      newWorkflowNode = {
        id: newNodeId,
        type: isNodeIf ? 'if' : 'basic',
        position: nextPosition,
        data: {
          ...(node as INodeInput),
          firstNode: actualFlowNodes.length === 0,
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
      newAddNodeId = addNode.id

      const addIfNodes: Node[] = [
        {
          id: `${newNodeId}-add-true`,
          type: 'addIf',
          position: {
            x: newWorkflowNode.position.x + 100,
            y: newWorkflowNode.position.y - 50,
          },
          data: {
            onAddNode: () =>
              handleOpenAddDialog(newWorkflowNode, `${newNodeId}-add-true`),
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
            onAddNode: () =>
              handleOpenAddDialog(newWorkflowNode, `${newNodeId}-add-false`),
          },
        },
      ]

      const nodesWithoutPlaceholder = nonInitialNodes.filter((nodeItem) => {
        if (!placeholderNodeId) {
          return true
        }

        return nodeItem.id !== placeholderNodeId
      })

      if (currentNode?.type === 'if') {
        return [...nodesWithoutPlaceholder, newWorkflowNode, addNode]
      }

      if (isNodeIf) {
        return [...nodesWithoutPlaceholder, newWorkflowNode, ...addIfNodes]
      }

      return [...nodesWithoutPlaceholder, newWorkflowNode, addNode]
    })

    // this part for edges reactflow
    setEdges((edgesSnapshot) => {
      const edgesWithoutPlaceholder = edgesSnapshot.filter((edge) => {
        if (!placeholderNodeId) {
          return true
        }

        return edge.source !== placeholderNodeId && edge.target !== placeholderNodeId
      })

      if (!previousNodeId) {
        const firstEdge: Edge = {
          id: 'first-edge',
          source: newNodeId,
          target: newAddNodeId ?? `${newNodeId}-add`,
        }

        // add edge from initial node to add node
        return [firstEdge]
      }

      // add edge from previous node to new node
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

      // add edge from new node to add node
      const addEdgeForNewNode: Edge = {
        id: `${newNodeId}->${newAddNodeId ?? `${newNodeId}-add`}`,
        source: newNodeId,
        target: newAddNodeId ?? `${newNodeId}-add`,
      }

      const addEdgeForIfNode: Edge[] = [
        {
          id: `${newNodeId}-true->${previousNodeId}`,
          source: newNodeId,
          target: `${newNodeId}-add-true`,
          type: 'label',
          data: {
            label: 'true',
          },
        },
        {
          id: `${newNodeId}-false->${previousNodeId}`,
          source: newNodeId,
          target: `${newNodeId}-add-false`,
          type: 'label',
          data: {
            label: 'false',
          },
        },
      ] as Edge[]

      const filteredEdges = edgesWithoutPlaceholder.filter(
        (edge) => edge.id !== 'first-edge',
      )

      if (newWorkflowNode.type === 'if') {
        return [...filteredEdges, connectingEdge, ...addEdgeForIfNode]
      }

      return [...filteredEdges, connectingEdge, addEdgeForNewNode]
    })

    nodeCategoriesRef.current?.onClose()
  }

  const onSaveWorkflow = ({ isExecution }: { isExecution: boolean }) => {
    // check if last nodes have node type addIf, its mean we have node if but don't have node after true/false
    if (nodes[nodes.length - 1].type === 'addIf') {
      toast.error('You must add node after If node')
      return
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
            properties: node.data.properties,
            ui_settings: {
              icon: node.data.icon, //(node?.data as any)?.ui_settings?.icon as string,
              displayName: node.data.displayName, //(node?.data as any)?.ui_settings?.displayName as string,
              edges: nodeEdges,
              position: node.position,
              type: node.type,
              id: node.id,
              firstNode: node.data.firstNode,
            },
          }
        }),
    }

    if (isExecution) {
      setIsExecuting(true)
    }

    fetcher.submit(
      {
        token: token!,
        workflow: JSON.stringify(payload),
        id: params?.workflow_id || '',
        isExecution: isExecution,
      },
      { method: params?.workflow_id ? 'PUT' : 'POST' },
    )
  }

  const onChangeTab = (tab: 'editor' | 'executions') => {
    setActiveTab(tab)

    if (tab === 'editor') {
      navigate(`/workflows/${params?.workflow_id}`)
    } else {
      navigate(`/workflows/${params?.workflow_id}/executions`)
    }
  }

  const onExecuteWorkflow = () => {
    setIsExecuting(true)
    navigate(`/workflows/${params?.workflow_id}/executions`)
  }

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
    // handle delete initial node or add node when user delete all nodes
    if (nodes.length === 0 || nodes[0].type === 'add') {
      setNodes([
        {
          id: 'initial',
          type: 'initial',
          position: { x: 0, y: 0 },
          data: { onAddNode: handleOpenAddDialog },
        },
      ])
    }
  }, [nodes])

  useEffect(() => {
    if (initialNodes.length > 0) {
      // nodes to display in reactflow
      const nodes = initialNodes.map((node: INodeInput) => {
        // remove edges from nodes
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { edges, ...newNode } = node.ui_settings

        // We need saved all properties from response node api into data, so we can use it again when updating node like line 194
        return {
          ...newNode,
          data: {
            name: node.name,
            description: node.description,
            kind: node.kind,
            firstNode: node.ui_settings.firstNode,
            icon: node?.ui_settings?.icon,
            displayName: node?.ui_settings?.displayName,
            isExecution: isExecution,
            properties: node.properties,
            parameters: node.parameters,
          },
        }
      })

      const lastNode = nodes[nodes.length - 1]

      const addNode: Node = {
        id: 'add',
        type: 'add',
        position: { x: lastNode.position.x + 100, y: 10 },
        data: {
          onAddNode: handleOpenAddDialog,
        },
      }

      nodes.push(addNode)

      setNodes(nodes)
    }
  }, [initialNodes])

  return (
    <div className="relative h-full w-full">
      <div className="absolute -top-1 left-0 z-10 flex w-full animate-slide-down items-center justify-between border-b bg-card py-3 pl-4 pr-8">
        <input
          value={workflowPayload?.name}
          readOnly={isExecution}
          onChange={(e) =>
            setWorkflowPayload({
              ...workflowPayload,
              name: e.target.value || '',
            })
          }
          onBlur={() => {}}
          className="w-auto !min-w-20 border-none border-transparent bg-transparent !text-lg font-semibold outline-none focus-visible:outline-0 focus-visible:ring-0"
        />

        <div className="absolute left-[44%] top-10">
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
            className="ml-3"
            disabled={nodes.length <= 1 || fetcher.state === 'submitting' || isExecution}>
            {fetcher.state === 'submitting' ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <ReactFlow
        className="animate-slide-up"
        nodes={isExecution ? nodes.filter((node) => node.type !== 'add') : nodes}
        edges={edges}
        disableKeyboardA11y
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView>
        {!isExecution && <Background />}
        <Controls />
      </ReactFlow>

      <NodeCategories
        ref={nodeCategoriesRef}
        apiUrl={apiUrl!}
        nodeEnv={nodeEnv}
        onSave={onSaveNode}
      />

      <div
        className={cn(
          'absolute bottom-10 left-[44%]',
          nodes.length === 1 || isExecution ? 'hidden' : 'block',
          fetcher.state === 'submitting' && isExecuting && 'left-[40%]',
        )}>
        <Button
          onClick={() =>
            params?.workflow_id
              ? onExecuteWorkflow()
              : onSaveWorkflow({ isExecution: true })
          }
          disabled={fetcher.state === 'submitting'}>
          <FlaskConical />
          <span>
            {/* cek if user on new page and click execute button, show 'Save and Executing Workflow' */}
            {fetcher.state === 'submitting' && !params?.workflow_id && isExecuting
              ? 'Save and Executing Workflow'
              : 'Execute Workflow'}
          </span>
        </Button>
      </div>
    </div>
  )
}
