import '../styles/components/slider.css'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import $ from 'jquery'

function pauseEvent(e) {
  if (e.stopPropagation) { e.stopPropagation(); }
  if (e.preventDefault) { e.preventDefault(); }
  // e.cancelBubble = true;
  // e.returnValue = false;
  return false;
}

function stopPropagation(e) {
  if (e.stopPropagation) { e.stopPropagation(); }
  // e.cancelBubble = true;
}
export default class Slider extends Component{
  static defaultProps = {
    min: 0,
    minValue: 0,
    max: 100,
    maxValue: 100,
    value: 50,
    step: 1,
    minDistance: 0,
    defaultValue: 0,
    orientation: 'horizontal',
    className: 'slider',
    handleClassName: 'handle',
    handleActiveClassName: 'active',
    withBars: false,
    pearling: false,
    disabled: false,
    snapDragDisabled: false,
    invert: false
  }
  static propTypes = {
    /**
     * The minimum value of the slider.
     */
    min: PropTypes.number,

    /**
     * The maximum value of the slider.
     */
    max: PropTypes.number,

    /**
     * Value to be added or subtracted on each step the slider makes.
     * Must be greater than zero.
     * `max - min` should be evenly divisible by the step value.
     */
    step: PropTypes.number,

    /**
     * The minimal distance between any pair of handles.
     * Must be positive, but zero means they can sit on top of each other.
     */
    minDistance: PropTypes.number,

    /**
     * Determines the initial positions of the handles and the number of handles if the component has no children.
     *
     * If a number is passed a slider with one handle will be rendered.
     * If an array is passed each value will determine the position of one handle.
     * The values in the array must be sorted.
     * If the component has children, the length of the array must match the number of children.
     */
    defaultValue: PropTypes.number,

    /**
     * Like `defaultValue` but for [controlled components](http://facebook.github.io/react/docs/forms.html#controlled-components).
     */
    value: PropTypes.number,

    /**
     * Determines whether the slider moves horizontally (from left to right) or vertically (from top to bottom).
     */
    orientation: PropTypes.oneOf([ 'horizontal', 'vertical' ]),

    /**
     * The css class set on the slider node.
     */
    className: PropTypes.string,

    /**
     * The css class set on each handle node.
     *
     * In addition each handle will receive a numbered css class of the form `${handleClassName}-${i}`,
     * e.g. `handle-0`, `handle-1`, ...
     */
    handleClassName: PropTypes.string,

    /**
     * The css class set on the handle that is currently being moved.
     */
    handleActiveClassName: PropTypes.string,


    /**
     * If `true` the active handle will push other handles
     * within the constraints of `min`, `max`, `step` and `minDistance`.
     */
    pearling: PropTypes.bool,

    /**
     * If `true` the handles can't be moved.
     */
    disabled: PropTypes.bool,

    /**
     * Disables handle move when clicking the slider bar
     */
    snapDragDisabled: PropTypes.bool,

    /**
     * Inverts the slider.
     */
    invert: PropTypes.bool,

    /**
     * Callback called before starting to move a handle.
     */
    onBeforeChange: PropTypes.func,

    /**
     * Callback called on every value change.
     */
    onChange: PropTypes.func,

    /**
     * Callback called only after moving a handle has ended.
     */
    onAfterChange: PropTypes.func
  }
  constructor(props, context){
    super(props, context);
    var value = this.props.value || this.props.defaultValue;
    this.state = {
      index: -1,
      upperBound: 0,
      sliderLength: 0,
      value: value
    }
    this._onSliderMouseDown = this._onSliderMouseDown.bind(this)
    this._onMouseDown = this._onMouseDown.bind(this)
    this._onMouseMove = this._onMouseMove.bind(this)
    this._onMouseUp = this._onMouseUp.bind(this)
    this._onTouchStart = this._onTouchStart.bind(this)
    this._onTouchMove = this._onTouchMove.bind(this)
    this._onTouchEnd = this._onTouchEnd.bind(this)
    this._handleResize = this._handleResize.bind(this)
  }
  // Keep the internal `value` consistent with an outside `value` if present.
  // This basically allows the slider to be a controlled component.
  componentWillReceiveProps (newProps) {
    var value = newProps.value || this.state.value;

    this.setState({
      value: this._trimAlignValue(value, newProps)
    })
  }
  componentDidMount () {
    $(window).on('resize', this._handleResize)
    this._handleResize();
  }
  componentWillUnmount () {
    $(window).off('resize', this._handleResize)
  }
  getValue () {
    return this.state.value;
  }
  _handleResize () {
    var slider = this.refs.slider
    var handle = this.refs.handle
    var rect = slider.getBoundingClientRect();

    var size = 'clientWidth';

    var sliderMax = rect['right'];
    var sliderMin = rect['left'];

    this.setState({
      upperBound: slider[size] - handle[size],
      sliderLength: Math.abs(sliderMax - sliderMin),
      handleSize: handle[size],
      sliderStart: this.props.invert ? sliderMax : sliderMin
    });
  }


  // Snaps the nearest handle to the value corresponding to `position` and calls `callback` with that handle's index.
  _forceValueFromPosition (position, callback) {
    var pixelOffset = position - this.state.sliderStart;
    if (this.props.invert) { pixelOffset = this.state.sliderLength - pixelOffset; }
    pixelOffset -= (this.state.handleSize / 2);


    var nextValue = this._trimAlignValue((pixelOffset / this.state.upperBound) * (this.props.max - this.props.min) + this.props.min);
    var value = this.state.value;
    value = nextValue;

    this.setState({value: value}, callback.bind(this));
  }

  _getMousePosition (e) {
    return [
      e['pageX'],
      e['pageY']
    ];
  }

  _getTouchPosition (e) {
    var touch = e.touches[0];
    return [
      touch['pageX'],
      touch['pageY']
    ];
  }

  _getMouseEventMap () {
    return {
      'mousemove': this._onMouseMove,
      'mouseup': this._onMouseUp
    }
  }

  _getTouchEventMap () {
    return {
      'touchmove': this._onTouchMove,
      'touchend': this._onTouchEnd
    }
  }

  // create the `mousedown` handler for the i-th handle
  _onMouseDown (e) {
    if (this.props.disabled) { return; }
    var position = this._getMousePosition(e);
    this._start( position[0]);
    this._addHandlers(this._getMouseEventMap());
    pauseEvent(e);
  }

  // create the `touchstart` handler for the i-th handle
  _onTouchStart (e) {
    if (this.props.disabled || e.touches.length > 1) { return; }
    var position = this._getTouchPosition(e);
    this.startPosition = position;
    this.isScrolling = undefined; // don't know yet if the user is trying to scroll
    this._start( position[0]);
    this._addHandlers(this._getTouchEventMap());
    stopPropagation(e);
  }

  _addHandlers (eventMap) {
    Object.keys(eventMap).forEach(function(key){
      $(document).on(key, eventMap[key])
    })
  }

  _removeHandlers (eventMap) {
    Object.keys(eventMap).forEach(function(key){
      $(document).off(key, eventMap[key])
    })
  }

  _start (position) {
    if (document.activeElement) { document.activeElement.blur(); }

    this._fireEvent('onBeforeChange');


    this.setState({
      startValue: this.state.value,
      startPosition: position,
      zIndices: 1
    });
  }

  _onMouseUp () {
    this._onEnd(this._getMouseEventMap());
  }

  _onTouchEnd () {
    this._onEnd(this._getTouchEventMap());
  }

  _onEnd (eventMap) {
    this._removeHandlers(eventMap);
    this.setState({index: -1}, this._fireEvent.bind(this, 'onAfterChange'));
  }

  _onMouseMove (e) {
    var position = this._getMousePosition(e);
    this._move(position[0]);
  }

  _onTouchMove (e) {
    if (e.touches.length > 1) { return; }

    var position = this._getTouchPosition(e);

    if (typeof this.isScrolling === 'undefined') {
      var diffMainDir = position[0] - this.startPosition[0];
      var diffScrollDir = position[1] - this.startPosition[1];
      this.isScrolling = Math.abs(diffScrollDir) > Math.abs(diffMainDir);
    }

    if (this.isScrolling) {
      this.setState({index: -1});
      return;
    }

    pauseEvent(e);

    this._move(position[0]);
  }

  _move (position) {
    var props = this.props;
    var state = this.state;

    var value = state.value;
    var l = value;
    var oldValue = value;

    var diffPosition = position - state.startPosition;


    var diffValue = diffPosition / (state.sliderLength - state.handleSize) * (props.max - props.min);
    var newValue = this._trimAlignValue(state.startValue + diffValue);

    var minDistance = props.minDistance;

    value = newValue;

    // Normally you would use `shouldComponentUpdate`, but since the slider is a low-level component,
    // the extra complexity might be worth the extra performance.
    if (newValue !== oldValue) {
      this.setState({value: value}, this._fireEvent.bind(this, 'onChange'));
    }
  }

  _trimAlignValue (val, opts) {
    const props = opts || this.props;
    var value;
    if (val <= props.minValue) {
      value = props.minValue;
    }else if (val >= props.maxValue) {
      value = props.maxValue;
    }else{
      value = val
    }
    var valModStep = (value - props.min) % props.step;
    var alignValue = value - valModStep;
    if (Math.abs(valModStep) * 2 >= props.step) {
      alignValue += (valModStep > 0) ? props.step : (-props.step);
    }
    return parseFloat(alignValue.toFixed(5));
  }
  _onSliderMouseDown (e) {
    if (this.props.disabled || this.props.snapDragDisabled) { return; }
    var position = this._getMousePosition(e);
    this._forceValueFromPosition(position[0], function (i) {
      this._fireEvent('onChange');
      this._start(position[0]);
      this._addHandlers(this._getMouseEventMap());
    }.bind(this));
    pauseEvent(e);
  }
  _fireEvent (evName) {
    if (this.props[evName]) {
      this.props[evName](this.state.value);
    }
  }
  render(){
    var style = {
      position: 'absolute',
      willChange: 'left',
      // zIndex: 1,
      left: `${((this.state.value - this.props.min) / (this.props.max - this.props.min)) * this.state.upperBound  }px`
    };
    const selectionStyle = {
      width: `${((this.state.value - this.props.min) / (this.props.max - this.props.min)) * this.state.upperBound  }px`
    }
    return (
      <div
        ref="slider"
        className={`slider time-slider${  this.props.disabled ? ' disabled' : ''}`}
      >
        <div
          className="slider-track"
          onMouseDown={this._onSliderMouseDown}
        >
          <div className="slider-selection" style={selectionStyle}></div>
          <div
            ref='handle'
            key='handle'
            className="slider-handle" style={style}
            onMouseDown={this._onMouseDown}
            onTouchStart={this._onTouchStart}
          >
          </div>
        </div>
      </div>
    )
  }
}
/**
 * To prevent text selection while dragging.
 * http://stackoverflow.com/questions/5429827/how-can-i-prevent-text-element-selection-with-cursor-drag
 */
