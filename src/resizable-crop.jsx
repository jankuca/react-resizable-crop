import React from 'react'
import ReactDOM from 'react-dom'

import assign from 'object-assign'
import PropTypes from 'prop-types'


class ResizableCrop extends React.Component {
  static propTypes = {
    crop: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
      width: PropTypes.number.isRequired,
      height: PropTypes.number.isRequired
    }).isRequired,
    speed: PropTypes.number,
    offset: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired
    }),
    onResize: PropTypes.func,
    onResizeStart: PropTypes.func,
    onResizeEnd: PropTypes.func
  }

  static defaultProps = {
    speed: 1,
    offset: {
      x: 0,
      y: 0
    }
  }

  constructor(...args) {
    super(...args)

    this._handleMouseDown = this._handleMouseDown.bind(this)
    this._handleMouseMove = this._handleMouseMove.bind(this)
    this._handleMouseUp = this._handleMouseUp.bind(this)

    this._asyncOnResizeHandle = 0
  }

  componentDidMount() {
    const element = ReactDOM.findDOMNode(this)
    element.addEventListener('mousedown', this._handleMouseDown, false)
  }

  componentWillUpdate() {
    const element = ReactDOM.findDOMNode(this)
    element.removeEventListener('mousedown', this._handleMouseDown, false)
  }

  componentDidUpdate() {
    const element = ReactDOM.findDOMNode(this)
    element.addEventListener('mousedown', this._handleMouseDown, false)
  }

  componentWillUnmount() {
    this._cancelAsyncOnResize()

    const element = ReactDOM.findDOMNode(this)
    element.removeEventListener('mousedown', this._handleMouseDown, false)

    if (this._resizing) {
      this._resizing = false

      const element = this._lastMouseEvent.target
      const win = element.ownerDocument.defaultView
      win.removeEventListener('mousemove', this._handleMouseMove, true)
      win.removeEventListener('mouseup', this._handleMouseUp, true)
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this._resizing) {
      if (nextProps.speed !== this.props.speed) {
        this._originalCrop = this._lastCrop
        this._startPosition = this._getPositionOfEvent(this._lastMouseEvent)

      } else if (nextProps.offset.x !== this.props.offset.x ||
          nextProps.offset.y !== this.props.offset.y) {
        const delta = {
          x: (this.props.offset.x - nextProps.offset.x) * this.props.speed,
          y: (this.props.offset.y - nextProps.offset.y) * this.props.speed
        }

        // NOTE: The `lastCrop` property is used as we need to prevent race
        //   conditions caused by the props being updated asynchronously.
        const prevCrop = this._lastCrop
        const nextCrop = this._updateCrop(prevCrop, this._resizeOrd, delta)

        this._originalCrop = nextCrop
        this._lastCrop = nextCrop
        this._startPosition = this._getPositionOfEvent(this._lastMouseEvent)

        const onResize = nextProps.onResize
        if (onResize) {
          this._scheduleAsyncOnResize(onResize, nextCrop)
        }
      }
    }
  }

  _scheduleAsyncOnResize(onResize, nextCrop) {
    this._asyncOnResizeHandle = setTimeout(() => {
      this._asyncOnResizeHandle = 0
      onResize(nextCrop)
    }, 0)
  }

  _cancelAsyncOnResize() {
    if (this._asyncOnResizeHandle) {
      clearTimeout(this._asyncOnResizeHandle)
    }
  }

  _handleMouseDown(e) {
    // NOTE: The mousdown event originated in right/contextmenu click. Ignore.
    if (e.which === 3) {
      return
    }

    const ord = e.target.getAttribute('data-ord') || null

    e.preventDefault()
    e.stopPropagation()

    const win = e.target.ownerDocument.defaultView
    win.addEventListener('mousemove', this._handleMouseMove, true)
    win.addEventListener('mouseup', this._handleMouseUp, true)

    this._resizing = true
    this._resizeOrd = ord
    this._originalCrop = this.props.crop
    this._lastCrop = this.props.crop
    this._startPosition = this._getPositionOfEvent(e)
    this._lastMouseEvent = e

    if (this.props.onResizeStart) {
      this.props.onResizeStart(this._resizeOrd)
    }
  }

  _handleMouseMove(e) {
    e.preventDefault()
    e.stopPropagation()

    const position = this._getPositionOfEvent(e)
    const delta = {
      x: (position.x - this._startPosition.x) * this.props.speed,
      y: (position.y - this._startPosition.y) * this.props.speed
    }

    const prevCrop = this._originalCrop
    const nextCrop = this._updateCrop(prevCrop, this._resizeOrd, delta)

    this._lastCrop = nextCrop
    this._lastMouseEvent = e

    if (this.props.onResize) {
      this.props.onResize(nextCrop)
    }
  }

  _handleMouseUp(e) {
    e.preventDefault()
    e.stopPropagation()

    const win = e.target.ownerDocument.defaultView
    win.removeEventListener('mousemove', this._handleMouseMove, true)
    win.removeEventListener('mouseup', this._handleMouseUp, true)

    this._resizing = false
    this._resizeOrd = null
    this._originalCrop = null
    this._lastCrop = null
    this._startPosition = null
    this._lastMouseEvent = null

    if (this.props.onResizeEnd) {
      this.props.onResizeEnd()
    }
  }

  _getPositionOfEvent(e) {
    return {
      x: e.clientX,
      y: e.clientY
    }
  }

  _updateCrop(prevCrop, ord, delta) {
    let nextCrop = prevCrop

    if (ord) {
      nextCrop = this._resizeCrop(nextCrop, ord, delta)
    } else {
      nextCrop = this._moveCrop(nextCrop, delta)
    }

    nextCrop = this._normalizeCrop(nextCrop)

    return nextCrop
  }

  _resizeCrop(prevCrop, ord, delta) {
    const nextCrop = assign({}, prevCrop)

    if (ord.indexOf('w') > -1) {
      nextCrop.x += delta.x
      nextCrop.width -= delta.x
    }
    if (ord.indexOf('n') > -1) {
      nextCrop.y += delta.y
      nextCrop.height -= delta.y
    }
    if (ord.indexOf('e') > -1) {
      nextCrop.width += delta.x
    }
    if (ord.indexOf('s') > -1) {
      nextCrop.height += delta.y
    }

    return nextCrop
  }

  _moveCrop(prevCrop, delta) {
    const nextCrop = assign({}, prevCrop)

    nextCrop.x += delta.x
    nextCrop.y += delta.y

    return nextCrop
  }

  _normalizeCrop(prevCrop) {
    if (prevCrop.width >= 0 && prevCrop.height >= 0) {
      return prevCrop
    }

    const nextCrop = assign({}, prevCrop)
    if (prevCrop.width < 0) {
      nextCrop.x += prevCrop.width
      nextCrop.width = Math.abs(nextCrop.width)
    }
    if (prevCrop.height < 0) {
      nextCrop.y += prevCrop.height
      nextCrop.height = Math.abs(nextCrop.height)
    }
    return nextCrop
  }

  render() {
    return (
      <div
        className={this.props.className}
      >
        <div className={this.props.className + '__drag-bar ord-n'} data-ord='n'></div>
        <div className={this.props.className + '__drag-bar ord-e'} data-ord='e'></div>
        <div className={this.props.className + '__drag-bar ord-s'} data-ord='s'></div>
        <div className={this.props.className + '__drag-bar ord-w'} data-ord='w'></div>

        <div className={this.props.className + '__drag-handle ord-nw'} data-ord='nw'></div>
        <div className={this.props.className + '__drag-handle ord-n'} data-ord='n'></div>
        <div className={this.props.className + '__drag-handle ord-ne'} data-ord='ne'></div>
        <div className={this.props.className + '__drag-handle ord-e'} data-ord='e'></div>
        <div className={this.props.className + '__drag-handle ord-se'} data-ord='se'></div>
        <div className={this.props.className + '__drag-handle ord-s'} data-ord='s'></div>
        <div className={this.props.className + '__drag-handle ord-sw'} data-ord='sw'></div>
        <div className={this.props.className + '__drag-handle ord-w'} data-ord='w'></div>

        {this.props.children}
      </div>
    )
  }
}


export default ResizableCrop
