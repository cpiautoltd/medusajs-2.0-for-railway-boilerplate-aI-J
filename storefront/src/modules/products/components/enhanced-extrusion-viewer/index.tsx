// src/modules/products/components/enhanced-extrusion-viewer.tsx
import React, { useRef, useEffect, useState, useCallback } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"

type EnhancedExtrusionViewerProps = {
  modelId: string
  length: number
  width?: number
  height?: number
  leftTap?: boolean
  rightTap?: boolean
  color?: string
  lod?: "low" | "medium" | "high"
  fallbackToGeneric?: boolean
}

const EnhancedExtrusionViewer = ({
  modelId,
  length,
  width = 1,
  height = 1,
  leftTap = false,
  rightTap = false,
  color = "#A9A9A9",
  lod = "medium",
  fallbackToGeneric = true,
}: EnhancedExtrusionViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const modelRef = useRef<THREE.Group | null>(null)
  const requestRef = useRef<number | null>(null)
  const loadingRef = useRef<HTMLDivElement | null>(null)

  // Status tracking
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [hasError, setHasError] = useState(false)
  const [isUsingFallback, setIsUsingFallback] = useState(false)

  // Initialize ThreeJS Scene
  const initThreeJS = useCallback(() => {
    if (!containerRef.current) return

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    )
    renderer.setClearColor(0xf5f5f5, 1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Setup scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf5f5f5)
    sceneRef.current = scene

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 5, 10)
    cameraRef.current = camera

    // Setup OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.25
    controls.enableZoom = true
    controls.autoRotate = false
    controls.update()
    controlsRef.current = controls

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 7.5)
    scene.add(directionalLight)

    const backLight = new THREE.DirectionalLight(0xffffff, 0.3)
    backLight.position.set(-5, -5, -5)
    scene.add(backLight)

    // Animation loop
    const animate = () => {
      requestRef.current = requestAnimationFrame(animate)

      if (controlsRef.current) {
        controlsRef.current.update()
      }

      renderer.render(scene, camera)
    }

    animate()
  }, [])

  // Load the model
  const loadModel = useCallback(async () => {
    if (!sceneRef.current) return

    setIsLoading(true)
    setLoadingProgress(0)
    setHasError(false)
    setIsUsingFallback(false)

    // Remove any existing model
    if (modelRef.current && sceneRef.current) {
      sceneRef.current.remove(modelRef.current)
      modelRef.current = null
    }

    // Create a loader
    const loader = new GLTFLoader()

    try {
      // Construct the URL to the model
      const modelUrl = `/api/models?id=${encodeURIComponent(
        modelId
      )}&lod=${lod}`

      // Set up progress tracking
      const onProgress = (event: ProgressEvent) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setLoadingProgress(progress)
        }
      }

      // Load the model
      const gltf = await new Promise<GLTF>((resolve, reject) => {
        loader.load(modelUrl, resolve, onProgress, reject)
      })

      // Process the loaded model
      const model = gltf.scene

      // Apply color to all meshes
      model.traverse((child: any) => {
        if (child instanceof THREE.Mesh) {
          if (child.material) {
            child.material = new THREE.MeshPhongMaterial({
              color: new THREE.Color(color),
              shininess: 80,
              specular: new THREE.Color(0x333333),
            })
          }
        }
      })

      // Adjust model scale if needed
      // const box = new THREE.Box3().setFromObject(model);
      // const size = box.getSize(new THREE.Vector3());

      // Scale the model to the desired length along X axis
      console.log("Scaling length", length)

      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3())
      console.log("Model base size:", size.x, "Desired length:", length)
      const scale = length / size.x
      console.log("Scale factor:", scale)
      model.scale.set(scale, 1, 1)

      // const scale = length / size.x;
      // model.scale.set(scale, scale, scale);

      // Add end taps if requested
      if (leftTap || rightTap) {
        // Recalculate bounding box after scaling
        const scaledBox = new THREE.Box3().setFromObject(model)
        const scaledSize = scaledBox.getSize(new THREE.Vector3())

        if (leftTap) {
          const leftTapGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16)
          leftTapGeometry.rotateZ(Math.PI / 2)
          const leftTapMaterial = new THREE.MeshPhongMaterial({
            color: 0x0066cc,
          })
          const leftTapMesh = new THREE.Mesh(leftTapGeometry, leftTapMaterial)
          leftTapMesh.position.set(
            scaledBox.min.x - 0.25,
            (scaledBox.min.y + scaledBox.max.y) / 2,
            (scaledBox.min.z + scaledBox.max.z) / 2
          )
          model.add(leftTapMesh)
        }

        if (rightTap) {
          const rightTapGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16)
          rightTapGeometry.rotateZ(Math.PI / 2)
          const rightTapMaterial = new THREE.MeshPhongMaterial({
            color: 0x00cc66,
          })
          const rightTapMesh = new THREE.Mesh(
            rightTapGeometry,
            rightTapMaterial
          )
          rightTapMesh.position.set(
            scaledBox.max.x + 0.25,
            (scaledBox.min.y + scaledBox.max.y) / 2,
            (scaledBox.min.z + scaledBox.max.z) / 2
          )
          model.add(rightTapMesh)
        }
      }

      // Center the model
      const newBox = new THREE.Box3().setFromObject(model)
      const center = newBox.getCenter(new THREE.Vector3())
      model.position.sub(center)

      // Add to scene
      sceneRef.current.add(model)
      modelRef.current = model

      // Position camera to view the model
      if (cameraRef.current && controlsRef.current) {
        const boundingBox = new THREE.Box3().setFromObject(model)
        const boundingSize = boundingBox.getSize(new THREE.Vector3())
        const maxDim = Math.max(boundingSize.x, boundingSize.y, boundingSize.z)

        cameraRef.current.position.set(maxDim * 2, maxDim, maxDim * 2)
        cameraRef.current.lookAt(0, 0, 0)
        controlsRef.current.update()
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error loading model:", error)

      if (fallbackToGeneric) {
        console.log("Using fallback generic model")
        setIsUsingFallback(true)
        await createGenericModel()
      } else {
        setHasError(true)
      }

      setIsLoading(false)
    }
  }, [modelId, lod, color, length, leftTap, rightTap, fallbackToGeneric])

  // Create a generic model as fallback
  const createGenericModel = useCallback(async () => {
    if (!sceneRef.current) return

    // Create a new group for the model
    const group = new THREE.Group()
    modelRef.current = group

    // Material for the extrusion
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(color),
      shininess: 80,
      specular: new THREE.Color(0x333333),
    })

    // Create a box for the main extrusion
    const boxGeometry = new THREE.BoxGeometry(length, height, width)
    const boxMesh = new THREE.Mesh(boxGeometry, material)
    group.add(boxMesh)

    // Add end taps if requested
    if (leftTap) {
      const leftTapGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16)
      leftTapGeometry.rotateZ(Math.PI / 2)
      const leftTapMaterial = new THREE.MeshPhongMaterial({ color: 0x0066cc })
      const leftTapMesh = new THREE.Mesh(leftTapGeometry, leftTapMaterial)
      leftTapMesh.position.set(-length / 2 - 0.25, 0, 0)
      group.add(leftTapMesh)
    }

    if (rightTap) {
      const rightTapGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16)
      rightTapGeometry.rotateZ(Math.PI / 2)
      const rightTapMaterial = new THREE.MeshPhongMaterial({ color: 0x00cc66 })
      const rightTapMesh = new THREE.Mesh(rightTapGeometry, rightTapMaterial)
      rightTapMesh.position.set(length / 2 + 0.25, 0, 0)
      group.add(rightTapMesh)
    }

    // Add to scene
    sceneRef.current.add(group)

    // Position camera to view the model
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(length * 2, length, length * 2)
      cameraRef.current.lookAt(0, 0, 0)
      controlsRef.current.update()
    }
  }, [length, width, height, color, leftTap, rightTap])

  // Initialize the scene
  useEffect(() => {
    initThreeJS()

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }

      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }
    }
  }, [initThreeJS])

  // Load or update the model when relevant props change
  useEffect(() => {
    if (sceneRef.current) {
      loadModel()
    }
  }, [loadModel])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current)
        return

      cameraRef.current.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      )
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="relative w-full h-64 md:h-96">
      <div
        ref={containerRef}
        className="w-full h-full rounded-md overflow-hidden bg-gray-50"
        aria-label="3D visualization of aluminum extrusion"
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-80">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <svg
                className="animate-spin h-8 w-8 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <p className="text-gray-700">Loading 3D Model...</p>
            <div className="w-48 bg-gray-200 rounded-full h-2.5 mt-2 mx-auto">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90">
          <div className="text-center p-4">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="mt-2 text-lg font-medium text-gray-900">
              Failed to load 3D model
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Please try again later or contact support.
            </p>
          </div>
        </div>
      )}

      {isUsingFallback && (
        <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white bg-opacity-70 px-2 py-1 rounded">
          Using generic model (original not found)
        </div>
      )}

      <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white bg-opacity-70 px-2 py-1 rounded">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  )
}

export default EnhancedExtrusionViewer