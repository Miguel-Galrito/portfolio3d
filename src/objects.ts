import * as THREE from 'three';
import { getLanguageColorAndGeometry, createOrbitLine } from './utils';

export interface RepoData {
  name: string;
  description: string;
  url: string;
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
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x0055aa, // Darker blue base
      transparent: true,
      opacity: 0.9,
    });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    
    // Core Outer Glow
    const glowGeo = new THREE.SphereGeometry(3.5, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00aaff, // Less intense glow base
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.core.add(glowMesh);

    // Core Data for HUD
    this.core.userData = {
      repo: {
        name: "portfolio3d",
        description: "Interactive 3D Orbital Command Portfolio powered by Vite, TypeScript, and Three.js.",
        url: "https://github.com/Miguel-Galrito/portfolio3d",
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
      
      if (['typescript', 'html', 'css', 'javascript'].includes(lang)) {
        // Crystalline Web Monolith
        material = new THREE.MeshPhysicalMaterial({
          color, emissive,
          emissiveIntensity: 0.8, // Increased from 0.2
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
          color, emissive,
          emissiveIntensity: 0.8, // Increased from 0.4
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
          color, emissive,
          emissiveIntensity: 1.2, // Increased from 0.8
          roughness: 0.3,
          metalness: 0.5,
          wireframe: true
        });
        // Solid core inside wireframe
        const coreMat = new THREE.MeshBasicMaterial({ color: emissive });
        const innerMesh = new THREE.Mesh(geometry, coreMat);
        innerMesh.scale.setScalar(0.7);
        satGroup.add(innerMesh);
      }

      const mesh = new THREE.Mesh(geometry, material);
      satGroup.add(mesh);
      
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
