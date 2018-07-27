import React, { Component } from 'react'
import { bindStores } from '../provider'
import { renderRoutes } from 'react-router-config'

@bindStores()
export default class MainView extends Component {
  render(){
    return (
      <div className='flex-col-1'>
        {
          location.hash === '#/main' ? (
            <div></div>
          ) : null
        }
        { renderRoutes(this.props.route.routes, this) }
      </div>
    )
  }
}
