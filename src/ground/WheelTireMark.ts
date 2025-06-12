import {
  InstancedBufferAttribute,
  InstancedMesh,
  Mesh,
  Object3D,
  Vector3,
} from 'three';
import { tireMarkMaterial } from './TireMark.material';
import type { TireMark } from './TireMark.model';
import {
  TIRE_MARK_FADE_DELAY,
  TIRE_MARK_FADE_DURATION,
  TIRE_MARK_LIFETIME,
} from './TireMark.const';

export class WheelTireMark extends InstancedMesh {
  private _alpha: Float32Array;
  private _tireMarks: TireMark[] = [];
  private _tireMarkIndex = 0;
  private _maxTiresInstances: number;
  private _dummy = new Object3D();
  private _tireMarkLength: number;

  constructor(wheel: Object3D, maxTiresMarkInstances: number) {
    const wheelGeometry = (wheel as Mesh).geometry.clone();

    const alpha = new Float32Array(maxTiresMarkInstances);

    wheelGeometry.setAttribute(
      'instanceAlpha',
      new InstancedBufferAttribute(alpha, 1)
    );

    super(wheelGeometry, tireMarkMaterial, maxTiresMarkInstances);

    this._maxTiresInstances = maxTiresMarkInstances;
    this._alpha = alpha;
    this._tireMarkLength = wheelGeometry.boundingBox?.max.x;
  }

  public addTireMark(position: Vector3, rotation: number): void {
    this._tireMarks.push({
      position,
      rotation,
      lifetime: 0,
    });

    const nearest = this._tireMarks[this._tireMarks.length - 1];
    const distance = nearest.position.distanceTo(position);

    if (distance < this._tireMarkLength) {
      return;
    }

    if (this._tireMarks.length > this._maxTiresInstances) {
      this._tireMarks.shift();
    }
  }

  public update(delta: number): void {
    this._tireMarks.forEach((mark) =>
      this._paintTireAt(this._tireMarkIndex++, mark.position, mark.rotation)
    );

    this._tireMarks = this._tireMarks.filter(
      (mark) => mark.lifetime < TIRE_MARK_LIFETIME
    );

    this.count = this._tireMarks.length;

    if (!this._tireMarks.length) {
      return;
    }

    for (let i = 0; i < this._tireMarks.length; i++) {
      const mark = this._tireMarks[i];
      mark.lifetime += delta;
      console.log(`Tire mark lifetime: ${mark.lifetime.toFixed(2)}s`);

      let alpha = 1;

      if (mark.lifetime > TIRE_MARK_FADE_DELAY) {
        const fadeProgress = Math.min(
          (mark.lifetime - TIRE_MARK_FADE_DELAY) / TIRE_MARK_FADE_DURATION,
          1
        );
        alpha = 1 - fadeProgress;
      }

      this._alpha[i] = alpha;

      this._dummy.position.copy(mark.position);
      this._dummy.rotation.set(-Math.PI / 2, 0, mark.rotation);
      this._dummy.updateMatrix();

      this.setMatrixAt(i, this._dummy.matrix);
    }

    this.instanceMatrix.needsUpdate = true;

    const alphaAttribute = this.geometry.getAttribute(
      'instanceAlpha'
    ) as InstancedBufferAttribute;
    alphaAttribute.needsUpdate = true;
  }

  private _paintTireAt(index: number, position: Vector3, rotation: number) {
    this._dummy.position.copy(position);
    this._dummy.rotation.set(-Math.PI / 2, 0, rotation);

    this._dummy.updateMatrix();
    this.setMatrixAt(index, this._dummy.matrix);
    this.instanceMatrix.needsUpdate = true;
  }
}
