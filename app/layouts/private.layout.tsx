import { SITE_CONFIG } from '@/constants/brand'
import { useRequestInfo } from '@/hooks/useRequestInfo'
import { ROUTE_PATH as THEME_PATH } from '@/routes/resources/update-theme'
import { CalendarCog, CodeSquare, Workflow } from 'lucide-react'
import { Outlet, useLocation, useParams, useSubmit } from 'react-router'
import { Layout, MainItemProps } from 'tessera-ui'

export default function PrivateLayout() {
  const requestInfo = useRequestInfo()
  const submit = useSubmit()
  const params = useParams()
  const location = useLocation()

  const onSetTheme = (theme: string) => {
    submit(
      { theme },
      {
        method: 'POST',
        action: THEME_PATH,
        navigate: false,
        fetcherKey: 'theme-fetcher',
      }
    )
  }

  const menuItems: MainItemProps[] = [
    {
      title: 'Workflows',
      path: '/workflows',
      icon: Workflow,
    },
    {
      title: 'Sources',
      path: `/sources`,
      icon: CodeSquare,
    },
    {
      title: 'Events',
      path: '/events',
      icon: CalendarCog,
    },
  ]

  const shouldCollapseSidebar =
    Boolean(params['workflow_id'] || params['source_id'] || params['eventID']) ||
    location.pathname === '/workflows/new' ||
    location.pathname === '/sources/new'

  return (
    <Layout.Main menuItems={menuItems} collapseSidebar={shouldCollapseSidebar}>
      <div className="flex min-h-0 h-full flex-col">
        <Layout.Header
          actionLogout={() => {}}
          actionProfile={() => {}}
          defaultLogo="/images/logo.png"
          onSetTheme={(theme) => onSetTheme(theme)}
          selectedTheme={requestInfo.userPrefs.theme || 'system'}
          title={SITE_CONFIG.siteTitle}
        />
        <div className="min-h-0 flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </Layout.Main>
  )
}
