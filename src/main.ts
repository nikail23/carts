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
} from 'three';
import {
  camera,
  rapierDebugRenderer,
  renderer,
  scene,
  stats,
  world,
} from './global';
import { Car } from './Car/Car';
import { ObserverControls } from './controls';
import { CarControls } from './controls/CarControls';
import { CubeColliderGroup } from './ColliderGroup';

// const controls = new ObserverControls(camera, renderer.domElement);

const light = createLight();

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
scene.add(controls.pivot);
car.attachController(controls);

physicalObjects.push(cube);
physicalObjects.push(ground);

for (const object of physicalObjects) {
  scene.add(object.object3D);
}

light.target = car.transmission.object3D;
car.transmission.object3D.add(light);

const lightCameraHelper = new CameraHelper(light.shadow.camera);
lightCameraHelper.visible = false;
scene.add(lightCameraHelper);

const ambientLight = new AmbientLight(0xffffff, 0.2);
ambientLight.position.set(0, 0, 0);
scene.add(ambientLight);

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
    const car = cars[name];
    car.attachController(controls);
    light.removeFromParent();
    light.target = car.transmission.object3D;
    car.transmission.object3D.add(light);
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

  rapierDebugRenderer.update();

  renderer.render(scene, camera);
}

function createLight(): DirectionalLight {
  const light = new DirectionalLight(0xffffff, 1);
  light.position.set(15, 15, 15);
  light.castShadow = true;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 200;
  light.shadow.camera.left = -15;
  light.shadow.camera.right = 15;
  light.shadow.camera.top = 15;
  light.shadow.camera.bottom = -15;
  return light;
}

animate();
