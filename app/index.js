import './styles/main.css'
import React from 'react'
import { render } from 'react-dom'
import { HashRouter } from 'react-router-dom'
import { renderRoutes } from 'react-router-config'
import Tooltip from './components/Tooltip'
import routes from './controllers/routes'
import { NoticeContainer } from './components/Notify'

function mountService(Component, props = {}, parent = document.body){
  var content = document.createElement('div')
  parent.appendChild(content)
  render((
    <Component {...props}/>
  ), content)
  return () => {
    ReactDOM.unmountComponentAtNode(content)
    parent.removeChild(content)
  }
}

render((
  <HashRouter>
    { renderRoutes(routes) }
  </HashRouter>
), document.getElementById('layout'))

mountService(NoticeContainer)
