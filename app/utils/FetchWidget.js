import React, { Component } from 'react'
import FluxStoreGroup from 'flux/lib/FluxStoreGroup'
import Loading from '../components/Loading'
import { Store } from './fluxkit'
import _ from 'lodash'

export default class FetchWidget extends Component {
  static defaultProps = {
    paramStores: [],
    fetch: () => Promise.resolve({}),
    mapToParams: (...args) => args.reduce((o, x) => Object.assign(o, x), {}),
    mapToData: (a) => a,
    scanData: (acc, x) => x,
    onFulfilled: () => {},
    onRejected: () => {},
    onProcess: () => {}
  }
  constructor(props){
    super(props)
    this.state = {
      pending: true,
      error: null,
      data: null
    }
  }
  __setData(data, res) {
    this.setState({
      pending: false,
      error: null,
      data: this.props.scanData(this.state.data, data)
    }, () => {
      this.props.onFulfilled(res)
    })
  }
  __fetch(){
    if(this.__promise && this.__promise.abort){
      this.__promise.abort()
    }
    const params = this.props.mapToParams.apply(null, this.props.paramStores.map((store) => {
      if(Store.prototype.isPrototypeOf(store)){
        return store.getState()
      }else{
        return store
      }
    }))
    this.setState({
      pending: true,
      data: null,
      error: null,
      params: params
    }, () => {
      const promise = this.__promise = this.props.fetch(params)
      this.props.onProcess(params)
      this.__promise.then((res) => {
        if(promise === this.__promise){
          this.__promise = null
          var mapToData = this.props.mapToData(res, params)
          if(mapToData && typeof mapToData.then === 'function') {
            mapToData.then((data) => {
              this.__setData(data, res)
            }).catch((err) => {
              if(err.customData){
                this.__setData(err.customData, res)
              }
            })
          }else{
            this.__setData(mapToData, res)
          }
        }
      }, (error) => {
        if(promise === this.__promise){
          this.__promise = null
          this.setState({
            pending: false,
            data: null,
            error: error
          }, () => {
            this.props.onRejected(error)
          })
        }
      })
    })
  }
  componentDidMount(){
    this.__fetch()
    const stores = this.props.paramStores.filter((store) => {
      return Store.prototype.isPrototypeOf(store)
    })
    var changed = false
    const setChanged = () => { changed = true }
    this.__storeSubscriptions = stores.map(
      store => store.addListener(setChanged)
    )
    if(stores.length){
      const __fetch__ = () => {
        if(changed){
          this.__fetch()
        }
        changed = false
      }
      this.__storeGroup = new FluxStoreGroup(stores, _.debounce(__fetch__, 100))
    }
  }
  componentWillUnmount(){
    if(this.__promise && this.__promise.abort){
      if(this.__promise.abort){
        this.__promise.abort()
      }
      this.__promise = null
    }
    if(this.__storeGroup){
      this.__storeGroup.release()
    }
    this.__storeSubscriptions.forEach((subscription) => {
      subscription.remove()
    })
  }
  render(){
    if(this.state.pending){
      return (<Loading />)
    }
    if(this.state.error){
      return <div className='widget-error'><span>{__('服务器异常，请稍后重试！')}</span></div>
    }
    if(this.state.data){
      if(typeof this.props.children === 'function'){
        if(this.props.renderFlattern){
          return React.cloneElement(this.props.children(this.state.data))
        }else{
          return this.props.children(_.cloneDeep(this.state.data))
        }
      }else{
        return React.cloneElement(this.props.children, this.state.data)
      }
    }
    return null
  }
}
