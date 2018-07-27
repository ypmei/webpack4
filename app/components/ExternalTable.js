import '../styles/components/table.css'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { Scrollbars } from 'react-custom-scrollbars'
import _ from 'lodash'
import cx from 'classnames'
import { Store } from '../utils/fluxkit'
import format from '../utils/format'
import FluxStoreGroup from 'flux/lib/FluxStoreGroup'
import Loading from '../components/Loading'
import NoData from '../components/NoData'

const normalizeWidth = (width) => {
  if(width === undefined){
    return 'auto'
  }
  if(typeof width === 'number'){
    return `${width}px`
  }
  return width
}
const defaultColSetting = {
  key: null,
  title: null,
  tip: null,
  width: null,
  sortable: true,
  sortfetch: true,
  template: null,
  format: (v) => v,
  render: (fmtVal, rowData, rowInd, colInd, rows) => fmtVal
}

export default class ExternalTable extends Component {
  static defaultProps = {
    columns: [],
    viewOptions: {
      helpers: {
        format: format
      }
    },
    showCols: true,
    showMore: true,
    fetch: () => Promise.resolve([]),
    paramStores: [],
    defaultExtParams: {
      sortKey: '',
      sortScend: 1,
      limit: 10
    },
    otherExtParams: {},
    sortfetch: true,
    mapToParams: (...args) => args.reduce((o, x) => Object.assign(o, x), {}),
    mapToData: (a) => a,
    onFulfilled: () => {},
    onRejected: () => {},
    onProcess: () => {},
    filterFn: (row) => true,
    selectedRows: [],
    className: null
  }
  constructor(props, context){
    super(props, context)
    this.state = {
      selectedRows: this.props.selectedRows || [],
      data: null,
      hasMore: false,
      pending: false,
      error: null,
      params: null,
      overflow: false
    }
    const defaultExtParams = Object.assign({}, ExternalTable.defaultProps.defaultExtParams, props.defaultExtParams)
    this.__sortParams = {
      sortKey: defaultExtParams.sortKey,
      sortScend: defaultExtParams.sortScend
    }
    this.__showMoreParams = {
      offset: 0,
      limit: props.defaultExtParams.limit
    }
  }
  handleSort(key){
    const sortScend = this.__sortParams.sortKey === key ? -1 * this.__sortParams.sortScend : this.__sortParams.sortScend
    this.__sortParams.sortKey = key
    this.__sortParams.sortScend = sortScend
    if(!this.state.hasMore || !this.props.sortfetch){
      if(sortScend > 0){
        this.setState({
          data: _.sortBy(this.state.data, key)
        })
      }else{
        this.setState({
          data: _(this.state.data).sortBy(key).reverse().value()
        })
      }
    }else{
      this.__fetch(true)
    }
  }
  handleRowClick(row){
    const { isSelected } = this.props
    if(isSelected){
      if(this.props.isRadio){
        this.state.selectedRows = [ row ]
      }else{
        if(!_.find(this.state.selectedRows, row)){
          this.state.selectedRows.push(row)
        }else{
          this.state.selectedRows = _.filter(this.state.selectedRows, (r) => {
            return !_.isEqual(r, row)
          })
        }
      }
      this.props.getSelections(this.state.selectedRows)
      this.forceUpdate();
    }
    if(this.props.rowClick){
      this.props.rowClick(row)
    }
  }
  __fetch(reset = true){
    if(this.__promise && this.__promise.abort){
      this.__promise.abort()
    }
    if(reset){
      this.__showMoreParams.offset = 0
    }
    const otherExtParams = Object.assign({}, ExternalTable.defaultProps.otherExtParams, this.props.otherExtParams)
    const params = this.props.mapToParams.apply(null, this.props.paramStores.map((store) => {
      if(Store.prototype.isPrototypeOf(store)){
        return store.getState()
      }else{
        return store
      }
    }).concat([ this.__sortParams, this.__showMoreParams ]).concat([ otherExtParams ]))
    this.setState({
      pending: true,
      data: reset ? null : this.state.data,
      error: null,
      params: params,
      hasMore: false
    }, () => {
      const promise = this.__promise = this.props.fetch(params)
      this.props.onProcess(params)
      this.__promise.then((res) => {
        if(promise === this.__promise){
          this.__promise = null
          const currentData = this.props.mapToData(res, params)
          const nextData = reset ? currentData : this.state.data.concat(currentData)
          this.setState({
            pending: false,
            error: null,
            data: nextData,
            hasMore: currentData.length === params.limit
          }, () => {
            this.__isOverflow()
            this.props.onFulfilled(res)
          })
        }
      }, (error) => {
        if(promise === this.__promise){
          this.__promise = null
          this.setState({
            pending: false,
            data: null,
            error: error,
            hasMore: false
          }, () => {
            this.props.onRejected(error)
          })
        }
      })
    })
  }
  __fetchMore(){
    this.__showMoreParams.offset = this.__showMoreParams.offset + this.__showMoreParams.limit
    this.__fetch(false)
  }
  __isOverflow(){
    const theadWidth = this.refs.thead ? ReactDOM.findDOMNode(this.refs.thead).clientWidth : 0 ;
    const tbodyWidth = this.refs.tbody ? ReactDOM.findDOMNode(this.refs.tbody).clientWidth : 0 ;
    this.setState({
      overflow: (theadWidth - tbodyWidth) > 0
    })
  }
  renderHeader(){
    return (
      <div className="table-header">
        <table className="table table-fixed table-sortable">
          <colgroup>
          {
            this.props.columns.map((col, colInd) => {
              return (
                <col
                  key={col.key}
                  style={{
                    width: normalizeWidth(col.width)
                  }}
                />
              )
            })
          }
          {
            this.state.overflow ? (
              <col
                key={'overflow'}
                style={{
                  width: '17px'
                }}
              />
            ) : null
          }
          </colgroup>
          <thead ref="thead">
            <tr>
            {
              this.props.columns.map((col, colInd) => {
                return (
                  <th
                    key={col.key}
                    onClick={
                      col.sortable ? this.handleSort.bind(this, col.key) : null
                    }>
                    <div className={cx({
                      'sortable': col.sortable || col.sortfetch
                    })}>
                      <span title={col.title} className="col-title">{col.title}</span>
                      {
                        col.tip ? (
                          <span className="iconfont tip-icon" dangerouslySetInnerHTML={{__html: '&#xe7d6;'}} data-tip={col.tip}></span>
                        ) : null
                      }
                      {
                        col.sortable ? (
                          <span key={`${col.key}down`} className={cx({
                            'sort-icon iconfont': true,
                            'sort-icon-hide': col.key !== this.__sortParams.sortKey
                          })} dangerouslySetInnerHTML={{__html: this.__sortParams.sortScend === 1 ? '&#xe656;' : '&#xe676;'}}></span>
                        ) : null
                      }
                    </div>
                  </th>
                )
              })
            }
            {
              this.state.overflow ? (
                <th></th>
              ) : null
            }
            </tr>
          </thead>
        </table>
      </div>
    )
  }
  renderBody(){
    return this.state.data.map((row, rowInd, rows) => {
      return this.renderRow(row, rowInd, rows)
    })
  }
  renderRow(row, rowInd, rows){
    return this.props.filterFn(row) ? (
      <tr key={rowInd} onClick={this.handleRowClick.bind(this, row)} className={_.find(this.state.selectedRows, row) ? 'active' : null}>
        {
          this.props.columns.map((col, colInd) => {
            return (
              <td key={col.key}>
                {
                  this.renderCell(col, row, rowInd, colInd, rows)
                }
              </td>
            )
          })
        }
      </tr>
    ) : null
  }
  renderCell(colSetting, rowData, rowInd, colInd, rows){
    var value = rowData[colSetting['key']]
    var formatFn
    if(colSetting.format){
      if(typeof colSetting.format === 'string'){
        formatFn = this.props.viewOptions.helpers.format[colSetting.format]
      }else{
        formatFn = colSetting.format
      }
    }
    if(!formatFn){
      formatFn = defaultColSetting.format
    }
    var fmtVal = formatFn(value)
    if(colSetting.template){
      return (
        <div dangerouslySetInnerHTML={{
          __html: _.template(colSetting.template)({
            fmtVal: fmtVal,
            rowData: rowData,
            rowInd: rowInd,
            colInd: colInd,
            rows: rows,
            format: this.props.viewOptions.helpers.format
          })
        }} />
      )
    }else if(colSetting.render){
      return (
        colSetting.render(fmtVal, rowData, rowInd, colInd, rows, this)
      )
    }
    return <span title={fmtVal}>{fmtVal}</span>
  }
  render(){
    return (
      <div className={cx('table-root ', {'flex-col-1': this.props.showCols}, this.props.className)}  style={{minHeight: 10}}>
        {this.props.showCols ? this.renderHeader() : null}
        <div className="flex-col-1 relative">
          <div className="table-body flex-col-1 fullpanel">
              <Scrollbars>
                <table className="table table-fixed table-striped table-hover">
                  <colgroup>
                  {
                    this.props.columns.map((col, colInd) => {
                      return (
                        <col
                          key={col.key}
                          style={{
                            width: normalizeWidth(col.width)
                          }}
                        />
                      )
                    })
                  }
                  </colgroup>
                  <tbody ref="tbody">
                  {
                    this.state.data ? (
                      this.state.data.filter((row) => this.props.filterFn(row)).length > 0 ? (
                        this.renderBody()
                      ) : this.renderNoData()
                    ) : null
                  }
                  {
                    this.state.error ? this.renderError() : null
                  }
                  {
                    this.state.pending ? this.renderLoading() : null
                  }
                  </tbody>
                </table>
                {
                  this.state.hasMore && this.state.data.filter((row) => this.props.filterFn(row)).length > 0 ? this.renderShowMore() : null
                }
              </Scrollbars>
          </div>
        </div>
      </div>
    )
  }
  renderLoading(){
    return (
      <tr>
        <td colSpan={this.props.columns.length}>
          <Loading />
        </td>
      </tr>
    )
  }
  renderError(){
    return (
      <tr>
        <td colSpan={this.props.columns.length}>
          {__('服务器异常，请稍后重试！')}
        </td>
      </tr>
    )
  }
  renderNoData(){
    return (
      <tr>
        <td colSpan={this.props.columns.length}>
          <NoData />
        </td>
      </tr>
    )
  }
  renderShowMore(){
    return this.props.showMore ? (
      <div className="panel-footer text-center">
        <a
          href="javascript:;"
          className="btn"
          onClick={this.__fetchMore.bind(this)}>
          {__('+ 显示更多')}

        </a>
      </div>
    ) : null
  }
  componentDidMount(){
    this.__fetch()
    const stores = this.props.paramStores.filter((store) => {
      return Store.prototype.isPrototypeOf(store)
    })
    var changed = false
    const setChanged = () => { changed = true }
    this.__storeSubscriptions = stores.map(
      store => store.addListener(setChanged)
    )
    if(stores.length){
      const __fetch__ = () => {
        if(changed){
          this.__fetch(true)
        }
        changed = false
      }
      this.__storeGroup = new FluxStoreGroup(stores, _.debounce(__fetch__, 100))
    }
  }
  componentWillUnmount(){
    if(this.__promise && this.__promise.abort){
      if(this.__promise.abort){
        this.__promise.abort()
      }
      this.__promise = null
    }
    if(this.__storeGroup){
      this.__storeGroup.release()
    }
    this.__storeSubscriptions.forEach((subscription) => {
      subscription.remove()
    })
  }
}
