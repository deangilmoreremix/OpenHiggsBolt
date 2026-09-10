export function createGroupedVideoRegistry({
  facetOptions,
  facetLabels,
  registerVariants,
}) {
  const configurations = new Map();
  const familyNames = {};
  const workflowVariants = {};

  function register(modelId, familyId, workflowIds, facets = {}) {
    configurations.set(modelId, Object.freeze({
      familyId,
      ...facets,
      workflowIds: Object.freeze(workflowIds),
    }));
  }

  registerVariants(register);

  for (const [modelId, config] of configurations) {
    if (!familyNames[config.familyId]) {
      familyNames[config.familyId] = config.familyId;
    }
    for (const workflowId of config.workflowIds) {
      if (workflowId === null) continue;
      (workflowVariants[config.familyId] ||= {})[workflowId] = (
        workflowVariants[config.familyId][workflowId] || []
      ).concat(modelId);
    }
  }

  const EMPTY_OPTIONS = Object.freeze([]);

  function buildSelectionIndex() {
    const families = new Map();
    for (const [modelId, config] of configurations) {
      let family = families.get(config.familyId);
      if (!family) {
        family = { workflows: new Map(), coordinates: new Map() };
        families.set(config.familyId, family);
      }
      const key = Object.entries(config)
        .filter(([k]) => facetOptions[k])
        .map(([, v]) => v)
        .join("\u0000");
      family.coordinates.set(key, config);
      for (const workflowId of config.workflowIds) {
        if (workflowId === null) continue;
        let group = family.workflows.get(workflowId);
        if (!group) {
          group = {
            modelIds: [],
            variantByCoordinates: new Map(),
            optionsByCoordinates: new Map(),
            facetValues: Object.fromEntries(
              Object.keys(facetOptions).map((facet) => [facet, new Set()]),
            ),
            defaultConfiguration: config,
            defaultScore: 0,
          };
          family.workflows.set(workflowId, group);
        }
        group.modelIds.push(modelId);
        const existingId = group.variantByCoordinates.get(key);
        if (!existingId) {
          group.variantByCoordinates.set(key, modelId);
        }
        for (const facet of Object.keys(facetOptions)) group.facetValues[facet].add(config[facet]);
      }
    }

    for (const family of families.values()) {
      for (const group of family.workflows.values()) {
        const fields = Object.keys(facetOptions).flatMap((key) =>
          group.facetValues[key].size > 1
            ? [{
              key,
              label: facetLabels[key],
              options: facetOptions[key].filter((option) => group.facetValues[key].has(option.value)),
            }]
            : []
        );
        for (const [coordinates, config] of family.coordinates) {
          const options = fields.map((field) => Object.freeze({
            key: field.key,
            label: field.label,
            value: config[field.key],
            options: Object.freeze(field.options.map((option) => Object.freeze({
              ...option,
              disabled: !group.variantByCoordinates.has(
                Object.entries(config)
                  .filter(([k]) => facetOptions[k])
                  .map(([k, v]) => k === field.key ? option.value : v)
                  .join("\u0000"),
              ),
            }))),
          }));
          group.optionsByCoordinates.set(coordinates, Object.freeze(options));
        }
        delete group.facetValues;
        delete group.defaultScore;
      }
    }
    return families;
  }

  const selectionIndex = buildSelectionIndex();

  return {
    configurations,
    familyNames,
    workflowVariants: Object.freeze(workflowVariants),
    getConfiguration: (modelId) => configurations.get(modelId) || null,
    getVariantOptions: (familyId, workflowId = null, currentModelId = null) => {
      const group = selectionIndex.get(familyId)?.workflows.get(workflowId);
      if (!group) return EMPTY_OPTIONS;
      const current = configurations.get(currentModelId);
      const selected = current?.familyId === familyId ? current : group.defaultConfiguration;
      const key = Object.entries(selected)
        .filter(([k]) => facetOptions[k])
        .map(([, v]) => v)
        .join("\u0000");
      return group.optionsByCoordinates.get(key) || EMPTY_OPTIONS;
    },
    resolveVariant: ({ familyId, workflowId = null, currentModelId = null, changes = {} }) => {
      const group = selectionIndex.get(familyId)?.workflows.get(workflowId);
      if (!group) return null;
      const current = configurations.get(currentModelId);
      const coordinates = current?.familyId === familyId ? current : group.defaultConfiguration;
      const requestedKey = Object.entries({ ...coordinates, ...changes })
        .filter(([k]) => facetOptions[k])
        .map(([, v]) => v)
        .join("\u0000");
      if (current?.familyId === familyId && current.workflowIds.includes(workflowId) &&
          Object.entries(current).filter(([k]) => facetOptions[k]).map(([, v]) => v).join("\u0000") === requestedKey) {
        return currentModelId;
      }
      return group.variantByCoordinates.get(requestedKey) || null;
    },
  };
}