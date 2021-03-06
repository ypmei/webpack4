import React from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import $ from 'jquery'
import cx from 'classnames'
import PropTypes from 'prop-types'
var sizerStyle = { position: 'absolute', visibility: 'hidden', height: 0, width: 0, overflow: 'scroll', whiteSpace: 'nowrap' };

class Input extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      inputWidth: props.minWidth
    }
  }
  componentDidMount() {
    this.copyInputStyles();
    this.updateInputWidth();
  }
  componentDidUpdate() {
    this.updateInputWidth();
  }
  copyInputStyles() {
    if (!window.getComputedStyle) {
      return;
    }
    var inputStyle = window.getComputedStyle(ReactDOM.findDOMNode(this.refs.input));
    var widthNode = ReactDOM.findDOMNode(this.refs.sizer);
    widthNode.style.fontSize = inputStyle.fontSize;
    widthNode.style.fontFamily = inputStyle.fontFamily;
    if (this.props.placeholder) {
      var placeholderNode = ReactDOM.findDOMNode(this.refs.placeholderSizer);
      placeholderNode.style.fontSize = inputStyle.fontSize;
      placeholderNode.style.fontFamily = inputStyle.fontFamily;
    }
  }
  updateInputWidth() {
    var $sizer = this.refs.sizer
    if (typeof $sizer.scrollWidth === 'undefined') {
      return;
    }
    var newInputWidth;
    if (this.props.placeholder) {
      newInputWidth = Math.max($sizer.scrollWidth, this.refs.placeholderSizer.scrollWidth) + 2;
    } else {
      newInputWidth = $sizer.scrollWidth + 2;
    }
    if (newInputWidth < this.props.minWidth) {
      newInputWidth = this.props.minWidth;
    }
    if (newInputWidth !== this.state.inputWidth) {
      this.setState({
        inputWidth: newInputWidth
      });
    }
  }
  focus() {
    this.refs.input.focus();
  }
  select() {
    this.refs.input.select();
  }
  render() {
    var nbspValue = (this.props.value || '').replace(/ /g, '&nbsp;');
    var wrapperStyle = this.props.style || {};
    wrapperStyle.display = 'inline-block';
    var inputStyle = this.props.inputStyle || {};
    inputStyle.width = this.state.inputWidth;
    var placeholder = this.props.placeholder ? <div ref="placeholderSizer" style={sizerStyle}>{this.props.placeholder}</div> : null;
    const { minWidth, ...rest} = this.props
    return (
      <div className={this.props.className} style={wrapperStyle}>
        <input {...rest} ref="input" className={this.props.inputClassName} style={inputStyle} />
        <div ref="sizer" style={sizerStyle} dangerouslySetInnerHTML={{ __html: nbspValue }} />
        {placeholder}
      </div>
    );
  }
}
Input.propTypes = {
  value: PropTypes.any,                 // field value
  defaultValue: PropTypes.any,          // default field value
  onChange: PropTypes.func,             // onChange handler: function(newValue) {}
  style: PropTypes.object,              // css styles for the outer element
  className: PropTypes.string,          // className for the outer element
  minWidth: PropTypes.oneOfType([       // minimum width for input element
    PropTypes.number,
    PropTypes.string
  ]),
  inputStyle: PropTypes.object,         // css styles for the input element
  inputClassName: PropTypes.string      // className for the input element
}
Input.defaultProps = {
  minWidth: 1
}
class Option extends React.Component{
  blockEvent(ev) {
    ev.stopPropagation();
  }
  render(){
    return (
      <div className="Select-item">
        <span className="Select-item-icon"
          onMouseDown={this.blockEvent}
          onClick={this.props.onRemove}
          onTouchEnd={this.props.onRemove}>&times;</span>
        <span className="Select-item-label">{this.props.label}</span>
      </div>
    );
  }
}
Option.propTypes = {
  label: PropTypes.string.isRequired
}
export default class Select extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      options: props.options,
      isFocused: false,
      isOpen: false,
      isLoading: false
    }
    this._closeMenu = this._closeMenu.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleInputBlur = this.handleInputBlur.bind(this)
    this.handleInputFocus = this.handleInputFocus.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.clearValue = this.clearValue.bind(this)
  }
  _closeMenu(e){
    var el = e.target
      , container = this.refs.wrapper
    if(this.state.isOpen && !$.contains(container, el)){
      this.setState({
        isOpen: false
      })
    }
  }
  componentWillMount(){
    this._optionsCache = {};
    this._optionsFilterString = '';
    this.setState(this.getStateFromValue(this.props.value));
  }
  componentDidMount(){
    $('body').on('click', this._closeMenu)
  }
  componentWillReceiveProps(newProps){
    if (JSON.stringify(newProps.options) !== JSON.stringify(this.props.options)) {
      this.setState({
        options: newProps.options,
        filteredOptions: this.filterOptions(newProps.options)
      });
    }
    if (newProps.value !== this.state.value) {
      this.setState(this.getStateFromValue(newProps.value, newProps.options));
    }
  }
  componentDidUpdate(){
    var self = this;
    if (!this.props.disabled && this._focusAfterUpdate) {
      clearTimeout(this._blurTimeout);

      this._focusTimeout = setTimeout(function() {
        self.getInputNode().focus();
        self._focusAfterUpdate = false;
      }, 50);
    }

    if (this._focusedOptionReveal) {
      if (this.refs.focused && this.refs.menu) {
        var focusedDOM = ReactDOM.findDOMNode(this.refs.focused);
        var menuDOM = ReactDOM.findDOMNode(this.refs.menu);
        var focusedRect = focusedDOM.getBoundingClientRect();
        var menuRect = menuDOM.getBoundingClientRect();

        if (focusedRect.bottom > menuRect.bottom ||
          focusedRect.top < menuRect.top) {
          menuDOM.scrollTop = (focusedDOM.offsetTop + focusedDOM.clientHeight - menuDOM.offsetHeight);
        }
      }

      this._focusedOptionReveal = false;
    }
  }
  componentWillUnmount() {
    clearTimeout(this._blurTimeout);
    clearTimeout(this._focusTimeout);
    $('body').off('click', this._closeMenu)
  }
  focus() {
    this.getInputNode().focus();
  }
  getStateFromValue(value, options) {
    let vOptions = options
    if (!options) {
      vOptions = this.state.options;
    }
    // reset internal filter string
    this._optionsFilterString = '';

    var values = this.initValuesArray(value, vOptions),
      filteredOptions = this.filterOptions(vOptions, values);
    return {
      value: values.map(function(v) { return v.value; }).join(this.props.delimiter),
      values: values,
      inputValue: '',
      filteredOptions: filteredOptions,
      placeholder: !this.props.multi && values.length ? values[0].label : this.props.placeholder,
      focusedOption: !this.props.multi && values.length ? values[0] : filteredOptions[0]
    };
  }
  initValuesArray(values, options) {
    let newValues = values;
    if (!_.isArray(values)) {
      if (typeof values === 'string') {
        newValues = values.split(this.props.delimiter);
      } else {
        newValues = values ? [ values ] : [];
      }
    }
    return newValues.map(function(val) {
      if (typeof val === 'string') {
        for (var key in options) {
          if (options.hasOwnProperty(key) && options[key] && options[key].value === val) {
            return options[key];
          }
        }
        return { value: val, label: val };
      } else {
        return val;
      }
    });
  }
  setValue(value, focusAfterUpdate) {
    if (focusAfterUpdate || focusAfterUpdate === undefined) {
      this._focusAfterUpdate = true;
    }
    var newState = this.getStateFromValue(value);
    newState.isOpen = false;
    this.fireChangeEvent(newState);
    this.setState(newState);
  }
  selectValue(value) {
    if (!this.props.multi) {
      this.setValue(value);
    } else if (value) {
      this.addValue(value);
    }
    // this._unbindCloseMenuIfClickedOutside();
  }
  addValue(value) {
    this.setValue(this.state.values.concat(value));
  }
  popValue() {
    this.setValue(this.state.values.slice(0, this.state.values.length - 1));
  }
  removeValue(valueToRemove) {
    this.setValue(this.state.values.filter(function(value) {
      return value !== valueToRemove;
    }));
  }
  clearValue(event) {
    // if the event was triggered by a mousedown and not the primary
    // button, ignore it.
    if (event && event.type === 'mousedown' && event.button !== 0) {
      return;
    }
    this.setValue(null);
  }
  resetValue() {
    this.setValue(this.state.value === '' ? null : this.state.value);
  }
  getInputNode () {
    var input = this.refs.input;
    return this.props.searchable ? input : ReactDOM.findDOMNode(input);
  }
  fireChangeEvent(newState) {
    if (newState.values[0] !== this.state.values[0] && this.props.onChange) {
      this.props.onChange(this.props.multi ? newState.values : newState.values[0]);
    }
  }
  handleMouseDown(event) {
    // if the event was triggered by a mousedown and not the primary
    // button, or if the component is disabled, ignore it.
    if (this.props.disabled || (event.type === 'mousedown' && event.button !== 0)) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    if (this.state.isFocused) {
      this.setState({
        isOpen: true
      }, this._bindCloseMenuIfClickedOutside);
    } else {
      this._openAfterFocus = true;
      this.getInputNode().focus();
    }
  }
  handleInputFocus(event) {
    var newIsOpen = this.state.isOpen || this._openAfterFocus;
    this.setState({
      isFocused: true,
      isOpen: newIsOpen
    });
    this._openAfterFocus = false;

    if (this.props.onFocus) {
      this.props.onFocus(event);
    }
  }
  handleInputBlur(event) {
    var self = this;
    this._blurTimeout = setTimeout(function() {
      if (self._focusAfterUpdate) { return; }

      self.setState({
        isFocused: false
      });
    }, 50);

    if (this.props.onBlur) {
      this.props.onBlur(event);
    }
  }
  handleKeyDown(event) {
    if (this.state.disabled) { return; }
    switch (event.keyCode) {
    case 8: // backspace
      if (!this.state.inputValue) {
        this.popValue();
      }
      return;
    case 9: // tab
      if (event.shiftKey || !this.state.isOpen || !this.state.focusedOption) {
        return;
      }
      this.selectFocusedOption();
      break;
    case 13: // enter
      this.selectFocusedOption();
      break;
    case 27: // escape
      if (this.state.isOpen) {
        this.resetValue();
      } else {
        this.clearValue();
      }
      break;
    case 38: // up
      this.focusPreviousOption();
      break;
    case 40: // down
      this.focusNextOption();
      break;
    default: return;
    }
    event.preventDefault();
  }
  // Ensures that the currently focused option is available in filteredOptions.
  // If not, returns the first available option.
  _getNewFocusedOption(filteredOptions) {
    for (var key in filteredOptions) {
      if (filteredOptions.hasOwnProperty(key) && filteredOptions[key] === this.state.focusedOption) {
        return filteredOptions[key];
      }
    }
    return filteredOptions[0];
  }
  handleInputChange(event) {
    // assign an internal variable because we need to use
    // the latest value before setState() has completed.
    this._optionsFilterString = event.target.value;

    if (this.props.asyncOptions) {
      this.setState({
        isLoading: true,
        inputValue: event.target.value
      });
    } else {
      var filteredOptions = this.filterOptions(this.state.options);
      this.setState({
        isOpen: true,
        inputValue: event.target.value,
        filteredOptions: filteredOptions,
        focusedOption: this._getNewFocusedOption(filteredOptions)
      }, this._bindCloseMenuIfClickedOutside);
    }
  }
  filterOptions(options, values) {
    if (!this.props.searchable) {
      return options;
    }
    var filterValue = this._optionsFilterString;
    var exclude = (values || this.state.values).map(function(i) {
      return i.value;
    });
    if (this.props.filterOptions) {
      return this.props.filterOptions.call(this, options, filterValue, exclude);
    } else {
      var filterOption = function(op) {
        if (this.props.multi && exclude.indexOf(op.value) > -1) { return false; }
        if (this.props.filterOption) { return this.props.filterOption.call(this, op, filterValue); }
        var valueTest = String(op.value), labelTest = String(op.label);
        return !filterValue || (this.props.matchPos === 'start') ? (
          (this.props.matchProp !== 'label' && valueTest.toLowerCase().substr(0, filterValue.length) === filterValue) ||
          (this.props.matchProp !== 'value' && labelTest.toLowerCase().substr(0, filterValue.length) === filterValue)
        ) : (
          (this.props.matchProp !== 'label' && valueTest.toLowerCase().indexOf(filterValue.toLowerCase()) >= 0) ||
          (this.props.matchProp !== 'value' && labelTest.toLowerCase().indexOf(filterValue.toLowerCase()) >= 0)
        );
      };
      return (options || []).filter(filterOption, this);
    }
  }
  selectFocusedOption() {
    return this.selectValue(this.state.focusedOption);
  }
  focusOption(op) {
    this.setState({
      focusedOption: op
    });
  }
  focusNextOption() {
    this.focusAdjacentOption('next');
  }
  focusPreviousOption() {
    this.focusAdjacentOption('previous');
  }
  focusAdjacentOption(dir) {
    this._focusedOptionReveal = true;

    var ops = this.state.filteredOptions;

    if (!this.state.isOpen) {
      this.setState({
        isOpen: true,
        inputValue: '',
        focusedOption: this.state.focusedOption || ops[dir === 'next' ? 0 : ops.length - 1]
      }, this._bindCloseMenuIfClickedOutside);
      return;
    }

    if (!ops.length) {
      return;
    }

    var focusedIndex = -1;

    for (var i = 0; i < ops.length; i += 1) {
      if (this.state.focusedOption === ops[i]) {
        focusedIndex = i;
        break;
      }
    }

    var focusedOption = ops[0];

    if (dir === 'next' && focusedIndex > -1 && focusedIndex < ops.length - 1) {
      focusedOption = ops[focusedIndex + 1];
    } else if (dir === 'previous') {
      if (focusedIndex > 0) {
        focusedOption = ops[focusedIndex - 1];
      } else {
        focusedOption = ops[ops.length - 1];
      }
    }
    this.setState({
      focusedOption: focusedOption
    });
  }
  unfocusOption(op) {
    if (this.state.focusedOption === op) {
      this.setState({
        focusedOption: null
      });
    }
  }
  buildMenu() {
    var focusedValue = this.state.focusedOption ? this.state.focusedOption.value : null;

    if(this.state.filteredOptions.length > 0) {
      focusedValue = focusedValue === null ? this.state.filteredOptions[0] : focusedValue;
    }

    var ops = Object.keys(this.state.filteredOptions).map(function(key) {
      var op = this.state.filteredOptions[key];
      var isFocused = focusedValue === op.value;

      var optionClass = cx({
        'Select-option': true,
        'is-focused': isFocused,
        'is-disabled': op.disabled
      });

      var ref = isFocused ? 'focused' : null;

      var mouseEnter = this.focusOption.bind(this, op);
      var mouseLeave = this.unfocusOption.bind(this, op);
      var mouseDown = this.selectValue.bind(this, op);

      if (op.disabled) {
        return (
          <div
            ref={ref}
            key={`option-${  _.isObject(op.value)}` ? JSON.stringify(op.value) : op.value}
            className={optionClass}
          >
            {op.label}
          </div>
        );
      } else {
        return (
          <div
            ref={ref}
            key={`option-${  _.isObject(op.value)}` ? JSON.stringify(op.value) : op.value}
            className={optionClass}
            onMouseEnter={mouseEnter}
            onMouseLeave={mouseLeave}
            onMouseDown={mouseDown}
            onClick={mouseDown}
          >
            {op.label}
          </div>
        );
      }
    }, this);

    return ops.length ? ops : (
      <div className="Select-noresults">
        {this.props.asyncOptions && !this.state.inputValue ? this.props.searchPromptText : this.props.noResultsText}
      </div>
    );
  }
  handleOptionLabelClick (value, event) {
    var handler = this.props.onOptionLabelClick;

    if (handler) {
      handler(value, event);
    }
  }
  render() {
    var selectClass = cx('Select', this.props.className, {
      'is-multi': this.props.multi,
      'is-searchable': this.props.searchable,
      'is-open': this.state.isOpen,
      'is-focused': this.state.isFocused,
      'is-loading': this.state.isLoading,
      'is-disabled': this.props.disabled,
      'has-value': this.state.value
    });
    var value = [];

    if (this.props.multi) {
      this.state.values.forEach(function(val) {
        var props = {
          key: val.label,
          optionLabelClick: Boolean(this.props.onOptionLabelClick),
          onOptionLabelClick: this.handleOptionLabelClick.bind(this, val),
          onRemove: this.removeValue.bind(this, val)
        };
        for (var key in val) {
          if (val.hasOwnProperty(key)) {
            props[key] = val[key];
          }
        }
        value.push(<Option {...props} />);
      }, this);
    }

    if (this.props.disabled || (!this.state.inputValue && (!this.props.multi || !value.length))) {
      value.push(<div className="Select-placeholder" key="placeholder">{this.state.placeholder}</div>);
    }

    var loading = this.state.isLoading ? (
      <span className="Select-loading" aria-hidden="true" />
    ) : null;

    var clear = this.props.multi && this.state.value && !this.props.disabled ? (
      <span className="Select-clear"
        title={this.props.multi ? this.props.clearAllText : this.props.clearValueText}
        aria-label={this.props.multi ? this.props.clearAllText : this.props.clearValueText} onMouseDown={this.clearValue}
        onClick={this.clearValue}
        dangerouslySetInnerHTML={{ __html: '&times;' }}
      />
    ) : null;

    var menu;
    var menuProps;
    if (this.state.isOpen) {
      menuProps = {
        ref: 'menu',
        className: 'Select-menu'
      };
      if (this.props.multi) {
        menuProps.onMouseDown = this.handleMouseDown;
      }
      menu = (
        <div ref="selectMenuContainer" className="Select-menu-outer">
          <div {...menuProps}>{this.buildMenu()}</div>
        </div>
      );
    }

    var input;
    var inputProps = {
      ref: 'input',
      className: 'Select-input',
      tabIndex: this.props.tabIndex || 0,
      onFocus: this.handleInputFocus,
      onBlur: this.handleInputBlur
    };
    for (var key in this.props.inputProps) {
      if (this.props.inputProps.hasOwnProperty(key)) {
        inputProps[key] = this.props.inputProps[key];
      }
    }
    if (this.props.searchable && !this.props.disabled) {
      input = <Input value={this.state.inputValue} onChange={this.handleInputChange} {...inputProps} />;
    } else {
      input = <div {...inputProps}>&nbsp;</div>;
    }

    return (
      <div ref="wrapper" className={selectClass} style={this.props.style}>
        <input type="hidden" ref="value" name={this.props.name} value={this.state.value} disabled={this.props.disabled} />
        <div className="Select-control" ref="control" onKeyDown={this.handleKeyDown} onMouseDown={this.handleMouseDown} onTouchEnd={this.handleMouseDown}>
          {value}
          {input}
          <span className="Select-arrow" />
          {loading}
          {clear}
        </div>
        {menu}
      </div>
    );
  }

}
Select.defaultProps = {
  value: undefined,
  options: undefined,
  disabled: false,
  delimiter: ',',
  asyncOptions: undefined,
  autoload: true,
  placeholder: 'Select...',
  noResultsText: 'No results found',
  clearable: true,
  clearValueText: 'Clear value',
  clearAllText: 'Clear all',
  searchable: true,
  searchPromptText: 'Type to search',
  name: undefined,
  onChange: undefined,
  className: undefined,
  matchPos: 'any',
  matchProp: 'any',
  inputProps: {}
}
Select.propTypes = {
  value: PropTypes.any,                // initial field value
  multi: PropTypes.bool,               // multi-value input
  disabled: PropTypes.bool,            // whether the Select is disabled or not
  options: PropTypes.array,            // array of options
  delimiter: PropTypes.string,         // delimiter to use to join multiple values
  asyncOptions: PropTypes.func,        // function to call to get options
  autoload: PropTypes.bool,            // whether to auto-load the default async options set
  placeholder: PropTypes.string,       // field placeholder, displayed when there's no value
  noResultsText: PropTypes.string,     // placeholder displayed when there are no matching search results
  clearable: PropTypes.bool,           // should it be possible to reset value
  clearValueText: PropTypes.string,    // title for the "clear" control
  clearAllText: PropTypes.string,      // title for the "clear" control when multi: true
  searchable: PropTypes.bool,          // whether to enable searching feature or not
  searchPromptText: PropTypes.string,  // label to prompt for search input
  name: PropTypes.string,              // field name, for hidden <input /> tag
  onChange: PropTypes.func,            // onChange handler: function(newValue) {}
  onFocus: PropTypes.func,             // onFocus handler: function(event) {}
  onBlur: PropTypes.func,              // onBlur handler: function(event) {}
  className: PropTypes.string,         // className for the outer element
  filterOption: PropTypes.func,        // method to filter a single option: function(option, filterString)
  filterOptions: PropTypes.func,       // method to filter the options array: function([options], filterString, [values])
  matchPos: PropTypes.string,          // (any|start) match the start or entire string when filtering
  matchProp: PropTypes.string,         // (any|label|value) which option property to filter on
  inputProps: PropTypes.object        // custom attributes for the Input (in the Select-control) e.g: {'data-foo': 'bar'}
}
