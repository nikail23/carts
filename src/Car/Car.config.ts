import { ColliderDesc } from '@dimforge/rapier3d';
import { Quaternion, Vector3 } from 'three';
import { exponentialInterlopation } from '../utils';

// MASS CONFIGURATION
export const CAR_TRANSMISSION_MASS = 1000;
export const CAR_WHEELS_MASS = 40;

// MOTORS CONFIGURATION
export const CAR_ACCELERATE_SPEED = 100;
export const CAR_ACCELERATE_DAMPING_INTERPOLATION = (current: number) =>
  exponentialInterlopation(2, 6, Math.abs(current), 0.125);
export const CAR_BRAKE_SPEED = -60;
export const CAR_HANDBRAKE_SPEED = 0;
export const CAR_HANDBRAKE_VELOCITY = 0;
export const CAR_HANDBRAKE_DAMPNG = 1000;
export const CAR_STEERING_ANGLE = Math.PI / 3;
export const CAR_STEERING_STIFFNESS = 500;
export const CAR_STEERING_DAMPING = 100;
export const CAR_NOACTIVE_DAMPING_INTERPOLATION = (current: number) =>
  exponentialInterlopation(20, 1000, Math.abs(current), 6);

// WHEELS OFFSETS
export const CAR_FL_OFFSET = new Vector3(-1.235, 0.29, 0.77);
export const CAR_FR_OFFSET = new Vector3(-1.235, 0.29, -0.77);
export const CAR_BL_OFFSET = new Vector3(1.235, 0.29, 0.77);
export const CAR_BR_OFFSET = new Vector3(1.235, 0.29, -0.77);

// SHAPE CONFIGURATION
export const CAR_WHEELS_SHAPE = ColliderDesc.cylinder(0.1, 0.3).setRotation(
  new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2)
);
