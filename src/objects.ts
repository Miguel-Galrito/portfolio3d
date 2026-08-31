import * as THREE from 'three';
import { getLanguageColorAndGeometry, createOrbitLine } from './utils';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export interface RepoData {
  name: string;
  description: string;
  url: string;
  homepageUrl?: string | null;
  stars: number;
  forks: number;
  primaryLanguage: string;
  topics: string[];
  languages: {name: string, percentage: number}[];
}

export class OrbitalSystem {
  public core: THREE.Mesh;
  public satellites: THREE.Group[] = [];
  public orbitLines: THREE.Line[] = [];
  public group: THREE.Group;

  constructor(scene: THREE.Scene, private repos: RepoData[]) {
    this.group = new THREE.Group();
    scene.add(this.group);

    // Core - Glowing Volumetric Star
    const coreGeo = new THREE.SphereGeometry(3, 32, 32);
    const coreColor = new THREE.Color(0x0055aa).multiplyScalar(1.5);
    const coreMat = new THREE.MeshBasicMaterial({
      color: coreColor,
      transparent: true,
      opacity: 1.0,
    });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    
    // Core Outer Glow
    const glowGeo = new THREE.SphereGeometry(3.5, 32, 32);
    const glowColor = new THREE.Color(0x00aaff).multiplyScalar(1.5);
    const glowMat = new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.core.add(glowMesh);

    // Core Label
    const coreDiv = document.createElement('div');
    coreDiv.className = 'text-cyan-300 font-bold text-xs uppercase tracking-widest bg-orbitDark/50 px-2 py-1 rounded border border-cyan-500/50 backdrop-blur-sm shadow-[0_0_10px_rgba(0,240,255,0.2)] pointer-events-none';
    coreDiv.textContent = "PORTFOLIO-3D";
    const coreLabel = new CSS2DObject(coreDiv);
    coreLabel.position.set(0, 4, 0);
    this.core.add(coreLabel);

    // Core Data for HUD
    this.core.userData = {
      repo: {
        name: "portfolio3d",
        description: "Interactive 3D Orbital Command Portfolio powered by Vite, TypeScript, and Three.js.",
        url: "https://github.com/Miguel-Galrito/portfolio3d",
        homepageUrl: "https://miguel-galrito.github.io/portfolio3d",
        stars: 0, forks: 0,
        primaryLanguage: "TypeScript",
        topics: ["3d", "portfolio", "threejs"],
        languages: [{name: "TypeScript", percentage: 90}, {name: "HTML", percentage: 10}]
      }
    };
    
    this.group.add(this.core);

    this.createSatellites();
  }

  private createSatellites() {
    const numRepos = this.repos.length;
    if (numRepos === 0) return;

    const baseRadius = 8;
    const radiusStep = 4;

    this.repos.forEach((repo, index) => {
      const radius = baseRadius + (index * radiusStep);
      const speed = 0.5 / Math.sqrt(radius);
      const startAngle = Math.random() * Math.PI * 2;
      
      const { color, emissive, geometry } = getLanguageColorAndGeometry(repo.primaryLanguage);

      const satGroup = new THREE.Group();
      satGroup.userData = {
        repo,
        angle: startAngle,
        radius,
        speed,
        baseY: (Math.random() - 0.5) * 2
      };

      // Create primary mesh with better materials
      let material: THREE.Material;
      const lang = repo.primaryLanguage.toLowerCase();
      
      const boostedColor = new THREE.Color(color).multiplyScalar(1.2);
      const boostedEmissive = new THREE.Color(emissive).multiplyScalar(2.0);
      
      if (['typescript', 'html', 'css', 'javascript'].includes(lang)) {
        // Crystalline Web Monolith
        material = new THREE.MeshPhysicalMaterial({
          color: boostedColor, 
          emissive: boostedEmissive,
          emissiveIntensity: 1.0,
          roughness: 0.1,
          metalness: 0.1,
          transmission: 0.9,
          thickness: 0.5,
          ior: 1.5,
          transparent: true
        });
      } else if (['c++', 'c', 'rust', 'matlab', 'cmake'].includes(lang)) {
        // Metallic Aerospace Precision
        material = new THREE.MeshStandardMaterial({
          color: boostedColor, 
          emissive: boostedEmissive,
          emissiveIntensity: 1.0,
          roughness: 0.4,
          metalness: 0.9,
        });
        
        // Add orbital ring to aerospace nodes
        const ringGeo = new THREE.TorusGeometry(1.8, 0.05, 16, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.5 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        satGroup.add(ring);
      } else {
        // AI / Default - Data Pulse
        material = new THREE.MeshStandardMaterial({
          color: boostedColor, 
          emissive: boostedEmissive,
          emissiveIntensity: 1.5,
          roughness: 0.3,
          metalness: 0.5,
          wireframe: true
        });
        // Solid core inside wireframe
        const coreMat = new THREE.MeshBasicMaterial({ color: boostedEmissive });
        const innerMesh = new THREE.Mesh(geometry, coreMat);
        innerMesh.scale.setScalar(0.7);
        satGroup.add(innerMesh);
      }

      const mesh = new THREE.Mesh(geometry, material);
      satGroup.add(mesh);
      
      // Add HTML Label
      const nameDiv = document.createElement('div');
      nameDiv.className = 'text-cyan-300/80 text-[10px] uppercase tracking-widest bg-orbitDark/40 px-2 py-0.5 rounded border border-cyan-500/20 backdrop-blur-sm pointer-events-none';
      nameDiv.textContent = repo.name;
      
      const label = new CSS2DObject(nameDiv);
      label.position.set(0, 2, 0); // Above the planet
      satGroup.add(label);
      
      this.group.add(satGroup);
      this.satellites.push(satGroup);

      const orbitLine = createOrbitLine(radius);
      orbitLine.position.y = satGroup.userData.baseY;
      this.group.add(orbitLine);
      this.orbitLines.push(orbitLine);
    });
  }

  public update(time: number) {
    // Rotate core slowly
    this.core.rotation.y = time * 0.2;
    
    // Pulse core scale slightly
    const scale = 1 + Math.sin(time * 2) * 0.02;
    this.core.scale.set(scale, scale, scale);

    // Update satellites
    this.satellites.forEach((sat) => {
      const data = sat.userData;
      data.angle += data.speed * 0.02;
      
      sat.position.x = Math.cos(data.angle) * data.radius;
      sat.position.z = Math.sin(data.angle) * data.radius;
      sat.position.y = data.baseY + Math.sin(time + data.radius) * 0.5;
      
      // Rotate mesh itself
      sat.children.forEach(child => {
        child.rotation.x = time * 0.5;
        child.rotation.y = time * 0.7;
      });
    });
  }

  public getIntersectedSatellite(raycaster: THREE.Raycaster): THREE.Group | THREE.Mesh | null {
    // Check core first
    const coreIntersect = raycaster.intersectObject(this.core, true);
    if (coreIntersect.length > 0) {
      return this.core;
    }

    const intersects = raycaster.intersectObjects(this.satellites, true);
    if (intersects.length > 0) {
      let object: THREE.Object3D | null = intersects[0].object;
      while (object && object.parent && !object.userData.repo) {
        object = object.parent;
      }
      return object as THREE.Group;
    }
    return null;
  }
}
