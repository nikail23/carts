import {
  InstancedBufferAttribute,
  InstancedMesh,
  MathUtils,
  Mesh,
  Object3D,
  Raycaster,
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
  private _maxTiresInstances: number;
  private _dummy = new Object3D();
  private _tireMarkLength: number;
  private _raycaster = new Raycaster();
  private _groundMesh: Mesh | null = null;
  private _lastTireMarkTime = 0;
  private _baseThrottleInterval = 50;
  private _minThrottleInterval = 1;
  private _maxSpeed = 50;
  private _useSmoothThrottle = false; // флаг для использования сглаженного throttling

  constructor(
    wheel: Object3D,
    maxTiresMarkInstances: number,
    groundMesh?: Mesh
  ) {
    const wheelGeometry = (wheel as Mesh).geometry.clone();

    const alpha = new Float32Array(maxTiresMarkInstances);

    wheelGeometry.setAttribute(
      'instanceAlpha',
      new InstancedBufferAttribute(alpha, 1)
    );

    super(wheelGeometry, tireMarkMaterial, maxTiresMarkInstances);

    this._maxTiresInstances = maxTiresMarkInstances;
    this._alpha = alpha;
    this._tireMarkLength = wheelGeometry.boundingBox?.max.x!;
    this._groundMesh = groundMesh || null;
  }

  public addTireMark(
    wheelPosition: Vector3,
    rotation: number,
    speed: number = 0
  ): void {
    // Динамический throttling в зависимости от скорости
    const currentTime = Date.now();
    const dynamicInterval = this._useSmoothThrottle
      ? this._calculateSmoothDynamicThrottle(speed)
      : this._calculateDynamicThrottle(speed);

    if (currentTime - this._lastTireMarkTime < dynamicInterval) {
      return;
    }
    this._lastTireMarkTime = currentTime;

    // Проецируем позицию колеса на землю
    const groundPosition = this._projectToGround(wheelPosition);

    console.log(
      `Speed: ${speed.toFixed(2)}, Throttle interval: ${dynamicInterval.toFixed(0)}ms`
    );
    console.log(`Wheel position: `, wheelPosition);
    console.log(`Ground position: `, groundPosition);

    // Проверяем расстояние до последнего следа
    if (this._tireMarks.length > 0) {
      const lastMark = this._tireMarks[this._tireMarks.length - 1];
      const distance = lastMark.position.distanceTo(groundPosition);

      // Не добавляем след, если он слишком близко к предыдущему
      if (distance < this._tireMarkLength * 0.3) {
        // Уменьшили множитель для более частых следов
        console.log('Skip');
        return;
      }
    }

    this._tireMarks.push({
      position: groundPosition,
      rotation,
      lifetime: 0,
    });

    console.log(`Tire marks: `, this._tireMarks);

    // Ограничиваем количество следов
    if (this._tireMarks.length > this._maxTiresInstances) {
      this._tireMarks.shift();
    }
  }

  public update(delta: number): void {
    // Фильтруем устарелые следы
    this._tireMarks = this._tireMarks.filter(
      (mark) => mark.lifetime < TIRE_MARK_LIFETIME
    );

    // Устанавливаем количество активных экземпляров
    this.count = this._tireMarks.length;

    if (!this._tireMarks.length) {
      return;
    }

    // Рисуем каждый след по его индексу в массиве
    for (let i = 0; i < this._tireMarks.length; i++) {
      const mark = this._tireMarks[i];

      // Обновляем время жизни
      mark.lifetime += delta;

      // Рисуем след
      this._paintTireAt(i, mark.position, mark.rotation);

      // Вычисляем альфу с учетом fade эффекта
      let alpha = this._applyDelay(1, mark.lifetime);
      this._alpha[i] = alpha;
    }

    // Обновляем атрибуты
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

    // Используем Three.js lerp для плавного fade эффекта
    return MathUtils.lerp(alpha, 0, fadeProgress);
  }

  private _paintTireAt(index: number, position: Vector3, rotation: number) {
    this._dummy.position.copy(position);
    this._dummy.rotation.set(-Math.PI / 2, 0, rotation);

    this._dummy.updateMatrix();
    this.setMatrixAt(index, this._dummy.matrix);
    this.instanceMatrix.needsUpdate = true;
  }

  /**
   * Проецирует позицию колеса на землю с помощью рейкастинга
   * @param wheelPosition - позиция колеса в мировых координатах
   * @returns позиция на земле или исходная позиция, если земля не найдена
   */
  private _projectToGround(wheelPosition: Vector3): Vector3 {
    if (!this._groundMesh) {
      return new Vector3(wheelPosition.x, 0, wheelPosition.z);
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

  /**
   * Вычисляет динамический интервал throttling в зависимости от скорости
   * @param speed - скорость машины
   * @returns интервал в миллисекундах
   */
  private _calculateDynamicThrottle(speed: number): number {
    // Нормализуем скорость от 0 до 1
    const normalizedSpeed = Math.min(Math.abs(speed) / this._maxSpeed, 1);

    // Используем Three.js lerp для интерполяции между базовым и минимальным интервалом
    // При скорости 0: _baseThrottleInterval
    // При максимальной скорости: _minThrottleInterval
    const interval = MathUtils.lerp(
      this._baseThrottleInterval,
      this._minThrottleInterval,
      normalizedSpeed
    );

    return Math.max(interval, this._minThrottleInterval);
  }

  /**
   * Вычисляет динамический интервал throttling с плавной кривой
   * @param speed - скорость машины
   * @returns интервал в миллисекундах
   */
  private _calculateSmoothDynamicThrottle(speed: number): number {
    // Нормализуем скорость от 0 до 1
    const normalizedSpeed = Math.min(Math.abs(speed) / this._maxSpeed, 1);

    // Используем smoothstep для более реалистичной кривой
    const smoothed = MathUtils.smoothstep(normalizedSpeed, 0, 1);

    // Интерполируем с использованием сглаженного значения
    const interval = MathUtils.lerp(
      this._baseThrottleInterval,
      this._minThrottleInterval,
      smoothed
    );

    return Math.max(interval, this._minThrottleInterval);
  }

  /**
   * Устанавливает параметры динамического throttling
   * @param baseInterval - базовый интервал для медленной скорости (мс)
   * @param minInterval - минимальный интервал для высокой скорости (мс)
   * @param maxSpeed - максимальная скорость для расчета
   * @param useSmooth - использовать ли сглаженную кривую throttling
   */
  public setDynamicThrottleParams(
    baseInterval: number,
    minInterval: number,
    maxSpeed: number,
    useSmooth: boolean = false
  ): void {
    this._baseThrottleInterval = baseInterval;
    this._minThrottleInterval = minInterval;
    this._maxSpeed = maxSpeed;
    this._useSmoothThrottle = useSmooth;
  }

  /**
   * Возвращает текущие параметры динамического throttling
   */
  public getDynamicThrottleParams(): {
    baseInterval: number;
    minInterval: number;
    maxSpeed: number;
    useSmooth: boolean;
  } {
    return {
      baseInterval: this._baseThrottleInterval,
      minInterval: this._minThrottleInterval,
      maxSpeed: this._maxSpeed,
      useSmooth: this._useSmoothThrottle,
    };
  }
}
