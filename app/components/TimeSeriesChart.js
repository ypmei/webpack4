import React, { Component } from 'react'
import Highcharts from 'local-highcharts-baseline'
import _ from 'lodash'
import format from '../utils/format'
import moment from 'moment'
import $ from 'jquery'

moment.locale('zh-cn');

var pattern = 'MM/DD HH:mm';
var tmplPrefix = '<span style="color:<%=serie.color%>"><%=serie.name%></span>'
          + '<br/>'
          + '<span>'
  , pieTmplPrefix = '<span style="color:<%=point.color%>"><%=point.name%></span>'
            + '<br/>'
            + '<span>'
  , tmplSuffix = '</span><br/>';


Highcharts.setOptions({
  global: {
    useUTC: false
  },
  // colors:['#56bc76','#eac85e','#32adfa','#c596fa','#70e0e0','#a1e55c','#f2a38d','#ffe9a6','#7aa9ff','#e5603b'],
  colors: [ '#0873b9', '#f78e2f', '#11c583', '#ffcf68', '#7964ad', '#2ea8ed', '#b07964', '#0a4e78', '#6ddbe1', '#db4c58' ],
  lang: {
    weekdays: [
      __('星期日'),
      __('星期一'),
      __('星期二'),
      __('星期三'),
      __('星期四'),
      __('星期五'),
      __('星期六')
    ],
    shortMonths: [ '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12' ],
    months: [
      __('一月'),
      __('二月'),
      __('三月'),
      __('四月'),
      __('五月'),
      __('六月'),
      __('七月'),
      __('八月'),
      __('九月'),
      __('十月'),
      __('十一月'),
      __('十二月')
    ],
    noData: __('暂无数据')
  }
})
export default class TimeSeriesChart extends Component {
  static defaultProps = {
    options: {},
    data: [],
    yAxis: [ {} ],
    // height: 180,
    tooltipTemplate: '',
    title: '',
    plotOptions: {},
    tooltip: function(tooltip){
      var tmpl, durationText
      if(this.point && this.point.customData){
        durationText = this.point.customData.startTime ? `从${moment(this.point.customData.startTime).format(pattern)}
          到${moment(this.point.customData.endTime).format(pattern)}
          的${moment.duration(this.point.customData.endTime - this.point.customData.startTime).humanize()}内${tmplSuffix}` : ''
        tmpl = `${tooltip.chart.options.chart.type === 'pie' ? pieTmplPrefix : (tooltip.chart.options.tooltip.noName ? "" : tmplPrefix)}
          ${durationText}
          ${_.map([ this.point.customData.y ].concat(
              _.chain(this.point.customData).omit('startTime', 'endTime', 'y').values().value()
            ), function(p){
             return `<span>${p.label}：</span><b>${p.fmtVal}</b>`
           }).join('<br />')}`
        return _.template(tmpl)({
          serie: this.series,
          point: this.point
        });
      }
      if(this.points && this.points.length){
        var serieTmpl = _.template('<i class="iconfont  state-downtime" style="color:<%=series.color%>">●</i><%=customData.y.fmtVal%>(<%=series.name%>)<br />');
        tmpl = (
          `从${
         moment(this.points[0].point.customData.startTime).format(pattern)
         }到${  moment(this.points[0].point.customData.endTime).format(pattern)
         }的${  moment.duration(this.points[0].point.customData.endTime - this.points[0].point.customData.startTime).humanize()
         }内`
        + `<br/>${
         _(this.points).map(function(item){ return serieTmpl(item.point) }).join('')}`
        )
        return _.template(tmpl)(this.points[0]);
      }
      return null
    }
  }
  render(){
    return (
      <div ref="root" style={{width: '100%', height: '100%'}}></div>
    )
  }
  componentDidMount(){
    var self = this

    var userDatayAxis = [], useryAxis = [], allyAxis = [];
    if(this.props.data && this.props.data.yAxis){
      userDatayAxis = _.isArray(this.props.data.yAxis) ? this.props.data.yAxis : [ this.props.data.yAxis ]
    }
    if(this.props.yAxis){
      useryAxis = _.isArray(this.props.yAxis) ? this.props.yAxis : [ this.props.yAxis ]
    }
    //规则改为 配置的规则比数据转换的规则优先
    if(useryAxis.length === 1 && _.keys(useryAxis[0]).length === 0){

      allyAxis = userDatayAxis;
    }else{
      allyAxis = useryAxis;

    }

    const pointOptions = {
      cursor: 'pointer',
      allowPointSelect: true,
      point: {
        events: {
          click: function(event){
            self.__pointEvent(event)
          }
        }
      }
    }

    var options = Object.assign({
      chart: Object.assign({}, {
        // spacing:[15,15,15,15],
        spacing: [ 15, 10, 10, 10 ],
        height: this.props.height,
        type: this.props.chartType,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        plotBorderWidth: 0,
        zoomType: 'x',
        events: {},
        style: {
          fontFamily: '"Microsoft Yahei","Open Sans", "Hiragino Sans GB",  sans-serif'
        }
      }, {
        renderTo: this.refs.root
      }, this.props.chart),
      title: Object.assign({}, {
        text: this.props.title || null,
        align: this.props.titleAlign || 'left',
        style: {
          color: '#757575',
          fontSize: '1.4rem',
          fontWeight: 700
        }
      }, this.props.options.title),
      credits: {
        enabled: false,
        text: 'OneAPM',
        href: 'http://www.oneapm.com'
      },
      legend: Object.assign({}, {
        itemStyle: {
          color: '#666666',
          fontWeight: 'normal',
          fontSize: 12,
          width: 150,
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "nowrap"
        },
        itemHoverStyle: {color: '#666666', fontWeight: 'bold'},
        itemHiddenStyle: {color: 'rgba(102,102,102,0.5)'},
        symbolHeight: 8,
        symbolWidth: 12,
        fontFamily: ' "Microsoft Yahei","Open Sans", "Hiragino Sans GB",sans-serif',
        borderWidth: 1,
        borderColor: '#EDEDED',
        align: 'right',
        verticalAlign: 'top'
      }, this.props.options.legend),
      loading: {},
      xAxis: Object.assign({}, {
        type: 'datetime',
        minPadding: 0,
        maxPadding: 0,
        minTickInterval: 60 * 1000,
        labels: {
          style: {
            color: '#757575',
            fontWeight: '300',
            fontSize: 11,
            whiteSpace: 'nowrap',
            fontFamily: '"Microsoft Yahei","Open Sans", sans-serif'
          }
        },
        dateTimeLabelFormats: {
          millisecond: '%H:%M:%S.%L',
          second: '%H:%M:%S',
          minute: '%H:%M',
          hour: '%H:%M',
          day: '%b/%e',
          week: '%b/%e',
          month: '%Y/%b',
          year: '%Y'
        },
        events: {
          setExtremes: function(event) {
            if(!event.min || !event.max) {
              if(self.__chart.resetZoomButton) {
                self.__chart.resetZoomButton.hide()
              }
            }
          }
        }
      }, this.props.xAxis, this.props.options.xAxis),
      yAxis: allyAxis.map((yAxis, key) => {
        return Object.assign({}, {
          title: {
            text: null
          },
          min: 0,
          labels: {
            align: 'left',
            x: 0,
            y: -2,
            style: {
              color: '#757575',
              whiteSpace: 'nowrap',
              fontSize: 11,
              fontWeight: '400',
              fontFamily: '"Microsoft Yahei","Open Sans", sans-serif'
            }
          },
          tickColor: "#888888",
          gridLineColor: '#EAEAEA',
          offset: 0,
          minPadding: 0,
          tickPosition: 'outside'
        }, yAxis, this.props.options.yAxis)
      }),
      series: this.props.data.series,
      baseLine: this.props.baseLine,
      plotOptions: Object.assign({}, {
        pie: {
          animation: false,
          dataLabels: {
            color: '#666666',
            shadow: false,
            fontWeight: 'normal',
            padding: 0,
            connectorPadding: 0,
            style: {
              width: 40
            }
          },
          stickyTracking: true
        },
        spline: Object.assign({}, {
          lineWidth: 2.5,
          marker: {
            radius: 1,
            lineWidth: 1
          }
        }, pointOptions),
        line: Object.assign({}, {
          lineWidth: 2.5,
          marker: {
            radius: 2.5,
            lineWidth: 1,
            lineColor: 'transparent'
          }
        }, pointOptions),
        area: Object.assign({}, {
          lineColor: 'rgba(0,0,0,0.1)',
          connectEnds: false,
          fillOpacity: 0.9,
          lineWidth: 0.5,
          stacking: 'normal',
          marker: {
            radius: 2,
            lineWidth: 1,
            symbol: "circle"
          }
        }, pointOptions),
        series: {
          dashStyle: "solid",
          pointInterval: 60000,
          borderColor: '#fff'
        },
        bar: {
          stacking: 'percent',
          pointInterval: 1
        },
        columnrange: {
          pointInterval: 1
        },
        column: {
          pointWidth: this.props.pointWidth || 20,
          stacking: this.props.stacking
        }
      }, this.props.plotOptions),
      tooltip: Object.assign({}, {
        crosshairs: [ {
          width: 1,
          color: 'rgba(0,0,0,0.1)',
          zIndex: 3
        }, false ],
        style: {color: '#666666', fontSize: 12},
        borderWidth: 1,
        shadow: false,
        backgroundColor: 'rgba(248,248,248,0.6)',
        borderRadius: 5,
        zIndex: 8,
        formatter: this.props.tooltip
        // formatter:((tmpl) => function(tooltip){return tmpl.call(this, {format,tooltip})})(_.template(this.props.tooltipTemplate))
      }, this.props.tooltip, this.props.options.tooltip),
      noData: {
        style: {
          fontSize: '12px',
          fontWeight: 'normal',
          color: '#999999'
        }
      }
    })
    this.__chart = new Highcharts.Chart(options)


    window.addEventListener('reflow', this.__reflowEventHandler__, false)

    window.addEventListener('resize', this.__resizeEventHandler__, false)
  }
  __reflowEventHandler() {
    if(this.__chart) {
      this.__chart.reflow()
    }
  }
  __reflowEventHandler__ = this.__reflowEventHandler.bind(this)
  resizeChart(){
    const div = this.refs.root
    const h = $(div).height()
    const w = $(div).width()
    if(this && this.__chart)      {
      this.__chart.setSize(w, h, true)
    }
  }
  __resizeEventHandler = _.debounce(this.resizeChart, 50)
  __resizeEventHandler__ = this.__resizeEventHandler.bind(this)
  componentWillReceiveProps(nextProps){
    var oldSeriesNames = _.map(this.__chart.series, 'name')
    var newSeriesNames = _.map(nextProps.data.series, 'name')
    this.__chart.series.filter((s) => {
      return _.includes(newSeriesNames, s.name) === false
    }).forEach((s) => {
      s.remove();
    });
    var partNew = _.partition(nextProps.data.series, (s) => {
      return _.includes(oldSeriesNames, s.name)
    });
    var existedSeries = partNew[0]
      , newSeries = partNew[1]

    existedSeries.forEach((serie) => {
      var oldSerie = _.find(this.__chart.series, {'name': serie.name})
      oldSerie.update(serie, false);
    });
    newSeries.forEach((s) => {
      this.__chart.addSeries(s, false, false);
    });
    this.__chart.redraw();
  }
  componentWillUnmount(){
    this.__chart.destroy()
    this.__chart = null;

    window.removeEventListener('reflow', this.__reflowEventHandler__)
    window.removeEventListener('resize', this.__resizeEventHandler__)
  }
}
