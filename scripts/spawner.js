/**
 * Token Spawning System
 * Allows dynamic creation of tokens on the canvas
 */

import { Crosshairs } from './crosshairs.js';

export class Spawner {
  /**
   * Spawn a token on the canvas
   * @param {string} actorNameOrId - Actor name or ID
   * @param {Object} updates - Updates to apply to the token
   * @param {Object} callbacks - Callbacks for customization
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Array of created tokens
   */
  static async spawn(actorNameOrId, updates = {}, callbacks = {}, options = {}) {
    // Merge default options
    options = foundry.utils.mergeObject({
      controllingActor: null,
      duplicates: 1,
      collision: true,
      comparisonKeys: {},
      crosshairs: {}
    }, options);

    // Find the actor
    const actor = await this._getActor(actorNameOrId);
    if (!actor) {
      ui.notifications.error(game.i18n.localize('CROSSGATE.error.noActor'));
      return [];
    }

    // Get the position (use crosshairs if not provided)
    let position;
    if (updates.x !== undefined && updates.y !== undefined) {
      position = { x: updates.x, y: updates.y, cancelled: false };
    } else {
      position = await Crosshairs.show(options.crosshairs);
      if (position.cancelled) {
        ui.notifications.info(game.i18n.localize('CROSSGATE.error.cancelled'));
        return [];
      }
    }

    // Prepare token data
    const tokenData = await this._prepareTokenData(actor, updates, position);

    // Pre-creation callback
    if (callbacks.pre) {
      const shouldContinue = await callbacks.pre(position, tokenData);
      if (shouldContinue === false) return [];
    }

    // Create the tokens
    const spawnedTokens = [];
    for (let i = 0; i < options.duplicates; i++) {
      // Adjust position for duplicates
      let spawnPosition = { ...position };
      if (i > 0 && options.collision) {
        spawnPosition = this._findValidPosition(spawnPosition, tokenData);
      }

      // Update position in token data
      const finalTokenData = foundry.utils.mergeObject(tokenData, {
        x: spawnPosition.x,
        y: spawnPosition.y
      });

      // Create the token
      const created = await canvas.scene.createEmbeddedDocuments('Token', [finalTokenData]);
      if (created && created.length > 0) {
        spawnedTokens.push(created[0]);
      }
    }

    // Post-creation callback
    if (callbacks.post && spawnedTokens.length > 0) {
      await callbacks.post(position, spawnedTokens);
    }

    return spawnedTokens;
  }

  /**
   * Search for an actor by name or ID
   */
  static async _getActor(actorNameOrId) {
    // Try by ID first
    let actor = game.actors.get(actorNameOrId);
    if (actor) return actor;

    // Try by name
    actor = game.actors.getName(actorNameOrId);
    if (actor) return actor;

    // Try searching in compendiums
    for (let pack of game.packs) {
      if (pack.documentName !== 'Actor') continue;

      const index = await pack.getIndex();
      const entry = index.find(e => e.name === actorNameOrId || e._id === actorNameOrId);

      if (entry) {
        actor = await pack.getDocument(entry._id);
        if (actor) return actor;
      }
    }

    return null;
  }

  /**
   * Prepare token data for creation
   */
  static async _prepareTokenData(actor, updates, position) {
    // Base data from prototype token
    const prototypeData = actor.prototypeToken.toObject();

    // Remove properties that shouldn't be copied
    delete prototypeData._id;

    // Merge with updates
    const tokenData = foundry.utils.mergeObject(prototypeData, {
      x: position.x,
      y: position.y,
      actorId: actor.id,
      actorLink: false,
      ...updates
    });

    return tokenData;
  }

  /**
   * Find a valid nearby position (avoid collision)
   */
  static _findValidPosition(position, tokenData) {
    const gridSize = canvas.grid.size;
    const tokenWidth = tokenData.width || 1;
    const tokenHeight = tokenData.height || 1;

    // Spiral algorithm to find free position
    let offset = 1;
    while (offset < 10) {
      for (let dx = -offset; dx <= offset; dx++) {
        for (let dy = -offset; dy <= offset; dy++) {
          if (Math.abs(dx) === offset || Math.abs(dy) === offset) {
            const testPos = {
              x: position.x + (dx * gridSize),
              y: position.y + (dy * gridSize)
            };

            if (!this._checkCollision(testPos, tokenWidth, tokenHeight)) {
              return testPos;
            }
          }
        }
      }
      offset++;
    }

    // If no free position found, return the original
    return position;
  }

  /**
   * Check if there's a collision at the position
   */
  static _checkCollision(position, width, height) {
    const gridSize = canvas.grid.size;
    const bounds = {
      x: position.x,
      y: position.y,
      width: width * gridSize,
      height: height * gridSize
    };

    // Check collision with other tokens
    for (let token of canvas.tokens.placeables) {
      const tokenBounds = {
        x: token.x,
        y: token.y,
        width: token.w,
        height: token.h
      };

      if (this._boundsIntersect(bounds, tokenBounds)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if two rectangles intersect
   */
  static _boundsIntersect(a, b) {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    );
  }

  /**
   * Dismisses (removes) tokens created by CrossGate
   * @param {Array<Token>} tokens - Tokens to remove
   * @param {Object} options - Options
   */
  static async dismiss(tokens, options = {}) {
    if (!Array.isArray(tokens)) tokens = [tokens];

    const tokenIds = tokens
      .map(t => t.id || t._id || t)
      .filter(id => id);

    if (tokenIds.length === 0) return;

    await canvas.scene.deleteEmbeddedDocuments('Token', tokenIds);
  }
}
