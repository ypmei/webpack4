import '../styles/components/datepicker.css'
import React, { Component } from 'react'
import Slider from './Slider'
import moment from 'moment'
import _ from 'lodash'
import cx from 'classnames'

const ADAY = 24 * 3600 * 1000

export default class DatePicker extends Component {
  static defaultProps = {
    onChange: () => {},
    defaultValue: Date.now(),
    minDate: Date.now() - 365 * 24 * 60 * 60 * 1000,
    maxDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
    withTime: true,
    type: ''
  }
  constructor(props){
    super(props)
    this.state = this._stateFromDate(moment(props.defaultValue).valueOf());
    this._onForward = this._onForward.bind(this);
    this._onBackward = this._onBackward.bind(this);
    this._onChange = this._onChange.bind(this);
  }
  _isDateDisabled(date){
    var cur = moment(date).startOf('d').valueOf()
    var min = moment(this.props.minDate).startOf('d').valueOf()
    var max = moment(this.props.maxDate).endOf('d').valueOf()
    return (cur < min || cur > max)
  }
  _stateFromDate(date, dontChangeValue){
    var $currentDay = moment(date)
    var prevLastDay = moment(date).add(-1, 'month').endOf('month').valueOf()
      , nextFirstDay = moment(date).add(1, 'month').startOf('month').valueOf()
    var value = dontChangeValue ? this.state.value : date
    return Object.assign({
      value: value
    }, {
      currentShow: date,
      year: $currentDay.year(),
      month: $currentDay.month(),
      date: moment(value).date(),
      hour: moment(value).hour(),
      minute: moment(value).minute(),
      matrix: this._generateMatrix(date),
      allowForward: nextFirstDay >= this.props.minDate && nextFirstDay <= this.props.maxDate,
      allowBackward: prevLastDay >= this.props.minDate && prevLastDay <= this.props.maxDate
    })
  }
  _generateMatrix(date){
    var matrixStart = moment(date).startOf('month').startOf('week').subtract(1, 'day').startOf('day').valueOf()
      , matrixEnd = moment(date).endOf('month').endOf('week').add(1, 'week').subtract(1, 'day').endOf('day').valueOf()
    return _.range(matrixStart, matrixEnd, ADAY).map((i) => {
      var m = moment(i)
      return {
        value: m.valueOf(),
        date: m.date(),
        label: m.format('DD'),
        month: m.month()
      }
    }).reduce((i, acc, n) => {
      if(n % 7){
        i[i.length - 1].push(acc)
        return i
      }else{
        i.push([ acc ])
        return i
      }
    }, [])
  }
  _onChange(){
    this.props.onChange(this.state.value)
  }
  _onForward(key){
    this.setState(this._stateFromDate(moment(this.state.currentShow).add(1, 'month').valueOf(), true))
  }
  _onBackward(key){
    this.setState(this._stateFromDate(moment(this.state.currentShow).add(-1, 'month').valueOf(), true))
  }
  _selectDay(date){
    const { startTime, endTime } = this.props.customValue
    let newDate = moment(date).set('hour', this.state.hour).set('minute', this.state.minute).valueOf()
    if(this.props.type === 'start'){
      newDate = newDate >= endTime ? (endTime - 60 * 1000) : newDate
      newDate = newDate < this.props.minDate ? this.props.minDate : newDate
    }else{
      newDate = newDate <= startTime ? (startTime + 60 * 1000) : newDate
      newDate = newDate > this.props.maxDate ? this.props.maxDate : newDate
    }
    this.setState(this._stateFromDate(newDate), this._onChange)
  }
  _selectHour(hour){
    this.setState(this._stateFromDate(moment(this.state.value).set('hour', hour).valueOf()), this._onChange)
  }
  _selectMinute(minute){
    this.setState(this._stateFromDate(moment(this.state.value).set('minute', minute).valueOf()), this._onChange)
  }
  render(){
    return (
      <div className="datetimepicker">
        <div>
          <div className="calendar-date">
            <table className="table-condensed">
              <thead>
                <tr>
                  <th>
                    <i className="iconfont arrow" onClick={this.state.allowBackward ? this._onBackward : null}>
                      &#xe64d;
                    </i>
                  </th>
                  <th colSpan="5">
                    {this.state.year}{__('年')}  {this.state.month + 1}{__('月')}
                  </th>
                  <th>
                    <i className="iconfont arrow" onClick={this.state.allowForward ? this._onForward : null}>
                      &#xe62e;
                    </i>
                  </th>
                </tr>
                <tr>
                  <th>{__('日')}</th>
                  <th>{__('一')}</th>
                  <th>{__('二')}</th>
                  <th>{__('三')}</th>
                  <th>{__('四')}</th>
                  <th>{__('五')}</th>
                  <th>{__('六')}</th>
                </tr>
              </thead>
              <tbody>
                {
                  this.state.matrix.map(function(week, n){
                    return (
                      <tr key={n}>
                        {
                          week.map(function(dayObj){
                            if(this._isDateDisabled(dayObj.value) || dayObj.month !== this.state.month){
                              return (
                                <td className="disabled" key={dayObj.value}>
                                  {dayObj.label}
                                </td>
                              )
                            }else{
                              return (
                                <td onClick={this._selectDay.bind(this, dayObj.value)} className={cx({
                                  active: dayObj.date === this.state.date
                                })}  key={dayObj.value}>
                                  {dayObj.label}
                                </td>
                              )
                            }
                          }, this)
                        }
                      </tr>
                    )
                  }, this)
                }
              </tbody>
            </table>
          </div>
        </div>
        {
          this.props.withTime && (
            <div className="timepicker">
              <div className='print-time'>
                <span className="label">{this.props.type === 'start' ? __('起始') : __('结束')}{__('时间')}</span>
                {moment(this.state.value).format('YYYY-MM-DD HH:mm')}
              </div>
              <div className="time-item">
                <span className="label">{__('小时')}</span>
                <div className="hour">
                  <Slider
                    ref="hour"
                    value={this.state.hour}
                    min={0}
                    minValue={moment(this.props.minDate).isSame(moment(this.state.value), 'day') ? moment(this.props.minDate).hour() : 0}
                    max={23}
                    maxValue={moment(this.props.maxDate).isSame(moment(this.state.value), 'day') ? moment(this.props.maxDate).hour() : 23}
                    onChange={(v) => this._selectHour(v)}
                    />
                </div>
              </div>
              <div className="time-item">
                <span className="label">{__('分钟')}</span>
                <div className="minute">
                  <Slider
                    ref="minute"
                    value={this.state.minute}
                    min={0}
                    minValue={moment(this.props.minDate).isSame(moment(this.state.value), 'day') && moment(this.props.minDate).isSame(moment(this.state.value), 'hour') ? moment(this.props.minDate).minute() : 0}
                    max={59}
                    maxValue={moment(this.props.maxDate).isSame(moment(this.state.value), 'day') && moment(this.props.maxDate).isSame(moment(this.state.value), 'hour') ? moment(this.props.maxDate).minute() : 59}
                    onChange={(v) => this._selectMinute(v)}
                    />
                </div>
              </div>
            </div>
          )
        }
      </div>
    )
  }
}
