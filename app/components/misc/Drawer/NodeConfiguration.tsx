/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button'
import { Node } from '@xyflow/react'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { INodeProperty } from '@/types/workflow'
import NodeProperty from '@/components/misc/ReactFlow/Nodes/property'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
} from '@/components/ui/drawer'

interface ParamProps {
  node: Node
  properties: INodeProperty[]
  title: string
  description: string
}

interface FuncProps {
  onOpen: ({ node, title, description }: ParamProps) => void
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
  const [parameters, setParameters] = useState<any>()

  useImperativeHandle(ref, () => ({
    onOpen(args: ParamProps) {
      setOpen(true)
      setNodeData(args)

      // Initialize parameters: use existing if available, otherwise create from properties
      if (args.node.data?.parameters) {
        setParameters(args.node.data?.parameters)
      } else if (args.properties && args.properties.length > 0) {
        const initialParameters = args.properties.reduce((acc, property) => {
          return {
            ...acc,
            [property.name]: property.default,
          }
        }, {})
        setParameters(initialParameters)
      }
    },
  }))

  const onChangeParameters = (field: string, value: any) => {
    setParameters({
      ...parameters,
      [field]: value,
    })
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerContent className="!max-w-screen-md">
          <DrawerHeader>
            <DrawerTitle className="text-xl">{nodeData?.title}</DrawerTitle>
            <DrawerDescription>{nodeData?.description}</DrawerDescription>
          </DrawerHeader>
          <div className="mt-2 overflow-auto px-5">
            {nodeData?.properties.map((property) => {
              return (
                <NodeProperty
                  key={property.name}
                  property={property}
                  parameter={parameters}
                  onChange={onChangeParameters}
                />
              )
            })}
          </div>
          <DrawerFooter className="flex flex-row items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setOpen(false)
                callback(nodeData?.node.id as string, parameters)
              }}>
              Save
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  )
}

export default forwardRef(ConfigurationNode)
