import React, { Component } from 'react'

export default class NoData extends Component {
  static defaultProps = {
    height: 100,
    content: __('暂无数据'),
    textAlign: 'center'
  }
  render(){
    return (
      <div style={{height: this.props.height,color: this.props.color, lineHeight: `${this.props.height}px`, textAlign: this.props.textAlign}}>
        {this.props.content}
      </div>
    )
  }
}
