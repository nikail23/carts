import "./style.css";
import * as THREE from "three";

const scene = new THREE.Scene();

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

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

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

function animate() {
  requestAnimationFrame(animate);

  delta = clock.getDelta();

  cube.rotation.x += delta;
  cube.rotation.y += delta;

  renderer.render(scene, camera);
}

animate();
