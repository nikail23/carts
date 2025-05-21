export type KeyControlsCallback = (
  map: Map<string, boolean>,
  delta: number
) => void;

export class KeyControls {
  protected static map: Map<string, boolean> = new Map();
  protected static listenersInitialized = false;

  private _callbacks: KeyControlsCallback[] = [];

  private get _map(): Map<string, boolean> {
    return KeyControls.map;
  }

  constructor() {
    if (!KeyControls.listenersInitialized) {
      const onDocumentKey = (e: KeyboardEvent) => {
        KeyControls.map.set(e.code, e.type === 'keydown');
      };
      document.addEventListener('keydown', onDocumentKey, false);
      document.addEventListener('keyup', onDocumentKey, false);
      KeyControls.listenersInitialized = true;
    }
  }

  public registerCallback(callback: KeyControlsCallback): void {
    this._callbacks.push(callback);
  }

  public update(delta) {
    for (const callback of this._callbacks) {
      callback(this._map, delta);
    }
  }
}
