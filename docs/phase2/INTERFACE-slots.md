# Phase 2 — Design text slots: the editable-slot contract

**Owner:** A4 (Inspector Slot Engineer) · **Consumers:** A7/A8 (catalog), A11 (integration)

This is the contract between the **overlay inspector** (which edits a design's text) and the
**render path** (which draws it). It exists because Phase 1 designs declare *several* editable
text slots, but only the *primary* one was reachable by the customer: the others were rendered
from the brand data and could not be changed.

- The inspector lives in `src/shared/personalization/guided/OverlayEditor.tsx` (A4's file).
- The render path lives in `src/shared/personalization/preview/PersonalizationComposition.tsx`
  (`core` lane → **A11**).
- The persisted layer shape lives in `src/shared/personalization/preview/types.ts`
  (`core` lane → **A11**).

---

## 1. What a design declares

### 1.1 `RemotionDesignTextSlot` — field by field

`src/shared/personalization/templates/types.ts`:

```ts
export interface RemotionDesignTextSlot {
  /** Stable key for the slot; the `textSlots` map is keyed by it. */
  key: string
  /** Brand field whose value feeds the slot. */
  field: RemotionDesignTextField
  /** Label shown to the customer in the editor. */
  label?: string
  /**
   * The primary slot is the one the customer edits directly on the layer
   * (`layer.text`). Exactly one slot should be primary.
   */
  primary?: boolean
  /**
   * OPTIONAL — Phase 2. Maximum number of characters the customer may type
   * into this slot. The inspector applies it to the field's `maxLength`.
   */
  maxLength?: number
}
```

| Field | Type | Required | Meaning for the inspector |
|---|---|---|---|
| `key` | `string` | yes | The slot's identity. It is the key of the per-slot override map and the key of the `textSlots` record the design component receives. Must be unique inside one design and stable across releases (it is persisted in the customer's project). |
| `field` | `RemotionDesignTextField` | yes | Which brand field feeds the slot when the customer has not typed anything: `'businessName' \| 'headline' \| 'offer' \| 'cta' \| 'phone' \| 'website'`. |
| `label` | `string` | no | The text shown above the field. When absent the inspector derives a name from `field` (see §1.2). |
| `primary` | `boolean` | no | `true` for exactly one slot: the one that owns the layer's own `text` (see §2). |
| `maxLength` | `number` | no | Character limit for the field. **Phase 2 addition — A11 must add it to the type** (the inspector already honours it at runtime and ignores a missing/invalid value). |

### 1.2 The derived label (used when `label` is missing)

| `field` | Derived label |
|---|---|
| `businessName` | `Business name` |
| `headline` | `Headline` |
| `offer` | `Offer` |
| `cta` | `Call to action` |
| `phone` | `Phone` |
| `website` | `Website` |
| *(anything else)* | `Text` |

### 1.3 The brand field → slot mapping

`brand` is `PreviewInputProps['brand']`:

| `RemotionDesignTextField` | Brand value |
|---|---|
| `businessName` | `brand.businessName` |
| `headline` | `brand.headline` |
| `offer` | `brand.offer` |
| `cta` | `brand.cta` |
| `phone` | `brand.phone` |
| `website` | `brand.website` |

A missing brand value is the empty string — never `undefined` and never a crash.

---

## 2. How the effective value of a slot is computed

The inspector and the composition MUST agree. The precedence is:

```
effective(slot) =
    primary slot  →  layer.text          (when it is a string, even an empty one)
                  →  brand[slot.field]   (when layer.text is absent)
    other slot    →  layer.textSlotOverrides[slot.key]   (when it is a non-empty string)
                  →  brand[slot.field]   (absent / blank / malformed override)
```

Notes that matter:

- **The primary slot keeps the legacy contract.** `layer.text` is a plain string field that was
  already persisted and already rendered, so nothing about it changes. An empty `layer.text`
  blanks the primary slot (that is today's behaviour and it stays).
- **Secondary overrides are "non-empty wins".** A missing key, a blank/whitespace-only string or a
  value that is not a string all fall back to the brand value — an override never renders an empty
  slot. Clearing a field in the inspector therefore *resets the slot to its brand value* (the
  override is removed from the map), which is the same thing the customer sees.
- **The brand value is the floor, not the ceiling.** A design that declares a slot whose brand
  field is empty shows an empty field; the customer can still type into it.

The single source of truth for this algorithm is the exported helper
`resolveDesignSlotValues(design, layer, brand)` in
`src/shared/personalization/guided/OverlayEditor.tsx` (A4's file, exported for exactly this
reason). **A11 must move that helper into the `core` lane** (see §4) and use it from both sides.

---

## 3. The storage shape

### 3.1 The PRIMARY slot — no change

The primary slot is stored in the layer's existing `text` field:

```ts
layer.text = 'Acme Roofing'   // the primary slot's value
```

It is already persisted, already normalised (`normalizeLayer` keeps `text`) and already rendered.
**Nothing has to change for the primary slot.**

### 3.2 The SECONDARY slots — the new field

**A11 must add exactly this field to `PreviewLayer`**
(`src/shared/personalization/preview/types.ts`):

```ts
export interface PreviewLayer {
  // … the existing fields …
  /**
   * Per-slot text overrides for a `design` layer, keyed by
   * `RemotionDesignTextSlot.key`.
   *
   * The PRIMARY slot is NOT stored here: it keeps using `layer.text`.
   * Only the secondary slots appear in this map, so a design that declares
   * no primary slot stores every slot here.
   *
   * Absent ⇒ the slot falls back to its brand field.
   */
  textSlotOverrides?: Record<string, string>
}
```

- Field name: **`textSlotOverrides`**
- Type: **`Record<string, string>`** — keyed by `RemotionDesignTextSlot.key`
- Optional; only meaningful on `kind: 'design'` layers
- The inspector reads it defensively, so **the inspector works today** (before A11 adds the
  field) and a project saved before the field existed keeps rendering the brand values.

### 3.3 The patch the inspector writes

The inspector writes the whole map in one patch (never a partial merge):

```ts
updatePreviewLayer(layer.id, { textSlotOverrides: nextMap })
```

where `nextMap` is the previous map with the edited slot's entry replaced (or removed when the
customer cleared the field). An empty map `{}` is equivalent to an absent map.

---

## 4. What A11 must change (the `core` lane)

### 4.1 `preview/types.ts` — add the field

Add `textSlotOverrides?: Record<string, string>` to `PreviewLayer` (§3.2). The inspector compiles
against the current type through a local cast, so this change is additive and safe.

### 4.2 `preview/presets.ts` — `normalizeLayer` must preserve it

`normalizeLayer()` rebuilds a layer from an untrusted record and currently drops every field it
does not know about, so a saved override would be **silently lost on reload**. Add:

```ts
// in normalizeLayer(), after the `designId` handling:
const textSlotOverrides = normalizeTextSlotOverrides(raw.textSlotOverrides)
if (textSlotOverrides) normalized.textSlotOverrides = textSlotOverrides
```

and the helper (same file, next to the other normalizers):

```ts
function normalizeTextSlotOverrides(raw: unknown): Record<string, string> | undefined {
  if (!isRecord(raw)) return undefined
  const out: Record<string, string> = {}
  for (const key of Object.keys(raw)) {
    const value = raw[key]
    if (typeof key !== 'string' || !key) continue
    if (typeof value !== 'string') continue
    out[key] = value
  }
  return Object.keys(out).length > 0 ? out : undefined
}
```

**`normalizePreviewSettings()` needs NO change**: it builds every layer through
`normalizeLayer()` (`presets.ts:773-792`) and then `clampLayer()`, which spreads the layer and
therefore keeps the new field. Only `normalizeLayer()` has to know about it.

### 4.3 `preview/presets.ts` — `applyDesignTemplate` should carry the overrides over

`applyDesignTemplate()` rebuilds the design layer from scratch, so re-applying a design would
drop the customer's secondary-slot edits. Carry them over when the *same* design is re-applied:

```ts
const textSlotOverrides = existing?.designId === design.id ? existing.textSlotOverrides : undefined
// …
if (textSlotOverrides) overrides.textSlotOverrides = textSlotOverrides
```

### 4.4 `preview/PersonalizationComposition.tsx` — render the overrides

`resolveDesignTextSlots()` must consult the new field for the non-primary slots:

```ts
function resolveDesignTextSlots(
  design: RemotionDesignTemplate,
  layer: PreviewLayer,
  brand: PreviewInputProps['brand'],
): Record<string, string> {
  const slots: Record<string, string> = {}
  const declared = Array.isArray(design.textSlots) ? design.textSlots : []
  const overrides = layer.textSlotOverrides
  for (const slot of declared) {
    if (!slot || typeof slot.key !== 'string') continue
    if (slot.primary && typeof layer.text === 'string') {
      slots[slot.key] = layer.text
      continue
    }
    const override = overrides && typeof overrides[slot.key] === 'string' ? overrides[slot.key] : undefined
    slots[slot.key] = override && override.trim() ? override : brandTextValue(slot.field, brand)
  }
  return slots
}
```

### 4.5 Move the resolver into the `core` lane (recommended, avoids a cycle)

`resolveDesignSlotValues()` currently lives in `guided/OverlayEditor.tsx` because that is the only
file A4 owns. The composition must NOT import it from `guided/OverlayEditor.tsx`: that file
imports `DemoPersonalizeProvider`, which imports `PersonalizationModal`, which imports
`OverlayEditor` — a require cycle.

**A11 should move the helper** (and `brandSlotValue`, `designSlotOverrides`,
`isPrimaryDesignSlot`, `designSlotLabel`) into the `core` lane — `preview/presets.ts` or a new
`preview/designSlots.ts` — and import it from both `PersonalizationComposition.tsx` and
`guided/OverlayEditor.tsx`. The behaviour must stay exactly as specified in §2; the inspector's
copy is a temporary duplicate until that move happens.

---

## 5. The rules an adapter author must follow

1. **Exactly one `primary: true`** per design that declares slots. The primary slot owns
   `layer.text`; the inspector, the composition and `pickPrimaryTextSlot()` (`presets.ts`) all
   assume the same slot is primary. A design with no primary slot stores *every* slot in
   `textSlotOverrides` and the layer's `text` is ignored.
2. **`key` must be unique inside the design** and **stable across releases** — it is persisted in
   the customer's project and is the key of the override map. Renaming a key orphans the
   customer's saved value.
3. **`field` must be a valid `RemotionDesignTextField`** (`businessName`, `headline`, `offer`,
   `cta`, `phone`, `website`). An unknown field falls back to the empty string.
4. **`label` is optional** but recommended: it is what the customer reads above the field. Without
   it the inspector derives a name from `field` (§1.2).
5. **`maxLength` is optional** and must be a positive integer; a missing or invalid value means
   "no limit".
6. **Declare only the slots the design really draws.** A slot that is never rendered still shows
   up as an editable field in the inspector.
7. **A design may declare no slots at all** (`textSlots: []`, as the bokeh effect does). The
   inspector then shows "This design has no editable text." and no text field.
8. **Two slots may share a `field`** (e.g. two different lines both fed by `headline`). They stay
   independent because the override map is keyed by `key`, not by `field`.

---

## 6. Worked example — the `lower-third` design

`src/shared/personalization/templates/catalog.ts`:

```ts
textSlots: [
  { key: 'businessName', field: 'businessName', label: 'Name', primary: true },
  { key: 'offer', field: 'offer', label: 'Title' },
],
```

The customer sees **two** fields in the inspector:

| Field | Label | Brand fallback | Stored in |
|---|---|---|---|
| 1 | `Name` | `brand.businessName` → `Acme Roofing` | `layer.text` |
| 2 | `Title` | `brand.offer` → `10% off this week` | `layer.textSlotOverrides.offer` |

### 6.1 Fresh layer (nothing typed yet)

```ts
const layer = createLayer('design', { designId: 'lower-third' })
// layer.text                       → undefined
// layer.textSlotOverrides          → undefined
```

The inspector shows `Name = "Acme Roofing"` and `Title = "10% off this week"`, and the
composition renders exactly those two strings.

### 6.2 The customer edits the secondary slot

```ts
// after typing "Summer sale" into the Title field
layer.text                       → undefined            (untouched)
layer.textSlotOverrides          → { offer: 'Summer sale' }
```

```ts
resolveDesignSlotValues(design, layer, brand)
// → { businessName: 'Acme Roofing', offer: 'Summer sale' }
```

The composition renders `Acme Roofing` / `Summer sale`.

### 6.3 The customer edits the primary slot

```ts
// after typing "Acme Roofing Ltd" into the Name field
layer.text                       → 'Acme Roofing Ltd'
layer.textSlotOverrides          → undefined            (untouched)
```

```ts
resolveDesignSlotValues(design, layer, brand)
// → { businessName: 'Acme Roofing Ltd', offer: '10% off this week' }
```

### 6.4 The customer clears the secondary slot

```ts
layer.textSlotOverrides          → {}   (the override is dropped)
```

```ts
resolveDesignSlotValues(design, layer, brand)
// → { businessName: 'Acme Roofing', offer: '10% off this week' }
```

The slot falls back to the brand value instead of rendering an empty string.

### 6.5 Round-trip through the persistence layer

`normalizeLayer()` (§4.2) keeps `textSlotOverrides`, so a reloaded project keeps the customer's
edits. A project saved **before** this field existed has no `textSlotOverrides` at all — the
inspector and the composition both fall back to the brand values, which is exactly the Phase 1
behaviour.

---

## 7. Where the behaviour is pinned by tests

`src/shared/personalization/guided/__tests__/designSlotEditing.test.tsx` (A4):

- one field per declared slot, labelled with the slot's label;
- the brand-derived values when nothing is stored;
- an unknown / blank / malformed override falls back to the brand value;
- editing a secondary slot updates the value the composition would use;
- editing the primary slot still writes `layer.text`;
- clearing a secondary slot restores the brand value;
- a plain text layer and an unregistered design keep their single text field.
