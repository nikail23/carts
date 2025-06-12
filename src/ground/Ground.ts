import { ColliderDesc } from '@dimforge/rapier3d';
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
} from 'three';
import { world } from '../global';
import PhysicalObject from '../PhysicalObject';
import type { Car } from '../car/Car';
import { WheelTireMark } from './WheelTireMark';
import type { CarWheels } from '../car/Car.model';

export class Ground extends PhysicalObject {
  private _size = 100;
  private _position = new Vector3(0, -1, 0);
  private _camera: OrthographicCamera;
  private _cameraHelper: CameraHelper;
  private _renderTarget: WebGLRenderTarget;
  private _scene: Scene;
  private _cars: Car[] = [];
  private _carsTireMarks: Map<Car, CarWheels<WheelTireMark>>;
  private _renderer: WebGLRenderer;
  private _maxTiresInstances = 500;

  public get cameraHelper(): CameraHelper {
    return this._cameraHelper;
  }

  constructor(renderer: WebGLRenderer, cars: Car[]) {
    super(null, null);

    this._cars = cars;
    this._renderer = renderer;
    this._renderer.autoClear = false;

    this._scene = new Scene();

    this._carsTireMarks = new Map(
      this._cars.map((car) => {
        const flMesh = car.wheelFL.object3D.clone() as Mesh;
        flMesh.geometry = flMesh.geometry.clone();
        flMesh.geometry.applyQuaternion(
          new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2)
        );
        flMesh.geometry.scale(0.5, 1, 0.95);

        const frMesh = car.wheelFR.object3D.clone() as Mesh;
        frMesh.geometry = frMesh.geometry.clone();
        frMesh.geometry.applyQuaternion(
          new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2)
        );
        frMesh.geometry.scale(0.5, 1, 0.95);

        const blMesh = car.wheelBL.object3D.clone() as Mesh;
        blMesh.geometry = blMesh.geometry.clone();
        blMesh.geometry.applyQuaternion(
          new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2)
        );
        blMesh.geometry.scale(0.5, 1, 0.95);

        const brMesh = car.wheelBR.object3D.clone() as Mesh;
        brMesh.geometry = brMesh.geometry.clone();
        brMesh.geometry.applyQuaternion(
          new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2)
        );
        brMesh.geometry.scale(0.5, 1, 0.95);

        return [
          car,
          {
            fl: new WheelTireMark(flMesh, this._maxTiresInstances),
            fr: new WheelTireMark(frMesh, this._maxTiresInstances),
            bl: new WheelTireMark(blMesh, this._maxTiresInstances),
            br: new WheelTireMark(brMesh, this._maxTiresInstances),
          },
        ];
      })
    );

    Array.from(this._carsTireMarks.values()).forEach((wheels) => {
      this._scene.add(wheels.fl, wheels.fr, wheels.bl, wheels.br);
    });

    this._renderTarget = new WebGLRenderTarget(2048, 2048, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
    });

    this.object3D = new Mesh(
      new PlaneGeometry(this._size, this._size, 1, 1),
      new MeshStandardMaterial({
        color: 0xffffff,
        map: this._renderTarget.texture,
      })
    );

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

    this._cameraHelper = new CameraHelper(this._camera);

    this.collider = world.createCollider(
      ColliderDesc.cuboid(this._size / 2, 0.001, this._size / 2).setTranslation(
        this._position.x,
        this._position.y,
        this._position.z
      )
    );

    this.object3D.rotateX(-Math.PI / 2);
    this.object3D.position.copy(this._position);
    this.object3D.receiveShadow = true;

    const light = new AmbientLight(0xffffff, 10);
    this._scene.add(light);

    const floorCopy = this._getFloorFadeCopy(1);

    this._scene.add(floorCopy);
  }

  private _getFloorFadeCopy(opacity: number): Mesh {
    const floorCopy = this.object3D.clone();
    (floorCopy as Mesh).material = new MeshStandardMaterial({
      color: 0xffffff,
      opacity: opacity,
      transparent: true,
    });
    return floorCopy as Mesh;
  }

  public update(delta: number): void {
    this._paintTires();

    this._carsTireMarks.forEach((wheels) => {
      wheels.fl.update(delta);
      wheels.fr.update(delta);
      wheels.bl.update(delta);
      wheels.br.update(delta);
    });

    this._renderer.setRenderTarget(this._renderTarget);
    this._renderer.clear(true, true, true);
    this._renderer.render(this._scene, this._camera);
    this._renderer.setRenderTarget(null);
  }

  private _paintTires(): void {
    this._cars.forEach((car) => {
      if (!car.eventMap.get('handbrake') || car.speed < 0.1) return;

      const positions = {
        fl: car.wheelFL.object3D.getWorldPosition(new Vector3()),
        fr: car.wheelFR.object3D.getWorldPosition(new Vector3()),
        bl: car.wheelBL.object3D.getWorldPosition(new Vector3()),
        br: car.wheelBR.object3D.getWorldPosition(new Vector3()),
      };

      const rotations = {
        fl: car.wheelFL.object3D.rotation.y,
        fr: car.wheelFR.object3D.rotation.y,
        bl: car.wheelBL.object3D.rotation.y,
        br: car.wheelBR.object3D.rotation.y,
      };

      const tireMarksMesh = this._carsTireMarks.get(car);

      tireMarksMesh.fl.addTireMark(positions.fl, rotations.fl);
      tireMarksMesh.fr.addTireMark(positions.fr, rotations.fr);
      tireMarksMesh.bl.addTireMark(positions.bl, rotations.bl);
      tireMarksMesh.br.addTireMark(positions.br, rotations.br);
    });
  }
}
