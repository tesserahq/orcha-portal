import { Avatar, AvatarFallback, AvatarImage } from '@shadcn/ui/avatar'

import type { IWorkflowCreator } from '@/types/workflow'
import { cn } from '@shadcn/lib/utils'

type WorkflowCreatedByProps = {
  creator?: IWorkflowCreator
  label?: string
  className?: string
  avatarClassName?: string
  textClassName?: string
  showEmail?: boolean
}

const getWorkflowCreatorName = (creator?: IWorkflowCreator) => {
  if (!creator) return ''

  const fullName = [creator.first_name, creator.last_name].filter(Boolean).join(' ').trim()

  if (fullName) return fullName
  if (creator.email) return creator.email

  return 'Unknown user'
}

const getWorkflowCreatorInitials = (name: string) => {
  const normalizedName = name.includes('@') ? name.split('@')[0] : name
  const initials = normalizedName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return initials || 'U'
}

export const WorkflowCreatedBy = ({
  creator,
  label = 'Created by',
  className,
  avatarClassName,
  textClassName,
  showEmail = false,
}: WorkflowCreatedByProps) => {
  if (!creator) return null

  const creatorName = getWorkflowCreatorName(creator)
  const shouldShowEmail = showEmail && !!creator.email && creator.email !== creatorName

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <Avatar className={cn('size-6', avatarClassName)}>
        <AvatarImage
          src={creator.avatar_url || '/images/default-avatar.jpg'}
          alt={creatorName}
          loading="lazy"
        />
        <AvatarFallback className="text-[10px] font-medium">
          <img src="/images/default-user-avatar.jpg" />
        </AvatarFallback>
      </Avatar>

      <div className={cn('min-w-0', textClassName)}>
        <div className="truncate">
          <span>{label} </span>
          <span className="font-medium text-foreground">{creatorName}</span>
        </div>
        {shouldShowEmail && <div className="truncate">{creator.email}</div>}
      </div>
    </div>
  )
}
