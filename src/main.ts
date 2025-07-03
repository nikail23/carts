import {
  ColliderDesc,
  RigidBodyDesc,
  Vector3 as RapierVector3,
} from '@dimforge/rapier3d';
import './style.css';
import { GUI } from 'dat.gui';
import PhysicalObject from './scene/PhysicalObject';
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
  TextureLoader,
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
import { CubeColliderGroup } from './scene/ColliderGroup';
import { Ground } from './ground/Ground';

const light = createLight();

const cube = new PhysicalObject(
  new BoxGeometry(),
  new MeshStandardMaterial({ color: 0x555555 }),
  ColliderDesc.cuboid(0.5, 0.5, 0.5),
  RigidBodyDesc.dynamic()
);
cube.castShadow = true;
cube.collider.setCollisionGroups(CubeColliderGroup);
scene.addPhysical(cube);

let currentCar: Car;

const car = new Car();
await car.init('/models/car1.glb', new ThreeVector3(3, -1, 3));

const car2 = new Car();
await car2.init('/models/car2.glb', new ThreeVector3(-3, -1, -3));

car.addMeshesToScene(scene);
car2.addMeshesToScene(scene);

const controls = new CarControls(renderer.domElement, camera);
scene.add(controls.pivot);
car.attachController(controls);
currentCar = car;

const groundTexture = await new TextureLoader().loadAsync(
  '/textures/dirt_floor_diff_2k.jpg'
);
const ground = new Ground(renderer, 25, groundTexture);
ground.setPosition(new ThreeVector3(0, -2, 0));
ground.setRotation(
  new ThreeQuaternion().setFromAxisAngle(new ThreeVector3(1, 0, 0), 0.1)
);
ground.attachCars([car, car2]);
scene.add(ground.cameraHelper);
scene.addPhysical(ground);

light.target = car.transmission!;
scene.add(light);

const lightCameraHelper = new CameraHelper(light.shadow.camera);
lightCameraHelper.visible = false;
scene.add(lightCameraHelper);

let delta: number = 0;
const clock = new Clock();

const cars: Record<string, Car> = { mainCar: car, policeCar: car2 };
const carNames = Object.keys(cars);
const carSelection = { selected: carNames[0] };

const gui = new GUI();
gui.add(rapierDebugRenderer, 'enabled').name('Rapier Degug Renderer');
gui.add(lightCameraHelper, 'visible').name('Light Camera Helper');
gui.add(ground.cameraHelper, 'visible').name('Ground Camera Helper');
gui
  .add(carSelection, 'selected', carNames)
  .name('Car')
  .onChange((name: string) => {
    currentCar = cars[name];
    currentCar.attachController(controls);
    light.target = currentCar.transmission!;
  });

function animate() {
  requestAnimationFrame(animate);

  stats.update();

  delta = clock.getDelta();
  world.timestep = Math.min(delta, 0.1);
  world.step();

  scene.update(delta);

  car.update();
  car2.update();

  ground.update(delta);

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
