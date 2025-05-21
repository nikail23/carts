export abstract class KeyMapControls {
  protected static keyMap: Map<string, boolean> = new Map();
  protected static listenersInitialized = false;

  protected get keyMap(): Map<string, boolean> {
    return KeyMapControls.keyMap;
  }

  constructor() {
    if (!KeyMapControls.listenersInitialized) {
      const onDocumentKey = (e: KeyboardEvent) => {
        KeyMapControls.keyMap.set(e.code, e.type === 'keydown');
        console.log(e.code, e.type);
      };
      document.addEventListener('keydown', onDocumentKey, false);
      document.addEventListener('keyup', onDocumentKey, false);
      KeyMapControls.listenersInitialized = true;
    }
  }
}
