import { Object3D, PerspectiveCamera, Vector3 } from 'three';
import { KeyControls } from './KeyControls';
import { MouseControls } from './MouseControls';
import { Car, type CarEventMap } from '../Car';

export class CarControls {
  public keyControls: KeyControls;
  public mouseControls: MouseControls;

  public constructor(domElement: HTMLElement, camera: PerspectiveCamera) {
    this.keyControls = new KeyControls();
    this.mouseControls = new MouseControls(domElement, camera);
  }

  public attachToCar(
    car: Car,
    offset: Vector3 = new Vector3(0, 1, 0)
  ): Object3D {
    this.mouseControls.attachToMesh(car.transmission.object3D, offset);

    return this.mouseControls.pivot;
  }

  public update(): CarEventMap {
    this.mouseControls.update();

    const map = this.keyControls.update();

    return new Map([
      ['accelerate', map.get('KeyW')],
      ['brake', map.get('KeyS')],
      ['steer_left', map.get('KeyA')],
      ['steer_right', map.get('KeyD')],
    ]);
  }
}
