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

    // Create central core
    const coreGeo = new THREE.IcosahedronGeometry(3, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x050510,
      emissive: 0x002244,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.core);

    // Add inner glow to core
    const innerCoreGeo = new THREE.IcosahedronGeometry(2.5, 2);
    const innerCoreMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.1
    });
    const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    this.core.add(innerCore);

    this.createSatellites();
  }

  private createSatellites() {
    const numRepos = this.repos.length;
    if (numRepos === 0) return;

    // Distribute orbits
    const baseRadius = 8;
    const radiusStep = 4;

    this.repos.forEach((repo, index) => {
      const radius = baseRadius + (index * radiusStep);
      const speed = 0.5 / Math.sqrt(radius); // Kepler's 3rd law approximation
      const startAngle = Math.random() * Math.PI * 2;
      
      const { color, emissive, geometry } = getLanguageColorAndGeometry(repo.primaryLanguage);

      // Create Satellite Group
      const satGroup = new THREE.Group();
      // Store custom data on userData
      satGroup.userData = {
        repo,
        angle: startAngle,
        radius,
        speed,
        baseY: (Math.random() - 0.5) * 2 // slight tilt or offset
      };

      // Create Satellite Mesh
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.9
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      // Wireframe overlay for technical look
      const wireMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.2 });
      const wireMesh = new THREE.Mesh(geometry, wireMat);
      mesh.add(wireMesh);

      satGroup.add(mesh);
      this.group.add(satGroup);
      this.satellites.push(satGroup);

      // Create Orbit Line
      const orbitLine = createOrbitLine(radius);
      orbitLine.position.y = satGroup.userData.baseY;
      this.group.add(orbitLine);
      this.orbitLines.push(orbitLine);
    });
  }

  public update(time: number) {
    // Rotate core slowly
    this.core.rotation.y = time * 0.1;
    this.core.rotation.x = time * 0.05;

    // Update satellites
    this.satellites.forEach((sat) => {
      const data = sat.userData;
      data.angle += data.speed * 0.02; // dt approx
      
      sat.position.x = Math.cos(data.angle) * data.radius;
      sat.position.z = Math.sin(data.angle) * data.radius;
      sat.position.y = data.baseY + Math.sin(time + data.radius) * 0.5; // slight bobbing
      
      // Rotate mesh itself
      if (sat.children[0]) {
        sat.children[0].rotation.x = time * 0.5;
        sat.children[0].rotation.y = time * 0.7;
      }
    });
  }

  public getIntersectedSatellite(raycaster: THREE.Raycaster): THREE.Group | null {
    const intersects = raycaster.intersectObjects(this.satellites, true);
    if (intersects.length > 0) {
      // Return the group containing the userData
      let object: THREE.Object3D | null = intersects[0].object;
      while (object && object.parent && !object.userData.repo) {
        object = object.parent;
      }
      return object as THREE.Group;
    }
    return null;
  }
}
