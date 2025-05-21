import { Object3D, PerspectiveCamera, Vector3 } from 'three';

export class MouseControls {
  public pivot = new Object3D();
  public yaw = new Object3D();
  public pitch = new Object3D();
  public target = new Object3D();
  public locked = false;

  protected static listenersInitialized = false;

  private _camera: PerspectiveCamera;

  public constructor(domElement: HTMLElement, camera: PerspectiveCamera) {
    this._camera = camera;
    this.target.position.set(0, 1, 0);
    this.pivot.add(this.yaw);
    this.yaw.add(this.pitch);
    this.pitch.add(camera);

    if (!MouseControls.listenersInitialized) {
      this._addPointerLockListeners(domElement);

      MouseControls.listenersInitialized = true;
    }
  }

  public attachToMesh(mesh: Object3D, offset: Vector3 = new Vector3(0, 0, 0)) {
    if (this.target.parent) {
      this.target.parent.remove(this.target);
    }

    this.target.position.copy(mesh.position).add(offset);

    mesh.add(this.target);
  }

  public update() {
    this.pivot.position.copy(this.target.getWorldPosition(new Vector3()));
  }

  private _onDocumentMouseMove(e: MouseEvent) {
    if (!this.locked) return;

    this.yaw.rotation.y -= e.movementX * 0.002;
    const v = this.pitch.rotation.x - e.movementY * 0.002;

    if (v > -1 && v < 0.1) {
      this.pitch.rotation.x = v;
    }
  }

  private _onDocumentMouseWheel(e: WheelEvent) {
    if (!this.locked) return;

    e.preventDefault();
    const v = this._camera.position.z + e.deltaY * 0.005;

    if (v >= 1 && v <= 10) {
      this._camera.position.z = v;
    }
  }

  private _pointerLockChange(domElement: HTMLElement) {
    this.locked = document.pointerLockElement === domElement;
  }

  private _addPointerLockListeners(domElement: HTMLElement) {
    document.addEventListener(
      'pointerlockchange',
      this._pointerLockChange.bind(this, domElement)
    );

    domElement.addEventListener(
      'mousemove',
      this._onDocumentMouseMove.bind(this)
    );

    domElement.addEventListener('wheel', this._onDocumentMouseWheel.bind(this));

    domElement.addEventListener('click', () => {
      domElement.requestPointerLock();
    });
  }
}
