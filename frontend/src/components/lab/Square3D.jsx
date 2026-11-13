import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * Menara persegi 3D (Three.js): lantai ke-k berisi k × k kubus, untuk k = 1..n.
 * Seret untuk memutar. Visualisasi pendukung — tidak wajib untuk memahami materi.
 */
export default function Square3D({ n = 4 }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    const width = mount.clientWidth
    const height = 340
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 200)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.75))
    const light = new THREE.DirectionalLight(0xffffff, 0.9)
    light.position.set(10, 20, 12)
    scene.add(light)

    const group = new THREE.Group()
    const colors = [0x60a5fa, 0xa78bfa, 0x6ee7b7, 0xfacc15, 0x2563eb, 0xf472b6, 0x38bdf8, 0xfb923c]
    const geo = new THREE.BoxGeometry(0.92, 0.92, 0.92)
    // Persegi ke-k diletakkan berjajar ke samping, sehingga terlihat 1, 4, 9, 16, ...
    let offset = 0
    for (let k = 1; k <= n; k++) {
      const mat = new THREE.MeshStandardMaterial({ color: colors[(k - 1) % colors.length] })
      for (let r = 0; r < k; r++) {
        for (let c = 0; c < k; c++) {
          const cube = new THREE.Mesh(geo, mat)
          cube.position.set(offset + c, 0, r - k / 2)
          group.add(cube)
        }
      }
      offset += k + 1.2
    }
    const box = new THREE.Box3().setFromObject(group)
    const center = box.getCenter(new THREE.Vector3())
    group.position.sub(center)
    scene.add(group)

    const span = Math.max(8, offset)
    camera.position.set(0, span * 0.7, span * 0.9)
    camera.lookAt(0, 0, 0)

    let rotY = -0.4
    let rotX = 0
    let dragging = false
    let lastX = 0
    let lastY = 0
    const down = (e) => {
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
    }
    const move = (e) => {
      if (!dragging) return
      rotY += (e.clientX - lastX) * 0.01
      rotX = Math.max(-0.6, Math.min(0.6, rotX + (e.clientY - lastY) * 0.005))
      lastX = e.clientX
      lastY = e.clientY
    }
    const up = () => (dragging = false)
    const el = renderer.domElement
    el.style.touchAction = 'none'
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)

    let frame
    const loop = () => {
      group.rotation.y = rotY
      group.rotation.x = rotX
      renderer.render(scene, camera)
      frame = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      geo.dispose()
      group.children.forEach((m) => m.material.dispose())
      renderer.dispose()
      mount.removeChild(el)
    }
  }, [n])

  return <div ref={mountRef} className="w-full cursor-grab rounded-xl bg-navy-900" aria-label={`Visualisasi 3D persegi 1 sampai ${n}`} role="img" />
}
