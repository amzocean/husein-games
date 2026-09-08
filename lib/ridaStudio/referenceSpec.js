'use strict';

const REFERENCE_ROLES = new Set(['base_cloth', 'design', 'complete']);
const SOURCE_TYPES = new Set(['fabric_closeup', 'design_only', 'worn_rida', 'other']);
const BASE_RELATIONSHIPS = new Set(['same_on_both', 'complementary', 'not_applicable']);
const LAYER_TYPES = new Set(['panel', 'border', 'lace', 'embroidery', 'piping', 'other']);
const LAYER_PLACEMENTS = new Set([
  'above_bottom_design',
  'bottom_design',
  'bottom_edge',
  'throughout',
  'other',
]);
const APPLIES_TO = new Set(['both', 'pardi', 'ghaghro']);
const VERTICAL_SIZES = new Set([
  'trim_1_3',
  'narrow_3_5',
  'standard_6_8',
  'broad_8_10',
  'not_applicable',
]);
const MAX_SPEC_TEXT_LENGTH = 500;
const MAX_SUMMARY_LENGTH = 700;
const MAX_LAYERS = 8;

function normalizeText(value, label, maxLength = MAX_SPEC_TEXT_LENGTH) {
  if (typeof value !== 'string') throw new Error(`${label} must be text.`);
  const normalized = value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (normalized.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  }
  return normalized;
}

function normalizeReferenceRole(value) {
  if (typeof value !== 'string' || !REFERENCE_ROLES.has(value)) {
    throw new Error('Reference role must be base_cloth, design, or complete.');
  }
  return value;
}

function normalizeReferenceSpec(value, expectedRole) {
  const role = normalizeReferenceRole(expectedRole);
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Reference analysis must be an object.');
  }
  const allowedKeys = new Set([
    'role',
    'sourceType',
    'baseRelationship',
    'baseCloth',
    'designLayers',
    'embroideryAboveDesign',
    'summary',
  ]);
  const extraKeys = Object.keys(value).filter((key) => !allowedKeys.has(key));
  if (extraKeys.length) throw new Error('Reference analysis contains unexpected fields.');
  if (value.role !== role) throw new Error('Reference analysis role does not match its upload field.');
  if (!SOURCE_TYPES.has(value.sourceType)) throw new Error('Reference analysis source type is invalid.');
  if (!BASE_RELATIONSHIPS.has(value.baseRelationship)) {
    throw new Error('Reference analysis base relationship is invalid.');
  }
  if (!Array.isArray(value.designLayers) || value.designLayers.length > MAX_LAYERS) {
    throw new Error(`Reference analysis must contain at most ${MAX_LAYERS} design layers.`);
  }

  const designLayers = value.designLayers.map((layer, index) => {
    if (!layer || typeof layer !== 'object' || Array.isArray(layer)) {
      throw new Error(`Design layer ${index + 1} must be an object.`);
    }
    const layerKeys = Object.keys(layer);
    if (layerKeys.length !== 5 ||
        !['type', 'placement', 'appliesTo', 'verticalSize', 'description']
          .every((key) => layerKeys.includes(key))) {
      throw new Error(`Design layer ${index + 1} has invalid fields.`);
    }
    if (!LAYER_TYPES.has(layer.type)) throw new Error(`Design layer ${index + 1} type is invalid.`);
    if (!LAYER_PLACEMENTS.has(layer.placement)) {
      throw new Error(`Design layer ${index + 1} placement is invalid.`);
    }
    if (!APPLIES_TO.has(layer.appliesTo)) {
      throw new Error(`Design layer ${index + 1} garment target is invalid.`);
    }
    if (!VERTICAL_SIZES.has(layer.verticalSize)) {
      throw new Error(`Design layer ${index + 1} vertical size is invalid.`);
    }
    const description = normalizeText(
      layer.description,
      `Design layer ${index + 1} description`,
    );
    if (!description) throw new Error(`Design layer ${index + 1} description is required.`);
    return {
      type: layer.type,
      placement: layer.placement,
      appliesTo: layer.appliesTo,
      verticalSize: layer.verticalSize,
      description,
    };
  });

  const normalized = {
    role,
    sourceType: value.sourceType,
    baseRelationship: value.baseRelationship,
    baseCloth: normalizeText(value.baseCloth, 'Base-cloth analysis'),
    designLayers,
    embroideryAboveDesign: normalizeText(
      value.embroideryAboveDesign,
      'Embroidery-above-design analysis',
    ),
    summary: normalizeText(value.summary, 'Reference-analysis summary', MAX_SUMMARY_LENGTH),
  };

  if (!normalized.summary) throw new Error('Reference-analysis summary is required.');
  if (role === 'base_cloth') {
    if (!normalized.baseCloth) throw new Error('Base-cloth analysis is required.');
    normalized.baseRelationship = 'same_on_both';
    normalized.designLayers = [];
    normalized.embroideryAboveDesign = '';
  } else if (role === 'design') {
    normalized.baseRelationship = 'not_applicable';
    normalized.baseCloth = '';
    if (!normalized.designLayers.length && !normalized.embroideryAboveDesign) {
      throw new Error('Design analysis must identify at least one design element.');
    }
  } else if (!normalized.baseCloth) {
    throw new Error('Complete-rida analysis must identify the base cloth.');
  }

  return normalized;
}

function formatReferenceSpec(spec) {
  const normalized = normalizeReferenceSpec(spec, spec.role);
  const sourceType = normalized.sourceType.replaceAll('_', ' ');
  const parts = [`Source type: ${sourceType}.`];
  if (normalized.role !== 'design') {
    const relationship = normalized.baseRelationship === 'complementary'
      ? 'The pardi and ghaghro use explicitly complementary base cloths.'
      : 'Use the same base cloth on the pardi and ghaghro.';
    parts.push(`Base cloth: ${normalized.baseCloth}. ${relationship}`);
  }
  if (normalized.role !== 'base_cloth') {
    if (normalized.designLayers.length) {
      parts.push('Required top-to-bottom design order:');
      normalized.designLayers.forEach((layer, index) => {
        const verticalSize = {
          trim_1_3: '1-3 inches high',
          narrow_3_5: '3-5 inches high',
          standard_6_8: '6-8 inches high',
          broad_8_10: '8-10 inches high',
          not_applicable: 'with no vertical-height requirement',
        }[layer.verticalSize];
        parts.push(
          `${index + 1}. ${layer.type} at ${layer.placement.replaceAll('_', ' ')}, ` +
          `${verticalSize}, applied to ${layer.appliesTo}: ${layer.description}.`,
        );
      });
      if (normalized.designLayers.some((layer) => layer.appliesTo === 'both')) {
        parts.push(
          'Every layer marked both must be rendered independently twice: once in the bottom-design ' +
          'stack of the pardi and once in the bottom-design stack of the ghaghro. Never distribute ' +
          'different layers between the two pieces.',
        );
      }
    }
    parts.push(normalized.embroideryAboveDesign
      ? `Additional embroidery above the bottom design: ${normalized.embroideryAboveDesign}.`
      : 'No additional embroidery above the bottom design was identified.');
  }
  return parts.join(' ');
}

module.exports = {
  REFERENCE_ROLES,
  SOURCE_TYPES,
  BASE_RELATIONSHIPS,
  LAYER_TYPES,
  LAYER_PLACEMENTS,
  APPLIES_TO,
  VERTICAL_SIZES,
  MAX_SPEC_TEXT_LENGTH,
  MAX_SUMMARY_LENGTH,
  MAX_LAYERS,
  normalizeText,
  normalizeReferenceRole,
  normalizeReferenceSpec,
  formatReferenceSpec,
};
