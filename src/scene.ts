import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OrbitalSystem, RepoData } from './objects';

export class SceneController {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  
  public orbitalSystem: OrbitalSystem | null = null;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  
  // Camera control variables
  private targetCameraPos = new THREE.Vector3(0, 20, 30);
  private targetCameraLookAt = new THREE.Vector3(0, 0, 0);
  private currentCameraLookAt = new THREE.Vector3(0, 0, 0);
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  
  // Orbital angles for camera
  private theta = Math.PI / 4;
  private phi = Math.PI / 3;
  private radius = 40;
  
  public focusedSatellite: THREE.Group | null = null;
  public onSatelliteClick: ((repo: RepoData) => void) | null = null;

  constructor(container: HTMLElement) {
    // Setup Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x070b19, 0.015);
    
    // Setup Camera
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.updateCameraTargetFromOrbit();
    this.camera.position.copy(this.targetCameraPos);
    this.camera.lookAt(this.currentCameraLookAt);

    // Setup Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x070b19);
    container.appendChild(this.renderer.domElement);

    // Post-Processing (Bloom)
    const renderScene = new RenderPass(this.scene, this.camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.2;
    bloomPass.strength = 1.2; // intense for sci-fi look
    bloomPass.radius = 0.5;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(bloomPass);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x112233);
    this.scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0x00f0ff, 2, 50);
    this.scene.add(pointLight); // Core light

    // Particles (Stars/Dust)
    this.createParticles();

    // Events
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    const canvas = this.renderer.domElement;
    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
    canvas.addEventListener('wheel', this.onWheel.bind(this));
    canvas.addEventListener('click', this.onClick.bind(this));
    canvas.addEventListener('touchstart', this.onTouchStart.bind(this), {passive: false});
    canvas.addEventListener('touchmove', this.onTouchMove.bind(this), {passive: false});
    canvas.addEventListener('touchend', this.onMouseUp.bind(this));
  }

  private createParticles() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 2000; i++) {
      vertices.push(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100
      );
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({ color: 0x88ccff, size: 0.1, transparent: true, opacity: 0.5 });
    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);
  }

  public initData(repos: RepoData[]) {
    this.orbitalSystem = new OrbitalSystem(this.scene, repos);
  }

  public update(time: number) {
    if (this.orbitalSystem) {
      this.orbitalSystem.update(time);
    }

    // Camera Lerping
    if (this.focusedSatellite) {
      // Offset camera slightly from satellite
      const satPos = this.focusedSatellite.position;
      const offset = new THREE.Vector3(satPos.x, satPos.y + 2, satPos.z + 5);
      
      // We want to smoothly look at the satellite while positioning nearby
      this.targetCameraPos.copy(offset);
      this.targetCameraLookAt.copy(satPos);
    } else {
      // Default orbit view
      this.updateCameraTargetFromOrbit();
      this.targetCameraLookAt.set(0, 0, 0);
    }

    this.camera.position.lerp(this.targetCameraPos, 0.05);
    this.currentCameraLookAt.lerp(this.targetCameraLookAt, 0.05);
    this.camera.lookAt(this.currentCameraLookAt);

    this.composer.render();
  }

  private updateCameraTargetFromOrbit() {
    this.targetCameraPos.x = this.radius * Math.sin(this.phi) * Math.cos(this.theta);
    this.targetCameraPos.y = this.radius * Math.cos(this.phi);
    this.targetCameraPos.z = this.radius * Math.sin(this.phi) * Math.sin(this.theta);
  }

  // --- Input Handling ---

  private handleDrag(dx: number, dy: number) {
    if (this.focusedSatellite) return; // Disable rotation when focused
    this.theta -= dx * 0.01;
    this.phi -= dy * 0.01;
    
    // Clamp phi to avoid flipping
    this.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.phi));
  }

  private onMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.previousMousePosition = { x: e.offsetX, y: e.offsetY };
  }

  private onMouseMove(e: MouseEvent) {
    if (this.isDragging) {
      const dx = e.offsetX - this.previousMousePosition.x;
      const dy = e.offsetY - this.previousMousePosition.y;
      this.handleDrag(dx, dy);
      this.previousMousePosition = { x: e.offsetX, y: e.offsetY };
    }
  }

  private onMouseUp() {
    this.isDragging = false;
  }

  private onTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  private onTouchMove(e: TouchEvent) {
    if (this.isDragging && e.touches.length === 1) {
      const dx = e.touches[0].clientX - this.previousMousePosition.x;
      const dy = e.touches[0].clientY - this.previousMousePosition.y;
      this.handleDrag(dx, dy);
      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  private onWheel(e: WheelEvent) {
    if (this.focusedSatellite) return;
    this.radius += e.deltaY * 0.05;
    this.radius = Math.max(10, Math.min(100, this.radius));
  }

  private onClick(e: MouseEvent) {
    if (this.isDragging && (Math.abs(e.offsetX - this.previousMousePosition.x) > 5)) return; // Ignore click if it was a drag

    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    if (this.orbitalSystem) {
      const hit = this.orbitalSystem.getIntersectedSatellite(this.raycaster);
      if (hit) {
        this.focusedSatellite = hit;
        if (this.onSatelliteClick) {
          this.onSatelliteClick(hit.userData.repo);
        }
      }
    }
  }

  public clearFocus() {
    this.focusedSatellite = null;
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }
}
