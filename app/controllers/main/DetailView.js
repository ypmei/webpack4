 import React, { Component } from 'react'
import { bindStores } from '../provider'

@bindStores()
export default class DetailView extends Component {
  render(){
    return (
      <div className='flex-col-1'>
        {__('详情内容')}
      </div>
    )
  }
}
