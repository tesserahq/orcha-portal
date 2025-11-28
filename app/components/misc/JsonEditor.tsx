import { FileText, CheckCircle2, AlertCircle, Eye } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// JSON Editor Component
// - Left: editable textarea (with basic line numbers)
// - Top toolbar: Validate, Format, Minify, Copy, Download, Reset
// - Right: Preview (rendered JSON) + collapsible TreeView
// - Props: initialValue (object or string), onChange (fn), readOnly (bool)

type JsonValue = string | number | boolean | null | JsonObject | JsonArray
type JsonObject = { [key: string]: JsonValue }
type JsonArray = JsonValue[]

type JsonEditorProps = {
  initialValue?: JsonValue | string
  onChange?: (parsed: JsonValue) => void
  readOnly?: boolean
}

export default function JsonEditor({
  initialValue,
  onChange = () => {},
  readOnly = false,
}: JsonEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  const stringify = (val: JsonValue) => {
    try {
      return typeof val === 'string'
        ? JSON.stringify(JSON.parse(val), null, 2)
        : JSON.stringify(val, null, 2)
    } catch (e) {
      return typeof val === 'string' ? val : JSON.stringify(val)
    }
  }

  const [text, setText] = useState(stringify(initialValue || {}))
  const [isValid, setIsValid] = useState(true)
  const [parsed, setParsed] = useState(() => {
    try {
      return JSON.parse(stringify(initialValue || {}))
    } catch (e) {
      return null
    }
  })

  useEffect(() => {
    // inform parent when valid JSON changes
    if (isValid) onChange(parsed)
  }, [isValid, parsed])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setText(v)
    try {
      const p = JSON.parse(v)
      setParsed(p)
      setIsValid(true)
    } catch (err) {
      setIsValid(false)
    }
  }

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const lineCount = text.split('\n').length
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1)

  const renderHighlightedJson = (jsonString: string) => {
    if (!isValid) return null

    const parts: Array<{ text: string; className: string }> = []
    let lastIndex = 0

    const regex =
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g
    let match

    while ((match = regex.exec(jsonString)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push({
          text: jsonString.slice(lastIndex, match.index),
          className: 'text-foreground',
        })
      }

      // Determine color class for the match
      let className = 'text-blue-600 dark:text-blue-400'
      if (/^"/.test(match[0])) {
        if (/:$/.test(match[0])) {
          className = 'text-purple-600 dark:text-purple-400'
        } else {
          className = 'text-green-600 dark:text-green-400'
        }
      } else if (/true|false/.test(match[0])) {
        className = 'text-orange-600 dark:text-orange-400'
      } else if (/null/.test(match[0])) {
        className = 'text-gray-500 dark:text-gray-400'
      }

      parts.push({ text: match[0], className })
      lastIndex = regex.lastIndex
    }

    // Add remaining text
    if (lastIndex < jsonString.length) {
      parts.push({ text: jsonString.slice(lastIndex), className: 'text-foreground' })
    }

    return (
      <>
        {parts.map((part, index) => (
          <span key={index} className={part.className}>
            {part.text}
          </span>
        ))}
      </>
    )
  }

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="flex h-[400px] gap-4">
        {/* Left - Editor */}
        <Card className="flex w-1/2 flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 py-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Editor</span>
            </div>
            <Badge
              variant={isValid ? 'default' : 'destructive'}
              className="flex items-center gap-1">
              {isValid ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Valid
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  Invalid
                </>
              )}
            </Badge>
          </CardHeader>
          <CardContent className="relative flex-1 overflow-hidden rounded-tr-none p-0">
            <div className="flex h-full">
              {/* Line Numbers */}
              <div
                ref={lineNumbersRef}
                className="flex-shrink-0 overflow-hidden border-r bg-muted/20 px-3 py-3 text-right font-mono text-xs text-muted-foreground"
                style={{ width: '50px' }}>
                {lines.map((line) => (
                  <div key={line} className="leading-[1.5rem]">
                    {line}
                  </div>
                ))}
              </div>
              {/* Textarea */}
              <div className="relative flex-1 overflow-auto">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={handleTextChange}
                  onScroll={handleScroll}
                  readOnly={readOnly}
                  spellCheck={false}
                  className="absolute inset-0 h-full w-full resize-none bg-transparent p-3 font-mono text-sm leading-[1.5rem] text-foreground outline-none selection:bg-primary/20"
                  style={{ tabSize: 2 }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right - Preview */}
        <Card className="flex w-1/2 flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 py-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Preview</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {isValid ? 'Formatted' : 'Raw'}
            </Badge>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto rounded-tr-none p-0">
            <div className="h-full overflow-auto p-3">
              {isValid ? (
                <pre className="font-mono text-sm leading-[1.5rem] text-foreground">
                  {renderHighlightedJson(JSON.stringify(parsed, null, 2))}
                </pre>
              ) : (
                <pre className="font-mono text-sm leading-[1.5rem] text-muted-foreground">
                  {text || 'Enter JSON to see preview...'}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
