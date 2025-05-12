import { RigidBody, Collider } from '@dimforge/rapier3d';
import { Object3D } from 'three';

export default class PhysicalObject {
  public object3D: Object3D;
  public collider: Collider;
  public body: RigidBody | null;

  public constructor(object3D: Object3D, collider: Collider) {
    this.object3D = object3D;
    this.collider = collider;
    this.body = collider.parent();
  }

  public update(): void {
    if (!this.body) return;

    const translation = this.body.translation();
    const rotation = this.body.rotation();

    this.object3D.position.copy(translation);
    this.object3D.quaternion.copy(rotation);
  }
}
