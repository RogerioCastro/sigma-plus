/**
 * Retorna o objeto informado omitindo as propriedades informadas.
 * Alternativa ao Lodash Omit (https://lodash.com/docs/4.17.15#omit)
 * via: https://stackoverflow.com/a/59447429
 *
 * @param {String[]} keys Propriedades a serem omitidas do objeto
 * @param {Object} obj Objeto a ser copiado
 * @returns {Object}
 */
export default function omit (keys, obj) {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([k]) => !keys.includes(k))
  )
}
