import {
  RigidBody,
  Collider,
  ColliderDesc,
  RigidBodyDesc,
} from '@dimforge/rapier3d';
import { BufferGeometry, Material, Mesh, Quaternion, Vector3 } from 'three';
import { world } from '../global';

export default class PhysicalObject extends Mesh {
  public collider: Collider;
  public body?: RigidBody;
  public baseRotation: Quaternion;
  public basePosition: Vector3;

  private _colliderDesc: ColliderDesc;
  private _rigidBodyDesc?: RigidBodyDesc;

  public constructor(
    geometry: BufferGeometry,
    material: Material | Material[],
    colliderDesc: ColliderDesc,
    rigidBodyDesc?: RigidBodyDesc
  ) {
    super(geometry, material);

    this._colliderDesc = colliderDesc;
    this._rigidBodyDesc = rigidBodyDesc;

    if (rigidBodyDesc) {
      this.body = world.createRigidBody(rigidBodyDesc);
    }

    this.collider = world.createCollider(colliderDesc, this.body);
    this.collider.setTranslation(this.position);

    this.baseRotation = new Quaternion();
    this.basePosition = new Vector3();
  }

  public cloneMesh(): Mesh {
    return new Mesh(this.geometry.clone(), this.material) as Mesh;
  }

  public update(delta?: number): void {
    if (!this.body) return;

    const translation = this.body.translation();
    const rotation = this.body.rotation();

    this.position.copy(translation).add(this.basePosition);
    this.quaternion.copy(rotation).multiply(this.baseRotation);
  }

  public setPosition(position: Vector3): void {
    if (!this.body) {
      this.collider.setTranslation(position);
    } else {
      this.body.setTranslation(position, true);
    }
    this.position.copy(position);
    this.updateMatrixWorld(true);
  }
  public setRotation(rotation: Quaternion): void {
    if (!this.body) {
      this.collider.setRotation(rotation);
      this.quaternion.copy(rotation);
    } else {
      this.body.setRotation(rotation, true);
      this.quaternion.copy(rotation).multiply(this.baseRotation);
    }
    this.updateMatrixWorld(true);
  }
}
