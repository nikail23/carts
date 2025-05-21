import { Camera } from 'three';
import { PointerLockControls } from 'three/examples/jsm/Addons.js';
import { KeyControls } from './KeyControls';

export class ObserverControls {
  private _pointerLockControls: PointerLockControls;
  private _keyControls: KeyControls;

  public constructor(camera: Camera, domElement: HTMLCanvasElement) {
    this._pointerLockControls = new PointerLockControls(camera, domElement);
    this._keyControls = new KeyControls();

    domElement.addEventListener('click', () => {
      this._pointerLockControls.lock();
    });

    this._keyControls.registerCallback((map, delta) => {
      if (!this._pointerLockControls.isLocked) return;
      if (map.get('KeyW')) {
        this._pointerLockControls.moveForward(delta);
      }
      if (map.get('KeyS')) {
        this._pointerLockControls.moveForward(-delta);
      }
      if (map.get('KeyA')) {
        this._pointerLockControls.moveRight(-delta);
      }
      if (map.get('KeyD')) {
        this._pointerLockControls.moveRight(delta);
      }
      if (map.get('Space')) {
        this._pointerLockControls.object.position.y += delta;
      }
      if (map.get('ShiftLeft')) {
        this._pointerLockControls.object.position.y -= delta;
      }
    });
  }

  public update(delta: number): void {
    this._keyControls.update(delta);
  }
}
