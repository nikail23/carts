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
cube.collider.setCollisionGroups(65542);

const car = new Car();
await car.init('/models/car1.glb', new ThreeVector3(3, 0, 3));

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

const ambientLight = new AmbientLight(0xffffff, 0.5);
ambientLight.position.set(0, 0, 0);
scene.add(ambientLight);

let delta: number = 0;
const clock = new Clock();

const gui = new GUI();
gui.add(rapierDebugRenderer, 'enabled').name('Rapier Degug Renderer');

const rotationController = {
  x: 0,
  y: 0,
  z: 0,
  update: () => {
    car.transmission.body.setRotation(
      new ThreeQuaternion(
        rotationController.x,
        rotationController.y,
        rotationController.z,
        1
      ),
      false
    );
  },
};

gui
  .add(rotationController, 'x', -Math.PI, Math.PI)
  .onChange(rotationController.update);
gui
  .add(rotationController, 'y', -Math.PI, Math.PI)
  .onChange(rotationController.update);
gui
  .add(rotationController, 'z', -Math.PI, Math.PI)
  .onChange(rotationController.update);

function animate() {
  requestAnimationFrame(animate);

  stats.update();

  delta = clock.getDelta();
  world.timestep = Math.min(delta, 0.1);
  world.step();

  for (const object of physicalObjects) {
    object.update();
  }

  controls.update(delta);

  rapierDebugRenderer.update();

  renderer.render(scene, camera);
}

animate();
