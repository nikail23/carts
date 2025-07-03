import { ColliderDesc, RigidBodyDesc } from '@dimforge/rapier3d';
import {
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  PlaneGeometry,
  WebGLRenderer,
  WebGLRenderTarget,
  Scene,
  Vector3,
  LinearFilter,
  RGBAFormat,
  CameraHelper,
  AmbientLight,
  Quaternion,
  Object3D,
  type ColorRepresentation,
  Texture,
  Color,
} from 'three';
import PhysicalObject from '../scene/PhysicalObject';
import type { Car } from '../car/Car';
import { TireMark } from './TireMark';
import type { CarWheels } from '../car/Car.model';
import { FloorColliderGroup } from '../scene/ColliderGroup';
import { groundMaterial } from './Ground.material';

export class Ground extends PhysicalObject {
  public cameraHelper: CameraHelper;
  private _size = 10;
  private _camera: OrthographicCamera;
  private _cameraPlaceholder: Object3D;
  private _renderTarget: WebGLRenderTarget;
  private _scene: Scene;
  private _cars: Car[] = [];
  private _carsTireMarks: Map<Car, CarWheels<TireMark> | null>;
  private _renderer: WebGLRenderer;
  private _maxTiresInstances = 2000;

  constructor(
    renderer: WebGLRenderer,
    size: number = 25,
    texture?: Texture,
    color?: Vector3
  ) {
    const renderTarget = new WebGLRenderTarget(2048, 2048, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
    });

    groundMaterial.uniforms.uTireMarksTexture.value = renderTarget.texture;
    groundMaterial.uniforms.uTexture.value = texture ?? null;
    groundMaterial.uniforms.uColor.value = color ?? new Vector3(0, 0, 0);
    groundMaterial.needsUpdate = true;

    const object3D = new Mesh(
      new PlaneGeometry(size, size, 1, 1),
      groundMaterial
    );
    object3D.rotateX(-Math.PI / 2);
    object3D.receiveShadow = true;

    super(
      object3D.geometry.rotateX(-Math.PI / 2),
      object3D.material,
      ColliderDesc.cuboid(size / 2, 0.001, size / 2).setCollisionGroups(
        FloorColliderGroup
      ),
      RigidBodyDesc.fixed()
    );

    this._renderer = renderer;
    this._renderer.autoClear = false;
    this._size = size;

    this._scene = new Scene();
    this._scene.add(new AmbientLight(0xffffff, 10));

    this._carsTireMarks = new Map();

    this._renderTarget = renderTarget;

    this._camera = new OrthographicCamera(
      -this._size / 2,
      this._size / 2,
      this._size / 2,
      -this._size / 2,
      0.1,
      100
    );
    this._camera.position.set(0, 50, 0);
    this._camera.lookAt(new Vector3(0, 0, 0));

    this._cameraPlaceholder = new Object3D();
    this._cameraPlaceholder.position.copy(
      this._camera.getWorldPosition(new Vector3())
    );
    this._cameraPlaceholder.quaternion.copy(
      this._camera.getWorldQuaternion(new Quaternion())
    );

    this.add(this._cameraPlaceholder);

    this.cameraHelper = new CameraHelper(this._camera);
  }

  public attachCars(cars: Car[]): void {
    this._scene.clear();

    this._cars = cars;

    this._carsTireMarks = new Map(
      this._cars.map((car) => {
        if (!car.wheelFL || !car.wheelFR || !car.wheelBL || !car.wheelBR) {
          console.error('Car wheels are not initialized properly.');
          return [car, null];
        }

        const flMesh = car.wheelFL.cloneMesh();
        flMesh.geometry = flMesh.geometry.clone();
        flMesh.geometry.applyQuaternion(
          new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2)
        );
        flMesh.geometry.scale(0.5, 1, 0.95);

        const frMesh = car.wheelFR.cloneMesh();
        frMesh.geometry = frMesh.geometry.clone();
        frMesh.geometry.applyQuaternion(
          new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2)
        );
        frMesh.geometry.scale(0.5, 1, 0.95);

        const blMesh = car.wheelBL.cloneMesh();
        blMesh.geometry = blMesh.geometry.clone();
        blMesh.geometry.applyQuaternion(
          new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2)
        );
        blMesh.geometry.scale(0.5, 1, 0.95);

        const brMesh = car.wheelBR.cloneMesh();
        brMesh.geometry = brMesh.geometry.clone();
        brMesh.geometry.applyQuaternion(
          new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2)
        );
        brMesh.geometry.scale(0.5, 1, 0.95);

        const color = new Color(0.1, 0.1, 0.1);

        return [
          car,
          {
            fl: new TireMark(flMesh, this._maxTiresInstances, this, color),
            fr: new TireMark(frMesh, this._maxTiresInstances, this, color),
            bl: new TireMark(blMesh, this._maxTiresInstances, this, color),
            br: new TireMark(brMesh, this._maxTiresInstances, this, color),
          },
        ];
      })
    );

    Array.from(this._carsTireMarks.values()).forEach((wheels) => {
      if (!wheels) return;
      this._scene.add(wheels.fl, wheels.fr, wheels.bl, wheels.br);
    });
  }

  public update(delta: number): void {
    if (this._carsTireMarks.size) {
      this._paintTireMarks();
      this._updateTireMarks(delta);
    }

    this._renderer.setRenderTarget(this._renderTarget);
    this._renderer.clear(true, true, true);
    this._renderer.render(this._scene, this._camera);
    this._renderer.setRenderTarget(null);
  }

  private _updateTireMarks(delta: number): void {
    this._carsTireMarks.forEach((wheels) => {
      wheels?.fl.update(delta);
      wheels?.fr.update(delta);
      wheels?.bl.update(delta);
      wheels?.br.update(delta);
    });
  }

  private _paintTireMarks(): void {
    this._cars.forEach((car) => {
      if (!car.eventMap.get('handbrake') || car.speed < 0.1) return;

      if (!car.wheelBL || !car.wheelBR || !car.wheelFL || !car.wheelFR) {
        console.error('Car wheels are not initialized properly.');
        return;
      }

      const positions = {
        fl: car.wheelFL.getWorldPosition(new Vector3()),
        fr: car.wheelFR.getWorldPosition(new Vector3()),
        bl: car.wheelBL.getWorldPosition(new Vector3()),
        br: car.wheelBR.getWorldPosition(new Vector3()),
      };

      const rotations = {
        fl: car.wheelFL.rotation.y,
        fr: car.wheelFR.rotation.y,
        bl: car.wheelBL.rotation.y,
        br: car.wheelBR.rotation.y,
      };

      const tireMarksMesh = this._carsTireMarks.get(car);

      if (!tireMarksMesh) return;

      tireMarksMesh.fl.addTireMark(positions.fl, rotations.fl);
      tireMarksMesh.fr.addTireMark(positions.fr, rotations.fr);
      tireMarksMesh.bl.addTireMark(positions.bl, rotations.bl);
      tireMarksMesh.br.addTireMark(positions.br, rotations.br);
    });
  }
}
