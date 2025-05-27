import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

type ExtrusionModelViewerProps = {
  modelPath: string;
  length?: number;
  width?: number;
  height?: number;
  leftTap?: boolean;
  rightTap?: boolean;
  color?: string;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

const ExtrusionModelViewer: React.FC<ExtrusionModelViewerProps> = ({
  modelPath,
  length = 12,
  width,
  height,
  leftTap = false,
  rightTap = false,
  color = '#A9A9A9',
  className = '',
  onLoad,
  onError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const originalModelRef = useRef<THREE.Group | null>(null);
  const requestRef = useRef<number | null>(null);
  
  // Camera position and controls state tracking
  const cameraPositionRef = useRef<THREE.Vector3 | null>(null);
  const cameraTargetRef = useRef<THREE.Vector3 | null>(null);
  const initialViewSet = useRef<boolean>(false);
  
  // Model state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Cache for loaded models to improve performance
  const modelCache = useRef<Record<string, THREE.Group>>({});
  
  // Handle devicePixelRatio changes
  const devicePixelRatio = useMemo(() => 
    typeof window !== 'undefined' ? window.devicePixelRatio : 1, 
  []);

  // Initialize ThreeJS scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    try {
      // Setup renderer
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(devicePixelRatio);
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      renderer.setClearColor(0xf5f5f5, 1);
    //   renderer.srG = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Setup scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f5f5);
      sceneRef.current = scene;

      // Setup camera
      const camera = new THREE.PerspectiveCamera(
        45, 
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 15);
      cameraRef.current = camera;
      
      // Store initial camera position
      cameraPositionRef.current = camera.position.clone();
      
      // Setup OrbitControls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.enableZoom = true;
      controls.autoRotate = false;
      controls.update();
      controlsRef.current = controls;
      
      // Store initial controls target
      cameraTargetRef.current = controls.target.clone();

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 10, 7.5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
      scene.add(directionalLight);
      
      // Add a subtle back light
      const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
      backLight.position.set(-5, -5, -5);
      scene.add(backLight);
      
      // Add helper grid (commented out but useful for debugging)
      // const gridHelper = new THREE.GridHelper(20, 20);
      // scene.add(gridHelper);

      // Animation loop
      const animate = () => {
        requestRef.current = requestAnimationFrame(animate);
        
        if (controlsRef.current) {
          controlsRef.current.update();
        }
        
        renderer.render(scene, camera);
      };
      
      animate();
      setIsInitialized(true);

      // Cleanup
      return () => {
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
        }
        
        if (rendererRef.current && containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        
        if (modelRef.current && sceneRef.current) {
          sceneRef.current.remove(modelRef.current);
        }
        
        if (controlsRef.current) {
          controlsRef.current.dispose();
        }
        
        renderer.dispose();
      };
    } catch (err) {
      console.error('Error initializing 3D viewer:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize 3D viewer');
    }
  }, [devicePixelRatio]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save camera state
  const saveCameraState = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraPositionRef.current = cameraRef.current.position.clone();
      cameraTargetRef.current = controlsRef.current.target.clone();
    }
  };

  // Restore camera state
  const restoreCameraState = () => {
    if (cameraRef.current && controlsRef.current && cameraPositionRef.current && cameraTargetRef.current) {
      cameraRef.current.position.copy(cameraPositionRef.current);
      controlsRef.current.target.copy(cameraTargetRef.current);
      controlsRef.current.update();
    }
  };

  // Load and update the model
  useEffect(() => {
    if (!sceneRef.current || !isInitialized || !modelPath) return;
    
    // Save camera state before updating
    if (isInitialized && !isLoading) {
      saveCameraState();
    }
    
    // Remove any existing model
    if (modelRef.current && sceneRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }
    
    setIsLoading(true);
    setError(null);
    
    const loadModel = async () => {
      try {
        let model: THREE.Group;
        
        // Check if model is already in cache
        if (modelCache.current[modelPath]) {
          model = modelCache.current[modelPath].clone();
          console.log(`Using cached model: ${modelPath}`);
        } else {
          // Load the model
          const loader = new GLTFLoader();
          
          // Setup Draco decoder for compressed models
          const dracoLoader = new DRACOLoader();
          dracoLoader.setDecoderPath('/draco/');
          loader.setDRACOLoader(dracoLoader);
          
          // Determine the full path to the model
          const fullModelPath = modelPath.startsWith('/') 
            ? modelPath 
            : `/models/${modelPath}`;
          
          console.log(`Loading model: ${fullModelPath}`);
          
          const gltf = await new Promise<THREE.Group>((resolve, reject) => {
            loader.load(
              fullModelPath,
              (gltf) => {
                resolve(gltf.scene);
              },
              (xhr) => {
                // Progress callback
                console.log(`${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
              },
              (error:any) => {
                // Error callback
                reject(new Error(`Failed to load model: ${error.message}`));
              }
            );
          });
          
          model = gltf;
          
          // Cache the original model
          modelCache.current[modelPath] = model.clone();
        }
        
        // Store original model for reference
        originalModelRef.current = model.clone();
        
        // Apply material/color
        const newMaterial = new THREE.MeshPhongMaterial({
          color: new THREE.Color(color),
          shininess: 80,
          specular: new THREE.Color(0x333333)
        });
        
        model.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            // Store original material for reference
            if (!node.userData.originalMaterial) {
              node.userData.originalMaterial = node.material;
            }
            
            // Apply new material
            node.material = newMaterial;
            
            // Enable shadows
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });
        
        // Find bounding box to determine extrusion axis
        const bbox = new THREE.Box3().setFromObject(model);
        const dimensions = new THREE.Vector3();
        bbox.getSize(dimensions);
        
        // Determine extrusion axis (assume longest dimension is X)
        const extrusionAxis = 'x';
        
        // Scale model based on length
        const baseLength = dimensions.x;
        const scaleFactor = length / baseLength;
        
        // Apply scale to extrusion axis only
        if (extrusionAxis === 'x') {
          model.scale.x = scaleFactor;
        } else if (extrusionAxis === 'y') {
          model.scale.y = scaleFactor;
        } else {
          model.scale.z = scaleFactor;
        }
        
        // Add end taps if needed
        if (leftTap || rightTap) {
          // Create tap material
          const leftTapMaterial = new THREE.MeshPhongMaterial({ color: 0x0066cc });
          const rightTapMaterial = new THREE.MeshPhongMaterial({ color: 0x00cc66 });
          
          // Calculate tap positions based on model dimensions and scale
          const tapDiameter = Math.min(dimensions.y, dimensions.z) * 0.6;
          const tapLength = tapDiameter * 1.5;
          const xPos = (dimensions.x * scaleFactor) / 2;
          
          if (leftTap) {
            const leftTapGeometry = new THREE.CylinderGeometry(tapDiameter/2, tapDiameter/2, tapLength, 16);
            leftTapGeometry.rotateZ(Math.PI / 2);
            const leftTapMesh = new THREE.Mesh(leftTapGeometry, leftTapMaterial);
            leftTapMesh.position.set(-xPos - tapLength/2, 0, 0);
            leftTapMesh.castShadow = true;
            leftTapMesh.receiveShadow = true;
            model.add(leftTapMesh);
          }
          
          if (rightTap) {
            const rightTapGeometry = new THREE.CylinderGeometry(tapDiameter/2, tapDiameter/2, tapLength, 16);
            rightTapGeometry.rotateZ(Math.PI / 2);
            const rightTapMesh = new THREE.Mesh(rightTapGeometry, rightTapMaterial);
            rightTapMesh.position.set(xPos + tapLength/2, 0, 0);
            rightTapMesh.castShadow = true;
            rightTapMesh.receiveShadow = true;
            model.add(rightTapMesh);
          }
        }
        
        // Center the model
        const centeringBbox = new THREE.Box3().setFromObject(model);
        const center = centeringBbox.getCenter(new THREE.Vector3());
        model.position.sub(center);
        
        // Add to scene
        if(sceneRef?.current) {
            sceneRef.current.add(model);
        } else {
            console.log("SceneRed .current doesnt doesnt exist")
        }
        modelRef.current = model;
        
        // Set initial camera view if it's the first load
        if (!initialViewSet.current && cameraRef.current) {
          // Calculate appropriate camera distance based on model size
          const modelSize = dimensions.length();
          const distance = modelSize * 2.5;
          
          cameraRef.current.position.set(distance, distance/2, distance);
          cameraRef.current.lookAt(0, 0, 0);
          
          // Update the initial camera position reference
          cameraPositionRef.current = cameraRef.current.position.clone();
          if (controlsRef.current) {
            cameraTargetRef.current = controlsRef.current.target.clone();
          }
          
          initialViewSet.current = true;
        } else {
          // Restore previous camera position
          restoreCameraState();
        }
        
        setIsLoading(false);
        if (onLoad) onLoad();
      } catch (err) {
        console.error("Error loading model:", err);
        setError(err instanceof Error ? err.message : "Unknown error loading model");
        setIsLoading(false);
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      }
    };
    
    loadModel();
  }, [modelPath, length, leftTap, rightTap, color, isInitialized, onLoad, onError]);
  
  return (
    <div className={`relative w-full ${className}`}>
      <div 
        ref={containerRef} 
        className="w-full h-48 rounded-md overflow-hidden"
        aria-label="3D visualization of aluminum extrusion"
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
          <div className="text-sm font-medium text-gray-600">Loading model...</div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-20">
          <div className="text-sm font-medium text-red-600">Error: {error}</div>
        </div>
      )}
      
      <div className="absolute bottom-1 left-1 text-xs text-gray-500 bg-white bg-opacity-70 px-1 rounded">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
};

export default ExtrusionModelViewer;