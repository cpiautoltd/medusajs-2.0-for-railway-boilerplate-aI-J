import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

type Extrusion3DViewerProps = {
  length: number;
  width?: number;
  height?: number;
  leftTap: boolean;
  rightTap: boolean;
  color?: string;
  profileType?: 'square' | 'rectangular' | 'circular' | 'channel' | 'custom';
  customModelUrl?: string;
}

const Extrusion3DViewer = ({
  length,
  width = 1,
  height = 1,
  leftTap,
  rightTap,
  color = '#A9A9A9',
  profileType = 'rectangular',
  customModelUrl
}: Extrusion3DViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const requestRef = useRef<number | null>(null);
  
  // Store camera and controls state
  const cameraPositionRef = useRef<THREE.Vector3 | null>(null);
  const cameraTargetRef = useRef<THREE.Vector3 | null>(null);
  const initialViewSet = useRef<boolean>(false);
  
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize ThreeJS Scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0xf5f5f5, 1);
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
    
    // Setup OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.autoRotate = false;
    controls.update();
    controlsRef.current = controls;

    // Store initial camera state
    cameraPositionRef.current = camera.position.clone();
    cameraTargetRef.current = controls.target.clone();

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);
    
    // Add a subtle back light
    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-5, -5, -5);
    scene.add(backLight);

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
  }, []);

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

  // Save camera position before update
  const saveCameraState = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraPositionRef.current = cameraRef.current.position.clone();
      cameraTargetRef.current = controlsRef.current.target.clone();
    }
  };

  // Restore camera position after update
  const restoreCameraState = () => {
    if (cameraRef.current && controlsRef.current && cameraPositionRef.current && cameraTargetRef.current) {
      cameraRef.current.position.copy(cameraPositionRef.current);
      controlsRef.current.target.copy(cameraTargetRef.current);
      controlsRef.current.update();
    }
  };

  // Build or update the extrusion model
  useEffect(() => {
    if (!sceneRef.current || !isInitialized) return;

    // Save current camera state before updating the model
    saveCameraState();

    // Clear any existing model
    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }

    // Create a new group to hold all parts
    const extrusionGroup = new THREE.Group();
    
    // Material for the extrusion
    const material = new THREE.MeshPhongMaterial({ 
      color: new THREE.Color(color),
      shininess: 80,
      specular: new THREE.Color(0x333333)
    });
    
    // Create the extrusion body based on profile type
    let extrusionBody: THREE.Mesh;
    
    // Scale for better visualization - the length is the main dimension
    // Keep the width and height proportional but smaller
    const scaledLength = Math.max(length / 12, 1); 
    const scaledWidth = width * 0.8;
    const scaledHeight = height * 0.8;
    
    switch (profileType) {
      case 'circular':
        const radius = Math.max(scaledWidth, scaledHeight) / 2;
        const cylinderGeometry = new THREE.CylinderGeometry(radius, radius, scaledLength, 32);
        // Orient along the X axis (length dimension)
        cylinderGeometry.rotateZ(Math.PI / 2); 
        extrusionBody = new THREE.Mesh(cylinderGeometry, material);
        break;
        
      case 'channel':
        // Create a channel (U-shaped) profile
        const channelShape = new THREE.Shape();
        const channelWidth = scaledWidth;
        const channelHeight = scaledHeight;
        const wallThickness = channelWidth * 0.15;
        
        channelShape.moveTo(-channelWidth/2, -channelHeight/2);
        channelShape.lineTo(channelWidth/2, -channelHeight/2);
        channelShape.lineTo(channelWidth/2, channelHeight/2);
        channelShape.lineTo(channelWidth/2 - wallThickness, channelHeight/2);
        channelShape.lineTo(channelWidth/2 - wallThickness, -channelHeight/2 + wallThickness);
        channelShape.lineTo(-channelWidth/2 + wallThickness, -channelHeight/2 + wallThickness);
        channelShape.lineTo(-channelWidth/2 + wallThickness, channelHeight/2);
        channelShape.lineTo(-channelWidth/2, channelHeight/2);
        channelShape.lineTo(-channelWidth/2, -channelHeight/2);
        
        const channelExtrudeSettings = {
          depth: scaledLength,
          bevelEnabled: false
        };
        
        const channelGeometry = new THREE.ExtrudeGeometry(channelShape, channelExtrudeSettings);
        channelGeometry.center();
        // Orient along the X axis for length
        channelGeometry.rotateY(Math.PI / 2);
        extrusionBody = new THREE.Mesh(channelGeometry, material);
        break;
        
      case 'square':
      case 'rectangular':
      default:
        // Create a box with the main dimension (length) along the X axis
        const boxGeometry = new THREE.BoxGeometry(scaledLength, scaledHeight, scaledWidth);
        extrusionBody = new THREE.Mesh(boxGeometry, material);
        break;
    }
    
    extrusionGroup.add(extrusionBody);
    
    // Add tap ends if requested - now at the ends of the X axis
    if (leftTap) {
      const leftTapGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16);
      // Orient the cylinder along the X axis
      leftTapGeometry.rotateZ(Math.PI / 2);
      const leftTapMaterial = new THREE.MeshPhongMaterial({ color: 0x0066cc });
      const leftTapMesh = new THREE.Mesh(leftTapGeometry, leftTapMaterial);
      // Position at the left end of the extrusion
      leftTapMesh.position.set(-scaledLength/2 - 0.25, 0, 0);
      extrusionGroup.add(leftTapMesh);
    }
    
    if (rightTap) {
      const rightTapGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16);
      // Orient the cylinder along the X axis
      rightTapGeometry.rotateZ(Math.PI / 2);
      const rightTapMaterial = new THREE.MeshPhongMaterial({ color: 0x00cc66 });
      const rightTapMesh = new THREE.Mesh(rightTapGeometry, rightTapMaterial);
      // Position at the right end of the extrusion
      rightTapMesh.position.set(scaledLength/2 + 0.25, 0, 0);
      extrusionGroup.add(rightTapMesh);
    }
    
    // Add the group to the scene
    sceneRef.current.add(extrusionGroup);
    modelRef.current = extrusionGroup;
    
    // Only set initial camera position if it's the first render
    if (!initialViewSet.current && cameraRef.current) {
      // Set a reasonable distance based on the length of the extrusion
      const cameraDistance = Math.max(scaledLength * 1.2, 5);
      cameraRef.current.position.z = cameraDistance;
      cameraRef.current.lookAt(0, 0, 0);
      
      // Update the initial camera position reference
      cameraPositionRef.current = cameraRef.current.position.clone();
      if (controlsRef.current) {
        cameraTargetRef.current = controlsRef.current.target.clone();
      }
      
      initialViewSet.current = true;
    } else {
      // Restore the previous camera position
      restoreCameraState();
    }
    
  }, [length, width, height, leftTap, rightTap, color, profileType, isInitialized]);
  
  return (
    <div className="relative w-full">
      <div 
        ref={containerRef} 
        className="w-full h-48 rounded-md overflow-hidden"
        aria-label="3D visualization of aluminum extrusion"
      />
      <div className="absolute bottom-1 left-1 text-xs text-gray-500 bg-white bg-opacity-70 px-1 rounded">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
};

export default Extrusion3DViewer;