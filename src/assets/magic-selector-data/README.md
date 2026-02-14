# SPX Magic Selector - Mock Data

This directory contains generated mock data files for the SPX Magic Selector
feature.

## Files

- `entities.json` - 100 entity definitions
- `forms.json` - 100 form records
- `documents.json` - 100 document records
- `selection_items.json` - Combined forms + documents (200 total items)
- `data_entries.json` - 2,500 data entries (25 per entity)
- `domains.json` - Domain schema definitions

## Data Structure

### Selection Items (Forms & Documents)

```json
{
  "id": "uuid",
  "name": "Form/Document Name",
  "type": "Form" | "Document",
  "entityId": "linked-entity-uuid",
  "entityName": "Entity_001",
  "displayName": "Human Readable Name",
  "description": "Description text",
  "version": "1.0" (forms only),
  "fileType": "PDF" (documents only),
  "queries": [
    {
      "id": "uuid",
      "name": "Query Name",
      "description": "Query description",
      "estimatedCount": 1234,
      "parameters": {
        "filters": [],
        "sortBy": "createdAt",
        "sortOrder": "asc"
      }
    }
  ]
}
```

### Data Entries (for Inspector Preview)

```json
{
  "id": "uuid",
  "entityId": "linked-entity-uuid",
  "entitySchemaName": "Entity_001",
  "content": {
    "recordId": "ENT-0001",
    "title": "Record Title",
    "owner": "John Doe",
    "status": "Active",
    "priority": "High",
    "value": 12345.67
    // ... entity-specific fields
  }
}
```

## Using in Angular Service

### Option 1: HttpClient (Recommended for Production-like Testing)

```typescript
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map, delay } from "rxjs/operators";

@Injectable({ providedIn: "root" })
export class SelectionDataService {
  constructor(private http: HttpClient) {}

  getAvailableItems(domainId: string): Observable<SelectionItem[]> {
    return this.http
      .get<SelectionItem[]>("/assets/magic-selector-data/selection_items.json")
      .pipe(
        map((items) =>
          items.filter((item) => item.entityName.includes(domainId)),
        ),
        delay(100), // Simulate network latency
      );
  }
}
```

### Option 2: Import JSON Directly (Dev Mode)

```typescript
import selectionItems from "../../assets/magic-selector-data/selection_items.json";

// Use directly in getAvailableItems()
return of(selectionItems).pipe(delay(50));
```

### Option 3: json-server (Full REST API)

```bash
# Install json-server globally
npm install -g json-server

# Run mock API server
json-server --watch src/assets/magic-selector-data/selection_items.json --port 3000

# Access endpoints:
# GET http://localhost:3000/selection_items
# GET http://localhost:3000/selection_items/:id
# GET http://localhost:3000/selection_items?entityName=Contact_001
```

```typescript
// In service
getAvailableItems(domainId: string): Observable<SelectionItem[]> {
  return this.http.get<SelectionItem[]>('http://localhost:3000/selection_items')
    .pipe(map(items => items.filter(/* domain filter */)));
}
```

## Regenerating Data

To regenerate all mock data files:

```bash
# Make sure faker is installed
pip install faker

# Run generator script
python scripts/generate-mock-data.py
```

This will overwrite all existing JSON files in this directory.

## Data Statistics

- **100 Entities** with diverse categories (Financial, Legal, HR, etc.)
- **200 Selection Items** (100 Forms + 100 Documents)
- **2,500 Data Entries** (25 records per entity)
- **Referential Integrity**: All forms/documents link to valid entities
- **Query Variety**: Each item has 2-4 queries with realistic parameters
- **Realistic Names**: Generated using Faker library for authentic data

## Testing Scenarios

This dataset enables testing:

1. **Search Performance**: 200 items with varied names
2. **Filtering**: Multiple entity types and categories
3. **Pagination**: Large data entry set (2,500 records)
4. **Inspector Panel**: 25 preview records per entity
5. **Selection History**: Diverse selections for history tracking
6. **Discovery Modal**: ag-grid with 200+ rows
