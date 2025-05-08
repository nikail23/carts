import { Camera } from 'three';
import { PointerLockControls } from 'three/examples/jsm/Addons.js';

export default class ObserverControls {
  private _pointerLockControls: PointerLockControls;
  private _keyMap: Map<string, boolean>;

  public constructor(camera: Camera, domElement: HTMLCanvasElement) {
    this._pointerLockControls = new PointerLockControls(camera, domElement);
    this._keyMap = new Map<string, boolean>();
    const onDocumentKey = (e: KeyboardEvent) => {
      this._keyMap.set(e.code, e.type === 'keydown');
    };
    document.addEventListener('keydown', onDocumentKey, false);
    document.addEventListener('keyup', onDocumentKey, false);
    domElement.addEventListener('click', () => {
      this._pointerLockControls.lock();
    });
  }

  public update(delta: number): void {
    if (!this._pointerLockControls.isLocked) return;

    if (this._keyMap.get('KeyW') || this._keyMap.get('ArrowUp')) {
      this._pointerLockControls.moveForward(delta);
    }

    if (this._keyMap.get('KeyS') || this._keyMap.get('ArrowDown')) {
      this._pointerLockControls.moveForward(-delta);
    }

    if (this._keyMap.get('KeyA') || this._keyMap.get('ArrowLeft')) {
      this._pointerLockControls.moveRight(-delta);
    }

    if (this._keyMap.get('KeyD') || this._keyMap.get('ArrowRight')) {
      this._pointerLockControls.moveRight(delta);
    }

    if (this._keyMap.get('Space')) {
      this._pointerLockControls.object.position.y += delta;
    }

    if (this._keyMap.get('ShiftLeft')) {
      this._pointerLockControls.object.position.y -= delta;
    }
  }
}
