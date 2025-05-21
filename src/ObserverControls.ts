import { Camera } from 'three';
import { PointerLockControls } from 'three/examples/jsm/Addons.js';
import { KeyMapControls } from './KeyMapControls';

export default class ObserverControls extends KeyMapControls {
  private _pointerLockControls: PointerLockControls;

  public constructor(camera: Camera, domElement: HTMLCanvasElement) {
    super();
    this._pointerLockControls = new PointerLockControls(camera, domElement);
    domElement.addEventListener('click', () => {
      this._pointerLockControls.lock();
    });
  }

  public update(delta: number): void {
    if (!this._pointerLockControls.isLocked) return;

    if (this.keyMap.get('KeyW')) {
      this._pointerLockControls.moveForward(delta);
    }

    if (this.keyMap.get('KeyS')) {
      this._pointerLockControls.moveForward(-delta);
    }

    if (this.keyMap.get('KeyA')) {
      this._pointerLockControls.moveRight(-delta);
    }

    if (this.keyMap.get('KeyD')) {
      this._pointerLockControls.moveRight(delta);
    }

    if (this.keyMap.get('Space')) {
      this._pointerLockControls.object.position.y += delta;
    }

    if (this.keyMap.get('ShiftLeft')) {
      this._pointerLockControls.object.position.y -= delta;
    }
  }
}
