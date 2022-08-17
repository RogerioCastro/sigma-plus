/**
 * Retorna a extensão de uma array numérica.
 *
 * @param {[Number]} values - Iterável com os elementos a serem verificados.
 * @param {Function} valueof - Função accessor para cada elemento.
 *
 * @returns {array} Array com dois elementos, valores mínimo e máximo, respectivamente.
 */
export default function extent(values, valueof) {
  let min
  let max
  if (valueof === undefined) {
    for (const value of values) {
      if (value != null) {
        if (min === undefined) {
          if (value >= value) min = max = value
        } else {
          if (min > value) min = value
          if (max < value) max = value
        }
      }
    }
  } else {
    let index = -1
    for (let value of values) {
      if ((value = valueof(value, ++index, values)) != null) {
        if (min === undefined) {
          if (value >= value) min = max = value
        } else {
          if (min > value) min = value
          if (max < value) max = value
        }
      }
    }
  }
  return [min, max]
}
