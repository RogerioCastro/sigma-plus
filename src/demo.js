/* global dat */
import SigmaPlus from './index'
import debounce from './util/debounce'
import { json } from 'd3-fetch'

json('example.json')
  .then((data) => {
    // Mudando o tipo de alguns nós como exemplo
    data.nodes.forEach((n) => {
      if (n.attributes.level === 1) {
        n.attributes.type = 'border'
      }
      if (n.attributes.level === 0) {
        n.attributes.type = 'image'
        n.attributes.image = './wikipedia.svg'
      }
    })
    // Colocando pesos aleatórios nas arestas para demonstração
    data.edges.forEach((e) => {
      e.attributes.weight = Math.floor(Math.random() * (5 - 1) + 1)
    })

    const sigmaPlus = window.sigmaPlus = new SigmaPlus({
      data,
      container: 'main',
      tooltipFormatter: (node) => {
        return `
          <div><strong>${node.label}</strong></div>
          <div style="border-top: 1px solid #ebebeb; margin-top: 5px;">
            <small>Nível: <strong>${node.level}</strong>${node.seed ? ' (seed)' : ''}</small>
          </div>
        `
      }
    })

    sigmaPlus.on('selectNode', (params) => {
      console.log('[demo.min.js] selectedNode:', params)
    })

    const settings = {
      renderEdges: sigmaPlus.getSetting('renderEdges'),
      renderLabels: sigmaPlus.getSetting('renderLabels'),
      minNodeSize: sigmaPlus.getSetting('minNodeSize'),
      maxNodeSize: sigmaPlus.getSetting('maxNodeSize'),
      minEdgeSize: sigmaPlus.getSetting('minEdgeSize'),
      maxEdgeSize: sigmaPlus.getSetting('maxEdgeSize'),
      zoomIn: () => {
        sigmaPlus.zoomIn()
      },
      zoomOut: () => {
        sigmaPlus.zoomOut()
      },
      resetCamera: () => {
        sigmaPlus.resetCamera()
      },
      focus: () => {
        // Foco com destaque
        sigmaPlus.focusNode('data visualization', true)
      },
      select: () => {
        // Selecionando e colocando em foco
        sigmaPlus.selectNode('data profiling')
        sigmaPlus.focusNode('data profiling')
      },
      highlight: () => {
        // Destacando alguns nós
        sigmaPlus.highlight([
          'information design',
          'data presentation architecture',
          'data visualization',
          'interaction techniques'
        ])
      }
    }

    const gui = new dat.GUI({ name: 'graph' })
    gui.width = 300

    const render = gui.addFolder('Rendering')

    render
      .add(settings, 'renderLabels')
      .name('Show labels')
      .onChange(e => {
        sigmaPlus.setSetting('renderLabels', e)
      })
    render
      .add(settings, 'renderEdges')
      .name('Show edges')
      .onChange(e => {
        sigmaPlus.setSetting('renderEdges', e)
      })
    render
      .add(settings, 'minNodeSize', 2, 10, 1)
      .name('Node size (min)')
      .onChange(e => {
        debounce(sigmaPlus.setSetting, 500)('minNodeSize', e)
      })
    render
      .add(settings, 'maxNodeSize', 5, 50, 1)
      .name('Node size (max)')
      .onChange(e => {
        debounce(sigmaPlus.setSetting, 500)('maxNodeSize', e)
      })
    render
      .add(settings, 'minEdgeSize', 1, 5, 1)
      .name('Edge size (min)')
      .onChange(e => {
        debounce(sigmaPlus.setSetting, 500)('minEdgeSize', e)
      })
    render
      .add(settings, 'maxEdgeSize', 1, 10, 1)
      .name('Edge size (max)')
      .onChange(e => {
        debounce(sigmaPlus.setSetting, 500)('maxEdgeSize', e)
      })

    // render.open()

    const controls = gui.addFolder('Controls')

    controls
      .add(settings, 'zoomIn')
      .name('Zoom in +')
    controls
      .add(settings, 'zoomOut')
      .name('Zoom out −')
    controls
      .add(settings, 'resetCamera')
      .name('Reset camera')
    controls
      .add(settings, 'focus')
      .name('Focus test')
    controls
      .add(settings, 'select')
      .name('Select test')
    controls
      .add(settings, 'highlight')
      .name('Highlight')

    // controls.open()
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Erro na leitura dos dados JSON:', error)
  })
