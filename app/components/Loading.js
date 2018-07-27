import '../styles/components/loading.css'
import React, { Component } from 'react'

export default class Loading extends Component{
  static defaultProps = {
    height: 200,
    content: ''
  }
  render(){
    return (
      <div className="loading" style={{height: this.props.height / 2, lineHeight: `${this.props.height / 2}px`}}>
        <div>
          <i className="iconfont">&#xe652;</i>
        </div>
        {this.props.content}
        {this.props.children}
      </div>
    )
  }
}
