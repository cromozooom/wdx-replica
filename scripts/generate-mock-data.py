"""
SPX Magic Selector - Mock Data Generator

This script generates realistic mock data with referential integrity for testing:
- Layer 1: 100 Entities (foundation)
- Layer 2: 100 Forms + 100 Documents (UI containers)
- Layer 3: 2,500 Data Entries (25 per entity)

Requirements: pip install faker

Usage: python scripts/generate-mock-data.py
"""

import json
import uuid
import random
import os
from datetime import datetime, timedelta
from faker import Faker

fake = Faker()

# Configuration
BASE_DIR = "mock_api_data"
os.makedirs(BASE_DIR, exist_ok=True)

def save_json(filename, data):
    """Save data to JSON file with pretty formatting"""
    filepath = os.path.join(BASE_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"✓ Generated {filename} ({len(data)} records)")

def generate_entities(count=100):
    """Generate Layer 1: Foundation entities"""
    entity_types = [
        "Contact", "Account", "Lead", "Opportunity", "Case", 
        "Asset", "Project", "Invoice", "Task", "Contract",
        "MedicalRecord", "Patient", "Appointment", "Prescription",
        "LeaseAgreement", "Property", "Tenant", "MaintenanceRequest"
    ]
    
    categories = ["Financial", "Legal", "Operations", "HR", "Sales", "Medical", "Real Estate"]
    
    entities = []
    for i in range(count):
        entity_type = random.choice(entity_types)
        e_id = str(uuid.uuid4())
        
        entities.append({
            "id": e_id,
            "schemaName": f"{entity_type}_{i:03d}",
            "displayName": f"{fake.company()} {entity_type}",
            "category": random.choice(categories),
            "description": fake.catch_phrase(),
            "isActive": random.choice([True, True, True, False]),  # 75% active
            "createdAt": fake.date_time_between(start_date='-2y', end_date='now').isoformat()
        })
    
    return entities

def generate_queries():
    """Generate realistic query definitions"""
    query_templates = [
        ("Active Records", "Filter by status = active", 0.7),
        ("Recently Updated", "Modified in last 30 days", 0.5),
        ("High Priority", "Priority level > 7", 0.3),
        ("Flagged for Review", "Requires admin approval", 0.2),
        ("Archived", "Historical data", 0.4),
        ("Recent Uploads", "Last 7 days", 0.6),
        ("Pending Approval", "Awaiting confirmation", 0.3),
        ("Completed", "Status = completed", 0.5),
        ("Overdue Items", "Due date < today", 0.2),
        ("All Records", "No filters applied", 1.0)
    ]
    
    queries = []
    for name, desc, probability in random.sample(query_templates, k=random.randint(2, 4)):
        queries.append({
            "id": str(uuid.uuid4()),
            "name": name,
            "description": desc,
            "estimatedCount": random.randint(50, 5000),
            "parameters": {
                "filters": [],
                "sortBy": random.choice(["createdAt", "updatedAt", "name"]),
                "sortOrder": random.choice(["asc", "desc"])
            }
        })
    
    return queries

def generate_forms(entities, count=100):
    """Generate Layer 2a: Forms linked to entities"""
    form_types = [
        "Intake", "Selection", "Registration", "Application", 
        "Submission", "Request", "Assessment", "Evaluation"
    ]
    
    forms = []
    for i in range(count):
        related_entity = random.choice(entities)
        form_type = random.choice(form_types)
        
        forms.append({
            "id": str(uuid.uuid4()),
            "name": f"{fake.job()} {form_type} Form",
            "type": "Form",
            "entityId": related_entity["id"],
            "entityName": related_entity["schemaName"],
            "displayName": related_entity["displayName"],
            "description": fake.sentence(nb_words=10),
            "version": f"{random.randint(1, 5)}.{random.randint(0, 9)}",
            "queries": generate_queries(),
            "isActive": random.choice([True, True, True, False]),
            "createdAt": fake.date_time_between(start_date='-1y', end_date='now').isoformat()
        })
    
    return forms

def generate_documents(entities, count=100):
    """Generate Layer 2b: Documents linked to entities"""
    doc_types = [
        "Report", "Contract", "Invoice", "Proposal", 
        "Agreement", "Certificate", "Summary", "Analysis"
    ]
    
    file_extensions = ["pdf", "docx", "xlsx", "csv"]
    security_levels = ["Public", "Internal", "Confidential", "Restricted"]
    
    documents = []
    for i in range(count):
        related_entity = random.choice(entities)
        doc_type = random.choice(doc_types)
        ext = random.choice(file_extensions)
        
        documents.append({
            "id": str(uuid.uuid4()),
            "name": f"{fake.catch_phrase()} {doc_type}.{ext}",
            "type": "Document",
            "entityId": related_entity["id"],
            "entityName": related_entity["schemaName"],
            "displayName": related_entity["displayName"],
            "description": fake.sentence(nb_words=8),
            "fileType": ext.upper(),
            "securityLevel": random.choice(security_levels),
            "expiryDate": (datetime.now() + timedelta(days=random.randint(30, 730))).isoformat() if random.random() > 0.5 else None,
            "queries": generate_queries(),
            "isActive": random.choice([True, True, True, False]),
            "createdAt": fake.date_time_between(start_date='-1y', end_date='now').isoformat()
        })
    
    return documents

def generate_data_entries(entities, entries_per_entity=25):
    """Generate Layer 3: Data entries (25 per entity)"""
    statuses = ["Draft", "In Progress", "Published", "Archived", "Under Review", "Approved"]
    priorities = ["Low", "Medium", "High", "Critical"]
    
    data_entries = []
    
    for entity in entities:
        for i in range(entries_per_entity):
            entry_id = str(uuid.uuid4())
            
            # Generate dynamic content based on entity type
            content = {
                "recordId": f"{entity['schemaName'][:3].upper()}-{i:04d}",
                "title": fake.bs().title(),
                "owner": fake.name(),
                "assignedTo": fake.name() if random.random() > 0.3 else None,
                "status": random.choice(statuses),
                "priority": random.choice(priorities),
                "value": round(random.uniform(100, 100000), 2),
                "createdAt": fake.date_time_between(start_date='-1y', end_date='now').isoformat(),
                "updatedAt": fake.date_time_between(start_date='-30d', end_date='now').isoformat(),
                "description": fake.paragraph(nb_sentences=3),
                "tags": [fake.word() for _ in range(random.randint(1, 5))],
            }
            
            # Add entity-type specific fields
            schema_lower = entity['schemaName'].lower()
            if 'contact' in schema_lower or 'patient' in schema_lower:
                content.update({
                    "firstName": fake.first_name(),
                    "lastName": fake.last_name(),
                    "email": fake.email(),
                    "phone": fake.phone_number()
                })
            elif 'account' in schema_lower or 'company' in schema_lower:
                content.update({
                    "companyName": fake.company(),
                    "industry": fake.bs(),
                    "revenue": round(random.uniform(10000, 10000000), 2)
                })
            elif 'invoice' in schema_lower or 'contract' in schema_lower:
                content.update({
                    "invoiceNumber": f"INV-{random.randint(1000, 9999)}",
                    "amount": round(random.uniform(500, 50000), 2),
                    "dueDate": fake.future_date(end_date='+90d').isoformat()
                })
            
            data_entries.append({
                "id": entry_id,
                "entityId": entity["id"],
                "entitySchemaName": entity["schemaName"],
                "content": content
            })
    
    return data_entries

def generate_domain_schemas():
    """Generate domain schema definitions"""
    domains = [
        {
            "domainId": "crm-scheduling",
            "name": "CRM & Scheduling",
            "description": "Customer relationship management and appointment scheduling system",
            "isActive": True,
            "entities": []
        },
        {
            "domainId": "document-management",
            "name": "Document Management",
            "description": "Document storage, versioning, and compliance tracking",
            "isActive": True,
            "entities": []
        }
    ]
    
    return domains

def generate_mock_data():
    """Main function to generate all mock data layers"""
    print("\n🚀 SPX Magic Selector - Mock Data Generator")
    print("=" * 60)
    
    # Layer 1: Entities
    print("\n📊 Layer 1: Generating Entities...")
    entities = generate_entities(count=100)
    save_json("entities.json", entities)
    
    # Layer 2: Forms & Documents
    print("\n📋 Layer 2: Generating Forms & Documents...")
    forms = generate_forms(entities, count=100)
    documents = generate_documents(entities, count=100)
    save_json("forms.json", forms)
    save_json("documents.json", documents)
    
    # Combine forms and documents for selection items
    all_items = forms + documents
    save_json("selection_items.json", all_items)
    
    # Layer 3: Data Entries
    print("\n💾 Layer 3: Generating Data Entries...")
    data_entries = generate_data_entries(entities, entries_per_entity=25)
    save_json("data_entries.json", data_entries)
    
    # Domain Schemas
    print("\n🏗️  Generating Domain Schemas...")
    domains = generate_domain_schemas()
    save_json("domains.json", domains)
    
    # Summary
    print("\n" + "=" * 60)
    print("✅ SUCCESS! Mock data generated in /{BASE_DIR}")
    print("\nSummary:")
    print(f"  • Entities: {len(entities)}")
    print(f"  • Forms: {len(forms)}")
    print(f"  • Documents: {len(documents)}")
    print(f"  • Selection Items: {len(all_items)}")
    print(f"  • Data Entries: {len(data_entries)}")
    print(f"  • Domains: {len(domains)}")
    print("\n📁 Files created:")
    print(f"  ├── entities.json")
    print(f"  ├── forms.json")
    print(f"  ├── documents.json")
    print(f"  ├── selection_items.json")
    print(f"  ├── data_entries.json")
    print(f"  └── domains.json")
    print("\n💡 Next steps:")
    print("  1. Install json-server: npm install -g json-server")
    print("  2. Run API: json-server --watch mock_api_data/selection_items.json --port 3000")
    print("  3. Access at: http://localhost:3000")
    print("\n")

if __name__ == "__main__":
    try:
        generate_mock_data()
    except ImportError:
        print("\n❌ Error: 'faker' library not installed")
        print("Please install it using: pip install faker")
        print("\n")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        print("\n")
