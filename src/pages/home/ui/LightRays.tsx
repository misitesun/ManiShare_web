/*
 * Adapted from the React Bits Light Rays component.
 * Copyright (c) 2026 David Haz.
 * MIT + Commons Clause License Condition v1.0:
 * https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md
 */

import { useEffect, useRef } from 'react'
import type { ReactElement } from 'react'
import { Color, Mesh, Program, Renderer, Triangle } from 'ogl'

type Vec2 = [number, number]
type Vec3 = [number, number, number]

type RaysOrigin =
    | 'top-center'
    | 'top-left'
    | 'top-right'
    | 'right'
    | 'left'
    | 'bottom-center'
    | 'bottom-right'
    | 'bottom-left'

interface LightRaysProps {
    raysOrigin?: RaysOrigin
    raysColor: string
    raysSpeed?: number
    lightSpread?: number
    rayLength?: number
    pulsating?: boolean
    fadeDistance?: number
    saturation?: number
    followMouse?: boolean
    mouseInfluence?: number
    noiseAmount?: number
    distortion?: number
}

interface RayPlacement {
    anchor: Vec2
    direction: Vec2
}

const CSS_VARIABLE_PATTERN = /^var\((--[\w-]+)\)$/

const VERTEX_SHADER = `
attribute vec2 position;
varying vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 rayPos;
uniform vec2 rayDir;
uniform vec3 raysColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform vec2 mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;

varying vec2 vUv;

float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float rayStrength(
  vec2 raySource,
  vec2 rayRefDirection,
  vec2 coord,
  float seedA,
  float seedB,
  float speed
) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);
  float distortedAngle = cosAngle
    + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
  float spreadFactor = pow(
    max(distortedAngle, 0.0),
    1.0 / max(lightSpread, 0.001)
  );
  float distance = length(sourceToCoord);
  float maxDistance = iResolution.x * rayLength;
  float lengthFalloff = clamp(
    (maxDistance - distance) / maxDistance,
    0.0,
    1.0
  );
  float fadeFalloff = clamp(
    (iResolution.x * fadeDistance - distance)
      / (iResolution.x * fadeDistance),
    0.5,
    1.0
  );
  float pulse = pulsating > 0.5
    ? 0.8 + 0.2 * sin(iTime * speed * 3.0)
    : 1.0;
  float baseStrength = clamp(
    (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed))
      + (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
    0.0,
    1.0
  );

  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  vec2 finalRayDir = rayDir;

  if (mouseInfluence > 0.0) {
    vec2 mouseScreenPos = mousePos * iResolution.xy;
    vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
    finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
  }

  vec4 rays1 = vec4(1.0) * rayStrength(
    rayPos,
    finalRayDir,
    coord,
    36.2214,
    21.11349,
    1.5 * raysSpeed
  );
  vec4 rays2 = vec4(1.0) * rayStrength(
    rayPos,
    finalRayDir,
    coord,
    22.3991,
    18.0234,
    1.1 * raysSpeed
  );

  fragColor = rays1 * 0.5 + rays2 * 0.4;

  if (noiseAmount > 0.0) {
    float n = noise(coord * 0.01 + iTime * 0.1);
    fragColor.rgb *= 1.0 - noiseAmount + noiseAmount * n;
  }

  float brightness = 1.0 - coord.y / iResolution.y;
  fragColor.x *= 0.1 + brightness * 0.8;
  fragColor.y *= 0.3 + brightness * 0.6;
  fragColor.z *= 0.5 + brightness * 0.5;

  if (saturation != 1.0) {
    float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
    fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
  }

  fragColor.rgb *= raysColor;
}

void main() {
  vec4 color;
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}
`

function getRayPlacement(origin: RaysOrigin, width: number, height: number): RayPlacement {
    const outside = 0.2

    switch (origin) {
        case 'top-left':
            return { anchor: [0, -outside * height], direction: [0, 1] }
        case 'top-right':
            return { anchor: [width, -outside * height], direction: [0, 1] }
        case 'left':
            return { anchor: [-outside * width, 0.5 * height], direction: [1, 0] }
        case 'right':
            return { anchor: [(1 + outside) * width, 0.5 * height], direction: [-1, 0] }
        case 'bottom-left':
            return { anchor: [0, (1 + outside) * height], direction: [0, -1] }
        case 'bottom-center':
            return { anchor: [0.5 * width, (1 + outside) * height], direction: [0, -1] }
        case 'bottom-right':
            return { anchor: [width, (1 + outside) * height], direction: [0, -1] }
        case 'top-center':
            return { anchor: [0.5 * width, -outside * height], direction: [0, 1] }
    }
}

function resolveColor(colorValue: string): Vec3 {
    const rootStyles = window.getComputedStyle(document.documentElement)
    const variableName = CSS_VARIABLE_PATTERN.exec(colorValue)?.[1]
    const resolvedColor =
        variableName === undefined ? colorValue : rootStyles.getPropertyValue(variableName).trim()
    const color = new Color(resolvedColor)

    return [color.r, color.g, color.b]
}

export function LightRays({
    raysOrigin = 'top-center',
    raysColor,
    raysSpeed = 1,
    lightSpread = 1,
    rayLength = 2,
    pulsating = false,
    fadeDistance = 1,
    saturation = 1,
    followMouse = true,
    mouseInfluence = 0.1,
    noiseAmount = 0,
    distortion = 0,
}: LightRaysProps): ReactElement {
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
        const uniforms = {
            iTime: { value: 0 },
            iResolution: { value: [1, 1] as Vec2 },
            rayPos: { value: [0, 0] as Vec2 },
            rayDir: { value: [0, 1] as Vec2 },
            raysColor: { value: resolveColor(raysColor) },
            raysSpeed: { value: raysSpeed },
            lightSpread: { value: lightSpread },
            rayLength: { value: rayLength },
            pulsating: { value: pulsating ? 1 : 0 },
            fadeDistance: { value: fadeDistance },
            saturation: { value: saturation },
            mousePos: { value: [0.5, 0.5] as Vec2 },
            mouseInfluence: { value: mouseInfluence },
            noiseAmount: { value: noiseAmount },
            distortion: { value: distortion },
        }
        const program = new Program(gl, {
            vertex: VERTEX_SHADER,
            fragment: FRAGMENT_SHADER,
            uniforms,
            transparent: true,
            depthTest: false,
            depthWrite: false,
        })
        const mesh = new Mesh(gl, { geometry, program })
        const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
        const finePointer = window.matchMedia('(pointer: fine)')
        const mousePosition = { x: 0.5, y: 0.5 }
        const smoothMousePosition = { x: 0.5, y: 0.5 }
        let animationFrame: number | undefined
        let isIntersecting = true
        let lastElapsedMilliseconds = 0
        let renderFailed = false

        function stopAnimation(): void {
            if (animationFrame === undefined) return
            window.cancelAnimationFrame(animationFrame)
            animationFrame = undefined
        }

        function renderFrame(elapsedMilliseconds: number): void {
            if (renderFailed) return
            lastElapsedMilliseconds = elapsedMilliseconds
            uniforms.iTime.value = elapsedMilliseconds * 0.001

            if (followMouse && finePointer.matches && mouseInfluence > 0) {
                const smoothing = 0.92
                smoothMousePosition.x =
                    smoothMousePosition.x * smoothing + mousePosition.x * (1 - smoothing)
                smoothMousePosition.y =
                    smoothMousePosition.y * smoothing + mousePosition.y * (1 - smoothing)
                uniforms.mousePos.value = [smoothMousePosition.x, smoothMousePosition.y]
            }

            try {
                renderer.render({ scene: mesh })
            } catch {
                renderFailed = true
                stopAnimation()
            }
        }

        function animate(elapsedMilliseconds: number): void {
            renderFrame(elapsedMilliseconds)
            if (!renderFailed) animationFrame = window.requestAnimationFrame(animate)
        }

        function syncAnimation(): void {
            stopAnimation()
            if (motionPreference.matches) {
                renderFrame(0)
                return
            }
            if (isIntersecting && document.visibilityState !== 'hidden' && !renderFailed) {
                animationFrame = window.requestAnimationFrame(animate)
            }
        }

        function resize(): void {
            const { width, height } = containerElement.getBoundingClientRect()
            renderer.setSize(Math.max(1, Math.round(width)), Math.max(1, Math.round(height)))
            const drawingWidth = gl.drawingBufferWidth
            const drawingHeight = gl.drawingBufferHeight
            uniforms.iResolution.value = [drawingWidth, drawingHeight]
            const placement = getRayPlacement(raysOrigin, drawingWidth, drawingHeight)
            uniforms.rayPos.value = placement.anchor
            uniforms.rayDir.value = placement.direction
            renderFrame(lastElapsedMilliseconds)
        }

        function syncTheme(): void {
            uniforms.raysColor.value = resolveColor(raysColor)
            renderFrame(lastElapsedMilliseconds)
        }

        function handlePointerMove(event: PointerEvent): void {
            if (!followMouse || !finePointer.matches) return
            const bounds = containerElement.getBoundingClientRect()
            if (bounds.width <= 0 || bounds.height <= 0) return
            mousePosition.x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width))
            mousePosition.y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height))
        }

        containerElement.appendChild(gl.canvas)
        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(containerElement)
        const themeObserver = new MutationObserver(syncTheme)
        themeObserver.observe(document.documentElement, {
            attributeFilter: ['data-theme'],
            attributes: true,
        })
        const intersectionObserver =
            typeof IntersectionObserver === 'undefined'
                ? undefined
                : new IntersectionObserver(
                      (entries): void => {
                          const [entry] = entries
                          if (entry === undefined) return
                          isIntersecting = entry.isIntersecting
                          syncAnimation()
                      },
                      { threshold: 0.1 },
                  )
        intersectionObserver?.observe(containerElement)
        motionPreference.addEventListener('change', syncAnimation)
        document.addEventListener('visibilitychange', syncAnimation)
        if (followMouse) {
            window.addEventListener('pointermove', handlePointerMove, { passive: true })
        }
        resize()
        syncAnimation()

        return (): void => {
            stopAnimation()
            resizeObserver.disconnect()
            themeObserver.disconnect()
            intersectionObserver?.disconnect()
            motionPreference.removeEventListener('change', syncAnimation)
            document.removeEventListener('visibilitychange', syncAnimation)
            if (followMouse) window.removeEventListener('pointermove', handlePointerMove)
            if (gl.canvas.parentNode === containerElement) containerElement.removeChild(gl.canvas)
            program.remove()
            gl.getExtension('WEBGL_lose_context')?.loseContext()
        }
    }, [
        distortion,
        fadeDistance,
        followMouse,
        lightSpread,
        mouseInfluence,
        noiseAmount,
        pulsating,
        rayLength,
        raysColor,
        raysOrigin,
        raysSpeed,
        saturation,
    ])

    return (
        <div
            ref={containerRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 size-full overflow-hidden"
        />
    )
}
