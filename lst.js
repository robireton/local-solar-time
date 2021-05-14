import circle from './circle.js'
import { positionSun } from './meeus.js'

window.addEventListener('DOMContentLoaded', () => {
  if ('geolocation' in navigator) {
    const t0 = Date.now() - window.performance.now()
    navigator.geolocation.getCurrentPosition(
      position => {
        function getClockHandAngles (local, tick = false) {
          const second = ((local * 60 - Math.floor(local * 60)) * 60)

          return {
            hour: local * 360 / 12,
            minute: (local - Math.floor(local / 24)) * 360,
            second: (tick ? Math.floor(second) : second) * 6
          }
        }

        function getSunIconPosition (a, h, r0 = 90, Δr = 40) {
          const azimuth = circle.DegreesToRadians(a)
          const elevation = circle.DegreesToRadians(h)
          const r = r0 + Δr * Math.sin(elevation)

          return {
            x: -r * Math.sin(azimuth),
            y: r * Math.cos(azimuth)
          }
        }

        function findNoon () {
          const Δt = 360000 // milliseconds
          let x = { t: t0, a: positionSun((new Date(t0)), position.coords.latitude, position.coords.longitude).A }
          let y
          if (x.a < 180) {
            y = { t: x.t + Δt, a: positionSun((new Date(x.t + Δt)), position.coords.latitude, position.coords.longitude).A }
            while (y.a < 180) {
              x = y
              y = { t: x.t + Δt, a: positionSun((new Date(x.t + Δt)), position.coords.latitude, position.coords.longitude).A }
            }
          } else {
            y = { t: x.t - Δt, a: positionSun((new Date(x.t - Δt)), position.coords.latitude, position.coords.longitude).A }
            while (y.a > 180) {
              x = y
              y = { t: x.t - Δt, a: positionSun((new Date(x.t - Δt)), position.coords.latitude, position.coords.longitude).A }
            }
          }
          return y.t + (180 - y.a) * ((x.t - y.t) / (x.a - y.a)) // linear interpolation
        }

        function addEclipticDot (t, azimuth, elevation) {
          const pos = getSunIconPosition(azimuth, elevation)
          const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
          dot.setAttribute('cx', pos.x)
          dot.setAttribute('cy', pos.y)
          dot.setAttribute('r', 1.25 + elevation / 90 / 2)
          const title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
          title.textContent = `${(new Date(t)).toTimeString()}; azimuth: ${circle.DDtoDMS(azimuth)}; elevation: ${circle.DDtoDMS(elevation)}`
          dot.appendChild(title)
          document.getElementById('ecliptic').appendChild(dot)
        }

        function updateDisplay (timestamp) {
          const t = new Date(t0 + timestamp)
          const sun = positionSun(t, position.coords.latitude, position.coords.longitude)
          const local = circle.normalizedDegrees((t.getUTCHours() + t.getUTCMinutes() / 60 + t.getUTCSeconds() / 3600 + t.getUTCMilliseconds() / 3600000 + position.coords.longitude * 24 / 360 + sun.E / 60) * 15) / 15

          const angles = getClockHandAngles(local)
          document.getElementById('hour').setAttribute('transform', `rotate(${angles.hour})`)
          document.getElementById('minute').setAttribute('transform', `rotate(${angles.minute})`)
          document.getElementById('second').setAttribute('transform', `rotate(${angles.second})`)

          const pos = getSunIconPosition(sun.A, sun.h)
          document.getElementById('sun').setAttribute('transform', `translate(${pos.x} ${pos.y})`)
          document.getElementById('azimuth').innerHTML = `azimuth:<br><b>${circle.DDtoDMS(sun.A)}</b>`
          document.getElementById('elevation').innerHTML = `elevation:<br><b>${circle.DDtoDMS(sun.h)}</b>`

          window.requestAnimationFrame(updateDisplay)
        }

        (function () {
          const Δt = 24 * 60 * 60 * 1000 / 113 // number of milliseconds to give 113 ticks per circle
          const tNoon = findNoon()
          const dots = []
          let t = tNoon
          let sun = positionSun((new Date(t)), position.coords.latitude, position.coords.longitude)

          const A0 = sun.A
          while (sun.A <= A0) {
            dots.push({ t: t, a: sun.A, h: sun.h })
            t -= Δt
            sun = positionSun((new Date(t)), position.coords.latitude, position.coords.longitude)
          }
          t = tNoon + Δt
          sun = positionSun((new Date(t)), position.coords.latitude, position.coords.longitude)
          while (sun.A > A0) {
            dots.push({ t: t, a: sun.A, h: sun.h })
            t += Δt
            sun = positionSun((new Date(t)), position.coords.latitude, position.coords.longitude)
          }
          dots.sort((a, b) => a.t - b.t) // sorting only makes the DOM tidyier; makes no visual difference
          for (const d of dots) addEclipticDot(d.t, d.a, d.h)
        })()

        window.requestAnimationFrame(updateDisplay)
      },
      err => {
        console.log(`geo fail: ${err.code} (${err.message})`)
        switch (err.code) {
          case 1: // permission denied
            window.alert('Won’t work without position.')
            break

          case 2: // position unavailable
            window.alert('Your position is not available.')
            break

          case 3: // timeout
            window.alert('Stopped waiting for position. Reload page to retry.')
            break
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 1000,
        maximumAge: 600000
      }
    )
  } else {
    window.alert('geolocation not available')
  }
})
