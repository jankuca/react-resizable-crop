import React from 'react'
import ReactDOM from 'react-dom'

import assign from 'object-assign'


class ResizableCrop extends React.Component {
  static propTypes = {
    crop: React.PropTypes.shape({
      x: React.PropTypes.number.isRequired,
      y: React.PropTypes.number.isRequired,
      width: React.PropTypes.number.isRequired,
      height: React.PropTypes.number.isRequired
    }).isRequired,
    speed: React.PropTypes.number,
    onResize: React.PropTypes.func,
    onResizeStart: React.PropTypes.func,
    onResizeEnd: React.PropTypes.func
  }

  static defaultProps = {
    speed: 1
  }

  constructor(...args) {
    super(...args)

    this._handleMouseDown = this._handleMouseDown.bind(this)
    this._handleMouseMove = this._handleMouseMove.bind(this)
    this._handleMouseUp = this._handleMouseUp.bind(this)
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

  _handleMouseDown(e) {
    const ord = e.target.getAttribute('data-ord')

    e.preventDefault()
    e.stopPropagation()

    const win = e.target.ownerDocument.defaultView
    win.addEventListener('mousemove', this._handleMouseMove, true)
    win.addEventListener('mouseup', this._handleMouseUp, true)

    this._resizing = true
    this._resizeOrd = ord
    this._originalCrop = this.props.crop
    this._startPosition = this._getPositionOfEvent(e)
    this._lastMouseEvent = e

    if (this.props.onResizeStart) {
      this.props.onResizeStart()
    }
  }

  _handleMouseMove(e) {
    e.preventDefault()
    e.stopPropagation()

    const position = this._getPositionOfEvent(e)
    const delta = {
      x: Math.round((position.x - this._startPosition.x) * this.props.speed),
      y: Math.round((position.y - this._startPosition.y) * this.props.speed)
    }

    let nextCrop = this._originalCrop
    if (this._resizeOrd) {
      nextCrop = this._resizeCrop(nextCrop, this._resizeOrd, delta)
    } else {
      nextCrop = this._moveCrop(nextCrop, delta)
    }
    nextCrop = this._normalizeCrop(nextCrop)

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
