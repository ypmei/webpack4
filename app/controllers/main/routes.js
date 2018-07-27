import { lazyLoad } from '../../utils/lazyload'

const MainView = lazyLoad(() => import('./MainView'))
const DetailView = lazyLoad(() => import('./DetailView'))

export default [
  {
    path: '/main',
    component: MainView,
    routes: [
      {
        path: '/main/:id/detail',
        component: DetailView
      }
    ]
  }
]
