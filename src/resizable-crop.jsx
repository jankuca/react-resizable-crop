import React from 'react'


class ResizableCrop extends React.Component {
  static propTypes = {
    crop: React.PropTypes.shape({
      x: React.PropTypes.number.isRequired,
      y: React.PropTypes.number.isRequired,
      width: React.PropTypes.number.isRequired,
      height: React.PropTypes.number.isRequired
    }).isRequired,
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
