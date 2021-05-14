'use strict'

export default {
  DegreesToRadians: degrees => degrees * Math.PI / 180,

  RadiansToDegrees: radians => radians * 180 / Math.PI,

  normalizedDegrees: degrees => {
    let value = Math.abs(degrees)
    if (value > 360) value -= (Math.floor(value / 360) * 360)

    return ((degrees < 0) ? (360 - value) : (value))
  },

  normalizedRadians: radians => {
    let value = radians
    while (value < 0) value += (2 * Math.PI)
    while (value > 2 * Math.PI) value -= (2 * Math.PI)

    return value
  },

  DDtoDMS: dd => {
    let value = Math.abs(dd)

    const degrees = Math.floor(value)
    value -= degrees
    value *= 60

    const minutes = Math.floor(value)
    value -= minutes
    value *= 60
    value = Math.floor(value)

    const parts = []
    if (value > 0) parts.unshift(`${value}ʺ`)
    if (parts.length || minutes > 0) parts.unshift(`${minutes}′`)
    parts.unshift(`${dd < 0 ? '-' : ''}${degrees}°`)

    return parts.join(' ') // narrow no-break space
  }
}
