import '../styles/components/switchbutton.css'
import React, { Component } from 'react';
import cx from 'classnames';
import PropTypes from 'prop-types'

export default class SwitchButton extends Component {
  static defaultProps = {
    onChange: () => {},
    checked: false,
    disabled: false
  }

  static propTypes = {
    onChange: PropTypes.func.isRequired,
    checked: PropTypes.bool,
    disabled: PropTypes.bool
  };

  constructor(props) {
    super(props);

    this.state = {
      isChecked: props.checked || false
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      isChecked: nextProps.checked
    });
  }

  toggle(event) {
    if (this.props.disabled) return ;

    this.setState({
      isChecked: ! this.state.isChecked
    });

    this.props.onChange(this.state.isChecked, event);
  }

  render() {
    return (
      <div className={cx('trigger', {
        'checked': this.state.isChecked,
        'disabled': this.props.disabled
      })}>
        <label>
          <span className="trigger-circle">
            <input
              type="checkbox"
              checked={ this.state.isChecked }
              onChange={ this.toggle.bind(this) }
            />
          </span>
        </label>
      </div>
    );
  }
}
