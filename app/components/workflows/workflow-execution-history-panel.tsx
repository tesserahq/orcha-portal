import { Badge } from '@shadcn/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shadcn/ui/tooltip'
import { cn } from '@shadcn/lib/utils'
import { WorkflowExecutionItem } from '@/resources/queries/workflows/workflow.type'
import { DateTime } from 'tessera-ui'

const getExecutionStatusBadgeClassName = (status?: string) => {
  const normalized = status?.toLowerCase()

  if (normalized === 'success' || normalized === 'completed') {
    return 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
  }

  if (normalized === 'failed' || normalized === 'error') {
    return 'border-transparent bg-destructive/15 text-destructive'
  }

  if (normalized === 'running' || normalized === 'in_progress') {
    return 'border-transparent bg-amber-500/15 text-amber-800 dark:text-amber-400'
  }

  return 'border-transparent bg-muted text-muted-foreground'
}

export type WorkflowExecutionHistoryPanelProps = {
  isLoadingExecutions: boolean
  totalRuns: number
  executionItems: WorkflowExecutionItem[]
  selectedExecutionId: string | null
  onSelectExecution: (executionId: string) => void
}

export const WorkflowExecutionHistoryPanel = ({
  isLoadingExecutions,
  totalRuns,
  executionItems,
  selectedExecutionId,
  onSelectExecution,
}: WorkflowExecutionHistoryPanelProps) => {
  return (
    <aside
      className="flex h-[min(40vh,22rem)] pt-16 max-w-[24rem] min-h-0 shrink-0 flex-col border-b
        border-border bg-card md:h-full md:w-96 md:border-b-0 md:border-r"
      aria-label="Workflow execution history">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {isLoadingExecutions ? (
          <div className="flex flex-col gap-2 px-1" role="status" aria-live="polite">
            {[0, 1, 2].map((key) => (
              <div
                key={key}
                className="h-24 animate-pulse rounded-lg border border-border bg-muted/40"
              />
            ))}
          </div>
        ) : executionItems.length > 0 ? (
          <ul className="flex list-none flex-col gap-2 p-0" role="list">
            {executionItems.map((execution: WorkflowExecutionItem) => (
              <li key={execution.id}>
                <article
                  role="button"
                  tabIndex={0}
                  aria-label={`Select execution ${execution.id}`}
                  onClick={() => onSelectExecution(execution.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelectExecution(execution.id)
                    }
                  }}
                  className={cn(
                    'rounded-lg border border-border bg-background p-3 shadow-sm transition-colors',
                    'hover:bg-muted/30',
                    selectedExecutionId === execution.id && 'border-primary bg-muted/40'
                  )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate font-mono text-xs font-medium text-foreground"
                        title={execution.id}>
                        {execution.id}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {execution.triggered_by ? `Triggered by ${execution.triggered_by}` : '—'}
                      </p>
                    </div>
                    {execution.error_message ? (
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="secondary"
                              className={cn(
                                'shrink-0 cursor-help text-[10px] font-semibold uppercase',
                                getExecutionStatusBadgeClassName(execution.status)
                              )}>
                              {execution.status || 'Unknown'}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-80 wrap-break-word">
                            {execution.error_message}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge
                        variant="secondary"
                        className={cn(
                          'shrink-0 text-[10px] font-semibold uppercase',
                          getExecutionStatusBadgeClassName(execution.status)
                        )}>
                        {execution.status || 'Unknown'}
                      </Badge>
                    )}
                  </div>

                  <dl
                    className="mt-3 grid grid-cols-1 gap-1 text-xs text-muted-foreground
                      sm:grid-cols-2">
                    <div>
                      <dt className="sr-only">Started</dt>
                      <dd>
                        <span className="text-muted-foreground/80">Started</span>{' '}
                        {execution.started_at ? (
                          <DateTime date={execution.started_at} formatStr="dd/MM/yyyy HH:mm" />
                        ) : (
                          '—'
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="sr-only">Finished</dt>
                      <dd>
                        <span className="text-muted-foreground/80">Finished</span>{' '}
                        {execution.finished_at ? (
                          <DateTime date={execution.finished_at} formatStr="dd/MM/yyyy HH:mm" />
                        ) : (
                          '—'
                        )}
                      </dd>
                    </div>
                  </dl>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <div
            className="mx-1 flex flex-col items-center justify-center rounded-lg border
              border-dashed border-border bg-muted/20 px-4 py-10 text-center"
            role="status">
            <p className="text-sm font-medium text-foreground">No runs yet</p>
            <p className="mt-1 max-w-[14rem] text-xs text-muted-foreground">
              When this workflow runs, executions will appear here.
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
