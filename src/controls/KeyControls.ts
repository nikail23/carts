export type KeyControlsCallback = (map: KeyControlsMap, delta: number) => void;
export type KeyControlsMap = Map<string, boolean>;

export class KeyControls {
  protected static map: KeyControlsMap = new Map();
  protected static listenersInitialized = false;

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

  public update(): KeyControlsMap {
    return this._map;
  }
}
