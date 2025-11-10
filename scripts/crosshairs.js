/**
 * Crosshairs System (Selection Reticle)
 * Allows the user to select a position on the canvas with visual feedback
 */

export class Crosshairs {
  constructor(config = {}) {
    this.config = foundry.utils.mergeObject({
      lockPosition: false,
      rememberControlled: false
    }, config);

    this.cancelled = false;
    this.position = null;
    this.cursorEffect = null;
    this.controlled = [];
  }

  /**
   * Show the crosshairs and wait for user selection
   * @returns {Promise<Object>} Selected position {x, y, cancelled}
   */
  async show() {
    return new Promise((resolve) => {
      this._activate();

      const moveHandler = (event) => this._onMouseMove(event);
      const clickHandler = (event) => {
        this._cleanup(moveHandler, clickHandler, rightClickHandler);
        this.position = this._getMousePosition(event);
        resolve({ x: this.position.x, y: this.position.y, cancelled: false });
      };
      const rightClickHandler = (event) => {
        event.preventDefault();
        this._cleanup(moveHandler, clickHandler, rightClickHandler);
        this.cancelled = true;
        resolve({ x: null, y: null, cancelled: true });
      };

      canvas.stage.on('pointermove', moveHandler);
      canvas.stage.on('pointerdown', clickHandler);
      canvas.stage.on('rightdown', rightClickHandler);
    });
  }

  _activate() {
    // Save controlled tokens
    if (this.config.rememberControlled) {
      this.controlled = canvas.tokens.controlled.map(t => t.id);
    }

    // Create visual template
    this._createTemplate();
  }

  _createTemplate() {
    // Criar elemento HTML para seguir o cursor
    this.cursorEffect = document.createElement('div');
    this.cursorEffect.className = 'crossgate-cursor-effect';
    document.body.appendChild(this.cursorEffect);
  }

  _onMouseMove(event) {
    const position = this._getMousePosition(event);
    if (!position) return;

    // Update cursor effect position
    if (this.cursorEffect) {
      // Converter para coordenadas da tela
      const screenPos = canvas.stage.toGlobal(new PIXI.Point(position.x, position.y));
      this.cursorEffect.style.left = screenPos.x + 'px';
      this.cursorEffect.style.top = screenPos.y + 'px';
    }
  }

  _getMousePosition(event) {
    const pos = event.data.getLocalPosition(canvas.stage);

    // Snap to grid if necessary
    if (!this.config.lockPosition && canvas.grid.type !== 0) {
      const snapped = canvas.grid.getSnappedPoint({ x: pos.x, y: pos.y }, {
        mode: CONST.GRID_SNAPPING_MODES.CENTER
      });
      return snapped;
    }

    return pos;
  }

  _cleanup(moveHandler, clickHandler, rightClickHandler) {
    canvas.stage.off('pointermove', moveHandler);
    canvas.stage.off('pointerdown', clickHandler);
    canvas.stage.off('rightdown', rightClickHandler);

    // Remove cursor effect
    if (this.cursorEffect) {
      this.cursorEffect.remove();
      this.cursorEffect = null;
    }

    // Restore controlled tokens
    if (this.config.rememberControlled && this.controlled.length > 0) {
      const tokens = this.controlled
        .map(id => canvas.tokens.get(id))
        .filter(t => t);
      canvas.tokens.controlled.forEach(t => t.release());
      tokens.forEach(t => t.control({ releaseOthers: false }));
    }
  }

  /**
   * Static method for quick use
   */
  static async show(config = {}) {
    const crosshairs = new Crosshairs(config);
    return await crosshairs.show();
  }
}
