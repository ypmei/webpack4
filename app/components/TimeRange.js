import '../styles/components/timerange.css'

import React, { Component } from 'react'
import _ from 'lodash'
import cx from 'classnames'
import moment from 'moment'
import $ from 'jquery'
import 'jquery.cookie'
import Datepicker from './Datepicker'
import Dropdown from './Dropdown'
import format from '../utils/format'
import { cookieKey } from '../config'

export default class TimeRange extends Component {
  static defaultProps = {
    onChange: () => {},
    defaultValue: {
      spanTime: cookieKey.defaultSpanTime,
      endTime: null
    },
    cookieKey: cookieKey,
    spanTimeItems: [ {
      value: 30 * 60 * 1000,
      text: __('30分钟')
    }, {
      value: 60 * 60 * 1000,
      text: __('1小时')
    }, {
      value: 3 * 60 * 60 * 1000,
      text: __('3小时')
    }, {
      value: 6 * 60 * 60 * 1000,
      text: __('6小时')
    }, {
      value: 12 * 60 * 60 * 1000,
      text: __('12小时')
    }, {
      value: 24 * 60 * 60 * 1000,
      text: __('1天')
    }, {
      value: 3 * 24 * 60 * 60 * 1000,
      text: __('3天')
    }, {
      value: 7 * 24 * 60 * 60 * 1000,
      text: __('7天')
    }, {
      value: 15 * 24 * 60 * 60 * 1000,
      text: __('15天')
    }, {
      value: 30 * 24 * 60 * 60 * 1000,
      text: __('30天')
    } ],

    onTimeShow: false
  }
  constructor(props, context){
    super(props, context)
    var now = moment().valueOf()
    const spanTime = $.cookie(props.cookieKey.spanTime, Number)
      , endTime = $.cookie(props.cookieKey.endTime, Number)
      , onTimeRunning = $.cookie('onTimeRunning', (v) => v === 'false' ? false : true)
    this.state = {
      isCustom: false,
      customValue: {
        startTime: (endTime || this.props.defaultValue.endTime || now) - (spanTime || this.props.defaultValue.spanTime),
        endTime: (endTime || this.props.defaultValue.endTime || now)
      },
      value: {
        spanTime: spanTime || this.props.defaultValue.spanTime,
        endTime: endTime || this.props.defaultValue.endTime
      },
      minDatetime: now - this.props.spanTimeItems[this.props.spanTimeItems.length - 1].value,
      maxDatetime: now,
      onTimeRunning: onTimeRunning || false
    }
    this.state.isCustom = Boolean(this.state.value.endTime)
    this.state.onTimeShow = ! this.state.isCustom
  }

  __onTimeSetting = {
    interval: 5, // 单位分钟
    rules: [ 30 * 60 * 1000, 60 * 60 * 1000, 3 * 60 * 60 * 1000 ] // 对哪几个时间点设置自动刷新
  }
  __onTimeTaskId = null

  toggleCustom(){
    this.setState({
      isCustom: true
    })
  }
  onChange(){
    const { value } = this.state
    this.props.onChange(value)

    // 选择自定义时间
    if(this.state.isCustom) {
      // 如果当前显示了定时刷新组件
      if(this.state.onTimeShow) {
        // 停止定时刷新并清除定时状态
        this.clearOnTimeAll()
      }
      // 隐藏定时组件
      this.setState({onTimeShow: false})
    } else{
      // 符合定时刷新条件
      if(this.onTimeInRules()) {
        // 显示定时刷新组件
        this.setState({onTimeShow: true})
      } else {
        // 停止定时刷新并清除定时状态
        this.clearOnTimeAll()
        // 隐藏
        this.setState({onTimeShow: false})
      }
    }
  }
  setValue(spanTime, endTime = null){
    var now = Date.now()
    this.setState({
      value: {
        spanTime,
        endTime
      },
      customValue: {
        startTime: (endTime || now) - spanTime,
        endTime: endTime || now
      },
      isActive: false,
      isCustom: endTime !== null
    }, () => this.onChange())
  }
  getValue(){
    const { value } = this.state
    return value
  }
  getDisplayText(){
    const { value } = this.state
    const { spanTimeItems } = this.props
    if(value.endTime){
      return `${moment(value.endTime - value.spanTime).format('YYYY-MM-DD HH:mm')} - ${moment(value.endTime).format('YYYY-MM-DD HH:mm')}`
    }else{
      var findedIndex = spanTimeItems.findIndex((i) => i.value === value.spanTime)
      if(findedIndex === -1){
        throw new Error('Can\'t find item in TimeStore config')
      }
      return spanTimeItems[findedIndex].text
    }
  }
  // 渲染当时刷新组件
  renderOnTimeComponent() {
    return this.state.onTimeShow && this.onTimeInRules() && !this.state.isCustom ? (<label className='checkbox-inline'>
        <input type='checkbox' onChange={() => this.onTimeSettingChange()} defaultChecked={this.state.onTimeRunning} key='ontime'></input>
        {__('每')}{this.__onTimeSetting.interval}{__('分钟自动刷新')}
      </label>) : null
  }

  // 规则判断
  onTimeInRules() {
    return false //_.findIndex(this.__onTimeSetting.rules, v => v === this.state.value.spanTime) >= 0
  }

  // 切换定时任务运行状态
  onTimeSettingChange() {
    if(!this.state.onTimeShow) { return }
    this.changeOnTimeTask(!this.state.onTimeRunning)
    if(this.state.onTimeRunning === true && this.state.onTimeShow === true) {
      this.runOnTimeTask()
    }else{
      this.stopOnTimeTask()
    }
  }

  runOnTimeTask() {
    $.cookie('onTimeRunning', true)
    this.__onTimeTaskId = setInterval(() => {
      this.setValue(this.state.value.spanTime, this.state.value.endTime)
    }, this.__onTimeSetting.interval * 60 * 1000)
  }

  stopOnTimeTask() {
    $.cookie('onTimeRunning', false)
    clearInterval(this.__onTimeTaskId)
  }

  changeOnTimeTask(value) {
    this.state.onTimeRunning = value
    this.forceUpdate()
  }

  clearOnTimeAll() {
    this.stopOnTimeTask()
    this.changeOnTimeTask(false)
  }

  componentWillUnmount() {
    // 组件销毁只需要清除任务定时器即可
    clearInterval(this.__onTimeTaskId)
  }

  componentDidMount() {
    window.__timeRangeComponent = this
    // 运行任务
    if(this.state.onTimeRunning)      {
      this.runOnTimeTask()
    }
  }

  renderBody(){
    return (
      <div ref="body" className="timerange-options">
        <ul className="timerange-option-container">
          {
            this.props.spanTimeItems.map((i) => {
              return (
                <li key={i.value} onClick={() => this.setValue(i.value)} className={cx({
                  'timerange-option': true,
                  'active': !this.state.isCustom && this.state.value.spanTime === i.value
                })}>
                {i.text}
                </li>
              )
            })
           }
          <li onClick={() => this.toggleCustom()} className={cx({
            'timerange-option': true,
            'active': this.state.isCustom
          })}>
          {__('自定义')}
          </li>
        </ul>
        {this.renderOnTimeComponent()}
        {this.state.isCustom ? this.renderCustomBody() : null}
      </div>
    )
  }
  renderCustomBody(){
    return (
      <div>
        <div className="datetime-item-container">
          <div className="datetime-item">
            <Datepicker
              type='start'
              onChange={(v) => {
                this.setState({
                  customValue: Object.assign({}, this.state.customValue, {
                    startTime: v
                  }),
                  isActive: false
                })
              }}
              defaultValue={this.state.customValue.startTime}
              customValue={this.state.customValue}
              minDate={this.state.minDatetime}
              maxDate={this.state.customValue.endTime - 60 * 1000}
              />
          </div>
          <span className="middle-text">{__('至')}</span>
          <div className="datetime-item">
            <Datepicker
              type='end'
              onChange={(v) => {
                this.setState({
                  customValue: Object.assign({}, this.state.customValue, {
                    endTime: v
                  }),
                  isActive: false
                })
              }}
              defaultValue={this.state.customValue.endTime}
              customValue={this.state.customValue}
              minDate={this.state.customValue.startTime + 60 * 1000}
              maxDate={this.state.maxDatetime}
              />
          </div>
        </div>
        <div className="timepicker-footer">
          <span className="print-text">{__('查询 ') + format.stampToTime(this.state.customValue.startTime) + __(' 至 ') + format.stampToTime(this.state.customValue.endTime) + __(' 内的性能数据')}</span>
          <button className="btn btn-primary" onClick={() => {
            this.setValue(this.state.customValue.endTime - this.state.customValue.startTime, this.state.customValue.endTime)
            this.setState({isActive: true})

            this.clearOnTimeAll()
          }}>  {__('确定')}</button>
        </div>
      </div>
    )
  }
  render(){
    return (
      <div className="timerange-container">
        {/*
         <span ref="refreshBtn" className="btn btn-icon" onClick={() => this.onChange()}>
         <i className="iconfont">&#xe602;</i>
         </span>
        */}
        <Dropdown
          autoHide={this.state.isActive}
          labelClassName="btn"
          label={
          <span ref="toggleBtn">
            <i className="iconfont">&#xe681;</i>
            <span className="text">
            {
              __('最新') + this.getDisplayText()
            }
            </span>
          </span>
          }>
          {
            this.renderBody()
          }
        </Dropdown>
      </div>
    )
  }
}
