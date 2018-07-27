import '../styles/components/table.css'
import '../styles/components/pagination.css'
import React, { Component } from 'react'
import _ from 'lodash'
import cx from 'classnames'
import {Scrollbars} from 'react-custom-scrollbars'
import { Store } from '../utils/fluxkit'
import format from '../utils/format'
import FluxStoreGroup from 'flux/lib/FluxStoreGroup'
import Loading from './Loading'
import NoData from './NoData'

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
  width: null,
  sortable: true,
  sortfetch: true,
  template: null,
  format: (v) => v,
  render: (fmtVal, rowData, rowInd, colInd, rows) => fmtVal
}

export default class PaginationTable extends Component {
  static defaultProps = {
    columns: [],
    viewOptions: {
      helpers: {
        format: format
      }
    },
    showCols: true,
    fetch: () => Promise.resolve([]),
    paramStores: [],
    defaultExtParams: {
      sortKey: '',
      sortScend: 1,
      currentpage: 1,
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
    mergeCol: null,
    disableHover: false
  }
  constructor(props, context){
    super(props, context)
    this.state = {
      selectedRows: [],
      data: null,
      pending: false,
      error: null,
      params: null,
      pagination: {
        total_size: 0,
        limit: 10,
        currentpage: 1,
        total: 0
      }
    }
    const defaultExtParams = Object.assign({}, PaginationTable.defaultProps.defaultExtParams, props.defaultExtParams)
    this.__sortParams = {
      sortKey: defaultExtParams.sortKey,
      sortScend: defaultExtParams.sortScend
    }
    this.__paginationParams = {
      currentpage: defaultExtParams.currentpage,
      limit: defaultExtParams.limit
    }
  }
  handleSort(key){
    const sortScend = this.__sortParams.sortKey === key ? -1 * this.__sortParams.sortScend : this.__sortParams.sortScend
    this.__sortParams.sortKey = key
    this.__sortParams.sortScend = sortScend
    if(this.props.sortfetch){
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
      this.__fetch()
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
  __fetch(){
    if(this.__promise && this.__promise.abort){
      this.__promise.abort()
    }
    const otherExtParams = Object.assign({}, PaginationTable.defaultProps.otherExtParams, this.props.otherExtParams)
    let params = this.props.mapToParams.apply(null, this.props.paramStores.map((store) => {
      if(Store.prototype.isPrototypeOf(store)){
        return store.getState()
      }else{
        return store
      }
    }).concat([ otherExtParams ]).concat([ this.__sortParams, this.__paginationParams ]))

    params = Object.assign({}, params, {
      offset: params.limit * (params.currentpage - 1 < 0 ? 0 : params.currentpage - 1)
    })
    this.setState({
      pending: true,
      error: null,
      params: params
    }, () => {
      const promise = this.__promise = this.props.fetch(params)
      this.props.onProcess(params)
      this.__promise.then((res) => {
        if(promise === this.__promise){
          this.__promise = null
          const currentData = this.props.mapToData(res.result, params)
          this.setState({
            pending: false,
            error: null,
            data: currentData,
            pagination: res
          }, () => {
            this.__paginationParams.currentpage = res.currentpage
            this.__paginationParams.limit = res.limit
            this.props.onFulfilled(res)
          })
        }
      }, (error) => {
        if(promise === this.__promise){
          this.__promise = null
          this.setState({
            pending: false,
            data: null,
            error: error
          }, () => {
            this.props.onRejected(error)
          })
        }
      })
    })
  }
  renderHeader(){
    return (
      <div className="table-title">
        <table className="table table-fixed">
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
          <thead>
            <tr>
            {
              this.props.columns.map((col, colInd) => {
                return (
                  <th
                    key={col.key}
                    className={cx({
                      'sortable': col.sortable
                    })}
                    onClick={
                      col.sortable ? this.handleSort.bind(this, col.key) : null
                    }>
                    {_.isFunction(col.title) ? (
                        <span className="col-title">{col.title()}</span>
                      ) : (
                        <span className="col-title">{col.title}</span>
                      )
                    }
                    {
                      col.sortable ? (
                        <span key={`${col.key}down`} className={cx({
                          'sort-arrow': true,
                          'hidden': col.key !== this.__sortParams.sortKey,
                          'asc': this.__sortParams.sortScend === 1,
                          'desc': this.__sortParams.sortScend === -1
                        })}></span>
                      ) : null
                    }
                  </th>
                )
              })
            }
            </tr>
          </thead>
        </table>
      </div>
    )
  }
  // 跳转到某页
  gotoPage(currentpage, total) {
    if(currentpage > 0 && currentpage <= total){
      this.__paginationParams.currentpage = currentpage
      this.__fetch()
    }
  }
  // 渲染分页
  renderPagination(){
    return (
      <div className="paginationCenter">
        <div className="pagination">
          <ul>
            <li><a onClick={()=>this.gotoPage(1, this.state.pagination.total)}>{__('首页')}</a></li>
            <li><a onClick={()=>this.gotoPage(this.state.pagination.currentpage - 1, this.state.pagination.total)}>{__('上一页')}</a></li>
              {
                (() => {
                  const arr = [];
                  const rightReducer = this.state.pagination.total - this.state.pagination.currentpage;
                  let count = 0;
                  const left = this.state.pagination.currentpage - 5 - ( rightReducer < 4 ? (4 - rightReducer) : 0)
                  for(let i = this.state.pagination.currentpage - 5 < 1 ? 1 : (left < 1 ? 1 : left)  ; i <= this.state.pagination.total; i += 1){
                    if(count < 10){
                      arr.push(<li key={`page-${i}`} className={i === this.state.pagination.currentpage ? 'active' : ''}><a onClick={()=>this.gotoPage(i, this.state.pagination.total)}>{i}</a></li>);
                      count += 1
                    }else{
                      break;
                    }
                  }
                  return arr;
                })()
              }
            <li><a onClick={()=>this.gotoPage(this.state.pagination.currentpage + 1, this.state.pagination.total)}>{__('下一页')}</a></li>
            <li><a onClick={()=>this.gotoPage(this.state.pagination.total, this.state.pagination.total)}>{__('尾页')}</a></li>
            <li><span>{__('总共')}{this.state.pagination.total}{__('页')}/{this.state.pagination.total_size}{__('条')}</span></li>
          </ul>
        </div>
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
            return this.renderCell(col, row, rowInd, colInd, rows)
          })
        }
      </tr>
    ) : null
  }
  renderCell(colSetting, rowData, rowInd, colInd, rows){
    //合并单元格算法-----------------------
    const needMerge = (this.props.mergeCol === colInd)
    let needNull = false
    let rowSpan = 0
    if(needMerge){
      const __values = rows.map(row => {
        return row[colSetting.key]
      });
      needNull = rowInd > 0 && __values[rowInd - 1] === __values[rowInd]
      if(!needNull){
        __values.splice(0, rowInd)
        __values.forEach((v, index) => {
          if(index === rowSpan && v === __values[0])            {
            rowSpan += 1
          }
        })
      }
    }
    //合并单元格算法-----------------------
    if(!needNull){
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
          <td key={colSetting.key}  className={cx({'td-borderline': this.props.disableHover})} rowSpan={rowSpan}>
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
          </td>
        )
      }else if(colSetting.render){
        return (
          <td key={colSetting.key} className={cx({'td-borderline': this.props.disableHover})} rowSpan={rowSpan==0?1:rowSpan}>
            {colSetting.render(fmtVal, rowData, rowInd, colInd, rows, this)}
          </td>
        )
      }
      return <td key={colSetting.key} className={cx({'td-borderline': this.props.disableHover})} rowSpan={rowSpan}>{fmtVal}</td>
    }else{
      return null
    }
  }
  render(){
    return (
      <div className="table-root flex-col-1 fullpanel">
        {this.props.showCols ? this.renderHeader() : null}
        <Scrollbars>
          <div className="table-body">
            <table className={cx("table table-fixed", {'table-hover table-striped': !this.props.disableHover})}>
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
              <tbody>
              {
                this.state.data ? (
                  this.state.data.length > 0 ? (
                    this.renderBody()
                  ) : this.renderNoData()
                ) : null
              }
              {
                this.state.error ? this.renderError() : null
              }
              </tbody>
            </table>
            <table>
              <tbody>
                {
                  this.state.pending ? this.renderLoading() : null
                }
              </tbody>
            </table>
          </div>
        </Scrollbars>
        <div>{this.renderPagination()}</div>
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
          Error!!!
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
          this.__paginationParams.currentpage = 1
          this.__fetch()
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
