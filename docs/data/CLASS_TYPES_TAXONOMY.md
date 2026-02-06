# Class Types & Styles Taxonomy

Canonical list of class types, styles, and categories for data quality and consistency.

---

## Philosophy

### The Problem
Looking at Mindbody exports, class names are a mess:
- "Vinyasa", "vinyasa flow", "VINYASA FLOW", "Power Vinyasa"
- "Yin", "yin yoga", "Yin/Restorative", "Deep Stretch/Yin"
- No way to compare data across studios

### Our Solution
- **Canonical types** with standardized names
- **Autocomplete** suggests existing types to prevent duplicates
- **Mapping** from common variations to canonical names
- **Categories** for grouping and filtering
- **Studio type defaults** but allow pulling from full list

---

## Data Model

```sql
-- Master list of canonical class types (managed centrally)
CREATE TABLE canonical_class_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,      -- "Vinyasa Flow"
  slug VARCHAR(100) NOT NULL UNIQUE,      -- "vinyasa-flow"
  category_id UUID REFERENCES class_categories(id),
  description TEXT,
  typical_duration_minutes INTEGER,
  typical_intensity VARCHAR(20),          -- 'gentle', 'moderate', 'vigorous'
  is_heated_default BOOLEAN DEFAULT false,
  aliases TEXT[],                         -- ["Power Vinyasa", "Dynamic Vinyasa"]
  icon VARCHAR(50),                       -- Icon name for UI
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories for grouping
CREATE TABLE class_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,       -- "Flow Yoga"
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7),                       -- Hex color for UI
  sort_order INTEGER DEFAULT 0
);

-- Studio-specific class templates reference canonical types
ALTER TABLE class_templates ADD COLUMN canonical_type_id UUID REFERENCES canonical_class_types(id);

-- Allow studios to create custom types (maps to 'Other' for analytics)
ALTER TABLE class_templates ADD COLUMN custom_type_name VARCHAR(100);

-- Studio type preferences (default types shown)
CREATE TABLE studio_type_defaults (
  studio_type VARCHAR(50),                -- 'yoga', 'pilates', 'fitness', 'dance'
  canonical_type_id UUID REFERENCES canonical_class_types(id),
  PRIMARY KEY (studio_type, canonical_type_id)
);
```

---

## Canonical Class Categories

### Yoga Categories

| Category | Description | Color |
|----------|-------------|-------|
| **Flow Yoga** | Dynamic, breath-linked movement | #7C3AED |
| **Alignment Yoga** | Focus on form and structure | #2563EB |
| **Restorative** | Relaxation and passive stretching | #059669 |
| **Hot Yoga** | Heated room practices | #DC2626 |
| **Meditation** | Mindfulness and seated practices | #8B5CF6 |
| **Specialty** | Workshops, inversions, specific focus | #F59E0B |
| **Fitness Fusion** | Yoga combined with other modalities | #EC4899 |
| **Prenatal/Postnatal** | Pregnancy and postpartum | #F472B6 |
| **Kids/Family** | Classes for children | #34D399 |

---

## Canonical Class Types

### Flow Yoga

| Type | Aliases | Duration | Intensity | Description |
|------|---------|----------|-----------|-------------|
| **Vinyasa Flow** | Power Vinyasa, Dynamic Vinyasa, Flow | 60-75 | Moderate-Vigorous | Breath-synchronized movement |
| **Power Yoga** | Power Flow, Athletic Yoga | 60-90 | Vigorous | High-intensity vinyasa |
| **Slow Flow** | Gentle Flow, Mindful Flow | 60 | Gentle-Moderate | Slower-paced vinyasa |
| **Sun Salutation Flow** | Surya Namaskar, Morning Flow | 45-60 | Moderate | Sun salutation focused |
| **Moon Flow** | Lunar Flow, Evening Flow | 60 | Gentle | Calming evening practice |

### Alignment Yoga

| Type | Aliases | Duration | Intensity | Description |
|------|---------|----------|-----------|-------------|
| **Hatha** | Hatha Yoga, Traditional Hatha | 60-90 | Gentle-Moderate | Classical posture practice |
| **Iyengar** | Iyengar Yoga, Alignment Yoga | 75-90 | Moderate | Prop-supported alignment |
| **Ashtanga** | Ashtanga Vinyasa, Mysore | 90 | Vigorous | Traditional sequence |
| **Fundamentals** | Basics, Yoga 101, Beginner | 60 | Gentle | Foundation building |

### Restorative

| Type | Aliases | Duration | Intensity | Description |
|------|---------|----------|-----------|-------------|
| **Yin Yoga** | Yin, Deep Stretch | 60-75 | Gentle | Long-held passive stretches |
| **Restorative** | Restorative Yoga, Rest & Restore | 60-75 | Very Gentle | Fully supported relaxation |
| **Yoga Nidra** | Yogic Sleep | 45-60 | Very Gentle | Guided deep relaxation |
| **Stretch & Release** | Deep Stretch, Flexibility | 45-60 | Gentle | Focused stretching |

### Hot Yoga

| Type | Aliases | Duration | Intensity | Heated |
|------|---------|----------|-----------|--------|
| **Hot Vinyasa** | Hot Flow, Heated Flow | 60-75 | Vigorous | Yes (95-100°F) |
| **Hot Power** | Hot Power Yoga | 60-75 | Very Vigorous | Yes (95-100°F) |
| **Bikram** | 26 & 2, Hot 26 | 90 | Vigorous | Yes (105°F) |
| **Warm Yoga** | Warm Flow | 60 | Moderate | Yes (85-90°F) |
| **Inferno Hot Pilates** | Hot Pilates | 60 | Very Vigorous | Yes (95°F) |

### Meditation

| Type | Aliases | Duration | Intensity | Description |
|------|---------|----------|-----------|-------------|
| **Guided Meditation** | Meditation, Mindfulness | 30-45 | Very Gentle | Instructor-led meditation |
| **Breathwork** | Pranayama, Breath Class | 30-45 | Gentle | Breathing techniques |
| **Sound Bath** | Sound Healing, Gong Bath | 60 | Very Gentle | Sound meditation |
| **Meditation & Movement** | Moving Meditation | 45-60 | Gentle | Combined practice |

### Specialty

| Type | Aliases | Duration | Intensity | Description |
|------|---------|----------|-----------|-------------|
| **Inversions** | Handstands, Arm Balances | 60-90 | Vigorous | Upside-down focused |
| **Backbends** | Heart Openers | 60-90 | Moderate | Spine extension focus |
| **Hip Openers** | Hip Workshop | 60-75 | Moderate | Hip mobility |
| **Yoga for Athletes** | Sports Yoga | 60 | Moderate | Athletic recovery |
| **Yoga for Back Care** | Back Yoga, Spine Health | 60 | Gentle | Back pain relief |

### Fitness Fusion

| Type | Aliases | Duration | Intensity | Description |
|------|---------|----------|-----------|-------------|
| **Yoga Sculpt** | Yoga + Weights, Strength Yoga | 60 | Vigorous | Yoga with weights |
| **Barre Yoga** | Yoga Barre | 60 | Moderate | Ballet-inspired |
| **Yoga + HIIT** | HIIT Yoga | 45-60 | Very Vigorous | High intensity intervals |
| **Pilates Yoga** | Yogilates | 60 | Moderate | Combined practice |

### Prenatal/Postnatal

| Type | Aliases | Duration | Intensity | Description |
|------|---------|----------|-----------|-------------|
| **Prenatal Yoga** | Pregnancy Yoga | 60 | Gentle | Safe for pregnancy |
| **Postnatal Yoga** | Mommy & Me, Baby Yoga | 60 | Gentle | Post-birth recovery |

### Kids/Family

| Type | Aliases | Duration | Intensity | Description |
|------|---------|----------|-----------|-------------|
| **Kids Yoga** | Children's Yoga | 30-45 | Gentle | Ages 5-12 |
| **Teen Yoga** | Youth Yoga | 45-60 | Moderate | Ages 13-17 |
| **Family Yoga** | Parent-Child Yoga | 45-60 | Gentle | All ages together |

---

## Pilates Types (for Pilates Studios)

| Type | Duration | Intensity |
|------|----------|-----------|
| **Mat Pilates** | 50-60 | Moderate |
| **Reformer Pilates** | 50 | Moderate-Vigorous |
| **Tower Pilates** | 50 | Moderate |
| **Barre Pilates** | 50 | Moderate |
| **Pilates Sculpt** | 50 | Vigorous |

---

## Autocomplete Implementation

```typescript
// src/hooks/useClassTypeAutocomplete.ts

interface ClassTypeSuggestion {
  id: string;
  name: string;
  category: string;
  isCanonical: boolean;
  matchedAlias?: string;
}

function useClassTypeAutocomplete(studioType: string = 'yoga') {
  const [suggestions, setSuggestions] = useState<ClassTypeSuggestion[]>([]);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) return [];

    // 1. Search canonical types (name and aliases)
    const canonical = await searchCanonicalTypes(query);

    // 2. Search studio's existing custom types
    const custom = await searchStudioCustomTypes(query);

    // 3. Prioritize: Exact match > Starts with > Contains > Alias match
    const sorted = [...canonical, ...custom].sort((a, b) => {
      const aExact = a.name.toLowerCase() === query.toLowerCase();
      const bExact = b.name.toLowerCase() === query.toLowerCase();
      if (aExact && !bExact) return -1;
      if (bExact && !aExact) return 1;

      const aStarts = a.name.toLowerCase().startsWith(query.toLowerCase());
      const bStarts = b.name.toLowerCase().startsWith(query.toLowerCase());
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;

      return a.name.localeCompare(b.name);
    });

    setSuggestions(sorted.slice(0, 10));
  }, []);

  return { suggestions, search };
}
```

### Autocomplete UI

```typescript
// When creating/editing a class template
<FormField name="classType">
  <FormLabel>Class Type</FormLabel>
  <Combobox
    value={selectedType}
    onValueChange={setSelectedType}
    onInputChange={(query) => search(query)}
  >
    <ComboboxInput placeholder="Start typing..." />
    <ComboboxOptions>
      {suggestions.map(type => (
        <ComboboxOption key={type.id} value={type}>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">{type.name}</span>
              {type.matchedAlias && (
                <span className="text-xs text-muted-foreground ml-2">
                  (also called "{type.matchedAlias}")
                </span>
              )}
            </div>
            <Badge variant="outline">{type.category}</Badge>
          </div>
        </ComboboxOption>
      ))}
      {/* Allow custom if no exact match */}
      {query && !suggestions.find(s => s.name === query) && (
        <ComboboxOption value={{ name: query, isCanonical: false }}>
          <span className="text-muted-foreground">
            Create custom type: "{query}"
          </span>
        </ComboboxOption>
      )}
    </ComboboxOptions>
  </Combobox>
  <FormDescription>
    Choose a standard type for better data quality, or create a custom one.
  </FormDescription>
</FormField>
```

---

## Import Mapping

When importing from Mindbody/competitors:

```typescript
// src/lib/importMapping.ts

const classTypeMapping: Record<string, string> = {
  // Vinyasa variations
  'vinyasa': 'Vinyasa Flow',
  'vinyasa flow': 'Vinyasa Flow',
  'power vinyasa': 'Vinyasa Flow',
  'dynamic vinyasa': 'Vinyasa Flow',
  'flow': 'Vinyasa Flow',
  'yoga flow': 'Vinyasa Flow',

  // Power variations
  'power': 'Power Yoga',
  'power yoga': 'Power Yoga',
  'power flow': 'Power Yoga',

  // Yin variations
  'yin': 'Yin Yoga',
  'yin yoga': 'Yin Yoga',
  'deep stretch': 'Yin Yoga',
  'yin stretch': 'Yin Yoga',

  // Hot variations
  'hot yoga': 'Hot Vinyasa',
  'hot flow': 'Hot Vinyasa',
  'heated yoga': 'Hot Vinyasa',
  'bikram': 'Bikram',
  '26 & 2': 'Bikram',

  // etc...
};

function normalizeClassName(input: string): string {
  const normalized = input.toLowerCase().trim();
  return classTypeMapping[normalized] || input; // Return original if no mapping
}
```

---

## Analytics Benefits

With canonical types, we can:

1. **Compare across studios**: "Average fill rate for Vinyasa Flow"
2. **Industry benchmarks**: "Your Yin classes fill 20% better than average"
3. **Trend analysis**: "Hot yoga demand up 15% this quarter"
4. **Recommendations**: "Studios like yours do well with Power Yoga at 6pm"

---

## Studio Type Defaults

When a studio is created, pre-populate based on type:

```typescript
const studioTypeDefaults: Record<string, string[]> = {
  yoga: [
    'Vinyasa Flow', 'Power Yoga', 'Slow Flow', 'Hatha',
    'Yin Yoga', 'Restorative', 'Guided Meditation',
    'Yoga Sculpt', 'Fundamentals'
  ],
  hot_yoga: [
    'Hot Vinyasa', 'Hot Power', 'Bikram', 'Warm Yoga',
    'Inferno Hot Pilates', 'Hot Yin'
  ],
  pilates: [
    'Mat Pilates', 'Reformer Pilates', 'Tower Pilates',
    'Barre Pilates', 'Pilates Sculpt'
  ],
  fitness: [
    'Yoga Sculpt', 'Yoga + HIIT', 'Barre Yoga',
    'Pilates Yoga', 'Power Yoga'
  ],
  meditation: [
    'Guided Meditation', 'Breathwork', 'Sound Bath',
    'Yoga Nidra', 'Meditation & Movement'
  ],
};
```

---

*Maintain data quality by encouraging canonical types while allowing flexibility.*
