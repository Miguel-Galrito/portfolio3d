import * as THREE from 'three';

export function getLanguageColorAndGeometry(lang: string): { color: number, emissive: number, geometry: THREE.BufferGeometry } {
  const normalizedLang = lang.toLowerCase();
  
  // C++ / Rust / MATLAB -> Dodecahedrons / Prism (Cyan/Blue)
  if (['c++', 'c', 'rust', 'matlab', 'cmake'].includes(normalizedLang)) {
    return {
      color: 0x0088ff,
      emissive: 0x0044aa,
      geometry: new THREE.DodecahedronGeometry(1)
    };
  }
  
  // Python / AI -> Icosahedrons (Amber/Orange)
  if (['python', 'jupyter notebook', 'r'].includes(normalizedLang)) {
    return {
      color: 0xff8800,
      emissive: 0xaa4400,
      geometry: new THREE.IcosahedronGeometry(1)
    };
  }
  
  // TypeScript / Web / Other -> Cubes (Emerald/Green)
  return {
    color: 0x00ff88,
    emissive: 0x00aa44,
    geometry: new THREE.BoxGeometry(1.2, 1.2, 1.2)
  };
}

export function lerp(start: number, end: number, t: number) {
  return start * (1 - t) + end * t;
}

export function createOrbitLine(radius: number): THREE.Line {
  const curve = new THREE.EllipseCurve(
    0,  0,            // ax, aY
    radius, radius,   // xRadius, yRadius
    0,  2 * Math.PI,  // aStartAngle, aEndAngle
    false,            // aClockwise
    0                 // aRotation
  );

  const points = curve.getPoints(50);
  // ellipse is in XY plane, we want it in XZ plane
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  geometry.rotateX(Math.PI / 2);

  const material = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.15 });
  return new THREE.Line(geometry, material);
}
