import {
  ColliderDesc,
  RigidBodyDesc,
  Vector3 as RapierVector3,
  World,
  Quaternion,
} from '@dimforge/rapier3d';
import './style.css';
import RapierDebugRenderer from './RapierDebugRenderer';
import { GUI } from 'dat.gui';
import ObserverControls from './ObserverControls';
import Stats from 'three/addons/libs/stats.module.js';
import PhysicalObject from './PhysicalObject';
import {
  Mesh,
  BoxGeometry,
  MeshStandardMaterial,
  PlaneGeometry,
  DirectionalLight,
  Clock,
  WebGLRenderer,
  PerspectiveCamera,
  Scene,
  AmbientLight,
  Vector3 as ThreeVector3,
  Quaternion as ThreeQuaternion,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

const world = new World({ x: 0.0, y: -9.81, z: 0.0 });

const scene = new Scene();

const rapierDebugRenderer = new RapierDebugRenderer(scene, world);

const camera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 2.5;

const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const stats = new Stats();
document.body.appendChild(stats.dom);

const controls = new ObserverControls(camera, renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const physicalObjects: PhysicalObject[] = [];

const ground = new PhysicalObject(
  new Mesh(
    new PlaneGeometry(1000, 1000, 1, 1),
    new MeshStandardMaterial({ color: 0xffffff })
  ),
  world.createCollider(
    ColliderDesc.cuboid(500, 0.001, 500).setTranslation(0, -1, 0)
  )
);
ground.object3D.rotateX(-Math.PI / 2);
ground.object3D.position.y = -1;
ground.object3D.receiveShadow = true;

const cube = new PhysicalObject(
  new Mesh(new BoxGeometry(), new MeshStandardMaterial({ color: 0x555555 })),
  world.createCollider(
    ColliderDesc.cuboid(0.5, 0.5, 0.5),
    world.createRigidBody(RigidBodyDesc.dynamic())
  )
);
cube.object3D.castShadow = true;

const gltfLoader = new GLTFLoader();

const gltf = await gltfLoader.loadAsync('/models/cars.glb');

const carsGroup = gltf.scene;
carsGroup.traverse((child) => {
  if (child instanceof Mesh) {
    child.castShadow = true;
  }
});

const robberMesh = carsGroup.children[0] as Mesh;
const policeMesh = carsGroup.children[1] as Mesh;

const robber = new PhysicalObject(
  robberMesh,
  world.createCollider(
    ColliderDesc.trimesh(
      robberMesh.geometry.attributes.position.array as Float32Array,
      robberMesh.geometry.index?.array as Uint32Array
    ),
    world.createRigidBody(RigidBodyDesc.dynamic())
  )
);
robber.body?.setTranslation(new RapierVector3(3, 1, 3), false);
robber.body?.setRotation(
  new ThreeQuaternion().setFromAxisAngle(
    new ThreeVector3(1, 0, 0),
    Math.PI / 2
  ),
  false
);

physicalObjects.push(robber);
physicalObjects.push(cube);
physicalObjects.push(ground);

for (const object of physicalObjects) {
  scene.add(object.object3D);
}

const light = new DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
light.castShadow = true;
scene.add(light);

const ambientLight = new AmbientLight(0xffffff, 0.5);
ambientLight.position.set(0, 0, 0);
scene.add(ambientLight);

let delta: number = 0;
const clock = new Clock();

const gui = new GUI();
gui.add(rapierDebugRenderer, 'enabled').name('Rapier Degug Renderer');

function animate() {
  requestAnimationFrame(animate);

  controls.update(delta * 5);

  stats.update();

  delta = clock.getDelta();
  world.timestep = Math.min(delta, 0.1);
  world.step();

  for (const object of physicalObjects) {
    object.update();
  }

  rapierDebugRenderer.update();

  renderer.render(scene, camera);
}

animate();
