# Scripts

This directory contains utility scripts for the WDX Replica project.

## Mock Data Generator

### Overview
The `generate-mock-data.py` script generates realistic mock data with referential integrity for the SPX Magic Selector feature.

### Data Layers

1. **Layer 1: Entities (100 records)**
   - Foundation layer with unique entity schemas
   - Properties: id, schemaName, displayName, category, description
   - Example: Contact_001, Account_042, MedicalRecord_089

2. **Layer 2: Forms & Documents (200 records)**
   - 100 Forms + 100 Documents
   - Each linked to a valid Entity ID
   - Properties: name, type, queries, version, security level
   - Example: "Patient Intake Form" → linked to Entity "MedicalRecord_012"

3. **Layer 3: Data Entries (2,500 records)**
   - 25 data entries per entity
   - Dynamic content based on entity type
   - Properties: recordId, owner, status, priority, entity-specific fields
   - Example: Contact entries include firstName, lastName, email

### Installation

```bash
# Install required Python package
pip install faker
```

### Usage

```bash
# Run from project root
python scripts/generate-mock-data.py
```

### Output

Creates `mock_api_data/` directory with:
- `entities.json` - 100 entity definitions
- `forms.json` - 100 form records
- `documents.json` - 100 document records
- `selection_items.json` - Combined forms + documents (200 total)
- `data_entries.json` - 2,500 data entries (25 per entity)
- `domains.json` - Domain schema definitions

### Testing with json-server

```bash
# Install json-server globally
npm install -g json-server

# Start mock API server
json-server --watch mock_api_data/selection_items.json --port 3000

# Access at: http://localhost:3000
```

### Integration with Angular Service

To use the generated data in your `SelectionDataService`:

```typescript
// Option 1: Import JSON directly (dev mode)
import selectionItems from '../../../mock_api_data/selection_items.json';

// Option 2: Fetch from json-server (more realistic)
this.http.get('http://localhost:3000/selection_items').subscribe(...);

// Option 3: Copy JSON to src/assets and use HttpClient
this.http.get('/assets/mock_api_data/selection_items.json').subscribe(...);
```

### Customization

Edit the script to customize:
- `entity_types` - Add new entity schemas
- `query_templates` - Modify query definitions
- `entries_per_entity` - Change data entry count per entity
- `form_types` / `doc_types` - Adjust form/document naming

### Referential Integrity

The script maintains referential integrity:
- ✅ All Forms/Documents reference valid Entity IDs
- ✅ All Data Entries belong to existing Entities
- ✅ Queries have realistic parameters and counts
- ✅ Timestamps follow chronological logic
