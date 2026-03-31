import { AppPreloader } from '@/components/loader/pre-loader'
import { SITE_CONFIG } from '@/constants/brand'
import { useApp } from '@/context/AppContext'
import { useRequestInfo } from '@/hooks/useRequestInfo'
import { ROUTE_PATH as THEME_PATH } from '@/routes/resources/update-theme'
import { CalendarCog, CodeSquare, Workflow } from 'lucide-react'
import { Outlet, useLoaderData, useLocation, useParams, useSubmit } from 'react-router'
import { Layout, MainItemProps, TesseraProvider } from 'tessera-ui'

export function loader() {
  const identiesApiUrl = process.env.IDENTIES_API_URL || process.env.API_URL

  return { identiesApiUrl }
}

export default function PrivateLayout() {
  const { identiesApiUrl } = useLoaderData<typeof loader>()

  const { isLoading, token } = useApp()
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

  if (isLoading) {
    // Display loading screen when auth0 isLoading true
    return <AppPreloader className="min-h-screen" />
  }

  return (
    <TesseraProvider identiesApiUrl={identiesApiUrl!} token={token ?? ''}>
      <Layout.Main menuItems={menuItems} collapseSidebar={shouldCollapseSidebar}>
        <Layout.Header
          actionLogout={() => {}}
          actionProfile={() => {}}
          defaultLogo="/images/logo.png"
          onSetTheme={(theme) => onSetTheme(theme)}
          selectedTheme={requestInfo.userPrefs.theme || 'system'}
          title={SITE_CONFIG.siteTitle}
        />
        <Outlet />
      </Layout.Main>
    </TesseraProvider>
  )
}
