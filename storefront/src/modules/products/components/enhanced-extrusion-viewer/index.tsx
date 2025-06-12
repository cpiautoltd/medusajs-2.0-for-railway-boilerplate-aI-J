// src/modules/products/components/enhanced-extrusion-viewer.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

type EnhancedExtrusionViewerProps = {
  modelId: string;
  length: number;
  unit?: "inch" | "mm";
  width?: number;
  height?: number;
  leftTap?: boolean;
  rightTap?: boolean;
  color?: string;
  lod?: "low" | "medium" | "high";
  fallbackToGeneric?: boolean;
};

const convertToMeters = (value: number, unit: "inch" | "mm"): number => {
  switch (unit) {
    case "inch":
      return value * 0.0254; // 1 inch = 0.0254 meters
    case "mm":
      return value * 0.001; // 1 mm = 0.001 meters
    default:
      throw new Error(`Unsupported unit: ${unit}`);
  }
};

const EnhancedExtrusionViewer = ({
  modelId,
  length,
  unit = "inch",
  width = 100,
  height = 100,
  leftTap = false,
  rightTap = false,
  color = "#A9A9A9",
  lod = "medium",
  fallbackToGeneric = true,
}: EnhancedExtrusionViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const requestRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [modelOpacity, setModelOpacity] = useState(1);
  const previousLengthRef = useRef<number>(length);
  
  // Smart zoom configuration - adjusted for much much further initial camera position
  const ZOOM_SENSITIVITY = 0.3; // Very subtle since we're starting from very far back
  const MIN_ZOOM_DISTANCE = 3.0; // Matches new minimum camera distance
  const MAX_ZOOM_DISTANCE = 150; // Much larger range for very long extrusions

  const initThreeJS = useCallback(() => {
    if (!containerRef.current) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0xf5f5f5, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    // Fixed camera settings - increased near plane and adjusted FOV
    const camera = new THREE.PerspectiveCamera(
      45, // Increased FOV for better perspective
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1, // Increased near plane to prevent clipping
      1000 // Increased far plane
    );
    camera.position.set(2, 2, 2); // More reasonable starting position
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.autoRotate = false;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    // Improved lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);
    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-5, -5, -5);
    scene.add(backLight);

    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();
  }, []);

  const loadModel = useCallback(async () => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;

    // Smooth loading transition - fade out current model
    if (!isInitialLoad) {
      setModelOpacity(0.3);
    }
    
    setIsLoading(true);
    setLoadingProgress(0);
    setHasError(false);
    setIsUsingFallback(false);

    // Save current camera position and target for non-initial loads
    const savedCameraPosition = isInitialLoad ? null : cameraRef.current.position.clone();
    const savedControlsTarget = isInitialLoad ? null : controlsRef.current.target.clone();
    
    // Calculate zoom adjustment based on length change
    const lengthRatio = isInitialLoad ? 1 : length / previousLengthRef.current;
    const zoomFactor = 1 + ((1 / lengthRatio - 1) * ZOOM_SENSITIVITY);

    // Remove existing model safely
    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          child.material?.dispose();
        }
      });
      modelRef.current = null;
    }

    const loader = new GLTFLoader();
    try {

      console.log("Trying out model : \n\n", modelId)


      const modelUrl = `/api/models?sku=${encodeURIComponent(modelId)}&lod=${lod}`;
      console.log("Loading model from:", modelUrl);
      const onProgress = (event: ProgressEvent) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setLoadingProgress(progress);
        }
      };

      const gltf = await loader.loadAsync(modelUrl, onProgress);
      const model = gltf.scene;

      // Apply material with initial opacity for smooth transition
      model.traverse((child: any) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(color),
            shininess: 80,
            specular: new THREE.Color(0x333333),
            transparent: true,
            opacity: isInitialLoad ? 1 : 0.3, // Start with low opacity for smooth transition
          });
        }
      });

      // Get the original model bounding box
      const originalBox = new THREE.Box3().setFromObject(model);
      const originalSize = originalBox.getSize(new THREE.Vector3());
      console.log("Original model size:", originalSize.x, originalSize.y, originalSize.z);

      // Convert desired length to meters
      const targetLengthInMeters = convertToMeters(length, unit);
      console.log(`Target length: ${length} ${unit} = ${targetLengthInMeters} meters`);

      // Calculate scale factor - assume model is in millimeters
      // Most GLTF models from CAD are exported in millimeters
      const modelLengthInMeters = originalSize.x * 0.001; // Convert mm to meters
      const scaleX = modelLengthInMeters !== 0 ? targetLengthInMeters / modelLengthInMeters : 1;
      
      console.log("Model length in meters:", modelLengthInMeters);
      console.log("Scale factor:", scaleX);

      // Apply scaling
      if (isNaN(scaleX) || !isFinite(scaleX) || scaleX <= 0) {
        console.error("Invalid scale factor:", scaleX, "Using fallback scale of 1");
        model.scale.set(1, 1, 1);
      } else {
        model.scale.set(scaleX, 1, 1); // Scale only X-axis (length)
      }

      // Add end taps if requested
      // if (leftTap || rightTap) {
      //   const scaledBox = new THREE.Box3().setFromObject(model);
      //   const tapRadius = 0.003;
      //   const tapLength = 0.005;

      //   if (leftTap) {
      //     const leftTapGeometry = new THREE.CylinderGeometry(tapRadius, tapRadius, tapLength, 16);
      //     leftTapGeometry.rotateZ(Math.PI / 2);
      //     const leftTapMaterial = new THREE.MeshPhongMaterial({ color: 0x0066cc });
      //     const leftTapMesh = new THREE.Mesh(leftTapGeometry, leftTapMaterial);
      //     leftTapMesh.position.set(
      //       scaledBox.min.x - tapLength / 2,
      //       (scaledBox.min.y + scaledBox.max.y) / 2,
      //       (scaledBox.min.z + scaledBox.max.z) / 2
      //     );
      //     model.add(leftTapMesh);
      //   }

      //   if (rightTap) {
      //     const rightTapGeometry = new THREE.CylinderGeometry(tapRadius, tapRadius, tapLength, 16);
      //     rightTapGeometry.rotateZ(Math.PI / 2);
      //     const rightTapMaterial = new THREE.MeshPhongMaterial({ color: 0x00cc66 });
      //     const rightTapMesh = new THREE.Mesh(rightTapGeometry, rightTapMaterial);
      //     rightTapMesh.position.set(
      //       scaledBox.max.x + tapLength / 2,
      //       (scaledBox.min.y + scaledBox.max.y) / 2,
      //       (scaledBox.min.z + scaledBox.max.z) / 2
      //     );
      //     model.add(rightTapMesh);
      //   }
      // }

      // Center the model
      const finalBox = new THREE.Box3().setFromObject(model);
      const center = finalBox.getCenter(new THREE.Vector3());
      model.position.sub(center);

      // Add to scene
      sceneRef.current.add(model);
      modelRef.current = model;

      // Position camera appropriately
      if (isInitialLoad) {
        // Initial load - set default camera position
        const boundingBox = new THREE.Box3().setFromObject(model);
        const boundingSize = boundingBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(boundingSize.x, boundingSize.y, boundingSize.z);
        
        console.log("Final bounding size:", boundingSize.x, boundingSize.y, boundingSize.z);
        console.log("Max dimension:", maxDim);

        // Calculate appropriate camera distance - much much further back for proper framing
        const cameraDistance = Math.max(maxDim * 25, 3.0); // Dramatically increased for proper overview
        
        // Position camera at an angle for better initial view - adjusted multipliers
        cameraRef.current.position.set(
          cameraDistance * 0.8,  // Further back on X
          cameraDistance * 0.6,  // Slightly higher on Y  
          cameraDistance * 0.8   // Further back on Z
        );
        cameraRef.current.lookAt(0, 0, 0);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
        
        setIsInitialLoad(false);
      } else {
        // Subsequent loads - restore saved camera position with smart zoom
        if (savedCameraPosition && savedControlsTarget) {
          // Apply smart zoom by adjusting camera distance from target
          const direction = savedCameraPosition.clone().sub(savedControlsTarget).normalize();
          const currentDistance = savedCameraPosition.distanceTo(savedControlsTarget);
          const newDistance = Math.max(MIN_ZOOM_DISTANCE, Math.min(MAX_ZOOM_DISTANCE, currentDistance * zoomFactor));
          
          const newCameraPosition = savedControlsTarget.clone().add(direction.multiplyScalar(newDistance));
          
          cameraRef.current.position.copy(newCameraPosition);
          controlsRef.current.target.copy(savedControlsTarget);
          controlsRef.current.update();
          
          console.log(`Smart zoom: length ratio ${lengthRatio.toFixed(2)}, zoom factor ${zoomFactor.toFixed(2)}, distance ${currentDistance.toFixed(2)} -> ${newDistance.toFixed(2)}`);
        }
      }
      
      // Smooth opacity transition
      if (!isInitialLoad) {
        // Animate opacity back to full
        const animateOpacity = () => {
          model.traverse((child: any) => {
            if (child instanceof THREE.Mesh && child.material) {
              const currentOpacity = child.material.opacity;
              if (currentOpacity < 1) {
                child.material.opacity = Math.min(1, currentOpacity + 0.05);
                requestAnimationFrame(animateOpacity);
              } else {
                // Animation complete, update state
                setModelOpacity(1);
              }
            }
          });
        };
        // Small delay to make transition more noticeable
        setTimeout(animateOpacity, 100);
      }
      
      // Update previous length for next comparison
      previousLengthRef.current = length;

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading model:", error);
      if (fallbackToGeneric) {
        console.log("Using fallback generic model");
        setIsUsingFallback(true);
        await createGenericModel();
      } else {
        setHasError(true);
        setIsLoading(false);
      }
    }
  }, [modelId, lod, color, length, unit, fallbackToGeneric, isInitialLoad, ZOOM_SENSITIVITY, MIN_ZOOM_DISTANCE, MAX_ZOOM_DISTANCE]);

  const createGenericModel = useCallback(async () => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;

    // Save current camera position and target for non-initial loads
    const savedCameraPosition = isInitialLoad ? null : cameraRef.current.position.clone();
    const savedControlsTarget = isInitialLoad ? null : controlsRef.current.target.clone();
    
    // Calculate zoom adjustment based on length change
    const lengthRatio = isInitialLoad ? 1 : length / previousLengthRef.current;
    const zoomFactor = 1 + ((1 / lengthRatio - 1) * ZOOM_SENSITIVITY);

    const group = new THREE.Group();
    modelRef.current = group;

    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(color),
      shininess: 80,
      specular: new THREE.Color(0x333333),
      transparent: true,
      opacity: isInitialLoad ? 1 : 0.3, // Start with low opacity for smooth transition
    });

    // Convert dimensions to meters
    const lengthInMeters = convertToMeters(length, unit);
    const widthInMeters = convertToMeters(width, unit);
    const heightInMeters = convertToMeters(height, unit);
    
    console.log("Generic model dimensions (meters):", lengthInMeters, heightInMeters, widthInMeters);

    // Create main box geometry
    const boxGeometry = new THREE.BoxGeometry(lengthInMeters, heightInMeters, widthInMeters);
    const boxMesh = new THREE.Mesh(boxGeometry, material);
    group.add(boxMesh);

    // Add taps if requested
    const tapRadius = Math.min(heightInMeters, widthInMeters) * 0.1;
    const tapLength = tapRadius * 2;

    if (leftTap) {
      const leftTapGeometry = new THREE.CylinderGeometry(tapRadius, tapRadius, tapLength, 16);
      leftTapGeometry.rotateZ(Math.PI / 2);
      const leftTapMaterial = new THREE.MeshPhongMaterial({ color: 0x0066cc });
      const leftTapMesh = new THREE.Mesh(leftTapGeometry, leftTapMaterial);
      leftTapMesh.position.set(-lengthInMeters / 2 - tapLength / 2, 0, 0);
      group.add(leftTapMesh);
    }

    if (rightTap) {
      const rightTapGeometry = new THREE.CylinderGeometry(tapRadius, tapRadius, tapLength, 16);
      rightTapGeometry.rotateZ(Math.PI / 2);
      const rightTapMaterial = new THREE.MeshPhongMaterial({ color: 0x00cc66 });
      const rightTapMesh = new THREE.Mesh(rightTapGeometry, rightTapMaterial);
      rightTapMesh.position.set(lengthInMeters / 2 + tapLength / 2, 0, 0);
      group.add(rightTapMesh);
    }

    sceneRef.current.add(group);

    // Position camera
    if (isInitialLoad) {
      // Initial load - set default camera position
      const boundingBox = new THREE.Box3().setFromObject(group);
      const boundingSize = boundingBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(boundingSize.x, boundingSize.y, boundingSize.z);
      const cameraDistance = Math.max(maxDim * 25, 3.0); // Much much further back for proper framing
      
      cameraRef.current.position.set(
        cameraDistance * 0.8,  // Further back on X
        cameraDistance * 0.6,  // Slightly higher on Y  
        cameraDistance * 0.8   // Further back on Z
      );
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
      
      setIsInitialLoad(false);
    } else {
      // Subsequent loads - restore saved camera position with smart zoom
      if (savedCameraPosition && savedControlsTarget) {
        // Apply smart zoom by adjusting camera distance from target
        const direction = savedCameraPosition.clone().sub(savedControlsTarget).normalize();
        const currentDistance = savedCameraPosition.distanceTo(savedControlsTarget);
        const newDistance = Math.max(MIN_ZOOM_DISTANCE, Math.min(MAX_ZOOM_DISTANCE, currentDistance * zoomFactor));
        
        const newCameraPosition = savedControlsTarget.clone().add(direction.multiplyScalar(newDistance));
        
        cameraRef.current.position.copy(newCameraPosition);
        controlsRef.current.target.copy(savedControlsTarget);
        controlsRef.current.update();
      }
    }
    
    // Smooth opacity transition for generic model
    if (!isInitialLoad) {
      // Animate opacity back to full
      const animateOpacity = () => {
        if (material.opacity < 1) {
          material.opacity = Math.min(1, material.opacity + 0.05);
          requestAnimationFrame(animateOpacity);
        } else {
          // Animation complete, update state
          setModelOpacity(1);
        }
      };
      // Small delay to make transition more noticeable
      setTimeout(animateOpacity, 100);
    }
    
    // Update previous length for next comparison
    previousLengthRef.current = length;

    setIsLoading(false);
  }, [length, width, height, color, unit, leftTap, rightTap, isInitialLoad, ZOOM_SENSITIVITY, MIN_ZOOM_DISTANCE, MAX_ZOOM_DISTANCE]);

  useEffect(() => {
    initThreeJS();
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [initThreeJS]);

  useEffect(() => {
    if (sceneRef.current) {
      loadModel();
    }
  }, [loadModel]);

  // Reset initial load flag when modelId changes (new model)
  useEffect(() => {
    setIsInitialLoad(true);
  }, [modelId]);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative w-full h-64 md:h-96">
      <div
        ref={containerRef}
        className="w-full h-full rounded-md overflow-hidden bg-gray-50"
        aria-label="3D visualization of aluminum extrusion"
      />
      {isLoading && isInitialLoad && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-700 text-sm">Loading 3D Model...</p>
          </div>
        </div>
      )}
      {isLoading && !isInitialLoad && (
        <div className="absolute top-2 left-2 flex items-center space-x-2 bg-white bg-opacity-90 px-3 py-1 rounded-full shadow-sm">
          <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-600">Updating...</span>
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
  );
};

export default EnhancedExtrusionViewer;