import { ColliderDesc } from '@dimforge/rapier3d';
import {
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  PlaneGeometry,
  WebGLRenderer,
  WebGLRenderTarget,
  MeshBasicMaterial,
  Scene,
  Object3D,
  Vector3,
  LinearFilter,
  RGBAFormat,
  CameraHelper,
  AmbientLight,
  InstancedMesh,
} from 'three';
import { world } from '../global';
import PhysicalObject from '../PhysicalObject';
import type { Car } from '../car/Car';

export class Ground extends PhysicalObject {
  private _size = 100;
  private _position = new Vector3(0, -1, 0);
  private _camera: OrthographicCamera;
  private _cameraHelper: CameraHelper;
  private _renderTarget: WebGLRenderTarget;
  private _scene: Scene;
  private _cars: Car[] = [];
  private _wheel: InstancedMesh;
  private _renderer: WebGLRenderer;
  private _dummy = new Object3D();
  private _currentTireIndex = 0;
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

    this._wheel = this._createWheelInstancedMesh(
      this._cars[0].wheelFL.object3D
    );

    this._scene.add(this._wheel);

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

  public update(): void {
    this._paintTires();

    this._renderer.setRenderTarget(this._renderTarget);
    this._renderer.render(this._scene, this._camera);
    this._renderer.setRenderTarget(null);
  }

  private _createWheelInstancedMesh(wheelObject3D: Object3D): InstancedMesh {
    const wheelGeometry = (wheelObject3D as Mesh).geometry.clone();

    return new InstancedMesh(
      wheelGeometry,
      new MeshBasicMaterial({
        color: 0x555555,
        transparent: true,
        opacity: 0.5,
      }),
      this._maxTiresInstances
    );
  }

  private _paintTires(): void {
    this._cars.forEach((car) => {
      if (!car.eventMap.get('handbrake')) return;

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

      this._paintNextTire(positions.fl.x, positions.fl.z, rotations.fl);
      this._paintNextTire(positions.fr.x, positions.fr.z, rotations.fr);
      this._paintNextTire(positions.bl.x, positions.bl.z, rotations.bl);
      this._paintNextTire(positions.br.x, positions.br.z, rotations.br);
    });
  }

  private _paintNextTire(x: number, z: number, rotation: number) {
    this._paintTireAt(
      this._currentTireIndex,
      new Vector3(x, this._position.y, z),
      rotation
    );
    this._currentTireIndex =
      (this._currentTireIndex + 1) % this._maxTiresInstances;
  }

  private _paintTireAt(index: number, position: Vector3, rotation: number) {
    this._dummy.position.copy(position);
    this._dummy.rotation.set(-Math.PI / 2, 0, rotation);

    this._dummy.updateMatrix();
    this._wheel.setMatrixAt(index, this._dummy.matrix);
    this._wheel.instanceMatrix.needsUpdate = true;
  }
}
