import React, { Component } from 'react'
import { renderRoutes } from 'react-router-config'
import { bindStores } from './provider'
import { Store } from '../utils/fluxkit'
import RefreshStore from '../stores/RefreshStore'
import TimeStore from '../stores/TimeStore'
import { fetchUserInfo } from '../actions/user'

class UserStore extends Store {
  $getUserInfo(state, payload){
    return payload
  }
}

@bindStores({
  userStore: UserStore,
  refreshStore: RefreshStore,
  timeStore: TimeStore
})
export default class Root extends Component {
  componentDidMount(){
    // fetchUserInfo().then((res) => this.$getUserInfo(res))
  }
  render(){
    return (
      <div className="flex-col-1">
        <div className="flex-1 container">
          <div className="flex-col-1">
          { renderRoutes(this.props.route.routes, this) }
          </div>
        </div>
      </div>
    )
  }
}
