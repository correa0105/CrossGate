/**
 * CrossGate
 * Advanced system for spawning, mutations, and visual selection of tokens
 * Compatible with Foundry VTT v13+
 */

import { Crosshairs } from './crosshairs.js';
import { Spawner } from './spawner.js';
import { Mutator } from './mutator.js';

/**
 * Main CrossGate API
 */
class CrossGate {
  static #initialized = false;

  /**
   * Initialize the module
   */
  static init() {
    if (this.#initialized) return;

    console.log('CrossGate | Initializing...');

    // Register settings
    this._registerSettings();

    this.#initialized = true;
    console.log('CrossGate | Initialized successfully');
  }

  /**
   * Register module settings
   */
  static _registerSettings() {
    game.settings.register('crossgate', 'debug', {
      name: 'Debug Mode',
      hint: 'Enable debug logging',
      scope: 'client',
      config: true,
      type: Boolean,
      default: false
    });
  }

  /**
   * SPAWN - Create tokens on the canvas
   *
   * @param {string} actorNameOrId - Name or ID of the actor to create
   * @param {Object} updates - Modifications to apply to the token
   * @param {Object} callbacks - Callback functions {pre, post}
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Array of created tokens
   *
   * @example
   * // Simple spawn
   * await crossgate.spawn("Goblin");
   *
   * @example
   * // Spawn with customizations
   * await crossgate.spawn("Goblin", {
   *   token: { name: "Goblin Boss", scale: 1.5 },
   *   actor: { "system.attributes.hp.value": 50 }
   * });
   *
   * @example
   * // Spawn with callbacks
   * await crossgate.spawn("Goblin", {}, {
   *   pre: async (location, data) => {
   *     console.log("Spawning at", location);
   *     return true; // false cancels
   *   },
   *   post: async (location, tokens) => {
   *     console.log("Spawned", tokens);
   *   }
   * });
   */
  static async spawn(actorNameOrId, updates = {}, callbacks = {}, options = {}) {
    return await Spawner.spawn(actorNameOrId, updates, callbacks, options);
  }

  /**
   * DISMISS - Remove tokens from the canvas
   *
   * @param {Array<Token>|Token} tokens - Token(s) to remove
   * @param {Object} options - Options
   *
   * @example
   * await crossgate.dismiss(token);
   * await crossgate.dismiss([token1, token2]);
   */
  static async dismiss(tokens, options = {}) {
    return await Spawner.dismiss(tokens, options);
  }

  /**
   * MUTATE - Apply mutations to tokens/actors
   *
   * @param {Token|Actor} target - Mutation target
   * @param {Object} updates - Updates to apply
   * @param {Object} callbacks - Callbacks {pre, post}
   * @param {Object} options - Options {name, permanent}
   * @returns {Promise<Object>} Mutation information
   *
   * @example
   * // Temporary mutation
   * await crossgate.mutate(token, {
   *   actor: { "system.attributes.hp.value": 100 },
   *   token: { scale: 2 }
   * }, {}, { name: "giant-form" });
   *
   * @example
   * // Permanent mutation
   * await crossgate.mutate(token, {
   *   actor: { name: "Transformed Creature" }
   * }, {}, { permanent: true });
   */
  static async mutate(target, updates = {}, callbacks = {}, options = {}) {
    return await Mutator.mutate(target, updates, callbacks, options);
  }

  /**
   * REVERT - Revert mutations
   *
   * @param {Token|Actor} target - Target
   * @param {string} mutationName - Mutation name (null = all)
   * @param {Object} callbacks - Callbacks
   *
   * @example
   * // Revert specific mutation
   * await crossgate.revert(token, "giant-form");
   *
   * @example
   * // Revert all mutations
   * await crossgate.revert(token);
   */
  static async revert(target, mutationName = null, callbacks = {}) {
    return await Mutator.revert(target, mutationName, callbacks);
  }

  /**
   * CROSSHAIRS - Show crosshairs for position selection
   *
   * @param {Object} config - Crosshairs configuration
   * @returns {Promise<Object>} Selected position {x, y, cancelled}
   *
   * @example
   * const location = await crossgate.crosshairs.show();
   * if (!location.cancelled) {
   *   console.log("Selected:", location.x, location.y);
   * }
   */
  static get crosshairs() {
    return {
      show: async (config = {}) => await Crosshairs.show(config),
      Crosshairs: Crosshairs
    };
  }

  /**
   * Check if an actor has a mutation
   */
  static hasMutation(target, mutationName) {
    return Mutator.hasMutation(target, mutationName);
  }

  /**
   * List all mutations of an actor
   */
  static getMutations(target) {
    return Mutator.getMutations(target);
  }

  /**
   * Utilities
   */
  static get CONST() {
    return {
      MODULE_NAME: 'crossgate',
      MODULE_TITLE: 'CrossGate',
      FLAG_SCOPE: 'crossgate'
    };
  }

  /**
   * Helpers for developers
   */
  static get helpers() {
    return {
      Spawner,
      Mutator,
      Crosshairs
    };
  }
}

/**
 * Initialization hook
 */
Hooks.once('init', () => {
  CrossGate.init();
});

/**
 * Ready hook
 */
Hooks.once('ready', () => {
  // Expose API globally
  window.crossgate = CrossGate;
  globalThis.crossgate = CrossGate;

  console.log('CrossGate | Ready! Access via "crossgate" object');

  // Notify users
  if (game.user.isGM) {
    ui.notifications.info('CrossGate loaded! Use "crossgate" to access the API.');
  }
});

/**
 * Export for other modules
 */
export default CrossGate;
export { CrossGate, Spawner, Mutator, Crosshairs };
