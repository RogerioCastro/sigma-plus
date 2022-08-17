/**
 * Função Curry que retorna outra função de escala baseada nos domain e range informados.
 * via: https://gist.github.com/vectorsize/7031902
 *
 * @param {[Number]} domain - Domínio de valores a serem escalados (extent) [min, max].
 * @param {[Number]} range - Extensão de valores a serem retornados [min, max].
 *
 * @returns {Number} Valor escalado.
 */
export default function linearScale (domain, range) {
  return function (value) {
    return ((value - domain[0]) / (domain[1] - domain[0])) * (range[1] - range[0]) + range[0]
  }
}
