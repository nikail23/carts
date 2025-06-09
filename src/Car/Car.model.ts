import { Vector3 } from 'three';

export type CarEvent =
  | 'accelerate'
  | 'brake'
  | 'steer_left'
  | 'steer_right'
  | 'handbrake';
export type CarEventMap = Map<CarEvent, boolean>;
export interface CarWheelsPosition {
  fl: Vector3;
  fr: Vector3;
  bl: Vector3;
  br: Vector3;
}
