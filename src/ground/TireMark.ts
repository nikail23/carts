import {
  Color,
  InstancedBufferAttribute,
  InstancedMesh,
  MathUtils,
  Mesh,
  Object3D,
  Raycaster,
  Vector3,
} from 'three';
import { tireMarkMaterial } from './TireMark.material';
import type { TireMarkModel } from './TireMark.model';
import {
  TIRE_MARK_FADE_DELAY,
  TIRE_MARK_FADE_DURATION,
  TIRE_MARK_LIFETIME,
} from './TireMark.const';

export class TireMark extends InstancedMesh {
  private _alpha: Float32Array;
  private _tireMarks: TireMarkModel[] = [];
  private _maxTiresInstances: number;
  private _dummy = new Object3D();
  private _tireMarkLength: number;
  private _raycaster = new Raycaster();
  private _groundMesh: Mesh | null = null;

  constructor(
    wheel: Object3D,
    tireMarkInstances: number,
    groundMesh?: Mesh,
    color?: Color
  ) {
    const wheelGeometry = (wheel as Mesh).geometry.clone();

    const alpha = new Float32Array(tireMarkInstances);

    wheelGeometry.setAttribute(
      'instanceAlpha',
      new InstancedBufferAttribute(alpha, 1)
    );

    wheelGeometry.computeBoundingBox();

    tireMarkMaterial.uniforms.uColor.value = color || new Color(0, 0, 0);
    tireMarkMaterial.needsUpdate = true;

    super(wheelGeometry, tireMarkMaterial, tireMarkInstances);

    this._maxTiresInstances = tireMarkInstances;
    this._alpha = alpha;
    this._tireMarkLength = wheelGeometry.boundingBox?.max.x!;
    this._groundMesh = groundMesh || null;
  }

  public addTireMark(wheelPosition: Vector3, rotation: number): void {
    const groundPosition = this._projectToGround(wheelPosition);

    if (this._tireMarks.length > 0) {
      const lastMark = this._tireMarks[this._tireMarks.length - 1];
      const distance = lastMark.position.distanceTo(groundPosition);

      if (distance < this._tireMarkLength * 0.3) {
        return;
      }
    }

    this._tireMarks.push({
      position: groundPosition,
      rotation,
      lifetime: 0,
    });

    if (this._tireMarks.length > this._maxTiresInstances) {
      this._tireMarks.shift();
    }
  }

  public update(delta: number): void {
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

      this._paintTireAt(i, mark.position, mark.rotation);

      let alpha = this._applyDelay(1, mark.lifetime);
      this._alpha[i] = alpha;
    }

    const alphaAttribute = this.geometry.getAttribute(
      'instanceAlpha'
    ) as InstancedBufferAttribute;
    alphaAttribute.needsUpdate = true;
  }

  private _applyDelay(alpha: number, lifetime: number): number {
    if (lifetime < TIRE_MARK_FADE_DELAY) {
      return alpha;
    }

    const fadeProgress = Math.min(
      (lifetime - TIRE_MARK_FADE_DELAY) / TIRE_MARK_FADE_DURATION,
      1
    );

    return MathUtils.lerp(alpha, 0, fadeProgress);
  }

  private _paintTireAt(index: number, position: Vector3, rotation: number) {
    this._dummy.position.copy(position);
    this._dummy.rotation.set(-Math.PI / 2, 0, rotation);

    this._dummy.updateMatrix();
    this.setMatrixAt(index, this._dummy.matrix);
    this.instanceMatrix.needsUpdate = true;
  }

  private _projectToGround(wheelPosition: Vector3): Vector3 {
    if (!this._groundMesh) {
      return new Vector3(wheelPosition.x, wheelPosition.y, wheelPosition.z);
    }

    const groundNormal = new Vector3(0, 1, 0);
    groundNormal.applyQuaternion(this._groundMesh.quaternion);

    const rayDirection = groundNormal.clone().negate();

    const rayOrigin = wheelPosition
      .clone()
      .add(groundNormal.clone().multiplyScalar(5));

    this._raycaster.set(rayOrigin, rayDirection);

    const intersections = this._raycaster.intersectObject(
      this._groundMesh,
      true
    );

    if (intersections.length > 0) {
      return intersections[0].point;
    }

    const groundPosition = this._groundMesh.position;
    const localPosition = wheelPosition.clone().sub(groundPosition);

    const distanceAlongNormal = localPosition.dot(groundNormal);
    const projectedLocal = localPosition.sub(
      groundNormal.clone().multiplyScalar(distanceAlongNormal)
    );

    return projectedLocal.add(groundPosition);
  }
}
