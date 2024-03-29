/**
 * Cria um hub para manipular eventos na biblioteca
 * via: https://github.com/30-seconds/30-seconds-of-code/blob/master/snippets/createEventHub.md
 */
const createEventHub = () => ({
  hub: Object.create(null),
  emit(event, ...data) {
    (this.hub[event] || []).forEach(handler => handler.apply(this, data))
  },
  on(event, handler) {
    if (!this.hub[event]) this.hub[event] = []
    this.hub[event].push(handler)
  },
  off(event, handler) {
    const i = (this.hub[event] || []).findIndex(h => h === handler)
    if (i > -1) this.hub[event].splice(i, 1)
    if (this.hub[event].length === 0) delete this.hub[event]
  }
})

export default createEventHub
