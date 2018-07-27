import '../styles/components/timeSetting.css'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import $ from 'jquery'
import format from '../utils/format'
import clickOutside from '../decorators/clickOutside'

@clickOutside((component) => {
  var $dom = $(ReactDOM.findDOMNode(component))
  if($(event.target)[0] !== $(`#${component.props.relate}`)[0]) {
    $dom.hide()
  }else{
    $dom.show()
  }
})
export default class TimePicker extends Component {
  static defaultProps = {
    onChange: (v) => v
  }
  constructor(props) {
    super(props);
    const time = props.value.split(':');
    this.state = {
      startTime: '',
      hour: time[0],
      minute: time[1],
      second: time[2]
    };
  }
  toDouble(n){
    return n < 10 ? `0${n}` : n
  }
  handleMouseDown(choice, props, event){
    const {hour, minute, second} = format.clockForDay(parseInt(this.state.hour), parseInt(this.state.minute), parseInt(this.state.second), props, choice)
    this.setClock(hour, minute, second)
    $(ReactDOM.findDOMNode(this.refs[`${props}_input`])).val(this.state[props])
  }
  setClock(hour, minute, second) {
    this.state.hour = this.toDouble(hour);
    this.state.minute = this.toDouble(minute);
    this.state.second = this.toDouble(second);
    this.triggerStartTimeChange()
    this.forceUpdate();
  }
  getStartTime() {
    return [ this.state.hour, this.state.minute, this.state.second ].join(':')
  }
  triggerStartTimeChange(){
    const startTime = this.getStartTime()
    this.setState({
      startTime: startTime
    })
    this.props.onChange(startTime)
  }
  inputChange(whic, event) {
    let max
    if(whic === 'hour')      {
      max = 23
    }    else if(whic === 'minute' || whic === 'second')      { max = 59 }
    var val = parseInt($(event.target).val())
    if(val < 0)      {
      val = 0
    }    else if(val > max)      {
      val = max
    }    else if(!(val >= 0 && val <= max))      {
      val = 0
    }
    val = this.toDouble(val)
    this.state[whic] = val
    this.forceUpdate()
    this.triggerStartTimeChange()
    $(event.target).val(val)
  }
  render(){
    var position = {}
    if(this.props.relate) {
      var $input = $(`#${this.props.relate}`)
      position = {
        top: $input[0].offsetTop + $input.height(),
        left: $input[0].offsetLeft
      }
    }
    return (
      <div className="time-pick-box" style={Object.assign({}, this.props.style, {
        position: 'absolute',
        zIndex: 99
      }, position)}>
        <div className="hour-box">
          <span className="up"
            onClick={(e) => { this.handleMouseDown(1, 'hour', e) }}><i className="iconfont">&#xe656;</i></span>
          <input className="input-box"
            defaultValue={this.state.hour} onChange={(e) => { this.inputChange('hour', e) }} ref='hour_input'/>
          <span className="down"
            onClick={(e) => { this.handleMouseDown(2, 'hour', e) }}><i className="iconfont">&#xe676;</i></span>
        </div>
        <span className="point">&nbsp;:&nbsp;</span>
        <div className="minute-box">
          <span className="up"
            onClick={(e) => { this.handleMouseDown(1, 'minute', e) }}><i className="iconfont">&#xe656;</i></span>
          <input className="input-box"
            defaultValue={this.state.minute} onChange={(e) => { this.inputChange('minute', e) }} ref='minute_input'/>
          <span className="down"
            onClick={(e) => { this.handleMouseDown(2, 'minute', e) }}><i className="iconfont">&#xe676;</i></span>
        </div>
        <span className="point">&nbsp;:&nbsp;</span>
        <div className="second-box">
          <span className="up"
            onClick={(e) => { this.handleMouseDown(1, 'second', e) }}><i className="iconfont">&#xe656;</i></span>
          <input className="input-box"
            defaultValue={this.state.second} onChange={(e) => { this.inputChange('second', e) }} ref='second_input'/>
          <span className="down"
            onClick={(e) => { this.handleMouseDown(2, 'second', e) }}><i className="iconfont">&#xe676;</i></span>
        </div>
      </div>
    )
  }
}
