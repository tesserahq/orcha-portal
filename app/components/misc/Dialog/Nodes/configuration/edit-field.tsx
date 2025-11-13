/* eslint-disable @typescript-eslint/no-explicit-any */
import JSONEditor from '@/components/misc/JsonEditor'
import { useState } from 'react'

export function ConfigEditField({
  data,
  callback,
}: {
  data: any // data from node api settings
  callback: (value: string) => void
}) {
  const [fields, setFields] = useState<any>(Object.keys(data).length > 0 ? data : {})

  return (
    <div>
      <JSONEditor
        onChange={(value) => {
          setFields(JSON.parse(value))
          callback(JSON.parse(value))
        }}
        currentData={JSON.stringify(fields)}
        title="Edit fields"
      />
    </div>
  )
}
