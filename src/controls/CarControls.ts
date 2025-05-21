import { Object3D, PerspectiveCamera, Vector3 } from 'three';
import { KeyControls } from './KeyControls';
import { MouseControls } from './MouseControls';
import { Car } from '../Car';
import { RevoluteImpulseJoint } from '@dimforge/rapier3d';

export class CarControls {
  public keyControls: KeyControls;
  public mouseControls: MouseControls;
  public car?: Car;

  public constructor(domElement: HTMLElement, camera: PerspectiveCamera) {
    this.keyControls = new KeyControls();
    this.mouseControls = new MouseControls(domElement, camera);
  }

  public attachToCar(
    car: Car,
    offset: Vector3 = new Vector3(0, 1, 0)
  ): Object3D {
    this.car = car;

    this.mouseControls.attachToMesh(car.transmission.object3D, offset);

    this.keyControls.registerCallback((map) => {
      const targetVelocity = map.get('KeyW') ? 20 : map.get('KeyS') ? -8 : 0;
      const targetSteer = map.get('KeyA')
        ? Math.PI / 6
        : map.get('KeyD')
          ? -Math.PI / 6
          : 0;

      (this.car.wheelBLMotor as RevoluteImpulseJoint).configureMotorVelocity(
        targetVelocity,
        2.0
      );
      (this.car.wheelBRMotor as RevoluteImpulseJoint).configureMotorVelocity(
        targetVelocity,
        2.0
      );

      (this.car.wheelFLMotor as RevoluteImpulseJoint).configureMotorVelocity(
        targetVelocity,
        2.0
      );
      (this.car.wheelFRMotor as RevoluteImpulseJoint).configureMotorVelocity(
        targetVelocity,
        2.0
      );

      (this.car.flAxelJoint as RevoluteImpulseJoint).configureMotorPosition(
        targetSteer,
        100,
        10
      );
      (this.car.frAxelJoint as RevoluteImpulseJoint).configureMotorPosition(
        targetSteer,
        100,
        10
      );
    });

    return this.mouseControls.pivot;
  }

  public update(delta: number): void {
    if (!this.car?.ready) return;

    this.keyControls.update(delta);
    this.mouseControls.update();

    this.car.transmission.update();
    this.car.wheelFL.update();
    this.car.wheelFR.update();
    this.car.wheelBL.update();
    this.car.wheelBR.update();
    this.car.axelFL.update();
    this.car.axelFR.update();
  }
}
