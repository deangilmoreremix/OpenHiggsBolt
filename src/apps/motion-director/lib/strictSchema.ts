/**
 * OpenAI structured outputs with `strict: true` accept only a subset of JSON Schema: every object must set
 * `additionalProperties: false` and list EVERY property in `required`; arrays need `items`; unsupported keywords make the
 * request fail with HTTP 400 on the first real call. This walks a schema and returns the problems (empty = strict-valid).
 */
const UNSUPPORTED = ['allOf', 'not', 'if', 'then', 'else', 'patternProperties', 'dependentRequired', 'dependentSchemas', 'uniqueItems', 'minProperties', 'maxProperties'];

export function strictSchemaProblems(schema: unknown, path = '$'): string[] {
  const out: string[] = [];
  if (!schema || typeof schema !== 'object') return [`${path}: not a schema object`];
  const s = schema as Record<string, unknown>;
  for (const k of UNSUPPORTED) if (k in s) out.push(`${path}: "${k}" is not supported in strict mode`);
  const type = s.type;
  if (type === 'object') {
    const props = (s.properties ?? {}) as Record<string, unknown>;
    if (s.additionalProperties !== false) out.push(`${path}: object needs additionalProperties: false`);
    const required = Array.isArray(s.required) ? (s.required as string[]) : [];
    for (const k of Object.keys(props)) if (!required.includes(k)) out.push(`${path}.${k}: property is not in required (strict mode requires all)`);
    for (const k of required) if (!(k in props)) out.push(`${path}: required "${k}" has no property`);
    for (const [k, v] of Object.entries(props)) out.push(...strictSchemaProblems(v, `${path}.${k}`));
  } else if (type === 'array') {
    if (!s.items) out.push(`${path}: array needs items`);
    else out.push(...strictSchemaProblems(s.items, `${path}[]`));
  } else if (Array.isArray(type)) {
    // a union such as ['string','null'] is allowed; objects inside unions must still be strict
  } else if (!type && !s.enum && !s.anyOf && !s.$ref) {
    out.push(`${path}: no type`);
  }
  if (Array.isArray(s.anyOf)) (s.anyOf as unknown[]).forEach((v, i) => out.push(...strictSchemaProblems(v, `${path}.anyOf[${i}]`)));
  return out;
}
