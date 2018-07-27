import Loadable from 'react-loadable'
import Loading from '../components/Loading'

const lazyLoad = (fn) => Loadable({
  loader: fn,
  loading: Loading
})

export { lazyLoad }
