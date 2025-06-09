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
  CameraHelper,
  ShaderMaterial,
} from 'three';
import {
  camera,
  rapierDebugRenderer,
  renderer,
  scene,
  stats,
  world,
} from './global';
import { Car } from './car/Car';
import { CarControls } from './controls/CarControls';
import { CubeColliderGroup } from './ColliderGroup';
import { Ground } from './ground/Ground';

const light = createLight();

const physicalObjects: PhysicalObject[] = [];

const cube = new PhysicalObject(
  new Mesh(new BoxGeometry(), new MeshStandardMaterial({ color: 0x555555 })),
  world.createCollider(
    ColliderDesc.cuboid(0.5, 0.5, 0.5),
    world.createRigidBody(RigidBodyDesc.dynamic())
  )
);
cube.object3D.castShadow = true;
cube.collider.setCollisionGroups(CubeColliderGroup);

let currentCar: Car;

const car = new Car();
await car.init('/models/car1.glb', new ThreeVector3(3, 0, 3));

const car2 = new Car();
await car2.init('/models/car2.glb', new ThreeVector3(-3, 0, -3));

const controls = new CarControls(renderer.domElement, camera);
scene.add(controls.pivot);
car.attachController(controls);
currentCar = car;

const ground = new Ground(renderer, [car, car2]);

physicalObjects.push(cube);
physicalObjects.push(ground);

for (const object of physicalObjects) {
  scene.add(object.object3D);
}

light.target = car.transmission.object3D;
scene.add(light);

const lightCameraHelper = new CameraHelper(light.shadow.camera);
lightCameraHelper.visible = false;
scene.add(lightCameraHelper);

let delta: number = 0;
const clock = new Clock();

const gui = new GUI();
gui.add(rapierDebugRenderer, 'enabled').name('Rapier Degug Renderer');
gui.add(lightCameraHelper, 'visible').name('Light Camera Helper');

const cars = { mainCar: car, policeCar: car2 };
const carNames = Object.keys(cars);
const carSelection = { selected: carNames[0] };
gui
  .add(carSelection, 'selected', carNames)
  .name('Car')
  .onChange((name: string) => {
    currentCar = cars[name];
    currentCar.attachController(controls);
    light.target = currentCar.transmission.object3D;
  });

function animate() {
  requestAnimationFrame(animate);

  stats.update();

  delta = clock.getDelta();
  world.timestep = Math.min(delta, 0.1);
  world.step();

  for (const object of physicalObjects) {
    object.update();
  }

  car.update();
  car2.update();

  ground.update();

  rapierDebugRenderer.update();

  renderer.render(scene, camera);
}

function createLight(): DirectionalLight {
  const light = new DirectionalLight(0xffffff, 1);
  light.position.set(150, 100, 115);
  light.castShadow = true;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 400;
  light.shadow.camera.left = -15;
  light.shadow.camera.right = 15;
  light.shadow.camera.top = 15;
  light.shadow.camera.bottom = -15;
  return light;
}

animate();
