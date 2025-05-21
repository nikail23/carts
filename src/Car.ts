import {
  ColliderDesc,
  JointData,
  MotorModel,
  RevoluteImpulseJoint,
  RigidBodyDesc,
} from '@dimforge/rapier3d';
import { scene, world } from './global';
import PhysicalObject from './PhysicalObject';
import { Mesh, Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { Quaternion as ThreeQuaternion, Vector3 as ThreeVector3 } from 'three';
import { Vector3 as RapierVector3 } from '@dimforge/rapier3d';
import { KeyMapControls } from './KeyMapControls';

export class Car extends KeyMapControls {
  public readonly flOffset = new ThreeVector3(-1.35, -0.29, 0.77);
  public readonly frOffset = new ThreeVector3(-1.35, -0.29, -0.77);
  public readonly blOffset = new ThreeVector3(1.1, -0.29, 0.77);
  public readonly brOffset = new ThreeVector3(1.1, -0.29, -0.77);

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

  protected loading: boolean = false;

  constructor() {
    super();
  }

  public async init(modelURL: string, position: ThreeVector3): Promise<void> {
    this.loading = true;

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
    );

    const wheelFlPosition = position.clone().add(this.flOffset);
    const wheelFrPosition = position.clone().add(this.frOffset);
    const wheelBlPosition = position.clone().add(this.blOffset);
    const wheelBrPosition = position.clone().add(this.brOffset);

    const wheelBLBody = world.createRigidBody(
      RigidBodyDesc.dynamic().setTranslation(
        wheelBlPosition.x,
        wheelBlPosition.y,
        wheelBlPosition.z
      )
    );
    const wheelBRBody = world.createRigidBody(
      RigidBodyDesc.dynamic().setTranslation(
        wheelBrPosition.x,
        wheelBrPosition.y,
        wheelBrPosition.z
      )
    );
    const wheelFLBody = world.createRigidBody(
      RigidBodyDesc.dynamic().setTranslation(
        wheelFlPosition.x,
        wheelFlPosition.y,
        wheelFlPosition.z
      )
    );
    const wheelFRBody = world.createRigidBody(
      RigidBodyDesc.dynamic().setTranslation(
        wheelFrPosition.x,
        wheelFrPosition.y,
        wheelFrPosition.z
      )
    );

    const axelFLBody = world.createRigidBody(
      RigidBodyDesc.dynamic().setTranslation(
        wheelFlPosition.x,
        wheelFlPosition.y,
        wheelFlPosition.z
      )
    );

    const axelFRBody = world.createRigidBody(
      RigidBodyDesc.dynamic().setTranslation(
        wheelFrPosition.x,
        wheelFrPosition.y,
        wheelFrPosition.z
      )
    );

    const transmissionShape = ColliderDesc.trimesh(
      transmissionMesh.geometry.attributes.position.array as Float32Array,
      transmissionMesh.geometry.index?.array as Uint32Array
    );
    const wheelBLShape = ColliderDesc.cylinder(0.1, 0.3).setRotation(
      new ThreeQuaternion().setFromAxisAngle(
        new ThreeVector3(1, 0, 0),
        Math.PI / 2
      )
    );
    const wheelBRShape = ColliderDesc.cylinder(0.1, 0.3).setRotation(
      new ThreeQuaternion().setFromAxisAngle(
        new ThreeVector3(1, 0, 0),
        Math.PI / 2
      )
    );
    const wheelFLShape = ColliderDesc.cylinder(0.1, 0.3).setRotation(
      new ThreeQuaternion().setFromAxisAngle(
        new ThreeVector3(1, 0, 0),
        Math.PI / 2
      )
    );
    const wheelFRShape = ColliderDesc.cylinder(0.1, 0.3).setRotation(
      new ThreeQuaternion().setFromAxisAngle(
        new ThreeVector3(1, 0, 0),
        Math.PI / 2
      )
    );

    this.transmission = new PhysicalObject(
      transmissionMesh,
      world.createCollider(transmissionShape, transmissionBody)
    );
    this.transmission.collider.setCollisionGroups(131073);
    this.wheelBL = new PhysicalObject(
      wheelBLMesh,
      world.createCollider(wheelBLShape, wheelBLBody)
    );
    this.wheelBL.collider.setCollisionGroups(262145);
    this.wheelBR = new PhysicalObject(
      wheelBRMesh,
      world.createCollider(wheelBRShape, wheelBRBody)
    );
    this.wheelBR.collider.setCollisionGroups(262145);
    this.wheelFL = new PhysicalObject(
      wheelFLMesh,
      world.createCollider(wheelFLShape, wheelFLBody)
    );
    this.wheelFL.collider.setCollisionGroups(262145);
    this.wheelFR = new PhysicalObject(
      wheelFRMesh,
      world.createCollider(wheelFRShape, wheelFRBody)
    );
    this.wheelFR.collider.setCollisionGroups(262145);
    this.axelFL = new PhysicalObject(
      axelFLMesh,
      world.createCollider(wheelFLShape, axelFLBody)
    );

    this.axelFL.collider.setCollisionGroups(0);
    this.axelFR = new PhysicalObject(
      axelFRMesh,
      world.createCollider(wheelFRShape, axelFRBody)
    );
    this.axelFR.collider.setCollisionGroups(0);

    world.createImpulseJoint(
      JointData.revolute(
        new RapierVector3(this.blOffset.x, this.blOffset.y, this.blOffset.z),
        new RapierVector3(0, 0, 0),
        new RapierVector3(0, 0, -1)
      ),
      transmissionBody,
      wheelBLBody,
      true
    );
    world.createImpulseJoint(
      JointData.revolute(
        new RapierVector3(this.brOffset.x, this.brOffset.y, this.brOffset.z),
        new RapierVector3(0, 0, 0),
        new RapierVector3(0, 0, -1)
      ),
      transmissionBody,
      wheelBRBody,
      true
    );

    const flAxelJoint = world.createImpulseJoint(
      JointData.revolute(
        new RapierVector3(this.flOffset.x, this.flOffset.y, this.flOffset.z),
        new RapierVector3(0, 0, 0),
        new RapierVector3(0, 1, 0)
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
        new RapierVector3(this.frOffset.x, this.frOffset.y, this.frOffset.z),
        new RapierVector3(0, 0, 0),
        new RapierVector3(0, 1, 0)
      ),
      transmissionBody,
      axelFRBody,
      true
    );
    (frAxelJoint as RevoluteImpulseJoint).configureMotorModel(
      MotorModel.ForceBased
    );

    const wheelBLMotor = world.createImpulseJoint(
      JointData.revolute(
        new RapierVector3(this.blOffset.x, this.blOffset.y, this.blOffset.z),
        new RapierVector3(0, 0, 0),
        new RapierVector3(0, 0, 1)
      ),
      transmissionBody,
      wheelBLBody,
      true
    ) as RevoluteImpulseJoint;
    wheelBLMotor.configureMotorModel(MotorModel.ForceBased);

    const wheelBRMotor = world.createImpulseJoint(
      JointData.revolute(
        new RapierVector3(this.brOffset.x, this.brOffset.y, this.brOffset.z),
        new RapierVector3(0, 0, 0),
        new RapierVector3(0, 0, 1)
      ),
      transmissionBody,
      wheelBRBody,
      true
    ) as RevoluteImpulseJoint;
    wheelBRMotor.configureMotorModel(MotorModel.ForceBased);

    const wheelFLMotor = world.createImpulseJoint(
      JointData.revolute(
        new RapierVector3(0, 0, 0),
        new RapierVector3(0, 0, 0),
        new RapierVector3(0, 0, 1)
      ),
      axelFLBody,
      wheelFLBody,
      true
    ) as RevoluteImpulseJoint;
    wheelFLMotor.configureMotorModel(MotorModel.ForceBased);

    const wheelFRMotor = world.createImpulseJoint(
      JointData.revolute(
        new RapierVector3(0, 0, 0),
        new RapierVector3(0, 0, 0),
        new RapierVector3(0, 0, 1)
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

    this.loading = false;
  }

  public update(): void {
    if (this.loading) return;

    this.transmission.update();
    this.wheelFL.update();
    this.wheelFR.update();
    this.wheelBL.update();
    this.wheelBR.update();
    this.axelFL.update();
    this.axelFR.update();

    const maxSteerAngle = Math.PI / 6; // 60 degrees in radians
    const targetVelocity = this.keyMap.get('ArrowUp')
      ? 20
      : this.keyMap.get('ArrowDown')
        ? -8
        : 0;
    const targetSteer = this.keyMap.get('ArrowLeft')
      ? maxSteerAngle
      : this.keyMap.get('ArrowRight')
        ? -maxSteerAngle
        : 0;

    (this.wheelBLMotor as RevoluteImpulseJoint).configureMotorVelocity(
      targetVelocity,
      2.0
    );
    (this.wheelBRMotor as RevoluteImpulseJoint).configureMotorVelocity(
      targetVelocity,
      2.0
    );

    (this.wheelFLMotor as RevoluteImpulseJoint).configureMotorVelocity(
      targetVelocity,
      2.0
    );
    (this.wheelFRMotor as RevoluteImpulseJoint).configureMotorVelocity(
      targetVelocity,
      2.0
    );

    (this.flAxelJoint as RevoluteImpulseJoint).configureMotorPosition(
      targetSteer,
      100,
      10
    );
    (this.frAxelJoint as RevoluteImpulseJoint).configureMotorPosition(
      targetSteer,
      100,
      10
    );
  }
}
