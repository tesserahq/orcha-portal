import { cn } from '@shadcn/lib/utils'
import { Link, useLocation } from 'react-router'

interface ItemProps {
  title: string
  path: string
  icon: React.ReactNode
}
export interface IMenuItemProps {
  title: string
  path: string
  icon: React.ReactNode
  children?: ItemProps[]
  divider?: boolean
}

interface ISidebarPanelProps {
  menuItems: IMenuItemProps[]
}

export function SidebarPanel({ menuItems }: ISidebarPanelProps) {
  const { pathname } = useLocation()

  const isMenuActive = (menuPath: string) => {
    return pathname === menuPath || pathname.startsWith(menuPath + '/')
  }

  return (
    <div className="sidebar-panel bg-sidebar-background flex h-full grow flex-col justify-between">
      <div className="flex w-full flex-col">
        {/* Sidebar Panel Body */}
        <div className="sidebar-body">
          <div className="is-scrollbar-hidden grow overflow-y-auto">
            <ul className="sidebar-nav mt-2">
              {menuItems.map((item) => (
                <div key={item.path}>
                  <li
                    className={cn(
                      'flex items-center justify-between overflow-hidden rounded hover:bg-muted',
                      isMenuActive(item.path) &&
                        'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent'
                    )}>
                    <Link
                      to={item.path}
                      className={cn('w-full', isMenuActive(item.path) && 'active')}>
                      {item.icon}
                      {item.title}
                    </Link>
                  </li>

                  {item.divider && <hr className="my-2 border-t border-border" />}
                </div>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
