import { Sigma } from 'sigma'
import Graph from 'graphology'
import getNodeProgramImage from 'sigma/rendering/webgl/programs/node.image'
import NodeProgramBorder from './core/node.border'
import createTooltip from './core/tooltip'
import createResizeObserver from './util/resizeObserver'
import createEventHub from './util/createEventHub'
import isHTMLElement from './util/isHTMLElement'
import linearScale from './util/linearScale'
import getExtent from './util/extent'
import omit from './util/omit'
import './styles/main.scss'

/**
 * Inicializa a biblioteca
 * @param {Object} options Configurações gerais
 * @returns {Object}
 */
export default function SigmaPlus(options) {

  /* Configurações gerais */
  const settings = {
    container: null,
    data: null,
    type: 'undirected',
    multi: false,
    renderEdges: true,
    greyedNodeColor: '#ebebeb',
    greyedEdgeColor: '#ebebeb',
    minNodeSize: 2,
    maxNodeSize: 10,
    minEdgeSize: 1,
    maxEdgeSize: 5,
    defaultEdgeSize: 1,
    grayOtherNodes: true,
    grayOtherEdges: false,
    hoverPadding: 2,
    hoverBackgroundColor: '#fff',
    hoverShadow: true,
    tooltipContainer: document.body,
    tooltipExtraClass: null,
    tooltipFormatter: (node) => node.label
  }

  /* Configurações da Sigma */
  const sigmaSettings = {
    // Performance
    hideEdgesOnMove: false,
    hideLabelsOnMove: false,
    renderLabels: true,
    renderEdgeLabels: false,
    // Component rendering
    defaultNodeColor: '#462393',
    defaultNodeType: 'circle', // 'circle' ou 'border'
    defaultEdgeColor: '#ccc',
    defaultEdgeType: 'line', // 'line' ou 'arrow'
    labelFont: 'Arial',
    labelSize: 12,
    labelWeight: 'normal',
    edgeLabelFont: 'Arial',
    edgeLabelSize: 14,
    edgeLabelWeight: 'normal',
    stagePadding: 30,
    // Labels
    labelDensity: 0.1,
    labelGridCellSize: 100,
    labelRenderedSizeThreshold: 6,
    // Features
    zIndex: true,
    minCameraRatio: null,
    maxCameraRatio: null,
    // Reducers
    nodeReducer: nodeReducer,
    edgeReducer: edgeReducer,
    // Renderers
    hoverRenderer: hoverRenderer,
    labelRenderer: labelRenderer
    // Não inclue as Program classes: nodeProgramClasses, edgeProgramClasses
  }

  /* Sobrescrevendo as configurações */
  if (options) {
    for (var key in options) {
      if (key in settings) {
        settings[key] = options[key]
      }
      if (key in sigmaSettings) {
        sigmaSettings[key] = options[key]
      }
    }
  }

  /* Variáveis e objetos gerais */
  // HUB de eventos da biblioteca
  const eventHub = createEventHub()
  // Estado do grafo (comportamento dos nós)
  const state = {
    selectedNode: null,
    hoveredNode: null,
    highlightedNeighbors: new Set(),
    highlightedNodes: new Set()
  }
  // Principais componentes
  const components = {
    graph: null,
    sigma: null,
    tooltip: createTooltip({
      container: settings.tooltipContainer,
      extraClass: settings.tooltipExtraClass
    })
  }
  // Variáveis auxiliares
  let nodesExtent = null
  let edgesExtent = null
  let nodeScale = null
  let edgeScale = null
  let resizeObserver = null

  /**
   * -----------------------------------------------------------------------------
   * VERIFICAÇÕES INICIAIS
   * -----------------------------------------------------------------------------
   */

  // Verificando o container
  if (settings.container && typeof settings.container === 'object' && settings.container !== null && !isHTMLElement(settings.container)) {
    throw new Error('O objeto fornecido como container não é um elemento HTML válido.')
  } else if (settings.container && typeof settings.container === 'string') {
    settings.container = document.getElementById(settings.container)
    if (!settings.container) {
      throw new Error('Não há nenhum elemento para container válido com o seletor fornecido.')
    }
  }

  // Verificando os dados fornecidos
  if (!settings.data.nodes || !settings.data.edges) {
    throw new Error('O dados fornecidos não são válidos. Verifique se as propriedades nodes e edges estão presentes.')
  }

  /**
   * -----------------------------------------------------------------------------
   * INICIALIZAÇÕES
   * -----------------------------------------------------------------------------
   */

  // Iniciando o objeto de rede graphology
  initGraph()

  // Carregando os dados de rede
  loadData(settings.data)

  // Iniciando a sigma e o layout, se for o caso
  initSigma()

  /**
   * Carrega e formata os dados da rede e adiciona no objeto graph
   * @param {Object} data Dados para a rede no formato { nodes, edges }
   */
  function loadData (data) {
    // Criando os nós: lendo a extensão dos tamanhos, criando a função de escala e inserindo
    // o objeto formato no modelo de grafo
    const { minNodeSize, maxNodeSize } = settings
    nodesExtent = getExtent(data.nodes.map(n => n.attributes?.size || n.size || 1))
    nodeScale = linearScale(nodesExtent, [minNodeSize, maxNodeSize])
    data.nodes.forEach((n, index) => {
      // Atribuindo um tamanho arbitrário, caso não haja (sobrescreve valor 0)
      const size = n.attributes?.size || n.size || 1
      components.graph.addNode(n.key ?? n.id, {
        ...(n.attributes ?? {}),
        ...(n.position ? { x: n.position.x, y: n.position.y } : {}),
        ...omit(['key', 'id', 'attributes'], n), // caso os atributos estejam na rais do objeto
        index,
        size: nodeScale(size),
        originalSize: size,
        originalColor: n.attributes?.color ?? n.color ?? sigmaSettings.defaultNodeColor
      })
    })
    // Criando as arestas: lendo a extensão dos pesos, criando a função de escala e inserindo
    // o objeto formato no modelo de grafo
    const { minEdgeSize, maxEdgeSize } = settings
    edgesExtent = getExtent(data.edges.map(e => e.attributes?.size || e.attributes?.weight || e.size || e.weight || settings.defaultEdgeSize))
    edgeScale = linearScale(edgesExtent, [minEdgeSize, maxEdgeSize])
    data.edges.forEach((e, index) => {
      // Atribuindo um peso arbitrário, caso não haja (sobrescreve valor 0)
      const size = e.attributes?.size || e.attributes?.weight || e.size || e.weight || settings.defaultEdgeSize
      components.graph.mergeEdgeWithKey(`${e.source}->${e.target}`, e.source, e.target, {
        ...(e.attributes ?? {}),
        ...omit(['key', 'id', 'attributes'], e), // caso os atributos estejam na rais do objeto
        index,
        size: edgeScale(size),
        originalSize: size,
        originalColor: e.attributes?.color ?? e.color ?? sigmaSettings.defaultEdgeColor
      })
    })
  }

  /**
   * Inicia o objeto graph (graphology)
   */
  function initGraph () {
    // Iniciando o objeto de rede graphology
    components.graph = new Graph({
      type: settings.type,
      multi: settings.multi
    })
  }

  /**
   * Inicia o objeto sigma (Sigma)
   */
  function initSigma () {
    components.sigma = new Sigma(
      components.graph,
      settings.container,
      {
        ...sigmaSettings,
        // Programs
        nodeProgramClasses: {
          image: getNodeProgramImage(),
          border: NodeProgramBorder
        }
      }
    )
  }

  /**
   * -----------------------------------------------------------------------------
   * REDUCERS
   * -----------------------------------------------------------------------------
   */

  /**
   * Callback executada em cada nó antes da renderização
   * @param {Object} node Objeto do nó
   * @param {Object} data Dados de renderização do nó transitados pela Sigma
   * @returns Dados de renderização
   */
  function nodeReducer (node, data) {
    let greyed = false
    let hideLabel = false
    let highlighted = false

    // Esmaecendo inicialmente todos os nós quando há highlightedNeighbors ou os que
    // estão fora do highlightedNeighbors
    if (settings.grayOtherNodes && (state.highlightedNeighbors.size || state.highlightedNodes.size)) {
      hideLabel = true
      greyed = true
    }

    if (state.highlightedNeighbors.has(node) || state.highlightedNodes.has(node)) {
      hideLabel = false
      greyed = false
    }

    // Destacando os selectedNode ou hoveredNode
    if (state.selectedNode === node || state.hoveredNode === node) {
      highlighted = true
      hideLabel = false
      greyed = false
    }

    return {
      ...data,
      highlighted,
      label: hideLabel ? '' : data.label,
      color: greyed ? settings.greyedNodeColor : data.color,
      zIndex: greyed ? 0 : 1
    }
  }

  /**
   * Callback executada em cada aresta antes da renderização
   * @param {Object} edge Objeto da aresta
   * @param {Object} data Dados de renderização da aresta transitados pela Sigma
   * @returns Dados de renderização
   */
  function edgeReducer (edge, data) {
    let greyed = false
    let hidden = false
    let node = state.hoveredNode || state.selectedNode
    // Verificando se as arestas devem ser impressas
    if (settings.renderEdges) {
      // Verificando se há nó selecionado ou sobreposto pelo mouse e se a aresta não está ligada
      // a nenhum desses nós
      if (node && !components.graph.hasExtremity(edge, node)) {
        // Verificando se arestas são ocultas ou simplesmente esmaecidas
        if (settings.grayOtherEdges) {
          greyed = true
        } else {
          hidden = true
        }
      }
    } else {
      hidden = true
      // Verificando se há nó selecionado ou sobreposto pelo mouse e se a aresta está ligada
      // a algum nó selecionado ou sobreposto
      if (node && components.graph.hasExtremity(edge, node)) {
        hidden = false
      }
    }

    return {
      ...data,
      hidden,
      color: greyed ? settings.greyedEdgeColor : data.color,
      zIndex: greyed ? 0 : 1
    }
  }

  /**
   * -----------------------------------------------------------------------------
   * RENDERS
   * -----------------------------------------------------------------------------
   */

  /**
   * Função de renderização do nó realçado (hover) no contexto canvas
   * @param {Object} context Contexto canvas
   * @param {Object} data Dados de renderização do nó transitados pela Sigma
   */
  function hoverRenderer(context, data) {
    context.beginPath()
    context.fillStyle = settings.hoverBackgroundColor
    if (settings.hoverShadow) {
      context.shadowOffsetX = 0
      context.shadowOffsetY = 0
      context.shadowBlur = 8
      context.shadowColor = '#000'
    }
    context.arc(data.x, data.y, data.size + settings.hoverPadding, 0, Math.PI * 2)

    context.closePath()
    context.fill()
    context.shadowOffsetX = 0
    context.shadowOffsetY = 0
    context.shadowBlur = 0
  }

  /**
   * Função de renderização de labels no contexto canvas
   * @param {Object} context Contexto canvas
   * @param {Object} data Dados de renderização do nó transitados pela Sigma
   * @param {Object} config Configurações da Sigma
   */
  function labelRenderer(context, data, config) {
    // Para deixar o texto em negrito quando for de um nó selecionado ou sobreposto pelo mouse
    const highlighted = (data.key === state.selectedNode || data.key === state.hoveredNode)
    const size = config.labelSize
    const font = config.labelFont
    const weight = highlighted ? 'bold' : config.labelWeight

    context.fillStyle = highlighted ? '#000' : config.defaultLabelColor
    context.font = `${weight} ${size}px ${font}`

    context.fillText(data.label, data.x + data.size + 5, data.y + size / 3)
  }

  /**
   * -----------------------------------------------------------------------------
   * CONTROLADORES DO GRAFO
   * -----------------------------------------------------------------------------
   */

  /**
   * Mais zoom ao grafo
   */
  function zoomIn () {
    if (components.sigma) {
      const camera = components.sigma.getCamera()
      camera.animatedZoom()
    }
  }

  /**
   * Menos zoom ao grafo
   */
  function zoomOut () {
    if (components.sigma) {
      const camera = components.sigma.getCamera()
      camera.animatedUnzoom()
    }
  }

  /**
   * Restaura o estado da câmera para o inicial (reset zoom)
   */
  function resetCamera () {
    if (components.sigma) {
      const camera = components.sigma.getCamera()
      // Posição inicial
      camera.animate({ ratio: 1, x: 0.5, y: 0.5 })
    }
  }

  /**
   * Manipula a câmera para exibir um determinado nó (e destacá-lo, se for o caso)
   * @param {String} node ID do nó
   * @param {Boolean} highlighted Indica se o nó será também destacado, com hoverNode. Default: false
   */
  function focusNode (node, highlighted = false) {
    if (components.sigma && node) {
      if (highlighted) {
        selectNode() // Limpando alguma seleção para evitar conflito
        hoverNode(node)
      } else {
        hoverNode() // Limpando outros destaques
      }
      const camera = components.sigma.getCamera()
      // Pegando a posição do nó
      const { x, y } = components.sigma.getNodeDisplayData(node)
      camera.animate({ x, y, angle: 0, ratio: 0.5 }, { duration: 500 })
    }
  }

  /**
   * Destaca um ou mais nós ou retira o destaque quando o parâmetro nodeIds não é informado
   * @param {string[]} nodeIds IDs dos nós. Default: null
   */
  function highlight (nodeIds = null, render = true) {
    if (nodeIds === null || nodeIds.length === 0) {
      state.highlightedNodes.clear()
      eventHub.emit('unhighlight', null)
    } else {
      state.highlightedNodes = new Set(nodeIds)
      eventHub.emit('highlight', nodeIds)
    }
    // Atualizando a renderização
    render && components.sigma.refresh()
  }

  /**
   * -----------------------------------------------------------------------------
   * EVENTOS (HANDLERS)
   * -----------------------------------------------------------------------------
   */

  /**
   * Insere um manipulador a um evento do HUB de eventos geral
   * @param {String} evt Evento a ser manipulado
   * @param {Function} handler Manipulador do evento
   */
  function on (evt, handler) {
    eventHub.on(evt, handler)
  }

  /**
   * Manipula o evento mouseout da área do grafo.
   * Evitando que a tooltip permaneça visível quando o mouse sai da área do grafo
   */
  function handleMouseout () {
    if (components.tooltip) {
      components.tooltip.hide()
    }
  }

  /**
   * Manipula o evento mouseenter sobre um nó
   * @param {string} node ID do nó
   * @param {object} event Evento sigma
   */
  function hoverNode (node = null, event = null) {
    if (node === state.hoveredNode) {
      return
    }
    // Disparando o evento leaveNode e informando qual nó foi deixado
    if (state.hoveredNode && !node) {
      eventHub.emit('leaveNode', { key: state.hoveredNode, attributes: components.graph.getNodeAttributes(state.hoveredNode) }, event)
    }
    // Atualizando o hoveredNode
    state.hoveredNode = node || null
    // Armazenamento dos vizinhos do hoveredNode: limpando totalmente quando não há nó selecionado ou
    // mantendo apenas os vizinhos do nó selecionado
    if (state.selectedNode) {
      state.highlightedNeighbors = new Set(components.graph.neighbors(state.selectedNode))
    } else {
      state.highlightedNeighbors.clear()
    }
    // Se há nó sobreposto: somando nós vizinhos com os vizinhos do nó selecionado, se for o caso
    // e disparando o evento hoverNode
    if (state.hoveredNode) {
      state.highlightedNeighbors = new Set([...state.highlightedNeighbors, ...components.graph.neighbors(node)])
      eventHub.emit('hoverNode', { key: state.hoveredNode, attributes: components.graph.getNodeAttributes(state.hoveredNode) }, event)
    }
    // Atualizando a renderização
    components.sigma.refresh()
  }

  /**
   * Manipula o evento de seleção de um nó (click)
   * @param {string} node ID do nó
   * @param {object} event Evento sigma
   */
  function selectNode (node = null, event = null) {
    if (node === state.selectedNode) {
      return
    }
    highlight(null, false)
    // Atualizando o nó selecionado
    state.selectedNode = node || null
    // Limpando todos os vizinhos dos últimos nós selecionado ou sobreposto
    state.highlightedNeighbors.clear()
    // Armazenando os vizinhos do nó selecionado e disparando o evento selectNode
    if (state.selectedNode) {
      state.highlightedNeighbors = new Set(components.graph.neighbors(node))
      eventHub.emit('selectNode', { key: state.selectedNode, attributes: components.graph.getNodeAttributes(state.selectedNode) }, event)
    }
    // Atualizando a renderização
    components.sigma.refresh()
  }

  /**
   * Manipula o evento enterNode da Sigma (mouseenter no nó)
   * @param {string} node ID do nó
   * @param {object} event Evento sigma
   */
  function onEnterNode ({ node, event }) {
    // Destacando o nó sobreposto
    hoverNode(node, event)
    // Exibindo a tooltip
    const nodeAttributes = components.graph.getNodeAttributes(node)
    components.tooltip.show(settings.tooltipFormatter(nodeAttributes), nodeAttributes.color)
    // Mudando o estilo do cursor
    settings.container.style.cursor = 'pointer'
  }

  /**
   * Manipula o evento leaveNode da Sigma (mouseout no nó)
   * @param {String} node ID do nó
   */
  function onLeaveNode () {
    // Tirando qualquer destaque de nó
    hoverNode()
    // Ocultando a tooltip
    components.tooltip.hide()
    // Mudando o estilo do cursor
    settings.container.style.cursor = 'default'
  }

  /**
   * -----------------------------------------------------------------------------
   * EVENTOS (LISTENERS)
   * -----------------------------------------------------------------------------
   */

  /**
   * Observa o redimensionamento do container do grafo e chama o resize da Sigma
   */
  resizeObserver = createResizeObserver(settings.container, () => {
    components.sigma && components.sigma.resize()
  })
  /**
   * Trata o evento enterNode da Sigma
   */
  components.sigma.on('enterNode', onEnterNode)
  /**
   * Trata o evento leaveNode da Sigma
   */
  components.sigma.on('leaveNode', onLeaveNode)
  /**
   * Trata o evento clickNode da Sigma
   */
  components.sigma.on('clickNode', (eData) => {
    selectNode(eData.node, eData.event)
  })
  /**
   * Trata o evento clickStage da Sigma.
   * Limpando qualquer seleção ou destaque em nós.
   */
  components.sigma.on('clickStage', () => {
    selectNode()
    hoverNode()
    eventHub.emit('clickStage', null)
  })
  /**
   * Trata o evento de movimentação do mouse sobre a Sigma.
   * Utilizado para repassar a posição do mouse para o componente de tooltip.
   *
   * ATENÇÃO: A utilização de margem no elemento <html> afeta os dados
   * de posicionamento correto do mouse.
   */
  components.sigma.getMouseCaptor().on('mousemove', (e) => {
    // console.info('move:', e.original.clientX, e.original.clientY)
    if (components.tooltip) {
      // Margens no elemento <html> podem afetar a posição X da tooltip e devem ser evitadas.
      // Margens laterais no elemento <body> devem ser calculadas.
      const documentStyle = window.getComputedStyle(document.documentElement)
      const marginLeft = Number(documentStyle.marginLeft.replace('px', '')) || 0
      components.tooltip.handleMousemove({ x: e.original.clientX + marginLeft, y: e.original.clientY })
    }
  })
  /**
   * Trata o evento mouseout da Sigma para, principalmente, ocultar a tooltip
   */
  components.sigma.elements.mouse.addEventListener('mouseout', handleMouseout)

  /**
   * -----------------------------------------------------------------------------
   * FUNCIONALIDADES GERAIS DA BIBLIOTECA
   * -----------------------------------------------------------------------------
   */

  /**
   * Reescala os tamanhos dos nós e/ou pesos das arestas
   * @param {Boolean} nodes Indica se os nós serão reescalados
   * @param {Boolean} edges Indica se as arestas serão reescaladas
   */
  function rescale (nodes = true, edges = true) {
    // Reescalando apenas os nós
    if (nodes) {
      const { minNodeSize, maxNodeSize } = settings
      // Recriando a função de escala com os novos valores
      nodeScale = linearScale(nodesExtent, [minNodeSize, maxNodeSize])
      components.graph.updateEachNodeAttributes((node, attr) => {
        return {
          ...attr,
          size: nodeScale(attr.originalSize)
        }
      })
    }
    // Reescalando apenas as arestas
    if (edges) {
      const { minEdgeSize, maxEdgeSize } = settings
      // Recriando a função de escala com os novos valores
      edgeScale = linearScale(edgesExtent, [minEdgeSize, maxEdgeSize])
      components.graph.updateEachEdgeAttributes((node, attr) => {
        return {
          ...attr,
          size: edgeScale(attr.originalSize)
        }
      })
    }
  }

  /**
   * Atualiza o valor de alguma configuração geral ou da Sigma
   * @param {String} key Nome da propriedade/configuração
   * @param {*} value Novo valor da configuração
   */
  function setSetting(key, value) {
    // Configurações da Sigma
    if (key in sigmaSettings) {
      components.sigma.setSetting(key, value)
      return
    }
    // Configurações gerais
    const scalableNodes = ['minNodeSize', 'maxNodeSize']
    const scalableEdges = ['minEdgeSize', 'maxEdgeSize']
    if (key in settings) {
      settings[key] = value
      if (scalableNodes.includes(key)) {
        rescale(true, false)
      }
      if (scalableEdges.includes(key)) {
        rescale(false, true)
      }
      components.sigma.refresh()
      return
    }
  }

  /**
   * Retorna o valor de alguma configuração geral ou da Sigma
   * @param {String} key Nome da propriedade/configuração
   * @returns valor da configuração ou undefined se não existir
   */
  function getSetting (key) {
    // Configurações da Sigma
    if (key in sigmaSettings) {
      return components.sigma.getSetting(key)
    }
    // Configurações gerais
    if (key in settings) {
      return settings[key]
    }
    return undefined
  }

  /**
   * Retorna o objeto graph (graphology)
   * @returns graph
   */
  function getGraph () {
    return components.graph
  }

  /**
   * Retorna o objeto sigma (Sigma)
   * @returns sigma
   */
  function getSigma () {
    return components.sigma
  }

  /**
   * Destrói a biblioteca e seus componentes
   */
  function kill () {
    resizeObserver && resizeObserver.disconnect()
    components.tooltip && components.tooltip.destroy()
    components.tooltip = null
    components.sigma && components.sigma.kill()
    components.sigma = null
    components.graph && components.graph.clear()
    components.graph = null
  }

  return {
    getGraph,
    getSigma,
    setSetting,
    getSetting,
    hoverNode,
    zoomIn,
    zoomOut,
    resetCamera,
    selectNode,
    focusNode,
    highlight,
    kill,
    on
  }
}
