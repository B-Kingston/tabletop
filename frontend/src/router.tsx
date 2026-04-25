import { createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { InstanceLayout } from './components/layout/InstanceLayout'
import { MediaList } from './pages/MediaList'
import { MediaDetail } from './pages/MediaDetail'
import { RecipeList } from './pages/RecipeList'
import { RecipeDetail } from './pages/RecipeDetail'
import { RecipeEdit } from './pages/RecipeEdit'
import { CookingView } from './pages/CookingView'
import { WineList } from './pages/WineList'
import { WineDetail } from './pages/WineDetail'
import { ChatPage } from './pages/ChatPage'

const rootRoute = createRootRoute({ component: Outlet })

const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: Login })
const dashboardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Dashboard })

const instanceLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  // id: 'instance',
  path: '/instances/$instanceId',
  component: InstanceLayout,
})

const mediaListRoute = createRoute({ getParentRoute: () => instanceLayoutRoute, path: '/media', component: MediaList })
const mediaDetailRoute = createRoute({ getParentRoute: () => instanceLayoutRoute, path: '/media/$mediaId', component: MediaDetail })
const recipeListRoute = createRoute({ getParentRoute: () => instanceLayoutRoute, path: '/recipes', component: RecipeList })
const recipeDetailRoute = createRoute({ getParentRoute: () => instanceLayoutRoute, path: '/recipes/$recipeId', component: RecipeDetail })
const recipeNewRoute = createRoute({ getParentRoute: () => instanceLayoutRoute, path: '/recipes/new', component: RecipeEdit })
const recipeEditRoute = createRoute({ getParentRoute: () => instanceLayoutRoute, path: '/recipes/$recipeId/edit', component: RecipeEdit })
const cookingViewRoute = createRoute({ getParentRoute: () => instanceLayoutRoute, path: '/recipes/$recipeId/cook', component: CookingView })
const wineListRoute = createRoute({ getParentRoute: () => instanceLayoutRoute, path: '/wines', component: WineList })
const wineDetailRoute = createRoute({ getParentRoute: () => instanceLayoutRoute, path: '/wines/$wineId', component: WineDetail })
const chatRoute = createRoute({ getParentRoute: () => instanceLayoutRoute, path: '/chat', component: ChatPage })

const routeTree = rootRoute.addChildren([
  loginRoute,
  dashboardRoute,
  instanceLayoutRoute.addChildren([
    mediaListRoute,
    mediaDetailRoute,
    recipeListRoute,
    recipeDetailRoute,
    recipeNewRoute,
    recipeEditRoute,
    cookingViewRoute,
    wineListRoute,
    wineDetailRoute,
    chatRoute,
  ]),
])

export const router = createRouter({ routeTree })
export type Router = typeof router
