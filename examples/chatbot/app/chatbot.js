import Messages  from './stores/messages'
import Microcosm from '../../../src/microcosm'

class ChatBot extends Microcosm {

  constructor(options) {
    super(options)
    this.addStore('messages', Messages)
  }

}

export default ChatBot
