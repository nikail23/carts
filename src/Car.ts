import { ColliderDesc, JointData, RigidBodyDesc } from '@dimforge/rapier3d';
import { scene, world } from './global';
import PhysicalObject from './PhysicalObject';
import { Mesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { Quaternion as ThreeQuaternion, Vector3 as ThreeVector3 } from 'three';
import { Vector3 as RapierVector3 } from '@dimforge/rapier3d';

export class Car {
  protected transmission: PhysicalObject;
  protected wheelFL: PhysicalObject;
  protected wheelFR: PhysicalObject;
  protected wheelBL: PhysicalObject;
  protected wheelBR: PhysicalObject;

  protected loading: boolean = false;

  public constructor(modelURL: string, position: RapierVector3) {
    this.init(modelURL, position);
  }

  public async init(modelURL: string, position: RapierVector3): Promise<void> {
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

    scene.add(transmissionMesh);
    scene.add(wheelBLMesh);
    scene.add(wheelBRMesh);
    scene.add(wheelFLMesh);
    scene.add(wheelFRMesh);

    const transmissionBody = world.createRigidBody(
      RigidBodyDesc.dynamic()
        .setRotation(
          new ThreeQuaternion().setFromAxisAngle(
            new ThreeVector3(1, 0, 0),
            Math.PI / 2
          )
        )
        .setTranslation(position.x, position.y, position.z)
        .setCanSleep(false)
    );
    const wheelBLBody = world.createRigidBody(
      RigidBodyDesc.dynamic()
        .setRotation(
          new ThreeQuaternion().setFromAxisAngle(
            new ThreeVector3(1, 0, 0),
            Math.PI / 2
          )
        )
        .setTranslation(position.x, position.y, position.z)
    );
    const wheelBRBody = world.createRigidBody(
      RigidBodyDesc.dynamic()
        .setRotation(
          new ThreeQuaternion().setFromAxisAngle(
            new ThreeVector3(1, 0, 0),
            Math.PI / 2
          )
        )
        .setTranslation(position.x, position.y, position.z)
    );
    const wheelFLBody = world.createRigidBody(
      RigidBodyDesc.dynamic()
        .setRotation(
          new ThreeQuaternion().setFromAxisAngle(
            new ThreeVector3(1, 0, 0),
            Math.PI / 2
          )
        )
        .setTranslation(position.x, position.y, position.z)
    );
    const wheelFRBody = world.createRigidBody(
      RigidBodyDesc.dynamic()
        .setRotation(
          new ThreeQuaternion().setFromAxisAngle(
            new ThreeVector3(1, 0, 0),
            Math.PI / 2
          )
        )
        .setTranslation(position.x, position.y, position.z)
    );

    const transmissionShape = ColliderDesc.trimesh(
      transmissionMesh.geometry.attributes.position.array as Float32Array,
      transmissionMesh.geometry.index?.array as Uint32Array
    );
    const wheelBLShape = ColliderDesc.cylinder(0.1, 0.3).setTranslation(
      1.225,
      0.7,
      -0.3
    );
    const wheelBRShape = ColliderDesc.cylinder(0.1, 0.3).setTranslation(
      1.225,
      -0.7,
      -0.3
    );
    const wheelFLShape = ColliderDesc.cylinder(0.1, 0.3).setTranslation(
      -1.225,
      0.7,
      -0.3
    );
    const wheelFRShape = ColliderDesc.cylinder(0.1, 0.3).setTranslation(
      -1.225,
      -0.7,
      -0.3
    );

    this.transmission = new PhysicalObject(
      transmissionMesh,
      world.createCollider(transmissionShape, transmissionBody)
    );
    this.wheelBL = new PhysicalObject(
      wheelBLMesh,
      world.createCollider(wheelBLShape, wheelBLBody)
    );
    this.wheelBR = new PhysicalObject(
      wheelBRMesh,
      world.createCollider(wheelBRShape, wheelBRBody)
    );
    this.wheelFL = new PhysicalObject(
      wheelFLMesh,
      world.createCollider(wheelFLShape, wheelFLBody)
    );
    this.wheelFR = new PhysicalObject(
      wheelFRMesh,
      world.createCollider(wheelFRShape, wheelFRBody)
    );

    world.createImpulseJoint(
      JointData.revolute(
        new RapierVector3(1.225, 0.7, -0.3),
        new RapierVector3(1.225, 0.7, -0.3),
        new RapierVector3(0, 1, 0)
      ),
      transmissionBody,
      wheelBLBody,
      true
    );
    world.createImpulseJoint(
      JointData.revolute(
        new RapierVector3(1.225, -0.7, -0.3),
        new RapierVector3(1.225, -0.7, -0.3),
        new RapierVector3(0, -1, 0)
      ),
      transmissionBody,
      wheelBRBody,
      true
    );
    world.createImpulseJoint(
      JointData.revolute(
        new RapierVector3(-1.225, 0.7, -0.3),
        new RapierVector3(-1.225, 0.7, -0.3),
        new RapierVector3(0, 1, 0)
      ),
      transmissionBody,
      wheelFLBody,
      true
    );
    world.createImpulseJoint(
      JointData.revolute(
        new RapierVector3(-1.225, -0.7, -0.3),
        new RapierVector3(-1.225, -0.7, -0.3),
        new RapierVector3(0, -1, 0)
      ),
      transmissionBody,
      wheelFRBody,
      true
    );

    this.loading = false;
  }

  public update(): void {
    if (this.loading) return;

    this.transmission.update();
    this.wheelFL.update();
    this.wheelFR.update();
    this.wheelBL.update();
    this.wheelBR.update();
  }
}
