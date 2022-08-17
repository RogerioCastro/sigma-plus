import { createPopper } from '@popperjs/core'
import createElement from '../util/createElement'
import clearElement from '../util/clearElement'

/**
 * Componente tooltip
 * Utilizando Popper positioning engine (https://popper.js.org/)
 *
 * @param {Object} options
 * @returns {Object} Componente tooltip
 */
export default function tooltip (options) {

  const settings = {
    container: document.body,
    class: 'sigma-plus-tooltip',
    extraClass: null,
    offset: [0, 10],
    // onSelect: () => {},
    ...options
  }
  let tooltipElement = createElement('div', {
    className: settings.class + (settings.extraClass ? ` ${settings.extraClass}` : '')
  })
  const virtualElement = {
    getBoundingClientRect: generateGetBoundingClientRect()
  }

  // Inserindo o popover no container
  settings.container.appendChild(tooltipElement)

  // Iniciando o popover
  const popper = createPopper(virtualElement, tooltipElement, {
    placement: 'right',
    modifiers: [
      // Offset necessária para a utilização da 'arrow'
      {
        name: 'offset',
        options: {
          offset: settings.offset,
        },
      }
    ],
  })

  function generateGetBoundingClientRect (x = 0, y = 0) {
    return () => ({
      width: 10,
      height: 10,
      top: y,
      right: x,
      bottom: y,
      left: x,
    })
  }

  /**
   * Exibe o popover
   */
  function show (htmlContent, color) {
    tooltipElement.innerHTML = htmlContent
    // Exibindo
    tooltipElement.setAttribute('data-show', '')
    if (color) {
      tooltipElement.style['border-color'] = color
    }
    // Habilitando os eventos da instância (performance)
    // via: https://popper.js.org/docs/v2/tutorial/#performance
    popper.setOptions((popperOptions) => ({
      ...popperOptions,
      modifiers: [
        ...popperOptions.modifiers,
        { name: 'eventListeners', enabled: true }
      ]
    }))
    // Atualizando a instância
    popper.update()
  }

  /**
   * Oculta o popover
   */
  function hide () {
    // Ocultando
    tooltipElement.removeAttribute('data-show')
    tooltipElement.style['border-color'] = 'rgb(146, 146, 146)'
    tooltipElement.innerHTML = ''
    // Desabilitando os eventos da instância (performance)
    // via: https://popper.js.org/docs/v2/tutorial/#performance
    popper.setOptions((popperOptions) => ({
      ...popperOptions,
      modifiers: [
        ...popperOptions.modifiers,
        { name: 'eventListeners', enabled: false }
      ]
    }))
  }

  /**
   * destrói o componente
   */
  function destroy () {
    popper.destroy()
    // Limpando elementos HTML
    clearElement(tooltipElement)
    tooltipElement.remove()
    tooltipElement = null
    // document.removeEventListener('mousemove', handleMousemove)
  }

  /* EVENTOS */
  // function handleMousemove ({ clientX: x, clientY: y }) {
  function handleMousemove ({ x, y }) {
    virtualElement.getBoundingClientRect = generateGetBoundingClientRect(x, y)
    popper.update()
  }

  // document.addEventListener('mousemove', handleMousemove) // não funfa!

  return {
    element: tooltipElement,
    popper,
    handleMousemove,
    destroy,
    show,
    hide
  }
}
