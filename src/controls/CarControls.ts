import { Object3D, PerspectiveCamera, Vector3 } from 'three';
import { KeyControls } from './KeyControls';
import { MouseControls } from './MouseControls';
import type { CarEvent, CarEventMap } from '../car/Car.model';
import type { Car } from '../car/Car';

export class CarControls {
  public keyControls: KeyControls;
  public mouseControls: MouseControls;

  public parent: Car | null = null;

  public constructor(domElement: HTMLElement, camera: PerspectiveCamera) {
    this.keyControls = new KeyControls();
    this.mouseControls = new MouseControls(domElement, camera);
  }

  public get pivot(): Object3D {
    return this.mouseControls.pivot;
  }

  public attachTo(
    object3D: Object3D,
    offset: Vector3 = new Vector3(0, 1, 0)
  ): void {
    this.mouseControls.attachToMesh(object3D, offset);
  }

  public update(): CarEventMap {
    this.mouseControls.update();

    const map = this.keyControls.update();

    return new Map([
      ['accelerate', map.get('KeyW')],
      ['brake', map.get('KeyS')],
      ['steer_left', map.get('KeyA')],
      ['steer_right', map.get('KeyD')],
      ['handbrake', map.get('Space')],
    ]);
  }
}
