import { lazyLoad } from '../utils/lazyload'
import mainRoutes from './main/routes'

const Root = lazyLoad(() => import('./Root'))
const RootView = lazyLoad(() => import('./RootView'))

export default [
  {
    component: Root,
    routes: [
      {
        path: '/',
        exact: true,
        component: RootView
      },
      ...mainRoutes
    ]
  }
]
