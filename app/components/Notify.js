import '../styles/components/notify.css'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import $ from 'jquery'
import _ from 'lodash'
import cx from 'classnames'
import {EventEmitter} from 'events'

let _notices = [];
const CHANGE_EVENT = 'change';
const noticeStore = _.extend({}, EventEmitter.prototype, {
  add: function(noticeProps){
    _notices.push(_.defaults(noticeProps, {
      $id: _.uniqueId('notice'),
      autoClose: true
    }))
    this.emitChange();
  },
  remove: function($id){
    _notices = _notices.filter(function(n){
      return n.$id !== $id
    })
    this.emitChange();
  },
  emitChange: function(){
    this.emit(CHANGE_EVENT);
  },
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },
  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
})
export function Success(content, options){
  return noticeStore.add(_.extend({}, options || {}, {
    noticeType: 'success',
    children: content
  }))
}
export function Info(content, options){
  return noticeStore.add(_.extend({}, options || {}, {
    noticeType: 'info',
    children: content
  }))
}
export function Warning(content, options){
  return noticeStore.add(_.extend({}, options || {}, {
    noticeType: 'warning',
    children: content
  }))
}
export function Error(content, options){
  return noticeStore.add(_.extend({}, options || {}, {
    noticeType: 'error',
    children: content
  }))
}

export class NoticeContainer extends Component {
  constructor(props){
    super(props);
    this.state = {
      notices: _notices
    }
    this._onChange = this._onChange.bind(this)
  }
  _onChange(){
    this.setState({
      notices: _notices
    })
  }
  componentDidMount(){
    noticeStore.addChangeListener(this._onChange)
  }
  componentWillUnmount(){
    noticeStore.removeChangeListener(this._onChange)
  }
  close(notice){

  }
  render(){
    return (
      <div className="notice-list" style={{zIndex: 9999}}>
        <ul>
          {
            this.state.notices.map(function(notice){
              return (
                <Notice
                  ref={notice.$id}
                  key={notice.$id}
                  id={notice.$id}
                  autoClose={notice.autoClose}
                  noticeType={notice.noticeType}
                >
                  {notice.children}
                </Notice>
              )
            }, this)
          }
        </ul>
      </div>
    )
  }
}
class Notice extends Component {
  constructor(props){
    super(props);
    this.close = this.close.bind(this)
  }
  close(){
    if(this.timer){
      clearTimeout(this.timer)
    }
    if(this.animating){
      return ;
    }
    var id = this.props.id;
    this.animating = true
    $(this.refs.root).fadeOut(function(){
      this.animating = false
      noticeStore.remove(id)
    })
  }
  componentDidMount(){
    var _this = this
    if(this.props.autoClose){
      this.timer = setTimeout(function(){
        _this.close()
      }, 3 * 1000)
    }
  }
  componentWillUnmount(){
    if(this.timer){
      clearTimeout(this.timer)
    }
  }
  render(){
    var noticeType;
    switch(this.props.noticeType){
    case 'success':
      noticeType = 'alert-success';
      break;
    case 'info':
      noticeType = 'alert-info';
      break;
    case 'warning':
      noticeType = 'alert-warning';
      break;
    case 'error':
      noticeType = 'alert-error';
      break;
    default:
      noticeType = 'alert-info';
      break;
    }
    return (
      <li ref="root" className={cx('alert', noticeType)}>
        <p>
          {_.isFunction(this.props.children) ? this.props.children(this) : this.props.children}
        </p>
        <span className="close" onClick={this.close}>
          <i className="iconfont">&#xe605;</i>
        </span>
      </li>
    )
  }
}
