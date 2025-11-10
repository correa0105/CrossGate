/**
 * Mutation System
 * Allows temporary or permanent modification of actors and tokens
 */

export class Mutator {
  /**
   * Apply mutations to a token/actor
   * @param {Token|Actor} target - Target token or actor
   * @param {Object} updates - Updates to apply
   * @param {Object} callbacks - Callbacks for customization
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Information about the applied mutation
   */
  static async mutate(target, updates = {}, callbacks = {}, options = {}) {
    // Merge default options
    options = foundry.utils.mergeObject({
      name: foundry.utils.randomID(),
      permanent: false,
      description: '',
      comparisonKeys: {},
      updateOpts: {}
    }, options);

    // Normalize the target
    const token = this._getToken(target);
    const actor = token?.actor || target;

    if (!actor) {
      ui.notifications.error(game.i18n.localize('CROSSGATE.error.noActor'));
      return null;
    }

    // Prepare the updates
    const preparedUpdates = this._prepareUpdates(updates, actor);

    // Pre-mutation callback
    if (callbacks.pre) {
      const shouldContinue = await callbacks.pre(preparedUpdates, actor);
      if (shouldContinue === false) return null;
    }

    // Save original state if not permanent
    let mutationInfo = null;
    if (!options.permanent) {
      mutationInfo = await this._saveMutationState(actor, options.name, preparedUpdates);
    }

    // Apply the changes
    await this._applyUpdates(actor, token, preparedUpdates, options.updateOpts);

    // Post-mutation callback
    if (callbacks.post) {
      await callbacks.post(mutationInfo, actor);
    }

    return mutationInfo;
  }

  /**
   * Revert applied mutations
   * @param {Token|Actor} target - Target token or actor
   * @param {string} mutationName - Name of the mutation to revert (or null for all)
   * @param {Object} callbacks - Callbacks
   */
  static async revert(target, mutationName = null, callbacks = {}) {
    const token = this._getToken(target);
    const actor = token?.actor || target;

    if (!actor) {
      ui.notifications.error(game.i18n.localize('CROSSGATE.error.noActor'));
      return false;
    }

    // Get mutation history
    const mutations = actor.getFlag('crossgate', 'mutations') || {};

    // If specific name, revert only that one
    if (mutationName) {
      const mutation = mutations[mutationName];
      if (!mutation) {
        console.warn(`Mutation ${mutationName} not found`);
        return false;
      }

      // Pre-revert callback
      if (callbacks.pre) {
        const shouldContinue = await callbacks.pre(mutation, actor);
        if (shouldContinue === false) return false;
      }

      // Revert
      await this._applyUpdates(actor, token, mutation.original, {});

      // Remove from history
      delete mutations[mutationName];
      await actor.setFlag('crossgate', 'mutations', mutations);

      // Post-revert callback
      if (callbacks.post) {
        await callbacks.post(mutation, actor);
      }

      return true;
    }

    // Revert all mutations
    const mutationNames = Object.keys(mutations);
    for (const name of mutationNames) {
      await this.revert(target, name, callbacks);
    }

    return true;
  }

  /**
   * Get the token(s) from the target
   */
  static _getToken(target) {
    // If it's already a TokenDocument, return it
    if (target instanceof TokenDocument) {
      return target;
    }

    // If it's a Token object (from canvas), get its document
    if (target?.document instanceof TokenDocument) {
      return target.document;
    }

    // If it's an Actor, get the first active token's document
    if (target instanceof Actor) {
      const activeTokens = target.getActiveTokens();
      return activeTokens[0]?.document || null;
    }

    return null;
  }

  /**
   * Prepare the updates for application
   */
  static _prepareUpdates(updates, actor) {
    const prepared = {
      actor: {},
      token: {},
      embedded: {}
    };

    // Debug logging
    const debug = game.settings.get('crossgate', 'debug');
    if (debug) {
      console.log('CrossGate | Raw updates received:', updates);
    }

    // Separate updates by type
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'token') {
        prepared.token = value;
      } else if (key === 'actor') {
        prepared.actor = value;
      } else if (key === 'embedded') {
        prepared.embedded = value;
      } else if (key === 'actorData') {
        // Compatibility with old format
        prepared.actor = value;
      } else {
        // Assume it's an actor update
        prepared.actor[key] = value;
      }
    }

    // Convert 'scale' to 'texture.scaleX' and 'texture.scaleY' for compatibility
    if (prepared.token.scale !== undefined) {
      const scaleValue = prepared.token.scale;
      prepared.token['texture.scaleX'] = scaleValue;
      prepared.token['texture.scaleY'] = scaleValue;
      delete prepared.token.scale;
    }

    if (debug) {
      console.log('CrossGate | Prepared updates:', prepared);
    }

    return prepared;
  }

  /**
   * Save the current state before mutation
   */
  static async _saveMutationState(actor, name, updates) {
    // Capture original values
    const original = {
      actor: {},
      token: {},
      embedded: {}
    };

    // Save original actor values
    for (const key of Object.keys(updates.actor)) {
      original.actor[key] = foundry.utils.getProperty(actor, key);
    }

    // Save original token values (if any)
    const token = actor.getActiveTokens()[0]?.document;
    if (token) {
      for (const key of Object.keys(updates.token)) {
        original.token[key] = foundry.utils.getProperty(token, key);
      }
    }

    // Save to mutation history
    const mutations = actor.getFlag('crossgate', 'mutations') || {};
    mutations[name] = {
      original,
      updates,
      timestamp: Date.now()
    };

    await actor.setFlag('crossgate', 'mutations', mutations);

    return { name, original, updates };
  }

  /**
   * Apply updates to actor/token
   */
  static async _applyUpdates(actor, token, updates, updateOpts = {}) {
    const promises = [];

    // Debug logging
    const debug = game.settings.get('crossgate', 'debug');
    if (debug) {
      console.log('CrossGate | Applying updates:', {
        actorName: actor.name,
        actorId: actor.id,
        tokenId: token?.id,
        updates: updates
      });
    }

    // Update actor
    if (updates.actor && Object.keys(updates.actor).length > 0) {
      if (debug) console.log('CrossGate | Updating actor with:', updates.actor);
      try {
        const result = await actor.update(updates.actor, updateOpts);
        if (debug) console.log('CrossGate | Actor update result:', result);
      } catch (error) {
        console.error('CrossGate | Error updating actor:', error);
        ui.notifications.error(`Failed to update actor: ${error.message}`);
      }
    }

    // Update token
    if (token && updates.token && Object.keys(updates.token).length > 0) {
      if (debug) console.log('CrossGate | Updating token with:', updates.token);
      try {
        const result = await token.update(updates.token, updateOpts);
        if (debug) console.log('CrossGate | Token update result:', result);
      } catch (error) {
        console.error('CrossGate | Error updating token:', error);
        ui.notifications.error(`Failed to update token: ${error.message}`);
      }
    }

    // Update embedded documents
    if (updates.embedded) {
      for (const [embeddedName, embeddedUpdates] of Object.entries(updates.embedded)) {
        if (Array.isArray(embeddedUpdates)) {
          // Creation/update of items
          promises.push(actor.createEmbeddedDocuments(embeddedName, embeddedUpdates, updateOpts));
        } else if (typeof embeddedUpdates === 'object') {
          // Updates to existing items
          const updates = Object.entries(embeddedUpdates).map(([id, data]) => ({
            _id: id,
            ...data
          }));
          promises.push(actor.updateEmbeddedDocuments(embeddedName, updates, updateOpts));
        }
      }
    }

    await Promise.all(promises);
  }

  /**
   * Check if an actor has a specific mutation
   */
  static hasMutation(target, mutationName) {
    const token = this._getToken(target);
    const actor = token?.actor || target;

    if (!actor) return false;

    // Check if it's actually an Actor
    if (!(actor instanceof Actor)) {
      console.warn('CrossGate | hasMutation: target is not a valid Actor', actor);
      return false;
    }

    try {
      const mutations = actor.getFlag('crossgate', 'mutations') || {};
      return mutationName ? !!mutations[mutationName] : Object.keys(mutations).length > 0;
    } catch (error) {
      console.error('CrossGate | Error checking mutations:', error);
      return false;
    }
  }

  /**
   * List all mutations of an actor
   */
  static getMutations(target) {
    const token = this._getToken(target);
    const actor = token?.actor || target;

    if (!actor) return {};

    // Check if it's actually an Actor
    if (!(actor instanceof Actor)) {
      console.warn('CrossGate | getMutations: target is not a valid Actor', actor);
      return {};
    }

    try {
      return actor.getFlag('crossgate', 'mutations') || {};
    } catch (error) {
      console.error('CrossGate | Error getting mutations:', error);
      return {};
    }
  }
}
