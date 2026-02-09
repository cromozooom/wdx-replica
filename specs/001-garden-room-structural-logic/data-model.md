# Data Model: Garden Room Structural Logic

**Units**: All persisted calculation values normalized to millimeters (mm). UI
can display cm/m.

## Entities

### Project

- **Fields**:
  - `id`: string
  - `name`: string
  - `buildEnvelope`: BuildEnvelope
  - `walls`: Wall[]
  - `materials`: MaterialLibrary
  - `hardwareRules`: HardwareRuleSet
  - `outputs`: OutputBundle
- **Validation**:
  - Must include at least four walls (front, back, left, right).

### BuildEnvelope

- **Fields**:
  - `maxLegalHeightMm`: number
  - `concreteOffsetMm`: number
  - `roofSystemMm`: number
  - `floorSystemMm`: number
  - `fallRatio`: { rise: number; run: number } (default 1:40)
- **Derived**:
  - `maxWallFrameHeightMm = maxLegalHeightMm - concreteOffsetMm - roofSystemMm - floorSystemMm`
- **Validation**:
  - `maxWallFrameHeightMm > 0`

### Wall

- **Fields**:
  - `id`: string
  - `name`: string (Front, Back, Left, Right)
  - `lengthMm`: number
  - `heightMm`: number (derived for front/back; computed per stud for side
    walls)
  - `isMasterHeight`: boolean
  - `decorativeOffsetMm`: number
  - `studGapMm`: number
  - `plateThicknessTopMm`: number
  - `plateThicknessBottomMm`: number
  - `members`: Member[]
- **Validation**:
  - `lengthMm > 0`
  - `studGapMm > 0`
  - `decorativeOffsetMm >= 0`

### Member

- **Fields**:
  - `id`: string
  - `type`: 'stud' | 'plate' | 'noggin'
  - `positionMm`: number (x-position along wall)
  - `lengthMm`: number
  - `heightMm`: number (for studs)
  - `metadata`: Record<string, unknown>

### StudLayout

- **Fields**:
  - `standardStudPositionsMm`: number[]
  - `decorativeStudPositionsMm`: number[]
  - `resolvedStudPositionsMm`: number[]
  - `clashThresholdMm`: number (default 50 mm)
- **Validation**:
  - Clash resolution merges positions within threshold.

### NogginLayout

- **Fields**:
  - `nogginLengthMm`: number (derived from stud gap)
  - `rows`: NogginRow[]

### NogginRow

- **Fields**:
  - `offsetMm`: number
  - `positionsMm`: number[]

### MaterialLibrary

- **Fields**:
  - `stockLengthsMm`: number[] (e.g., 2400, 3600, 4800)
  - `sheetMaterials`: SheetMaterial[]

### SheetMaterial

- **Fields**:
  - `id`: string
  - `name`: string
  - `widthMm`: number
  - `heightMm`: number

### CutRequirement

- **Fields**:
  - `id`: string
  - `memberType`: 'stud' | 'plate' | 'noggin'
  - `lengthMm`: number
  - `quantity`: number

### CutPlan

- **Fields**:
  - `stockLengthMm`: number
  - `cuts`: CutRequirement[]
  - `wasteMm`: number

### SheetRequirement

- **Fields**:
  - `sheetMaterialId`: string
  - `requiredAreaMm2`: number
  - `sheetCount`: number

### HardwareRuleSet

- **Fields**:
  - `screwsPerLinearMeter`: number
  - `tapePerSquareMeter`: number
  - `membranePerSquareMeter`: number

### OutputBundle

- **Fields**:
  - `buyList`: BuyListItem[]
  - `cutList`: CutPlan[]
  - `hardwareList`: HardwareItem[]

### BuyListItem

- **Fields**:
  - `itemType`: 'timber' | 'sheet'
  - `description`: string
  - `quantity`: number
  - `unit`: string

### HardwareItem

- **Fields**:
  - `description`: string
  - `quantity`: number
  - `unit`: string

## Relationships

- Project 1..1 BuildEnvelope
- Project 1..\* Wall
- Wall 1..\* Member
- Project 1..1 MaterialLibrary
- MaterialLibrary 1..\* SheetMaterial
- Project 1..1 OutputBundle

## State Transitions

- **Inputs Updated** → recompute `BuildEnvelope` → recompute `Wall` heights →
  recompute `Member` layouts → recompute `CutRequirements` → recompute
  `OutputBundle`.
