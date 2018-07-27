import React, { Component } from 'react'
import _ from 'lodash'
import cx from 'classnames';

export default class Card extends Component {
  static defaultProps = {
    className: null,
    subClassName: null,
    extra: null,
    title: null,
    tip: null,
    content: null
  }
  render() {
    return (
      <div className={ cx('panel', this.props.className) }>
        {this.props.title ? (
          <div className="panel-heading">
            <div className="pull-right">
              {
                this.props.extra
              }
            </div>
            <h5 className="panel-title">{this.props.title}
              {
                this.props.tip ? (
                  <span className="icon tip-icon" dangerouslySetInnerHTML={{__html: '&#xe7d6;'}} data-tip={this.props.tip}></span>
                ) : null
              }
            </h5>
          </div>
        ) : null}
        <div ref="content" className={ cx('panel-body', 'flex-col-1', this.props.subClassName) }>
          {this.props.children}
        </div>
      </div>
    )
  }
}
