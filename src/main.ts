import RAPIER from '@dimforge/rapier3d';
import './style.css';
import * as THREE from 'three';
import RapierDebugRenderer from './RapierDebugRenderer';
import { GUI } from 'dat.gui';
import ObserverControls from './ObserverControls';

const world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });

const scene = new THREE.Scene();

const rapierDebugRenderer = new RapierDebugRenderer(scene, world);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 2.5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new ObserverControls(camera, renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

world.createCollider(
  RAPIER.ColliderDesc.cuboid(500, 0.1, 500).setTranslation(0, -1, 0)
);

const cubeRigidBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic());

world.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5), cubeRigidBody);

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshStandardMaterial({ color: 0x555555 })
);
cube.castShadow = true;

const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(1000, 1000, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);
plane.rotateX(-Math.PI / 2);
plane.position.y = -1;
plane.receiveShadow = true;

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
light.castShadow = true;

scene.add(cube);
scene.add(plane);
scene.add(light);

let delta: number = 0;
const clock = new THREE.Clock();

const gui = new GUI();
gui.add(rapierDebugRenderer, 'enabled').name('Rapier Degug Renderer');

function animate() {
  requestAnimationFrame(animate);

  controls.update(delta * 5);

  delta = clock.getDelta();
  world.timestep = Math.min(delta, 0.1);
  world.step();

  cube.position.copy(cubeRigidBody.translation());

  rapierDebugRenderer.update();

  renderer.render(scene, camera);
}

animate();
