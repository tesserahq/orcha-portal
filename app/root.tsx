import { Auth0Provider } from '@auth0/auth0-react'
import type { LinksFunction, LoaderFunctionArgs } from 'react-router'
import {
  data,
  Links,
  Meta,
  MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from 'react-router'
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react'

// Import global CSS styles for the application
// The ?url query parameter tells the bundler to handle this as a URL import
import SpinnerCSS from '@/styles/spinner.css?url'
import RootCSS from '@/styles/root.css?url'
import ReactCountryStateCityCSS from 'react-country-state-city/dist/react-country-state-city.css?url'
import '@xyflow/react/dist/style.css'
import DayPickerCSS from 'react-day-picker/style.css?url'
// import ReactFlowCSS from '@xyflow/react/dist/style.css'
import { ClientHintCheck } from '@/components/client-hints/client-hints'
import { GenericErrorBoundary } from '@/components/error-boundary/error-boundary'
import { Toaster } from '@shadcn/ui/sonner'
import { SITE_CONFIG } from '@/constants/brand'
import { getHints } from '@/hooks/useHints'
import { useNonce } from '@/hooks/useNonce'
import { getTheme, Theme, useTheme } from '@/hooks/useTheme'
import { useToast } from '@/hooks/useToast'
import i18nServer, { localeCookie } from '@/modules/i18n/i18n.server'
import { csrf } from '@/utils/csrf.server'
import { combineHeaders, getDomainUrl } from '@/utils/misc.server'
import { getToastSession } from '@/utils/toast.server'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ProgressBar } from './components/loader/progress-bar'
import { AppProvider } from './context/AppContext'
import { ReactQueryProvider } from './modules/react-query'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
library.add(fas as any)

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: data ? `${SITE_CONFIG.siteTitle}` : `Error | ${SITE_CONFIG.siteTitle}`,
    },
    {
      name: 'description',
      content: SITE_CONFIG.siteDescription,
    },
  ]
}

export const links: LinksFunction = () => {
  return [
    { rel: 'stylesheet', href: RootCSS },
    { rel: 'stylesheet', href: SpinnerCSS },
    { rel: 'stylesheet', href: ReactCountryStateCityCSS },
    { rel: 'stylesheet', href: DayPickerCSS },
  ]
}

export type LoaderData = Exclude<Awaited<ReturnType<typeof loader>>, Response>

export async function loader({ request }: LoaderFunctionArgs) {
  const user = null

  const { toast, headers: toastHeaders } = await getToastSession(request)
  const [csrfToken, csrfCookieHeader] = await csrf.commitToken()
  const clientID = process.env.AUTH0_CLIENT_ID
  const domain = process.env.AUTH0_DOMAIN
  const audience = process.env.AUTH0_AUDIENCE
  const organizationID = process.env.AUTH0_ORGANIZATION_ID
  const hostUrl = process.env.HOST_URL
  const identiesApiUrl = process.env.IDENTIES_API_URL
  const nodeEnv = process.env.NODE_ENV

  return data(
    {
      hostUrl,
      identiesApiUrl,
      nodeEnv,
      user,
      toast,
      csrfToken,
      clientID,
      domain,
      audience,
      organizationID,
      requestInfo: {
        hints: getHints(request),
        origin: getDomainUrl(request),
        path: new URL(request.url).pathname,
        userPrefs: { theme: getTheme(request) },
      },
    } as const,
    {
      headers: combineHeaders(
        toastHeaders,
        csrfCookieHeader ? { 'Set-Cookie': csrfCookieHeader } : null
      ),
    }
  )
}

function Document({
  children,
  nonce,
  dir = 'ltr',
  theme = 'light',
}: {
  children: React.ReactNode
  nonce: string
  dir?: 'ltr' | 'rtl'
  theme?: Theme
}) {
  return (
    <html
      lang="en"
      dir={dir}
      className={`${theme} overflow-x-hidden`}
      style={{ colorScheme: theme }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"></link>
        <ClientHintCheck nonce={nonce} />
        <Meta />
        <Links />
      </head>
      <body className="h-auto w-full">
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <Toaster closeButton position="top-right" theme={theme} richColors />
      </body>
    </html>
  )
}

export default function AppWithProviders() {
  const {
    toast,
    csrfToken,
    clientID,
    domain,
    audience,
    hostUrl,
    organizationID,
    identiesApiUrl,
    nodeEnv,
  } = useLoaderData<typeof loader>()

  const nonce = useNonce()
  const theme = useTheme()

  // Renders toast (if any).
  useToast(toast)

  return (
    <Document nonce={nonce} theme={theme}>
      <ProgressBar />
      <AuthenticityTokenProvider token={csrfToken}>
        <Auth0Provider
          domain={domain ?? ''}
          clientId={clientID ?? ''}
          authorizationParams={{
            redirect_uri: hostUrl || 'http://localhost:3000',
            organization: organizationID,
            audience: audience,
          }}>
          {/* To check if the route is a public gazette share page */}
          <AppProvider identiesApiUrl={identiesApiUrl!} nodeEnv={nodeEnv}>
            <ReactQueryProvider>
              <Outlet />
            </ReactQueryProvider>
          </AppProvider>
        </Auth0Provider>
      </AuthenticityTokenProvider>
    </Document>
  )
}

export function ErrorBoundary() {
  const nonce = useNonce()
  const theme = useTheme()

  return (
    <Document nonce={nonce} theme={theme}>
      <GenericErrorBoundary
        statusHandlers={{
          403: ({ error }) => <p>You are not allowed to do that: {error?.data.message}</p>,
        }}
      />
    </Document>
  )
}
