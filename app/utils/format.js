import moment from 'moment'
import _ from 'lodash'

const format = {
  timeToISO: function(v) {
    return moment(v).toISOString()
  },
  timeToStamp: function(v) {
    return moment(v).valueOf()
  },
  stampToTime: function(value){
    var v = value || 0
    var millios = (v.toString().length > 10 ? 1 : 1000);
    return moment(v * millios).format('YYYY-MM-DD HH:mm:ss')
  },
  withStampToTime: function(value){
    var v = value || 0
    var millios = (v.toString().length > 10 ? 1 : 1000);
    return moment(v * millios).format('MM/DD HH:mm')
  },
  rate: function(value){
    var v = parseFloat(value)
    if(isNaN(v) || !v){
      return '0.00%';
    }
    return `${(v * 100).toFixed(2)}%`;
  },
  numberic: function(v){
    var med,
      tmp_value,
      out_value = parseFloat(v);
    if (isNaN(out_value) || out_value === 0) {
      return "0.00";
    }
    med = 0;
    do{
      med += 2;
      tmp_value = out_value.toFixed(med);
    }while(parseFloat(tmp_value) === 0 && med < 6);
    out_value = tmp_value
    return out_value.toString().replace(/(\d{1,3})(?=(\d{3})+(?:\.))/g, "$1,");
  },
  integer: function(v){
    var out_value = parseInt(v);
    if (isNaN(out_value)) {
      return "0";
    }
    return out_value.toString().replace(/(\d{1,3})(?=(\d{3})+(?:$|\.))/g, "$1,");
  },
  sDuration: function(v, d){
    var date = d || (new Date()).getTime();
    return moment.duration(date - v).humanize()
  },
  duration: function(v, d){
    var date = d || (new Date()).getTime();
    return moment.duration(date - v).humanize() + __('之前')
  },
  qDuration: function(v, d){
    var date = d || (new Date()).getTime();
    return Math.ceil(moment.duration(date - v).asSeconds()) + __('秒之前')
  },
  dataSize: function(v){
    var str = v.toString();
    var bits;
    if(str.search(/[e]/) !== -1){
      bits = parseInt(str.split('+' || '-').pop()) + str.split('e').shift().replace(/\.\d+/, '').length;
    }else{
      bits = (v).toString().replace(/\.\d+/, '').length;
    }
    var units = [ 'B', 'KB', 'MB', 'GB', 'TB' ];
    var i;
    for(i = units.length - 1;i + 1;i -= 1){
      if(bits > i * 3){
        return `${format.numberic(v / Math.pow(10, i * 3))  } ${units[i]}`
      }
    }
    return `${format.numberic(v)  } b`
  },
  kSize: function(v){
    var str = v.toString();
    var bits;
    if(str.search(/[e]/) !== -1){
      bits = parseInt(str.split('+' || '-').pop()) + str.split('e').shift().replace(/\.\d+/, '').length;
    }else{
      bits = (v).toString().replace(/\.\d+/, '').length;
    }
    var units = [ '', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y' ];
    var i;
    for(i = units.length - 1;i + 1;i -= 1){
      if(bits > i * 3){
        return `${format.numberic(v / Math.pow(10, i * 3))  } ${units[i]}`
      }
    }
    return `${format.numberic(v)  } b`
  },
  numSecond: function(v){
    if(v >= 1){
      return `${format.numberic(v) } s`
    }else{
      return `${format.numberic(v * 1000)} ms`
    }
  },
  numMinSecond: function(v){
    if(v >= 1000){
      return `${format.numberic(v / 1000) } s`
    }else{
      return `${format.numberic(v)} ms`
    }
  },
  numSecondOnlyNoUnit: function(v){
    return format.numberic(v * 1000)
  },
  round: function(item) {
    if (isNaN(item)) {
      return 0;
    }else{
      return Math.round(item)
    }
  },
  shortTitle: function(title, num) {
    if(title === undefined || title === null || num < 0){
      return title
    }

    if(title.length > num){
      return `${title .substring(0, num)}...`;
    }else{
      return title;
    }
  },
  numSecs: function(v) {
    //Math.round
    if (v < 1000) {
      return `${format.numberic(v)} ms`

    } else if (v >= 1000 && v < 1000 * 60) {
      return `${format.numberic(v / 1000)} s`
    } else {
      return `${format.numberic(v / (1000 * 60))} min`
    }
  },
  //时间秒数格式化
  secondFormat: function(s) {
    var t;
    if(s > -1){
      var hour = Math.floor(s / 3600);
      var min = Math.floor(s / 60) % 60;
      var sec = s % 60;
      var day = parseInt(hour / 24);
      if (day > 0) {
        hour = hour - 24 * day;
        t = `${day  }day ${  hour  }:`;
      }      else { t = `${hour < 10 ? `0${  hour}` : hour  }:`; }
      if(min < 10){ t += "0"; }
      t += `${min  }:`;
      if(sec < 10){ t += "0"; }
      t += sec;
    }
    return t;
  },
  clockForDay: function(h, m, s, whic, choice) {
    let hour = h
    , minute = m
    , second = s
    if(whic === 'hour'){
      if(choice === 2){
        hour = hour - 1;
        if(hour < 0) { hour = 23; }
      }else{
        hour = hour + 1;
        if(hour > 23) { hour = 0; }
      }
    }else if(whic === 'minute'){
      if(choice === 2){
        minute = minute - 1;
        if(minute < 0){
          minute = 59
        }
      }else{
        minute = minute + 1;
        if(minute > 59){
          minute = 0
        }
      }
    }else {
      if(choice === 2){
        second = second - 1;
        if(second < 0) { second = 59; }
      }else{
        second = second + 1;
        if(second > 59){
          second = 0
        }
      }
    }
    return {
      hour,
      minute,
      second
    }
  }
}
export default format
