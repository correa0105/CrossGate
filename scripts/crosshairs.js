/**
 * Crosshairs System (Selection Reticle)
 * Allows the user to select a position on the canvas with visual feedback
 */

export class Crosshairs {
  constructor(config = {}) {
    this.config = foundry.utils.mergeObject({
      size: 1,
      icon: 'icons/svg/target.svg',
      label: '',
      tag: 'crosshairs',
      drawIcon: true,
      drawOutline: true,
      interval: -1,
      fillAlpha: 0,
      tileTexture: false,
      lockSize: true,
      lockPosition: false,
      rememberControlled: false,
      range: -1,
      classList: ['crossgate-crosshairs']
    }, config);

    this.cancelled = false;
    this.position = null;
    this.template = null;
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
    const templateData = {
      t: 'circle',
      user: game.user.id,
      distance: this.config.size,
      direction: 0,
      x: 0,
      y: 0,
      fillColor: game.user.color,
      flags: {
        crossgate: {
          crosshairs: true
        }
      }
    };

    const cls = CONFIG.MeasuredTemplate.documentClass;
    const template = new cls(templateData, { parent: canvas.scene });
    this.template = new CONFIG.MeasuredTemplate.objectClass(template);
    this.template.draw();
    this.template.layer.addChild(this.template);
  }

  _onMouseMove(event) {
    const position = this._getMousePosition(event);
    if (!position) return;

    // Update template position
    if (this.template) {
      this.template.document.updateSource({ x: position.x, y: position.y });
      this.template.renderFlags.set({ refresh: true });
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

    // Remove template
    if (this.template) {
      this.template.destroy();
      this.template = null;
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
