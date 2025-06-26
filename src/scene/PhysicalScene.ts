import { Scene } from 'three';
import type PhysicalObject from './PhysicalObject';

export class PhysicalScene extends Scene {
  private _physicalObjects: PhysicalObject[] = [];

  public addPhysical(object: PhysicalObject): void {
    this._physicalObjects.push(object);

    super.add(object);
  }

  public update(delta: number): void {
    for (const object of this._physicalObjects) {
      object.update(delta);
    }
  }
}
