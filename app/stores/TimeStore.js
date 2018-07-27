import { Store } from '../utils/fluxkit'
import $ from 'jquery'
import 'jquery.cookie'

export const cookieKey = {
  spanTime: 'ItsiSpanTime',
  endTime: 'ItsiEndTime',
  defaultSpanTime: 30 * 60 * 1000
}

export default class TimeStore extends Store {
  getInitialState(props){
    const beginInCookie = $.cookie(cookieKey.spanTime, Number)
    , endInCookie = $.cookie(cookieKey.endTime, Number)
    return {
      spanTime: beginInCookie || cookieKey.defaultSpanTime,
      endTime: endInCookie || null
    }
  }
  $setTime(state, data){
    $.cookie(cookieKey.spanTime, data.spanTime)
    $.cookie(cookieKey.endTime, data.endTime)

    return Object.assign({}, data)
  }
}
