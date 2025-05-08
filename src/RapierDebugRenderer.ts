import type { World } from '@dimforge/rapier3d';
import {
  BufferAttribute,
  BufferGeometry,
  LineBasicMaterial,
  LineSegments,
  Scene,
} from 'three';

export default class RapierDebugRenderer {
  public world: World;
  public enabled = true;

  private _lines: LineSegments;

  public constructor(scene: Scene, world: World) {
    this.world = world;
    this._lines = new LineSegments(
      new BufferGeometry(),
      new LineBasicMaterial({ color: 0xffffff, vertexColors: true })
    );
    this._lines.frustumCulled = false;
    scene.add(this._lines);
  }

  public update(): void {
    if (this.enabled) {
      const { vertices, colors } = this.world.debugRender();
      this._lines.geometry.setAttribute(
        'position',
        new BufferAttribute(vertices, 3)
      );
      this._lines.geometry.setAttribute(
        'color',
        new BufferAttribute(colors, 4)
      );
      this._lines.visible = true;
    } else {
      this._lines.visible = false;
    }
  }
}
