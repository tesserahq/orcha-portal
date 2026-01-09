import { type RouteConfig, index, layout, route } from '@react-router/dev/routes'

export default [
  // Theme
  route('/resources/update-theme', 'routes/resources/update-theme.ts'),

  // Home Route
  route('/', 'routes/index.tsx', { id: 'home' }),

  layout('layouts/private.layout.tsx', [
    route('workflows', 'routes/main/workflows/layout.tsx', [
      index('routes/main/workflows/index.tsx', { id: 'workflows' }),
      route('new', 'routes/main/workflows/new.tsx', { id: 'workflows-new' }),
      route(':workflow_id', 'routes/main/workflows/detail.tsx', {
        id: 'workflows-detail',
      }),
      route(':workflow_id/executions', 'routes/main/workflows/executions.tsx', {
        id: 'workflows-executions',
      }),
    ]),
    route('sources', 'routes/main/sources/layout.tsx', [
      index('routes/main/sources/index.tsx', { id: 'sources' }),
      route('new', 'routes/main/sources/new.tsx', { id: 'sources-new' }),
      route(':source_id', 'routes/main/sources/detail.tsx', {
        id: 'sources-detail',
      }),
      route(':source_id/edit', 'routes/main/sources/edit.tsx', {
        id: 'sources-edit',
      }),
    ]),
    route('events', 'routes/main/events/layout.tsx', [
      index('routes/main/events/index.tsx', { id: 'events' }),
    ]),
  ]),
  // Logout Route
  route('logout', 'routes/logout.tsx', { id: 'logout' }),

  // Catch-all route for 404 errors - must be last
  route('*', 'routes/not-found.tsx'),
] as RouteConfig
