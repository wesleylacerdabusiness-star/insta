

import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as CheckoutRouteImport } from './routes/checkout'
import { Route as DashboardRouteImport } from './routes/dashboard'
import { Route as DeliveringRouteImport } from './routes/delivering'
import { Route as ResultadoRouteImport } from './routes/resultado'
import { Route as ScanningRouteImport } from './routes/scanning'
import { Route as SearchRouteImport } from './routes/search'
import { Route as UpsellRouteImport } from './routes/upsell'
import { Route as ApiIgImageRouteImport } from './routes/api/ig-image'
import { Route as ApiInstagramRouteImport } from './routes/api/instagram'
import { Route as RegisterIndexRouteImport } from './routes/register/index'

const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)
const CheckoutRoute = CheckoutRouteImport.update({
  id: '/checkout',
  path: '/checkout',
  getParentRoute: () => rootRouteImport,
} as any)
const DashboardRoute = DashboardRouteImport.update({
  id: '/dashboard',
  path: '/dashboard',
  getParentRoute: () => rootRouteImport,
} as any)
const DeliveringRoute = DeliveringRouteImport.update({
  id: '/delivering',
  path: '/delivering',
  getParentRoute: () => rootRouteImport,
} as any)
const ResultadoRoute = ResultadoRouteImport.update({
  id: '/resultado',
  path: '/resultado',
  getParentRoute: () => rootRouteImport,
} as any)
const ScanningRoute = ScanningRouteImport.update({
  id: '/scanning',
  path: '/scanning',
  getParentRoute: () => rootRouteImport,
} as any)
const SearchRoute = SearchRouteImport.update({
  id: '/search',
  path: '/search',
  getParentRoute: () => rootRouteImport,
} as any)
const UpsellRoute = UpsellRouteImport.update({
  id: '/upsell',
  path: '/upsell',
  getParentRoute: () => rootRouteImport,
} as any)
const ApiIgImageRoute = ApiIgImageRouteImport.update({
  id: '/api/ig-image',
  path: '/api/ig-image',
  getParentRoute: () => rootRouteImport,
} as any)
const ApiInstagramRoute = ApiInstagramRouteImport.update({
  id: '/api/instagram',
  path: '/api/instagram',
  getParentRoute: () => rootRouteImport,
} as any)
const RegisterIndexRoute = RegisterIndexRouteImport.update({
  id: '/register/',
  path: '/register/',
  getParentRoute: () => rootRouteImport,
} as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/checkout': typeof CheckoutRoute
  '/dashboard': typeof DashboardRoute
  '/delivering': typeof DeliveringRoute
  '/resultado': typeof ResultadoRoute
  '/scanning': typeof ScanningRoute
  '/search': typeof SearchRoute
  '/upsell': typeof UpsellRoute
  '/api/ig-image': typeof ApiIgImageRoute
  '/api/instagram': typeof ApiInstagramRoute
  '/register/': typeof RegisterIndexRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/checkout': typeof CheckoutRoute
  '/dashboard': typeof DashboardRoute
  '/delivering': typeof DeliveringRoute
  '/resultado': typeof ResultadoRoute
  '/scanning': typeof ScanningRoute
  '/search': typeof SearchRoute
  '/upsell': typeof UpsellRoute
  '/api/ig-image': typeof ApiIgImageRoute
  '/api/instagram': typeof ApiInstagramRoute
  '/register': typeof RegisterIndexRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/checkout': typeof CheckoutRoute
  '/dashboard': typeof DashboardRoute
  '/delivering': typeof DeliveringRoute
  '/resultado': typeof ResultadoRoute
  '/scanning': typeof ScanningRoute
  '/search': typeof SearchRoute
  '/upsell': typeof UpsellRoute
  '/api/ig-image': typeof ApiIgImageRoute
  '/api/instagram': typeof ApiInstagramRoute
  '/register/': typeof RegisterIndexRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
  | '/'
  | '/checkout'
  | '/dashboard'
  | '/delivering'
  | '/resultado'
  | '/scanning'
  | '/search'
  | '/upsell'
  | '/api/ig-image'
  | '/api/instagram'
  | '/register/'
  fileRoutesByTo: FileRoutesByTo
  to:
  | '/'
  | '/checkout'
  | '/dashboard'
  | '/delivering'
  | '/resultado'
  | '/scanning'
  | '/search'
  | '/upsell'
  | '/api/ig-image'
  | '/api/instagram'
  | '/register'
  id:
  | '__root__'
  | '/'
  | '/checkout'
  | '/dashboard'
  | '/delivering'
  | '/resultado'
  | '/scanning'
  | '/search'
  | '/upsell'
  | '/api/ig-image'
  | '/api/instagram'
  | '/register/'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  CheckoutRoute: typeof CheckoutRoute
  DashboardRoute: typeof DashboardRoute
  DeliveringRoute: typeof DeliveringRoute
  ResultadoRoute: typeof ResultadoRoute
  ScanningRoute: typeof ScanningRoute
  SearchRoute: typeof SearchRoute
  UpsellRoute: typeof UpsellRoute
  ApiIgImageRoute: typeof ApiIgImageRoute
  ApiInstagramRoute: typeof ApiInstagramRoute
  RegisterIndexRoute: typeof RegisterIndexRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/checkout': {
      id: '/checkout'
      path: '/checkout'
      fullPath: '/checkout'
      preLoaderRoute: typeof CheckoutRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/dashboard': {
      id: '/dashboard'
      path: '/dashboard'
      fullPath: '/dashboard'
      preLoaderRoute: typeof DashboardRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/delivering': {
      id: '/delivering'
      path: '/delivering'
      fullPath: '/delivering'
      preLoaderRoute: typeof DeliveringRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/resultado': {
      id: '/resultado'
      path: '/resultado'
      fullPath: '/resultado'
      preLoaderRoute: typeof ResultadoRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/scanning': {
      id: '/scanning'
      path: '/scanning'
      fullPath: '/scanning'
      preLoaderRoute: typeof ScanningRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/search': {
      id: '/search'
      path: '/search'
      fullPath: '/search'
      preLoaderRoute: typeof SearchRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/upsell': {
      id: '/upsell'
      path: '/upsell'
      fullPath: '/upsell'
      preLoaderRoute: typeof UpsellRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/api/ig-image': {
      id: '/api/ig-image'
      path: '/api/ig-image'
      fullPath: '/api/ig-image'
      preLoaderRoute: typeof ApiIgImageRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/api/instagram': {
      id: '/api/instagram'
      path: '/api/instagram'
      fullPath: '/api/instagram'
      preLoaderRoute: typeof ApiInstagramRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/register/': {
      id: '/register/'
      path: '/register'
      fullPath: '/register/'
      preLoaderRoute: typeof RegisterIndexRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  CheckoutRoute: CheckoutRoute,
  DashboardRoute: DashboardRoute,
  DeliveringRoute: DeliveringRoute,
  ResultadoRoute: ResultadoRoute,
  ScanningRoute: ScanningRoute,
  SearchRoute: SearchRoute,
  UpsellRoute: UpsellRoute,
  ApiIgImageRoute: ApiIgImageRoute,
  ApiInstagramRoute: ApiInstagramRoute,
  RegisterIndexRoute: RegisterIndexRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
  }
}
