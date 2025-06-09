import { RigidBody, Collider } from '@dimforge/rapier3d';
import { Object3D, Quaternion, Vector3 } from 'three';

export default class PhysicalObject {
  public object3D: Object3D | null;
  public collider: Collider | null;
  public body: RigidBody | null;
  public baseRotation: Quaternion;
  public basePosition: Vector3;

  public constructor(object3D: Object3D, collider: Collider) {
    this.object3D = object3D;
    this.collider = collider;
    this.body = collider ? collider.parent() : null;
    this.baseRotation = new Quaternion();
    this.basePosition = new Vector3();
  }

  public update(): void {
    if (!this.body) return;

    const translation = this.body.translation();
    const rotation = this.body.rotation();

    this.object3D.position.copy(translation).add(this.basePosition);
    this.object3D.quaternion.copy(rotation).multiply(this.baseRotation);
  }
}
