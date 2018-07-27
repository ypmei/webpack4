import '../styles/components/search.css'
import '../styles/components/searchbox.css'
import React, { Component } from 'react'
import cx from 'classnames'
import _ from 'lodash'

export default class SearchInput extends Component {
  static defaultProps={
    onChange: (v) => v,
    width: '180px',
    className: '',
    sizeClass: ''
  }
  constructor (props) {
    super(props)
    this.state = {
      value: ''
    }
  }
  __ct = null
  changeHandle(e){
    const value = e.target.value || ''
    clearTimeout(this.__ct)
    this.__ct = _.delay(() => {
      this.props.onChange(value)
    }, 1000)
    this.setState({
      value: value
    })
  }
  clearHandle(){
    this.props.onChange('')
    this.setState({
      value: ''
    })
  }
  onInputKeyUp(e){
    const value = e.target.value || ''
    if(e.keyCode === 13){
      clearTimeout(this.__ct)
      this.props.onChange(value)
    }
  }
  render(){
    const clearable = Boolean(this.state.value);
    return (
      <div
        style={{ width: this.props.width}}
        className={cx(this.props.className, {'form-feedback searchbox': true, 'form-clearable': clearable})}
      >
        <div className="form-feedback-icon">
          {
            clearable ? <i className="iconfont close" onClick={ this.clearHandle.bind(this) }>&#xe605;</i> : null
          }
          <i className="iconfont">&#xe60b;</i>
        </div>
        <input type="text" value={ this.state.value } className={cx('form-control', this.props.sizeClass)} onChange={ this.changeHandle.bind(this) } placeholder={ __('搜索') } />
      </div>
    )
  }
}
