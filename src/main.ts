import {
  ColliderDesc,
  RigidBodyDesc,
  Vector3 as RapierVector3,
} from '@dimforge/rapier3d';
import './style.css';
import { GUI } from 'dat.gui';
import PhysicalObject from './PhysicalObject';
import {
  Mesh,
  BoxGeometry,
  MeshStandardMaterial,
  PlaneGeometry,
  DirectionalLight,
  Clock,
  AmbientLight,
  Vector3 as ThreeVector3,
  Quaternion as ThreeQuaternion,
} from 'three';
import {
  camera,
  rapierDebugRenderer,
  renderer,
  scene,
  stats,
  world,
} from './global';
import { Car } from './Car';
import { ObserverControls } from './controls';
import { CarControls } from './controls/CarControls';
import { CubeColliderGroup } from './ColliderGroup';

// const controls = new ObserverControls(camera, renderer.domElement);

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
cube.collider.setCollisionGroups(CubeColliderGroup);

const car = new Car();
await car.init('/models/car1.glb', new ThreeVector3(3, 0, 3));

const car2 = new Car();
await car2.init('/models/car2.glb', new ThreeVector3(-3, 0, -3));

const controls = new CarControls(renderer.domElement, camera);
const pivot = controls.attachToCar(car, new ThreeVector3(0, 0.5, 0));
scene.add(pivot);

physicalObjects.push(cube);
physicalObjects.push(ground);

for (const object of physicalObjects) {
  scene.add(object.object3D);
}

const light = new DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
light.castShadow = true;
scene.add(light);

const ambientLight = new AmbientLight(0xffffff, 0.2);
ambientLight.position.set(0, 0, 0);
scene.add(ambientLight);

let delta: number = 0;
const clock = new Clock();

const gui = new GUI();
gui.add(rapierDebugRenderer, 'enabled').name('Rapier Degug Renderer');

console.log('car1', car);

function animate() {
  requestAnimationFrame(animate);

  stats.update();

  delta = clock.getDelta();
  world.timestep = Math.min(delta, 0.1);
  world.step();

  for (const object of physicalObjects) {
    object.update();
  }

  const carEventMap = controls.update();

  car.update(carEventMap);

  car2.update();

  rapierDebugRenderer.update();

  renderer.render(scene, camera);
}

animate();
