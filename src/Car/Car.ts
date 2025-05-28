import {
  ColliderDesc,
  JointData,
  MotorModel,
  RevoluteImpulseJoint,
  RigidBodyDesc,
} from '@dimforge/rapier3d';
import { scene, world } from '../global';
import PhysicalObject from '../PhysicalObject';
import { Mesh, Object3D, type TypedArray } from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { Vector3 } from 'three';
import {
  AxelColliderGroup,
  CarColliderGroup,
  WheelColliderGroup,
} from '../ColliderGroup';
import {
  CAR_ACCELERATE_DAMPING_INTERPOLATION,
  CAR_ACCELERATE_SPEED,
  CAR_BL_OFFSET,
  CAR_BR_OFFSET,
  CAR_BRAKE_SPEED,
  CAR_FL_OFFSET,
  CAR_FR_OFFSET,
  CAR_NOACTIVE_DAMPING_INTERPOLATION,
  CAR_STEERING_ANGLE,
  CAR_STEERING_DAMPING,
  CAR_STEERING_STIFFNESS,
  CAR_TRANSMISSION_MASS,
  CAR_WHEELS_MASS,
  CAR_WHEELS_SHAPE,
} from './Car.config';
import type { CarEventMap } from './Car.model';
import { truncatePositions } from '../utils';

export class Car {
  public transmission: PhysicalObject;
  public wheelFL: PhysicalObject;
  public wheelFR: PhysicalObject;
  public wheelBL: PhysicalObject;
  public wheelBR: PhysicalObject;

  public axelFL: PhysicalObject;
  public axelFR: PhysicalObject;
  public wheelBLMotor: RevoluteImpulseJoint;
  public wheelBRMotor: RevoluteImpulseJoint;
  public wheelFLMotor: RevoluteImpulseJoint;
  public wheelFRMotor: RevoluteImpulseJoint;
  public flAxelJoint: RevoluteImpulseJoint;
  public frAxelJoint: RevoluteImpulseJoint;

  public ready = false;

  public async init(modelURL: string, position: Vector3): Promise<void> {
    const gltf = await new GLTFLoader().loadAsync(modelURL);

    gltf.scene.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true;
      }
    });

    const transmissionMesh = gltf.scene.getObjectByName('car1') as Mesh;
    const wheelBLMesh = gltf.scene.getObjectByName('wheel_bl') as Mesh;
    const wheelBRMesh = gltf.scene.getObjectByName('wheel_br') as Mesh;
    const wheelFLMesh = gltf.scene.getObjectByName('wheel_fl') as Mesh;
    const wheelFRMesh = gltf.scene.getObjectByName('wheel_fr') as Mesh;

    transmissionMesh.position.set(0, 0, 0);
    wheelBLMesh.position.set(0, 0, 0);
    wheelBRMesh.position.set(0, 0, 0);
    wheelFLMesh.position.set(0, 0, 0);
    wheelFRMesh.position.set(0, 0, 0);

    const axelFLMesh = new Object3D();
    const axelFRMesh = new Object3D();

    scene.add(transmissionMesh);
    scene.add(wheelBLMesh);
    scene.add(wheelBRMesh);
    scene.add(wheelFLMesh);
    scene.add(wheelFRMesh);
    scene.add(axelFLMesh);
    scene.add(axelFRMesh);

    scene.updateMatrixWorld();

    const transmissionBody = world.createRigidBody(
      RigidBodyDesc.dynamic()
        .setTranslation(position.x, position.y, position.z)
        .setCanSleep(false)
        .setAdditionalMass(CAR_TRANSMISSION_MASS)
    );

    const wheelFlPosition = position.clone().add(CAR_FL_OFFSET);
    const wheelFrPosition = position.clone().add(CAR_FR_OFFSET);
    const wheelBlPosition = position.clone().add(CAR_BL_OFFSET);
    const wheelBrPosition = position.clone().add(CAR_BR_OFFSET);

    const wheelBLBody = world.createRigidBody(
      RigidBodyDesc.dynamic()
        .setTranslation(wheelBlPosition.x, wheelBlPosition.y, wheelBlPosition.z)
        .setAdditionalMass(CAR_WHEELS_MASS)
    );
    const wheelBRBody = world.createRigidBody(
      RigidBodyDesc.dynamic()
        .setTranslation(wheelBrPosition.x, wheelBrPosition.y, wheelBrPosition.z)
        .setAdditionalMass(CAR_WHEELS_MASS)
    );
    const wheelFLBody = world.createRigidBody(
      RigidBodyDesc.dynamic()
        .setTranslation(wheelFlPosition.x, wheelFlPosition.y, wheelFlPosition.z)
        .setAdditionalMass(CAR_WHEELS_MASS)
    );
    const wheelFRBody = world.createRigidBody(
      RigidBodyDesc.dynamic()
        .setTranslation(wheelFrPosition.x, wheelFrPosition.y, wheelFrPosition.z)
        .setAdditionalMass(CAR_WHEELS_MASS)
    );

    const axelFLBody = world.createRigidBody(
      RigidBodyDesc.dynamic()
        .setTranslation(wheelFlPosition.x, wheelFlPosition.y, wheelFlPosition.z)
        .setAdditionalMass(40)
    );

    const axelFRBody = world.createRigidBody(
      RigidBodyDesc.dynamic()
        .setTranslation(wheelFrPosition.x, wheelFrPosition.y, wheelFrPosition.z)
        .setAdditionalMass(40)
    );

    const transmissionShape = ColliderDesc.convexHull(
      new Float32Array(
        truncatePositions(transmissionMesh.geometry.attributes.position.array, {
          z: 0.9,
        })
      )
    );

    console.log(transmissionMesh);

    this.transmission = new PhysicalObject(
      transmissionMesh,
      world.createCollider(transmissionShape, transmissionBody)
    );
    this.transmission.collider.setCollisionGroups(CarColliderGroup);
    this.wheelBL = new PhysicalObject(
      wheelBLMesh,
      world.createCollider(CAR_WHEELS_SHAPE, wheelBLBody)
    );
    this.wheelBL.collider.setCollisionGroups(WheelColliderGroup);
    this.wheelBR = new PhysicalObject(
      wheelBRMesh,
      world.createCollider(CAR_WHEELS_SHAPE, wheelBRBody)
    );
    this.wheelBR.collider.setCollisionGroups(WheelColliderGroup);
    this.wheelFL = new PhysicalObject(
      wheelFLMesh,
      world.createCollider(CAR_WHEELS_SHAPE, wheelFLBody)
    );
    this.wheelFL.collider.setCollisionGroups(WheelColliderGroup);
    this.wheelFR = new PhysicalObject(
      wheelFRMesh,
      world.createCollider(CAR_WHEELS_SHAPE, wheelFRBody)
    );
    this.wheelFR.collider.setCollisionGroups(WheelColliderGroup);
    this.axelFL = new PhysicalObject(
      axelFLMesh,
      world.createCollider(CAR_WHEELS_SHAPE, axelFLBody)
    );

    this.axelFL.collider.setCollisionGroups(AxelColliderGroup);
    this.axelFR = new PhysicalObject(
      axelFRMesh,
      world.createCollider(CAR_WHEELS_SHAPE, axelFRBody)
    );
    this.axelFR.collider.setCollisionGroups(AxelColliderGroup);

    world.createImpulseJoint(
      JointData.revolute(
        CAR_BL_OFFSET,
        new Vector3(0, 0, 0),
        new Vector3(0, 0, -1)
      ),
      transmissionBody,
      wheelBLBody,
      true
    );
    world.createImpulseJoint(
      JointData.revolute(
        CAR_BR_OFFSET,
        new Vector3(0, 0, 0),
        new Vector3(0, 0, -1)
      ),
      transmissionBody,
      wheelBRBody,
      true
    );

    const flAxelJoint = world.createImpulseJoint(
      JointData.revolute(
        CAR_FL_OFFSET,
        new Vector3(0, 0, 0),
        new Vector3(0, 1, 0)
      ),
      transmissionBody,
      axelFLBody,
      true
    );
    (flAxelJoint as RevoluteImpulseJoint).configureMotorModel(
      MotorModel.ForceBased
    );

    const frAxelJoint = world.createImpulseJoint(
      JointData.revolute(
        CAR_FR_OFFSET,
        new Vector3(0, 0, 0),
        new Vector3(0, 1, 0)
      ),
      transmissionBody,
      axelFRBody,
      true
    );
    (frAxelJoint as RevoluteImpulseJoint).configureMotorModel(
      MotorModel.ForceBased
    );

    (flAxelJoint as RevoluteImpulseJoint).setLimits(-Math.PI / 6, Math.PI / 6);
    (frAxelJoint as RevoluteImpulseJoint).setLimits(-Math.PI / 6, Math.PI / 6);

    const wheelBLMotor = world.createImpulseJoint(
      JointData.revolute(
        CAR_BL_OFFSET,
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 1)
      ),
      transmissionBody,
      wheelBLBody,
      true
    ) as RevoluteImpulseJoint;
    wheelBLMotor.configureMotorModel(MotorModel.ForceBased);

    const wheelBRMotor = world.createImpulseJoint(
      JointData.revolute(
        CAR_BR_OFFSET,
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 1)
      ),
      transmissionBody,
      wheelBRBody,
      true
    ) as RevoluteImpulseJoint;
    wheelBRMotor.configureMotorModel(MotorModel.ForceBased);

    const wheelFLMotor = world.createImpulseJoint(
      JointData.revolute(
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 1)
      ),
      axelFLBody,
      wheelFLBody,
      true
    ) as RevoluteImpulseJoint;
    wheelFLMotor.configureMotorModel(MotorModel.ForceBased);

    const wheelFRMotor = world.createImpulseJoint(
      JointData.revolute(
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 1)
      ),
      axelFRBody,
      wheelFRBody,
      true
    ) as RevoluteImpulseJoint;
    wheelFRMotor.configureMotorModel(MotorModel.ForceBased);

    this.wheelBLMotor = wheelBLMotor;
    this.wheelBRMotor = wheelBRMotor;
    this.wheelFLMotor = wheelFLMotor;
    this.wheelFRMotor = wheelFRMotor;
    this.flAxelJoint = flAxelJoint as RevoluteImpulseJoint;
    this.frAxelJoint = frAxelJoint as RevoluteImpulseJoint;

    this.ready = true;
  }

  public update(map: CarEventMap = new Map()): void {
    if (!this.ready) return;

    this.transmission.update();
    this.wheelFL.update();
    this.wheelFR.update();
    this.wheelBL.update();
    this.wheelBR.update();
    this.axelFL.update();
    this.axelFR.update();

    this._setVelocity(map);
    this._setSteering(map);
  }

  private _setSteering(map: CarEventMap): void {
    const targetSteer = map.get('steer_left')
      ? CAR_STEERING_ANGLE
      : map.get('steer_right')
        ? -CAR_STEERING_ANGLE
        : 0;

    (this.flAxelJoint as RevoluteImpulseJoint).configureMotorPosition(
      targetSteer,
      CAR_STEERING_STIFFNESS,
      CAR_STEERING_DAMPING
    );
    (this.frAxelJoint as RevoluteImpulseJoint).configureMotorPosition(
      targetSteer,
      CAR_STEERING_STIFFNESS,
      CAR_STEERING_DAMPING
    );
  }

  private _setVelocity(map: CarEventMap): void {
    const currentVelocity = this._getCurrentVelocity();

    let frontWheelsVelocity = 0;
    let frontWheelsDamping = 4;
    let backWheelsVelocity = 0;
    let backWheelsDamping = 4;

    const handbrakeIsActive = map.get('handbrake');

    const motorsIsActive = map.get('accelerate') || map.get('brake');

    if (handbrakeIsActive) {
      backWheelsVelocity = 0;
      backWheelsDamping = 1000;
    } else if (!motorsIsActive) {
      const dampingInterpolation =
        CAR_NOACTIVE_DAMPING_INTERPOLATION(currentVelocity);
      frontWheelsDamping = dampingInterpolation;
      backWheelsDamping = dampingInterpolation;
    } else {
      const dampingInterpolation =
        CAR_ACCELERATE_DAMPING_INTERPOLATION(currentVelocity);

      if (map.get('accelerate')) {
        frontWheelsVelocity = CAR_ACCELERATE_SPEED;
        backWheelsVelocity = CAR_ACCELERATE_SPEED;
        frontWheelsDamping = dampingInterpolation;
        backWheelsDamping = dampingInterpolation;
      } else if (map.get('brake')) {
        frontWheelsVelocity = CAR_BRAKE_SPEED;
        backWheelsVelocity = CAR_BRAKE_SPEED;
        frontWheelsDamping = dampingInterpolation;
        backWheelsDamping = dampingInterpolation;
      }
    }

    (this.wheelBLMotor as RevoluteImpulseJoint).configureMotorVelocity(
      backWheelsVelocity,
      backWheelsDamping
    );
    (this.wheelBRMotor as RevoluteImpulseJoint).configureMotorVelocity(
      backWheelsVelocity,
      backWheelsDamping
    );

    (this.wheelFLMotor as RevoluteImpulseJoint).configureMotorVelocity(
      frontWheelsVelocity,
      frontWheelsDamping
    );
    (this.wheelFRMotor as RevoluteImpulseJoint).configureMotorVelocity(
      frontWheelsVelocity,
      frontWheelsDamping
    );
  }

  private _getCurrentVelocity(): number {
    const linvel = this.transmission?.body?.linvel();
    return (
      -1 *
      new Vector3(linvel.z, linvel.y, linvel.x).applyQuaternion(
        this.transmission.object3D.quaternion
      ).z
    );
  }
}
