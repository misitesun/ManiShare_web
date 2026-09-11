/*
 * Adapted from the React Bits Aurora component.
 * Copyright (c) 2026 David Haz.
 * MIT + Commons Clause License Condition v1.0:
 * https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md
 */

import { useEffect, useRef } from 'react'
import type { ReactElement } from 'react'
import { Color, Mesh, Program, Renderer, Triangle } from 'ogl'
import { getAuroraVerticalScale } from '../model/aurora-viewport'

const VERTEX_SHADER = `#version 300 es
in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;
uniform float uLightMode;
uniform float uVerticalScale;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,
    0.366025403784439,
    -0.577350269189626,
    0.024390243902439
  );
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = x0.x > x0.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
    permute(i.y + vec3(0.0, i1.y, 1.0))
      + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
    0.5 - vec3(
      dot(x0, x0),
      dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)
    ),
    0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec3 colorRamp(float position) {
  float factor = clamp(position, 0.0, 1.0);
  if (factor < 0.5) {
    return mix(uColorStops[0], uColorStops[1], factor * 2.0);
  }
  return mix(uColorStops[1], uColorStops[2], (factor - 0.5) * 2.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 auroraUv = vec2(uv.x, 1.0 - uv.y * uVerticalScale);
  vec3 rampColor = colorRamp(auroraUv.x);
  float height = snoise(vec2(auroraUv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = auroraUv.y * 2.0 - height + 0.2;
  float intensity = 0.6 * height;
  float midPoint = 0.20;
  float auroraAlpha = smoothstep(
    midPoint - uBlend * 0.5,
    midPoint + uBlend * 0.5,
    intensity
  );
  vec3 auroraColor = intensity * rampColor;

  if (uLightMode > 0.5) {
    float energy = clamp(max(intensity, 0.0), 0.0, 1.0);
    float coverage = clamp(auroraAlpha * (0.55 + 0.45 * energy), 0.0, 0.86);
    vec3 chroma = pow(clamp(rampColor, 0.0, 1.0), vec3(1.2));
    float chromaPeak = max(chroma.r, max(chroma.g, chroma.b));
    chroma /= max(chromaPeak, 0.0001);
    fragColor = vec4(mix(vec3(1.0), chroma, min(coverage * 1.08, 0.94)), 1.0);
  } else {
    fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
  }
}
`

type AuroraColorStops = readonly [string, string, string]
type RgbColor = [number, number, number]

interface AuroraProps {
    colorStops: AuroraColorStops
    amplitude?: number
    blend?: number
    speed?: number
}

const CSS_VARIABLE_PATTERN = /^var\((--[\w-]+)\)$/

function resolveColorStop(colorStop: string, rootStyles: CSSStyleDeclaration): RgbColor {
    const variableName = CSS_VARIABLE_PATTERN.exec(colorStop)?.[1]
    const resolvedColor =
        variableName === undefined ? colorStop : rootStyles.getPropertyValue(variableName).trim()
    const color = new Color(resolvedColor)

    return [color.r, color.g, color.b]
}

export function Aurora({
    colorStops,
    amplitude = 1,
    blend = 0.5,
    speed = 0.5,
}: AuroraProps): ReactElement {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect((): (() => void) | undefined => {
        const container = containerRef.current
        if (container === null) return undefined
        const containerElement = container

        let renderer: Renderer
        try {
            renderer = new Renderer({
                alpha: true,
                antialias: false,
                depth: false,
                dpr: Math.min(window.devicePixelRatio, 1.5),
                powerPreference: 'low-power',
                premultipliedAlpha: true,
                webgl: 2,
            })
        } catch {
            return undefined
        }

        const gl = renderer.gl
        gl.clearColor(0, 0, 0, 0)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
        gl.canvas.className = 'block size-full'

        const geometry = new Triangle(gl)
        if (geometry.attributes.uv !== undefined) delete geometry.attributes.uv

        const program = new Program(gl, {
            vertex: VERTEX_SHADER,
            fragment: FRAGMENT_SHADER,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            uniforms: {
                uTime: { value: 0 },
                uAmplitude: { value: amplitude },
                uColorStops: { value: [] },
                uResolution: { value: [1, 1] },
                uBlend: { value: blend },
                uLightMode: { value: 0 },
                uVerticalScale: { value: 1 },
            },
        })
        const mesh = new Mesh(gl, { geometry, program })
        const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
        let animationFrame: number | undefined
        let lastElapsedMilliseconds = 0

        function renderFrame(elapsedMilliseconds: number): void {
            lastElapsedMilliseconds = elapsedMilliseconds
            program.uniforms.uTime.value = elapsedMilliseconds * 0.001 * speed
            renderer.render({ scene: mesh })
        }

        function animate(elapsedMilliseconds: number): void {
            renderFrame(elapsedMilliseconds)
            animationFrame = window.requestAnimationFrame(animate)
        }

        function stopAnimation(): void {
            if (animationFrame === undefined) return
            window.cancelAnimationFrame(animationFrame)
            animationFrame = undefined
        }

        function syncTheme(): void {
            const rootElement = document.documentElement
            const rootStyles = window.getComputedStyle(rootElement)
            program.uniforms.uColorStops.value = colorStops.map((colorStop): RgbColor =>
                resolveColorStop(colorStop, rootStyles),
            )
            program.uniforms.uLightMode.value = rootElement.dataset.theme === 'light' ? 1 : 0
            renderFrame(lastElapsedMilliseconds)
        }

        function resize(): void {
            const { width, height } = containerElement.getBoundingClientRect()
            const nextWidth = Math.max(1, Math.round(width))
            const nextHeight = Math.max(1, Math.round(height))
            renderer.setSize(nextWidth, nextHeight)
            program.uniforms.uResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight]
            program.uniforms.uVerticalScale.value = getAuroraVerticalScale(
                gl.drawingBufferWidth,
                gl.drawingBufferHeight,
            )
            renderFrame(lastElapsedMilliseconds)
        }

        function syncMotionPreference(): void {
            stopAnimation()
            if (motionPreference.matches) {
                renderFrame(0)
                return
            }
            animationFrame = window.requestAnimationFrame(animate)
        }

        containerElement.appendChild(gl.canvas)
        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(containerElement)
        const themeObserver = new MutationObserver(syncTheme)
        themeObserver.observe(document.documentElement, {
            attributeFilter: ['data-theme'],
            attributes: true,
        })
        motionPreference.addEventListener('change', syncMotionPreference)
        syncTheme()
        resize()
        syncMotionPreference()

        return (): void => {
            stopAnimation()
            resizeObserver.disconnect()
            themeObserver.disconnect()
            motionPreference.removeEventListener('change', syncMotionPreference)
            if (gl.canvas.parentNode === containerElement) containerElement.removeChild(gl.canvas)
            program.remove()
            gl.getExtension('WEBGL_lose_context')?.loseContext()
        }
    }, [amplitude, blend, colorStops, speed])

    return (
        <div
            ref={containerRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 size-full"
        />
    )
}
