/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Node } from '@xyflow/react'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { ConfigEditField } from './configuration/edit-field'

export type NodeType =
  | 'editFields'
  | 'dateTime'
  | 'if'
  | 'filter'
  | 'httpRequest'
  | 'eventReceived'

interface ParamProps {
  node: Node
  nodeType: NodeType
  title: string
  description: string
}

interface FuncProps {
  onOpen: ({ node, nodeType, title, description }: ParamProps) => void
}

interface IProps {
  callback: (nodeId: string, value: any) => void
}

const ConfigurationNode: React.ForwardRefRenderFunction<FuncProps, IProps> = (
  { callback }: IProps,
  ref,
) => {
  const [open, setOpen] = useState<boolean>(false)
  const [nodeData, setNodeData] = useState<ParamProps>()
  const [data, setData] = useState<any>()

  useImperativeHandle(ref, () => ({
    onOpen(args: ParamProps) {
      setOpen(true)
      setNodeData(args)
      setData(args.node.data.settings) // data from node
    },
  }))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>{nodeData?.title}</DialogTitle>
          <DialogDescription>{nodeData?.description}</DialogDescription>
        </DialogHeader>
        <div>
          {nodeData?.nodeType === 'editFields' && (
            <ConfigEditField data={data} callback={setData} />
          )}
          {/* {nodeData?.nodeType === 'dateTime' && <ConfigDateTime callback={() => {}} />} */}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setOpen(false)
              callback(nodeData?.node.id as string, data)
            }}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default forwardRef(ConfigurationNode)
