import React from 'react'
import { Dispatcher } from 'flux'
import { Store as FluxStore } from 'flux/utils'
import FluxStoreGroup from 'flux/lib/FluxStoreGroup'
import _ from 'lodash'

const omitProps = [
  'children',
  'stores',
  'context',
  'location',
  'params',
  'route',
  'routeParams',
  'history',
  'routes',
  'stores',
  'createHref'
]
export class Store extends FluxStore {
  constructor(dispatcher, props){
    super(dispatcher)
    this._state = this.getInitialState(props)
  }
  getState(){
    return this._state;
  }
  getInitialState(props){
    return null
  }
  areEqual(one, two){
    return one === two;
  }
  __dispatchAction(state, action){
    if(action.type && this[`${action.type}`]){
      return this[`${action.type}`](state, action.params, action.stores)
    }
    return state
  }
  waitFor(stores){
    this.getDispatcher().waitFor(stores.map((store) => store.getDispatchToken()))
  }
  __invokeOnDispatch(action){
    this.__changed = false
    var startingState = this._state
    var endingState = this.__dispatchAction(startingState, action)
    if (!this.areEqual(startingState, endingState)) {
      this._state = endingState;
      this.__emitChange()
    }
    if(this.__changed) {
      this.__emitter.emit(this.__changeEvent)
    }
  }
  destroy(){
    this.getDispatcher().unregister(this.getDispatchToken())
  }
}
export function createProvider(){
  const dispatcher = new Dispatcher()

  function bindStores(
    Stores = {}
  , calculateState = (stores) => _.mapValues(stores, (store) => store.getState())
  , options = {}){
    var realOptions = Object.assign({
      propsEqual: () => true
    }, options)
    return (ControllerComponent) => {
      const displayName = `bindStores(${ControllerComponent.displayName || ControllerComponent.name})`
      class Controller extends ControllerComponent {
        constructor(props, context){
          super(props, context)
          this.ownStores = _.mapValues(Stores, (Store) => {
            return new Store(dispatcher, props)
          })
          this.stores = Object.assign({}, props.stores, this.ownStores)
          this.state = Object.assign(this.state || {}, calculateState(this.stores, this.state, props, this))
          this.actionNames().forEach((type) => {
            this[type] = (params) => {
              dispatcher.dispatch({
                type,
                params,
                stores: this.stores
              })
            }
          })
        }
        actionNames(){
          return _.chain(_.values(this.stores)).map((store) => {
            return Object.getOwnPropertyNames(Object.getPrototypeOf(store)).filter((methodName) => {
              return methodName.indexOf('$') === 0
            })
          }).flatten(true).uniq().value()
        }
        componentDidMount(){
          const stores = _.values(this.stores)
          var changed = false
          const setChanged = () => { changed = true }
          this.__storeSubscriptions = stores.map(
            store => store.addListener(setChanged)
          )
          this.__storeGroup = new FluxStoreGroup(stores, () => {
            if(changed){
              this.setState((prevState) => calculateState(this.stores, prevState, this.props, this))
            }
            changed = false
          })
          if(super.componentDidMount){
            super.componentDidMount()
          }
        }
        componentWillReceiveProps(nextProps){
          if(realOptions.propsEqual(nextProps, this.props) === false){
            this.setState((prevState) => calculateState(this.stores, prevState, nextProps, this))
          }
          if(super.componentWillReceiveProps){
            super.componentWillReceiveProps(nextProps)
          }
        }
        componentWillUnmount(){
          this.__storeGroup.release()
          this.__storeSubscriptions.forEach((subscription) => {
            subscription.remove()
          })
          _.values(this.ownStores).forEach((store) => {
            store.destroy()
          })
          if(super.componentWillUnmount){
            super.componentWillUnmount()
          }
        }
        renderChildren(otherProps){
          if(!this.props.children){
            return null;
          }
          return React.cloneElement(this.props.children, Object.assign({
            stores: Object.assign({}, this.props.stores, this.ownStores),
            context: Object.assign(
              {},
              this.props.context,
              Object
                .keys(this.ownStores)
                .map((key) => this.ownStores[key].getState())
                .reduce((acc, x) => Object.assign(acc, x), {})
            )
          }, _.omit(this.props, omitProps), otherProps))
        }
        render(){
          if(process.env.NODE_ENV !== 'production'){
            console.log(`Render View [${displayName}], current props:`, this.props)
          }
          if(!super.render){
            return this.renderChildren()
          }
          return super.render()
        }
      }
      Controller.displayName = displayName
      return Controller
    }
  }
  return {
    bindStores
  }
}
