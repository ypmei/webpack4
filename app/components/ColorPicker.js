import '../styles/components/colorpicker.css'
import React, { Component } from 'react'
import { ChromePicker, CirclePicker, CompactPicker, GithubPicker, SketchPicker } from 'react-color-ypmei'
import Dropdown from './Dropdown'

export default class ColorPicker extends Component {
  static defaultProps = {
    type: 'SketchPicker',
    color: '#FFF',
    onChange: (v) => v,
    onClose: () => {}
  }
  constructor(props){
    super(props)
    this.state = {
      autoHide: false,
      hex: props.color
    }
  }
  handleChange(color, event){
    const { hex } = color;
    this.setState({
      hex: hex
    },()=>this.props.onChange(hex))
  }
  circleChange(color, event){
    const { hex } = color;
    this.setState({
      autoHide: true,
      hex: hex
    }, () => this.props.onChange(hex) )
  }
  onClose(event){
    this.setState({
      autoHide: true
    })
  }
  render(){
    const isInput = this.props.type === 'input';
    return (
      <div className="tools-warp color-picker">
        <Dropdown
          autoHide={this.state.autoHide}
          label={
            isInput ? (
              <div className="input-color">
                <span className="text"> {this.state.hex} </span>
                <i className="circle" data-tip={__('拾色器')} style={{backgroundColor: this.state.hex}}></i>
              </div>
            ) : (
              <div className="pick-btn" data-tip={__('拾色器') }>
                {
                  this.props.type === 'CirclePicker' ? (
                    <div className="double-icon">
                      <i className="iconfont double-icon-t">&#xe62a;</i>
                      <i className="iconfont double-icon-b">&#xe62b;</i>
                    </div>
                  ) : (
                    <div className="double-icon">
                      <i className="iconfont double-icon-t">&#xe62d;</i>
                      <i className="iconfont double-icon-b">&#xe62b;</i>
                    </div>
                  )
                }
              </div>
            )
          }>
          {
            ['SketchPicker', 'input'].includes(this.props.type) ? (
              <SketchPicker
                onChange={ (color, event) => this.handleChange(color, event) }
                onClose={ (event) => this.onClose(event) }
              />
            ) : null
          }
          {
            this.props.type === 'CirclePicker' ? (
              <CirclePicker
                onChange={ (color, event) => this.circleChange(color, event) }
              />
            ) : null
          }
        </Dropdown>
      </div>
    )
  }
}
