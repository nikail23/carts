export type CarEvent =
  | 'accelerate'
  | 'brake'
  | 'steer_left'
  | 'steer_right'
  | 'handbrake';
export type CarEventMap = Map<CarEvent, boolean>;
export interface CarWheels<T> {
  fl: T;
  fr: T;
  bl: T;
  br: T;
}
