/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as IndexImport } from './routes/index'
import { Route as LuroIndexImport } from './routes/luro/index'
import { Route as LuroSoonImport } from './routes/luro/soon'
import { Route as LuroIntervalImport } from './routes/luro/$interval'

// Create/Update Routes

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const LuroIndexRoute = LuroIndexImport.update({
  id: '/luro/',
  path: '/luro/',
  getParentRoute: () => rootRoute,
} as any)

const LuroSoonRoute = LuroSoonImport.update({
  id: '/luro/soon',
  path: '/luro/soon',
  getParentRoute: () => rootRoute,
} as any)

const LuroIntervalRoute = LuroIntervalImport.update({
  id: '/luro/$interval',
  path: '/luro/$interval',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/luro/$interval': {
      id: '/luro/$interval'
      path: '/luro/$interval'
      fullPath: '/luro/$interval'
      preLoaderRoute: typeof LuroIntervalImport
      parentRoute: typeof rootRoute
    }
    '/luro/soon': {
      id: '/luro/soon'
      path: '/luro/soon'
      fullPath: '/luro/soon'
      preLoaderRoute: typeof LuroSoonImport
      parentRoute: typeof rootRoute
    }
    '/luro/': {
      id: '/luro/'
      path: '/luro'
      fullPath: '/luro'
      preLoaderRoute: typeof LuroIndexImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/luro/$interval': typeof LuroIntervalRoute
  '/luro/soon': typeof LuroSoonRoute
  '/luro': typeof LuroIndexRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/luro/$interval': typeof LuroIntervalRoute
  '/luro/soon': typeof LuroSoonRoute
  '/luro': typeof LuroIndexRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/luro/$interval': typeof LuroIntervalRoute
  '/luro/soon': typeof LuroSoonRoute
  '/luro/': typeof LuroIndexRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/luro/$interval' | '/luro/soon' | '/luro'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/luro/$interval' | '/luro/soon' | '/luro'
  id: '__root__' | '/' | '/luro/$interval' | '/luro/soon' | '/luro/'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  LuroIntervalRoute: typeof LuroIntervalRoute
  LuroSoonRoute: typeof LuroSoonRoute
  LuroIndexRoute: typeof LuroIndexRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  LuroIntervalRoute: LuroIntervalRoute,
  LuroSoonRoute: LuroSoonRoute,
  LuroIndexRoute: LuroIndexRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/luro/$interval",
        "/luro/soon",
        "/luro/"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/luro/$interval": {
      "filePath": "luro/$interval.tsx"
    },
    "/luro/soon": {
      "filePath": "luro/soon.tsx"
    },
    "/luro/": {
      "filePath": "luro/index.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
