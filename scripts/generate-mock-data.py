"""
SPX Magic Selector - Three-Call API Mock Data Generator

Generates realistic mock data following the production-ready "Three-Call" pattern:
- Call A: form-summaries.json (lightweight dropdown data)
- Call B: form-metadata.json (metadata with queries per form)  
- Call C: preview-data-{entityId}-{queryId}.json (actual records per query)

This simulates how a real API would work: incremental data loading for performance.

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
BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "src", "assets", "magic-selector-data")
os.makedirs(BASE_DIR, exist_ok=True)

def save_json(filename, data):
    """Save data to JSON file with pretty formatting"""
    filepath = os.path.join(BASE_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    record_count = len(data) if isinstance(data, list) else len(data) if isinstance(data, dict) else "N/A"
    print(f"✓ Generated {filename} ({record_count} records)")

def generate_realistic_forms():
    """Generate Call A: Form summaries with realistic business entities"""
    
    # Real business form categories with their typical entities
    form_definitions = [
        # CRM & Sales
        ("contact-management", "Contact Management", "Manage customer and prospect information", "crm", "Contact"),
        ("lead-tracking", "Sales Lead Tracking", "Track prospects through sales funnel", "sales", "Lead"),
        ("opportunity-pipeline", "Sales Opportunities", "Manage deals and revenue pipeline", "sales", "Opportunity"),
        ("account-profiles", "Account Management", "Corporate customer profiles", "crm", "Account"),
        
        # Scheduling & Operations  
        ("appointment-booking", "Appointment Scheduling", "Schedule customer appointments", "scheduling", "Appointment"),
        ("service-requests", "Service Request Management", "Track customer service requests", "support", "ServiceRequest"),
        ("project-tracking", "Project Management", "Project progress and deliverables", "project", "Project"),
        ("task-management", "Task Planning", "Team task assignment and tracking", "project", "Task"),
        
        # Financial & Legal
        ("invoice-processing", "Invoice Management", "Generate and track invoices", "financial", "Invoice"),
        ("expense-tracking", "Expense Reports", "Employee expense management", "financial", "Expense"),
        ("contract-management", "Contract Lifecycle", "Legal agreement management", "legal", "Contract"),
        ("payment-processing", "Payment Tracking", "Customer payment records", "financial", "Payment"),
        
        # Inventory & Assets
        ("product-catalog", "Product Management", "Product inventory and specifications", "inventory", "Product"),
        ("asset-tracking", "Asset Management", "Company asset tracking", "inventory", "Asset"),
        ("vendor-management", "Vendor Directory", "Supplier and vendor information", "procurement", "Vendor"),
        ("purchase-orders", "Purchase Order Processing", "Procurement and ordering", "procurement", "PurchaseOrder"),
        
        # HR & People
        ("employee-directory", "Employee Management", "Staff information and profiles", "hr", "Employee"),
        ("timesheet-tracking", "Time & Attendance", "Employee time tracking", "hr", "Timesheet"),
        ("performance-reviews", "Performance Management", "Employee evaluations", "hr", "PerformanceReview"),
        ("training-records", "Training Management", "Employee skill development", "hr", "TrainingRecord"),
        
        # Healthcare (if applicable)
        ("patient-records", "Patient Management", "Medical patient information", "healthcare", "Patient"),
        ("medical-appointments", "Medical Scheduling", "Healthcare appointment booking", "healthcare", "MedicalAppointment"),
        ("prescription-tracking", "Prescription Management", "Medication tracking", "healthcare", "Prescription"),
        
        # Real Estate (if applicable)  
        ("property-listings", "Property Management", "Real estate listings", "real-estate", "Property"),
        ("tenant-management", "Tenant Directory", "Rental property tenant info", "real-estate", "Tenant"),
        ("maintenance-requests", "Maintenance Tracking", "Property maintenance requests", "real-estate", "MaintenanceRequest")
    ]
    
    form_summaries = []
    
    # Define which categories are documents vs forms
    document_categories = ["financial", "legal", "inventory", "procurement", "hr", "healthcare", "real-estate"]
    
    for form_id, name, description, category, entity_name in form_definitions:
        item_type = "Document" if category in document_categories else "Form"
        
        form_summaries.append({
            "id": f"{form_id}-form",
            "type": item_type,
            "name": name,
            "description": description,
            "category": category,
            "entityName": entity_name
        })
    
    return form_summaries

def generate_query_templates():
    """Generate realistic query templates for different entity types"""
    
    # Universal queries that work for most entities
    universal_queries = [
        ("all-records", "All Records", "Complete dataset without filters", "default"),
        ("active-only", "Active Records", "Currently active/enabled records", "filtered"),
        ("recent-updates", "Recently Updated", "Modified in the last 30 days", "filtered"),
        ("created-this-month", "Created This Month", "New records from current month", "filtered")
    ]
    
    # Entity-specific query templates
    entity_specific = {
        "Contact": [
            ("high-value-customers", "High Value Customers", "Customers with high lifetime value", "filtered"),
            ("new-leads", "New Leads", "Recently acquired prospects", "filtered"),
            ("overdue-follow-up", "Overdue Follow-ups", "Contacts requiring follow-up", "custom")
        ],
        "Appointment": [
            ("today-appointments", "Today's Schedule", "Appointments scheduled for today", "filtered"),
            ("pending-confirmation", "Pending Confirmation", "Unconfirmed appointments", "filtered"),
            ("overdue-appointments", "Overdue Follow-ups", "Appointments needing follow-up", "custom")
        ],
        "Invoice": [
            ("unpaid-invoices", "Unpaid Invoices", "Outstanding invoice balances", "filtered"),
            ("overdue-payments", "Overdue Payments", "Past due invoices", "custom"),
            ("high-value-invoices", "High Value Invoices", "Invoices over $10,000", "filtered")
        ],
        "Product": [
            ("low-stock-alert", "Low Stock Alert", "Products with low inventory", "filtered"),
            ("best-sellers", "Best Sellers", "Top performing products", "custom"),
            ("discontinued-products", "Discontinued Items", "No longer available products", "filtered")
        ],
        "Employee": [
            ("active-employees", "Active Staff", "Currently employed staff", "filtered"),
            ("new-hires", "New Hires", "Recently onboarded employees", "filtered"),
            ("performance-reviews-due", "Reviews Due", "Pending performance evaluations", "custom")
        ]
    }
    
    return universal_queries, entity_specific

def generate_form_metadata(form_summaries):
    """Generate Call B: Detailed metadata for each form"""
    
    universal_queries, entity_specific = generate_query_templates()
    metadata_dict = {}
    
    for form_summary in form_summaries:
        form_id = form_summary["id"]
        entity_name = form_summary["entityName"]
        
        # Start with universal queries
        queries = []
        for query_id, query_name, description, query_type in universal_queries:
            queries.append({
                "id": f"query-{query_id}",
                "name": query_name,
                "description": description,
                "type": query_type,
                "estimatedResults": random.randint(50, 1500),
                "lastRun": fake.date_time_between(start_date='-7d', end_date='now').isoformat(),
                "parameters": {
                    "filters": [],
                    "sortBy": random.choice(["createdDate", "updatedDate", "name"]),
                    "includeDrafts": False
                }
            })
        
        # Add entity-specific queries
        if entity_name in entity_specific:
            for query_id, query_name, description, query_type in entity_specific[entity_name]:
                queries.append({
                    "id": f"query-{query_id}",
                    "name": query_name,
                    "description": description,
                    "type": query_type,
                    "estimatedResults": random.randint(20, 800),
                    "lastRun": fake.date_time_between(start_date='-3d', end_date='now').isoformat(),
                    "parameters": {
                        "filters": [f"{random.choice(['status', 'type', 'category'])}={random.choice(['active', 'pending', 'high'])}"],
                        "sortBy": random.choice(["priority", "createdDate", "value"]),
                        "includeDrafts": query_type == "custom"
                    }
                })
        
        # Create metadata entry
        total_records = sum(q["estimatedResults"] for q in queries) // 2  # Realistic overlap
        
        metadata_dict[form_id] = {
            "id": form_id,
            "type": form_summary.get("type", "Form"),  # Include type from summary
            "name": form_summary["name"],
            "description": f"Comprehensive {form_summary['description'].lower()}",
            "category": form_summary["category"],
            "entityName": entity_name,
            "entityId": f"entity-{entity_name.lower()}",
            "totalRecords": total_records,
            "lastUpdated": fake.date_time_between(start_date='-1d', end_date='now').isoformat(),
            "queries": queries
        }
    
    return metadata_dict

def generate_preview_data_for_query(entity_name, query_id, estimated_results):
    """Generate Call C: Preview records for a specific entity/query combination"""
    
    # Base fields for all entities
    base_fields = ["id", "name", "status", "createdDate", "updatedDate", "owner"]
    
    # Entity-specific field schemas
    field_schemas = {
        "Contact": {
            "fields": ["firstName", "lastName", "email", "phone", "company", "lifetimeValue", "lastActivity"],
            "sample_values": {
                "firstName": lambda: fake.first_name(),
                "lastName": lambda: fake.last_name(), 
                "email": lambda: fake.email(),
                "phone": lambda: fake.phone_number(),
                "company": lambda: fake.company(),
                "lifetimeValue": lambda: round(random.uniform(500, 50000), 2),
                "lastActivity": lambda: fake.date_time_between(start_date='-90d', end_date='now').isoformat()
            }
        },
        "Appointment": {
            "fields": ["appointmentDate", "appointmentTime", "serviceType", "customerName", "status", "notes"],
            "sample_values": {
                "appointmentDate": lambda: fake.future_date(end_date='+30d').isoformat(),
                "appointmentTime": lambda: fake.time(),
                "serviceType": lambda: random.choice(["Consultation", "Follow-up", "Treatment", "Assessment"]),
                "customerName": lambda: fake.name(),
                "notes": lambda: fake.sentence(nb_words=8)
            }
        },
        "Invoice": {
            "fields": ["invoiceNumber", "amount", "dueDate", "customerName", "status", "paymentTerms"],
            "sample_values": {
                "invoiceNumber": lambda: f"INV-{random.randint(1000, 9999)}",
                "amount": lambda: round(random.uniform(100, 25000), 2),
                "dueDate": lambda: fake.future_date(end_date='+60d').isoformat(),
                "customerName": lambda: fake.company(),
                "paymentTerms": lambda: random.choice(["Net 30", "Net 15", "Due on Receipt", "Net 60"])
            }
        },
        "Product": {
            "fields": ["productCode", "category", "price", "inventory", "supplier", "reorderLevel"],
            "sample_values": {
                "productCode": lambda: f"PRD-{random.randint(1000, 9999)}",
                "category": lambda: random.choice(["Electronics", "Office Supplies", "Furniture", "Software"]),
                "price": lambda: round(random.uniform(10, 2000), 2),
                "inventory": lambda: random.randint(0, 500),
                "supplier": lambda: fake.company(),
                "reorderLevel": lambda: random.randint(10, 50)
            }
        },
        "Employee": {
            "fields": ["employeeId", "department", "position", "hireDate", "salary", "manager"],
            "sample_values": {
                "employeeId": lambda: f"EMP-{random.randint(1000, 9999)}",
                "department": lambda: random.choice(["Sales", "Marketing", "Engineering", "HR", "Finance"]),
                "position": lambda: fake.job(),
                "hireDate": lambda: fake.date_between(start_date='-5y', end_date='-30d').isoformat(),
                "salary": lambda: random.randint(40000, 150000),
                "manager": lambda: fake.name()
            }
        }
    }
    
    # Use entity schema if available, otherwise create generic fields
    if entity_name in field_schemas:
        entity_fields = field_schemas[entity_name]["fields"]
        sample_values = field_schemas[entity_name]["sample_values"]
    else:
        entity_fields = ["type", "category", "value", "description"]
        sample_values = {
            "type": lambda: random.choice(["Standard", "Premium", "Basic"]),
            "category": lambda: random.choice(["Type A", "Type B", "Type C"]),
            "value": lambda: round(random.uniform(100, 10000), 2),
            "description": lambda: fake.sentence(nb_words=6)
        }
    
    # Generate records
    num_records = min(estimated_results, 25)  # Limit preview to 25 records
    records = []
    
    for i in range(num_records):
        record = {
            "id": str(uuid.uuid4()),
            "name": f"{fake.catch_phrase()} {i+1}",
            "status": random.choice(["Active", "Inactive", "Pending", "Completed"]),
            "createdDate": fake.date_time_between(start_date='-1y', end_date='-1d').isoformat(),
            "updatedDate": fake.date_time_between(start_date='-30d', end_date='now').isoformat(),
            "owner": fake.name()
        }
        
        # Add entity-specific fields
        for field in entity_fields:
            if field in sample_values:
                record[field] = sample_values[field]()
            else:
                record[field] = fake.word()
        
        records.append(record)
    
    # Generate field schema for frontend
    all_fields = base_fields + entity_fields
    schema = []
    for field in all_fields:
        data_type = "string"
        if field in ["lifetimeValue", "amount", "price", "inventory", "salary", "value"]:
            data_type = "number"
        elif field in ["appointmentDate", "dueDate", "hireDate", "createdDate", "updatedDate", "lastActivity"]:
            data_type = "date"
        elif field in ["reorderLevel", "inventory"]:
            data_type = "number"
        
        schema.append({
            "fieldName": field,
            "displayName": " ".join(word.capitalize() for word in field.replace("camelCase", "").split("_") if word),  # Convert camelCase/snake_case to Title Case
            "dataType": data_type,
            "isKey": field == "id",
            "isRequired": field in ["id", "name", "status"]
        })
    
    return {
        "entityId": f"entity-{entity_name.lower()}",
        "queryId": query_id,
        "totalCount": estimated_results,
        "pageSize": 25,
        "currentPage": 1,
        "records": records,
        "schema": schema
    }

def generate_three_call_mock_data():
    """Main function to generate Three-Call API mock data"""
    print("\n🚀 SPX Magic Selector - Three-Call API Mock Data Generator")
    print("=" * 70)
    
    # Call A: Generate form summaries (lightweight dropdown data)
    print("\n📋 Call A: Generating Form Summaries...")
    form_summaries = generate_realistic_forms()
    save_json("form-summaries.json", form_summaries)
    
    # Call B: Generate form metadata (queries and details per form)
    print("\n🔍 Call B: Generating Form Metadata...")
    form_metadata = generate_form_metadata(form_summaries)
    save_json("form-metadata.json", form_metadata)
    
    # Call C: Generate preview data for each query
    print("\n💾 Call C: Generating Preview Data Files...")
    preview_files_created = 0
    
    for form_id, metadata in form_metadata.items():
        entity_name = metadata["entityName"]
        entity_id = metadata["entityId"]
        
        for query in metadata["queries"]:
            query_id = query["id"]
            estimated_results = query["estimatedResults"]
            
            # Generate preview data for this specific entity/query combination
            preview_data = generate_preview_data_for_query(entity_name, query_id, estimated_results)
            
            # Save as individual file per query (realistic API pattern)
            filename = f"preview-data-{entity_id}-{query_id}.json"
            save_json(filename, preview_data)
            preview_files_created += 1
    
    # Summary
    print("\n" + "=" * 70)
    print(f"✅ SUCCESS! Three-Call API mock data generated in {BASE_DIR}")
    print("\n📊 Production-Ready API Pattern:")
    print(f"  Call A (Dropdown):     form-summaries.json ({len(form_summaries)} forms)")
    print(f"  Call B (Metadata):     form-metadata.json ({len(form_metadata)} forms)")
    print(f"  Call C (Preview):      {preview_files_created} preview-data-*.json files")
    
    total_queries = sum(len(metadata["queries"]) for metadata in form_metadata.values())
    print(f"\n📈 Data Breakdown:")
    print(f"  • Business Forms:      {len(form_summaries)}")
    print(f"  • Query Definitions:   {total_queries}")
    print(f"  • Preview Data Files:  {preview_files_created}")
    
    print(f"\n💡 Three-Call Integration Pattern:")
    print(f"  1. Load form-summaries.json → populate ng-select dropdown")
    print(f"  2. User selects form → load form-metadata.json[formId] → show queries")
    print(f"  3. User clicks query → load preview-data-{{entityId}}-{{queryId}}.json")
    
    print(f"\n🎯 This simulates production API calls:")
    print(f"  GET /api/forms/summary")
    print(f"  GET /api/forms/{{id}}/metadata") 
    print(f"  GET /api/entities/{{entityId}}/records?queryId={{queryId}}")
    print("\n")

if __name__ == "__main__":
    try:
        generate_three_call_mock_data()
    except ImportError:
        print("\n❌ Error: 'faker' library not installed")
        print("Please install it using: pip install faker")
        print("\n")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        print("\n")
