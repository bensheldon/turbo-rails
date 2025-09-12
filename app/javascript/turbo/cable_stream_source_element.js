import { connectStreamSource, disconnectStreamSource } from "@hotwired/turbo"
import { subscribeTo } from "./cable"
import snakeize from "./snakeize"

class TurboCableStreamSourceElement extends HTMLElement {
  static observedAttributes = ["channel", "signed-stream-name"]

  async connectedCallback() {
    if (this.disconnecting) {
      this.disconnecting = false;
      return;
    }
    
    connectStreamSource(this)
    this.subscription = await subscribeTo(this.channel, {
      received: this.dispatchMessageEvent.bind(this),
      connected: this.subscriptionConnected.bind(this),
      disconnected: this.subscriptionDisconnected.bind(this)
    })
  }

  disconnectedCallback() {
    this.disconnecting = true;
    await new Promise(resolve => setTimeout(resolve, 0))
    if (!this.disconnecting) return;
    
    disconnectStreamSource(this)
    if (this.subscription) this.subscription.unsubscribe()
    this.subscriptionDisconnected()
  }

  attributeChangedCallback() {
    if (this.subscription) {
      this.disconnectedCallback()
      this.connectedCallback()
    }
  }

  dispatchMessageEvent(data) {
    const event = new MessageEvent("message", { data })
    return this.dispatchEvent(event)
  }

  subscriptionConnected() {
    this.setAttribute("connected", "")
  }

  subscriptionDisconnected() {
    this.removeAttribute("connected")
  }

  get channel() {
    const channel = this.getAttribute("channel")
    const signed_stream_name = this.getAttribute("signed-stream-name")
    return { channel, signed_stream_name, ...snakeize({ ...this.dataset }) }
  }
}


if (customElements.get("turbo-cable-stream-source") === undefined) {
  customElements.define("turbo-cable-stream-source", TurboCableStreamSourceElement)
}
