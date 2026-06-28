/**
 * Safely updates a document field and its corresponding tracking metadata.
 * Respects manual overrides: if the field was manually edited (source === 'manual'),
 * automated syncs (source !== 'manual') are ignored to prevent overwriting user edits.
 *
 * @param {Object} doc - Mongoose document to update
 * @param {String} fieldPath - Dot-separated path to the field (e.g. 'displayName', 'socialLinks.linkedin')
 * @param {Any} value - The new value to set
 * @param {String} source - Source of the update ('manual', 'googleScholar', etc.)
 * @param {String|ObjectId} userId - ID of the user performing the action
 * @param {Number} [syncVersion=1] - Sync version
 * @returns {Boolean} True if updated, false if skipped due to manual lock
 */
export const updateFieldWithMetadata = (doc, fieldPath, value, source, userId, syncVersion = 1) => {
  // If the doc doesn't have a fieldMetadata map, initialize it
  if (!doc.fieldMetadata) {
    doc.fieldMetadata = new Map();
  }

  // Check if this field has been manually updated.
  // If the existing source is 'manual' and the incoming source is automated (not 'manual'), we skip the update.
  const existingMeta = doc.fieldMetadata.get(fieldPath);
  if (existingMeta && existingMeta.source === 'manual' && source !== 'manual') {
    console.log(`[SourceTracker] Skipped updating "${fieldPath}" to preserve manual user edit.`);
    return false;
  }

  // Set value on document
  doc.set(fieldPath, value);

  // Update field metadata
  doc.fieldMetadata.set(fieldPath, {
    source,
    lastUpdated: new Date(),
    updatedBy: userId,
    syncVersion,
  });

  return true;
};
