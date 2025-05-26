import { World } from '@dimforge/rapier3d';
import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import RapierDebugRenderer from './RapierDebugRenderer';

export const world = new World({ x: 0.0, y: -9.81, z: 0.0 });

export const scene = new Scene();

export const rapierDebugRenderer = new RapierDebugRenderer(scene, world);

export const camera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 2.5;

export const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

export const stats = new Stats();
document.body.appendChild(stats.dom);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

export function exponentialInterlopation(
  from: number,
  to: number,
  factor: number,
  k: number
): number {
  return from + (to - from) * Math.exp(-k * factor);
}
