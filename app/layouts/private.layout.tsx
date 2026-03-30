import { AppPreloader } from '@/components/loader/pre-loader'
import { SITE_CONFIG } from '@/constants/brand'
import { useApp } from '@/context/AppContext'
import { useRequestInfo } from '@/hooks/useRequestInfo'
import { ROUTE_PATH as THEME_PATH } from '@/routes/resources/update-theme'
import { cn } from '@shadcn/lib/utils'
import { CalendarCog, CodeSquare, Workflow } from 'lucide-react'
import { useMemo } from 'react'
import { Outlet, useLoaderData, useLocation, useNavigate, useParams, useSubmit } from 'react-router'
import { Layout, MainItemProps, TesseraProvider } from 'tessera-ui'

export function loader() {
  const identiesApiUrl = process.env.IDENTIES_API_URL || process.env.API_URL
  // app host urls
  const quoreHostUrl = process.env.QUORE_HOST_URL
  const looplyHostUrl = process.env.LOOPLY_HOST_URL
  const vaultaHostUrl = process.env.VAULTA_HOST_URL
  const identiesHostUrl = process.env.IDENTIES_HOST_URL
  const orchaHostUrl = process.env.ORCHA_HOST_URL || process.env.HOST_URL
  const custosHostUrl = process.env.CUSTOS_HOST_URL
  const indexaHostUrl = process.env.INDEXA_HOST_URL
  const sendlyHostUrl = process.env.SENDLY_HOST_URL

  return {
    identiesApiUrl,
    quoreHostUrl,
    looplyHostUrl,
    vaultaHostUrl,
    identiesHostUrl,
    orchaHostUrl,
    custosHostUrl,
    indexaHostUrl,
    sendlyHostUrl,
  }
}

export default function PrivateLayout() {
  const {
    identiesApiUrl,
    quoreHostUrl,
    looplyHostUrl,
    vaultaHostUrl,
    identiesHostUrl,
    orchaHostUrl,
    custosHostUrl,
    indexaHostUrl,
    sendlyHostUrl,
  } = useLoaderData<typeof loader>()

  const { isLoading, token, user } = useApp()
  const requestInfo = useRequestInfo()
  const submit = useSubmit()
  const navigate = useNavigate()
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
    Boolean(params['workflow_id'] || params['source_id'] || params['event_id']) ||
    location.pathname === '/workflows/new'

  // const isWorkflowCanvasPage = useMemo(() => {
  //   return Boolean(params.workflow_id) || location.pathname === '/workflows/new'
  // }, [params.workflow_id, location.pathname])

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
        {/* <main className={cn('w-full', isWorkflowCanvasPage && 'p-0')}>
          <div
            className={cn(
              'mx-auto h-full w-full max-w-(--breakpoint-2xl)',
              isWorkflowCanvasPage && 'max-w-full'
            )}>
            <Outlet />
          </div>
        </main> */}
      </Layout.Main>
    </TesseraProvider>
  )
}
