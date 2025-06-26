import {
  ColliderDesc,
  JointData,
  MotorModel,
  RevoluteImpulseJoint,
  RigidBodyDesc,
} from '@dimforge/rapier3d';
import { scene, world } from '../global';
import PhysicalObject from '../scene/PhysicalObject';
import {
  BufferGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  type TypedArray,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { Vector3 } from 'three';
import {
  AxelColliderGroup,
  CarColliderGroup,
  WheelColliderGroup,
} from '../scene/ColliderGroup';
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
import type { CarEventMap, CarWheels } from './Car.model';
import { truncatePositions } from '../utils';
import type { CarControls } from '../controls/CarControls';
import type { PhysicalScene } from '../scene/PhysicalScene';

export class Car {
  public id = crypto.randomUUID();
  public transmission?: PhysicalObject;
  public wheelFL?: PhysicalObject;
  public wheelFR?: PhysicalObject;
  public wheelBL?: PhysicalObject;
  public wheelBR?: PhysicalObject;

  public axelFL?: PhysicalObject;
  public axelFR?: PhysicalObject;

  private _wheelBLMotor?: RevoluteImpulseJoint;
  private _wheelBRMotor?: RevoluteImpulseJoint;
  private _wheelFLMotor?: RevoluteImpulseJoint;
  private _wheelFRMotor?: RevoluteImpulseJoint;
  private _flAxelJoint?: RevoluteImpulseJoint;
  private _frAxelJoint?: RevoluteImpulseJoint;

  public ready = false;

  private _controller: CarControls | null = null;

  private _map: CarEventMap = new Map();

  public get speed(): number {
    return this._getCurrentVelocity();
  }

  public get wheelsPositions(): CarWheels<Vector3> | null {
    if (!this.wheelFL || !this.wheelFR || !this.wheelBL || !this.wheelBR) {
      return null;
    }

    return {
      fl: this.wheelFL.getWorldPosition(new Vector3()),
      fr: this.wheelFR.getWorldPosition(new Vector3()),
      bl: this.wheelBL.getWorldPosition(new Vector3()),
      br: this.wheelBR.getWorldPosition(new Vector3()),
    };
  }

  public get eventMap(): CarEventMap {
    return this._map;
  }

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

    if (
      !transmissionMesh ||
      !wheelBLMesh ||
      !wheelBRMesh ||
      !wheelFLMesh ||
      !wheelFRMesh
    ) {
      throw new Error('Car model is missing required meshes');
    }

    transmissionMesh.position.set(0, 0, 0);
    wheelBLMesh.position.set(0, 0, 0);
    wheelBRMesh.position.set(0, 0, 0);
    wheelFLMesh.position.set(0, 0, 0);
    wheelFRMesh.position.set(0, 0, 0);

    const transmissionBodyDesc = RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)
      .setCanSleep(false)
      .setAdditionalMass(CAR_TRANSMISSION_MASS);

    const wheelFlPosition = position.clone().add(CAR_FL_OFFSET);
    const wheelFrPosition = position.clone().add(CAR_FR_OFFSET);
    const wheelBlPosition = position.clone().add(CAR_BL_OFFSET);
    const wheelBrPosition = position.clone().add(CAR_BR_OFFSET);

    const wheelBLBodyDesc = RigidBodyDesc.dynamic()
      .setTranslation(wheelBlPosition.x, wheelBlPosition.y, wheelBlPosition.z)
      .setAdditionalMass(CAR_WHEELS_MASS);
    const wheelBRBodyDesc = RigidBodyDesc.dynamic()
      .setTranslation(wheelBrPosition.x, wheelBrPosition.y, wheelBrPosition.z)
      .setAdditionalMass(CAR_WHEELS_MASS);
    const wheelFLBodyDesc = RigidBodyDesc.dynamic()
      .setTranslation(wheelFlPosition.x, wheelFlPosition.y, wheelFlPosition.z)
      .setAdditionalMass(CAR_WHEELS_MASS);
    const wheelFRBodyDesc = RigidBodyDesc.dynamic()
      .setTranslation(wheelFrPosition.x, wheelFrPosition.y, wheelFrPosition.z)
      .setAdditionalMass(CAR_WHEELS_MASS);

    const axelFLBodyDesc = RigidBodyDesc.dynamic()
      .setTranslation(wheelFlPosition.x, wheelFlPosition.y, wheelFlPosition.z)
      .setAdditionalMass(40);

    const axelFRBodyDesc = RigidBodyDesc.dynamic()
      .setTranslation(wheelFrPosition.x, wheelFrPosition.y, wheelFrPosition.z)
      .setAdditionalMass(40);

    const transmissionShape = ColliderDesc.convexHull(
      new Float32Array(
        truncatePositions(transmissionMesh.geometry.attributes.position.array, {
          z: 0.9,
        })
      )
    );

    if (!transmissionShape) {
      throw new Error('Failed to create transmission shape');
    }

    this.transmission = new PhysicalObject(
      transmissionMesh.geometry,
      transmissionMesh.material,
      transmissionShape,
      transmissionBodyDesc
    );
    this.transmission.collider.setCollisionGroups(CarColliderGroup);
    this.wheelBL = new PhysicalObject(
      wheelBLMesh.geometry,
      wheelBLMesh.material,
      CAR_WHEELS_SHAPE,
      wheelBLBodyDesc
    );
    this.wheelBL.collider.setCollisionGroups(WheelColliderGroup);
    this.wheelBR = new PhysicalObject(
      wheelBRMesh.geometry,
      wheelBRMesh.material,
      CAR_WHEELS_SHAPE,
      wheelBRBodyDesc
    );
    this.wheelBR.collider.setCollisionGroups(WheelColliderGroup);
    this.wheelFL = new PhysicalObject(
      wheelFLMesh.geometry,
      wheelFLMesh.material,
      CAR_WHEELS_SHAPE,
      wheelFLBodyDesc
    );
    this.wheelFL.collider.setCollisionGroups(WheelColliderGroup);
    this.wheelFR = new PhysicalObject(
      wheelFRMesh.geometry,
      wheelFRMesh.material,
      CAR_WHEELS_SHAPE,
      wheelFRBodyDesc
    );
    this.wheelFR.collider.setCollisionGroups(WheelColliderGroup);
    this.axelFL = new PhysicalObject(
      new BufferGeometry(),
      new MeshStandardMaterial(),
      CAR_WHEELS_SHAPE,
      axelFLBodyDesc
    );

    this.axelFL.collider.setCollisionGroups(AxelColliderGroup);
    this.axelFR = new PhysicalObject(
      new BufferGeometry(),
      new MeshStandardMaterial(),
      CAR_WHEELS_SHAPE,
      axelFRBodyDesc
    );
    this.axelFR.collider.setCollisionGroups(AxelColliderGroup);

    world.createImpulseJoint(
      JointData.revolute(
        CAR_BL_OFFSET,
        new Vector3(0, 0, 0),
        new Vector3(0, 0, -1)
      ),
      this.transmission.body!,
      this.wheelBL.body!,
      true
    );
    world.createImpulseJoint(
      JointData.revolute(
        CAR_BR_OFFSET,
        new Vector3(0, 0, 0),
        new Vector3(0, 0, -1)
      ),
      this.transmission.body!,
      this.wheelBR.body!,
      true
    );

    const flAxelJoint = world.createImpulseJoint(
      JointData.revolute(
        CAR_FL_OFFSET,
        new Vector3(0, 0, 0),
        new Vector3(0, 1, 0)
      ),
      this.transmission.body!,
      this.axelFL.body!,
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
      this.transmission.body!,
      this.axelFR.body!,
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
      this.transmission.body!,
      this.wheelBL.body!,
      true
    ) as RevoluteImpulseJoint;
    wheelBLMotor.configureMotorModel(MotorModel.ForceBased);

    const wheelBRMotor = world.createImpulseJoint(
      JointData.revolute(
        CAR_BR_OFFSET,
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 1)
      ),
      this.transmission.body!,
      this.wheelBR.body!,
      true
    ) as RevoluteImpulseJoint;
    wheelBRMotor.configureMotorModel(MotorModel.ForceBased);

    const wheelFLMotor = world.createImpulseJoint(
      JointData.revolute(
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 1)
      ),
      this.axelFL.body!,
      this.wheelFL.body!,
      true
    ) as RevoluteImpulseJoint;
    wheelFLMotor.configureMotorModel(MotorModel.ForceBased);

    const wheelFRMotor = world.createImpulseJoint(
      JointData.revolute(
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 1)
      ),
      this.axelFR.body!,
      this.wheelFR.body!,
      true
    ) as RevoluteImpulseJoint;
    wheelFRMotor.configureMotorModel(MotorModel.ForceBased);

    this._wheelBLMotor = wheelBLMotor;
    this._wheelBRMotor = wheelBRMotor;
    this._wheelFLMotor = wheelFLMotor;
    this._wheelFRMotor = wheelFRMotor;
    this._flAxelJoint = flAxelJoint as RevoluteImpulseJoint;
    this._frAxelJoint = frAxelJoint as RevoluteImpulseJoint;

    this.ready = true;
  }

  public attachController(controller: CarControls): void {
    if (!this.transmission) {
      throw new Error('Transmission is not initialized');
    }

    controller?.parent?.removeController();

    this._controller = controller;
    this._controller.attachTo(this.transmission, new Vector3(0, 0.5, 0));

    this._controller.parent = this;
  }

  public removeController(): void {
    this._controller = null;
  }

  public update(): void {
    if (!this.ready) return;

    this.transmission?.update();
    this.wheelFL?.update();
    this.wheelFR?.update();
    this.wheelBL?.update();
    this.wheelBR?.update();
    this.axelFL?.update();
    this.axelFR?.update();

    this._map = this._controller?.update() ?? new Map();

    this._setVelocity();
    this._setSteering();
  }

  private _setSteering(): void {
    const map = this._map;

    const targetSteer = map.get('steer_left')
      ? CAR_STEERING_ANGLE
      : map.get('steer_right')
        ? -CAR_STEERING_ANGLE
        : 0;

    if (!this._flAxelJoint || !this._frAxelJoint) return;

    this._flAxelJoint.configureMotorPosition(
      targetSteer,
      CAR_STEERING_STIFFNESS,
      CAR_STEERING_DAMPING
    );
    this._frAxelJoint.configureMotorPosition(
      targetSteer,
      CAR_STEERING_STIFFNESS,
      CAR_STEERING_DAMPING
    );
  }

  private _setVelocity(): void {
    const map = this._map;

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

    if (
      !this._wheelBLMotor ||
      !this._wheelBRMotor ||
      !this._wheelFLMotor ||
      !this._wheelFRMotor
    )
      return;

    this._wheelBLMotor.configureMotorVelocity(
      backWheelsVelocity,
      backWheelsDamping
    );
    this._wheelBRMotor.configureMotorVelocity(
      backWheelsVelocity,
      backWheelsDamping
    );
    this._wheelFLMotor.configureMotorVelocity(
      frontWheelsVelocity,
      frontWheelsDamping
    );
    this._wheelFRMotor.configureMotorVelocity(
      frontWheelsVelocity,
      frontWheelsDamping
    );
  }

  private _getCurrentVelocity(): number {
    if (!this.transmission?.body) return 0;

    const linvel = this.transmission.body.linvel();
    return (
      -1 *
      new Vector3(linvel.z, linvel.y, linvel.x).applyQuaternion(
        this.transmission.quaternion
      ).z
    );
  }

  public addMeshesToScene(scene: PhysicalScene): void {
    if (!this.ready) return;

    if (this.transmission) scene.add(this.transmission);
    if (this.wheelFL) scene.add(this.wheelFL);
    if (this.wheelFR) scene.add(this.wheelFR);
    if (this.wheelBL) scene.add(this.wheelBL);
    if (this.wheelBR) scene.add(this.wheelBR);
    if (this.axelFL) scene.add(this.axelFL);
    if (this.axelFR) scene.add(this.axelFR);
  }
}
