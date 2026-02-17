"""
SPX Magic Selector - Four-Call API Mock Data Generator

Generates realistic mock data following the production-ready "Four-Call" pattern:
- Call A: form-summaries.json (lightweight dropdown data)
- Call B: form-metadata.json (metadata with queries per form)  
- Call C: preview-data-{entityId}-{queryId}.json (actual records per query)
- Call D: dependency-graph.json (entity/form/document relationships for visualization)

This simulates how a real API would work: incremental data loading for performance.

Requirements: pip install faker

Usage:
  python scripts/generate-mock-data.py          # Full dataset (local development - 408 forms)
  python scripts/generate-mock-data.py --light  # Light dataset (Netlify builds - 24 forms)
  python scripts/generate-mock-data.py --scale  # Scale test (1300 forms, 800 entities, 1000+ queries)
  
Modes:
  --light: Generates 24 forms with ~114 preview files (fast, for CI/CD)
  default: Generates 408 forms (24 base × 17 variations) for local testing
  --scale: Generates 1300 forms with 800+ entities for performance testing
"""

import json
import uuid
import random
import os
import argparse
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
    print(f"[OK] Generated {filename} ({record_count} records)")

def generate_realistic_forms(limit=None):
    """Generate Call A: Form summaries with wealth management entities
    
    Args:
        limit: Maximum number of forms to generate (None = all)
    """
    
    # Base wealth management form categories with their typical entities
    base_form_definitions = [
        # Client Management
        ("client-portfolio", "Client Portfolio Management", "Manage client investment portfolios and holdings", "portfolio", "Portfolio"),
        ("client-profiles", "Client Profile Management", "Client personal and financial information", "client", "Client"),
        ("household-accounts", "Household Accounts", "Family and household account aggregation", "client", "Household"),
        ("beneficiary-management", "Beneficiary Management", "Manage account beneficiaries and designations", "client", "Beneficiary"),
        
        # Investment & Trading
        ("investment-accounts", "Investment Account Management", "Track investment accounts and positions", "investment", "Account"),
        ("trade-execution", "Trade Execution", "Buy and sell orders for securities", "trading", "Trade"),
        ("asset-allocation", "Asset Allocation", "Portfolio asset class distribution", "investment", "AssetAllocation"),
        ("securities-holdings", "Securities Holdings", "Individual security positions and performance", "investment", "Security"),
        
        # Financial Planning
        ("financial-plans", "Financial Planning", "Comprehensive client financial plans", "planning", "FinancialPlan"),
        ("retirement-planning", "Retirement Planning", "Retirement income and savings strategies", "planning", "RetirementPlan"),
        ("tax-planning", "Tax Planning", "Tax optimization and strategies", "planning", "TaxPlan"),
        ("estate-planning", "Estate Planning", "Estate and wealth transfer planning", "planning", "EstatePlan"),
        
        # Performance & Reporting
        ("performance-reports", "Performance Reports", "Investment performance and attribution", "reporting", "PerformanceReport"),
        ("transaction-history", "Transaction History", "Account transaction records and history", "reporting", "Transaction"),
        ("fee-billing", "Fee & Billing", "Advisory fees and billing statements", "reporting", "FeeStatement"),
        ("consolidated-statements", "Consolidated Statements", "Multi-account summary statements", "reporting", "Statement"),
        
        # Risk & Compliance
        ("risk-assessment", "Risk Assessment", "Client risk tolerance and suitability", "compliance", "RiskProfile"),
        ("compliance-reviews", "Compliance Reviews", "Regulatory compliance and reviews", "compliance", "ComplianceReview"),
        ("aml-kyc", "AML/KYC Documentation", "Anti-money laundering and client verification", "compliance", "KYCDocument"),
        ("regulatory-filings", "Regulatory Filings", "Required regulatory submissions", "compliance", "RegulatoryFiling"),
        
        # Research & Analysis
        ("market-research", "Market Research", "Investment research and market analysis", "research", "Research"),
        ("portfolio-analysis", "Portfolio Analysis", "Deep portfolio analytics and insights", "research", "Analysis"),
        ("investment-products", "Investment Products", "Available investment vehicles and funds", "research", "Product"),
        ("model-portfolios", "Model Portfolios", "Strategic model portfolio templates", "research", "ModelPortfolio")
    ]
    
    # Variations to create multiple instances of each base form
    variations = [
        ("", ""),  # No suffix (original)
        ("high-net-worth", "High Net Worth"),
        ("retail", "Retail"),
        ("institutional", "Institutional"),
        ("family-office", "Family Office"),
        ("advisor-managed", "Advisor Managed"),
        ("self-directed", "Self-Directed"),
        ("401k", "401(k)"),
        ("ira", "IRA"),
        ("roth", "Roth"),
        ("traditional", "Traditional"),
        ("taxable", "Taxable"),
        ("trust", "Trust"),
        ("corporate", "Corporate"),
        ("nonprofit", "Non-Profit"),
        ("pension", "Pension"),
        ("sep", "SEP"),
    ]
    
    form_definitions = []
    
    # Generate variations of base forms
    for base_id, base_name, base_desc, category, entity in base_form_definitions:
        for var_suffix, var_label in variations:
            # Create unique ID and name
            form_id = f"{base_id}-{var_suffix}" if var_suffix else base_id
            form_name = f"{base_name} - {var_label}" if var_label else base_name
            
            form_definitions.append((
                form_id,
                form_name,
                base_desc,
                category,
                entity
            ))
    
    form_summaries = []
    
    # Define which categories are documents vs forms
    document_categories = ["reporting", "compliance", "research"]
    
    # Apply limit if specified
    forms_to_generate = form_definitions[:limit] if limit else form_definitions
    
    for form_id, name, description, category, entity_name in forms_to_generate:
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
    """Generate realistic query templates for wealth management entities"""
    
    # Universal queries that work for most entities
    universal_queries = [
        ("all-records", "All Records", "Complete dataset without filters", "default"),
        ("active-only", "Active Records", "Currently active/enabled records", "filtered"),
        ("recent-updates", "Recently Updated", "Modified in the last 30 days", "filtered"),
        ("created-this-quarter", "Created This Quarter", "New records from current quarter", "filtered")
    ]
    
    # Entity-specific query templates for wealth management
    entity_specific = {
        "Portfolio": [
            ("high-net-worth", "High Net Worth Portfolios", "Portfolios over $5M in assets", "filtered"),
            ("underperforming", "Underperforming Portfolios", "Below benchmark performance YTD", "custom"),
            ("rebalancing-needed", "Rebalancing Required", "Portfolios drifted from target allocation", "filtered")
        ],
        "Client": [
            ("new-clients", "New Clients", "Onboarded in last 90 days", "filtered"),
            ("high-value-clients", "High Value Clients", "Clients with AUM over $2M", "filtered"),
            ("review-due", "Annual Review Due", "Clients requiring annual review", "custom")
        ],
        "Account": [
            ("retirement-accounts", "Retirement Accounts", "IRA, 401k, and pension accounts", "filtered"),
            ("taxable-accounts", "Taxable Accounts", "Non-retirement investment accounts", "filtered"),
            ("high-cash-balance", "High Cash Positions", "Accounts with >10% cash allocation", "custom")
        ],
        "Trade": [
            ("pending-trades", "Pending Trades", "Trades awaiting execution", "filtered"),
            ("todays-trades", "Today's Activity", "Trades executed today", "filtered"),
            ("failed-trades", "Failed Trades", "Trades requiring attention", "custom")
        ],
        "PerformanceReport": [
            ("quarterly-reports", "Quarterly Performance", "Q3 2025 performance reports", "filtered"),
            ("ytd-performance", "YTD Performance", "Year-to-date performance analysis", "filtered"),
            ("top-performers", "Top Performing Portfolios", "Best returns this period", "custom")
        ],
        "RiskProfile": [
            ("conservative-risk", "Conservative Investors", "Low risk tolerance profiles", "filtered"),
            ("aggressive-risk", "Aggressive Investors", "High risk tolerance profiles", "filtered"),
            ("profile-update-needed", "Profile Updates Due", "Risk profiles requiring annual update", "custom")
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
    
    # Entity-specific field schemas for wealth management
    field_schemas = {
        "Portfolio": {
            "fields": ["portfolioId", "clientName", "totalValue", "cashBalance", "ytdReturn", "riskLevel", "advisor"],
            "sample_values": {
                "portfolioId": lambda: f"PF-{random.randint(100000, 999999)}",
                "clientName": lambda: fake.name(),
                "totalValue": lambda: round(random.uniform(100000, 15000000), 2),
                "cashBalance": lambda: round(random.uniform(5000, 500000), 2),
                "ytdReturn": lambda: round(random.uniform(-12.5, 28.5), 2),
                "riskLevel": lambda: random.choice(["Conservative", "Moderate", "Aggressive", "Very Aggressive"]),
                "advisor": lambda: fake.name()
            }
        },
        "Client": {
            "fields": ["clientId", "firstName", "lastName", "email", "phone", "aum", "riskTolerance", "onboardDate"],
            "sample_values": {
                "clientId": lambda: f"CL-{random.randint(10000, 99999)}",
                "firstName": lambda: fake.first_name(),
                "lastName": lambda: fake.last_name(),
                "email": lambda: fake.email(),
                "phone": lambda: fake.phone_number(),
                "aum": lambda: round(random.uniform(250000, 20000000), 2),
                "riskTolerance": lambda: random.choice(["Conservative", "Moderate", "Aggressive"]),
                "onboardDate": lambda: fake.date_between(start_date='-10y', end_date='now').isoformat()
            }
        },
        "Account": {
            "fields": ["accountNumber", "accountType", "currentValue", "costBasis", "unrealizedGain", "inceptionDate"],
            "sample_values": {
                "accountNumber": lambda: f"{random.randint(1000000000, 9999999999)}",
                "accountType": lambda: random.choice(["IRA", "Roth IRA", "401k", "Taxable", "Trust", "529 Plan"]),
                "currentValue": lambda: round(random.uniform(50000, 5000000), 2),
                "costBasis": lambda: round(random.uniform(40000, 4500000), 2),
                "unrealizedGain": lambda: round(random.uniform(-50000, 800000), 2),
                "inceptionDate": lambda: fake.date_between(start_date='-15y', end_date='-1y').isoformat()
            }
        },
        "Trade": {
            "fields": ["tradeId", "symbol", "quantity", "price", "tradeType", "tradeDate", "settlementDate"],
            "sample_values": {
                "tradeId": lambda: f"TRD-{random.randint(1000000, 9999999)}",
                "symbol": lambda: random.choice(["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "VTI", "SPY", "QQQ"]),
                "quantity": lambda: random.randint(10, 1000),
                "price": lambda: round(random.uniform(50, 500), 2),
                "tradeType": lambda: random.choice(["Buy", "Sell", "Transfer In", "Transfer Out"]),
                "tradeDate": lambda: fake.date_between(start_date='-30d', end_date='now').isoformat(),
                "settlementDate": lambda: fake.date_between(start_date='now', end_date='+3d').isoformat()
            }
        },
        "PerformanceReport": {
            "fields": ["reportId", "periodStart", "periodEnd", "totalReturn", "benchmark", "alpha", "sharpeRatio"],
            "sample_values": {
                "reportId": lambda: f"RPT-{random.randint(10000, 99999)}",
                "periodStart": lambda: fake.date_between(start_date='-1y', end_date='-90d').isoformat(),
                "periodEnd": lambda: fake.date_between(start_date='-89d', end_date='now').isoformat(),
                "totalReturn": lambda: round(random.uniform(-8.5, 32.5), 2),
                "benchmark": lambda: random.choice(["S&P 500", "MSCI World", "60/40 Portfolio", "Russell 2000"]),
                "alpha": lambda: round(random.uniform(-3.0, 5.0), 2),
                "sharpeRatio": lambda: round(random.uniform(0.5, 2.5), 2)
            }
        },
        "RiskProfile": {
            "fields": ["profileId", "riskScore", "timeHorizon", "liquidityNeeds", "investmentExperience", "lastUpdated"],
            "sample_values": {
                "profileId": lambda: f"RISK-{random.randint(10000, 99999)}",
                "riskScore": lambda: random.randint(1, 100),
                "timeHorizon": lambda: random.choice(["<3 years", "3-5 years", "5-10 years", "10+ years"]),
                "liquidityNeeds": lambda: random.choice(["Low", "Medium", "High"]),
                "investmentExperience": lambda: random.choice(["None", "Limited", "Moderate", "Extensive"]),
                "lastUpdated": lambda: fake.date_between(start_date='-2y', end_date='now').isoformat()
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
        if field in ["totalValue", "cashBalance", "ytdReturn", "aum", "currentValue", "costBasis", 
                     "unrealizedGain", "quantity", "price", "totalReturn", "alpha", "sharpeRatio", "riskScore"]:
            data_type = "number"
        elif field in ["onboardDate", "inceptionDate", "tradeDate", "settlementDate", "periodStart", 
                       "periodEnd", "lastUpdated", "createdDate", "updatedDate"]:
            data_type = "date"
        elif field in ["ytdReturn", "totalReturn", "alpha", "sharpeRatio"]:
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

def generate_dependency_graph(form_summaries, target_entities=400, target_dashboards=250, target_processes=60, target_documents=50):
    """Generate dependency graph showing relationships between entities, forms, documents, processes, and dashboards
    
    Args:
        form_summaries: List of form/document summaries generated earlier
        target_entities: Target number of unique entities (default: 400)
        target_dashboards: Target number of dashboards (default: 250)
        target_processes: Target number of processes (default: 60)
        target_documents: Target number of standalone documents (default: 50)
    
    Returns:
        Dictionary with nodes and links for dependency visualization
    """
    nodes = []
    links = []
    
    # Extract unique base entities from forms and create variations
    base_entities = {}
    for form in form_summaries:
        entity_name = form["entityName"]
        category = form["category"]
        if entity_name not in base_entities:
            base_entities[entity_name] = category
    
    # Entity variations/suffixes to reach target count
    entity_variations = [
        "", " - Primary", " - Secondary", " - Archive", " - Draft", " - Published",
        " - Active", " - Inactive", " - Pending", " - Approved", " - Rejected",
        " - US", " - EU", " - APAC", " - Global", " - Regional", " - Local",
        " - Legacy", " - Modern", " - V1", " - V2", " - V3", " - Beta", " - Production"
    ]
    
    # Create entity nodes with variations to reach target
    entity_id_map = {}
    entity_count = 0
    variations_needed = max(1, (target_entities // len(base_entities)) + 1)
    
    for base_name, category in base_entities.items():
        for i, variation in enumerate(entity_variations[:variations_needed]):
            if entity_count >= target_entities:
                break
            entity_count += 1
            entity_id = f"e{entity_count}"
            full_name = f"{base_name}{variation}" if variation else base_name
            entity_id_map[full_name] = entity_id
            # Also map base name for lookups
            if not variation:
                entity_id_map[base_name] = entity_id
            
            nodes.append({
                "id": entity_id,
                "name": full_name,
                "type": "entity",
                "category": category.capitalize()
            })
        if entity_count >= target_entities:
            break
    
    # Create form/document nodes from summaries and link them to entities
    form_nodes = []
    doc_nodes = []
    
    for idx, form in enumerate(form_summaries, 1):
        item_type = form["type"]
        entity_name = form["entityName"]
        entity_id = entity_id_map.get(entity_name)
        
        if item_type == "Form":
            node_id = f"f{len(form_nodes) + 1}"
            form_nodes.append({
                "id": node_id,
                "name": form["name"],
                "type": "form",
                "category": form["category"].capitalize()
            })
            
            # Link form to entity (form creates entity)
            if entity_id:
                links.append({
                    "source": node_id,
                    "target": entity_id,
                    "relationship": "creates",
                    "strength": 1.0
                })
                
                # Randomly link to 1-2 additional related entities
                if len(entity_id_map) > 10 and random.random() > 0.7:
                    related_entity_id = random.choice(list(entity_id_map.values()))
                    if related_entity_id != entity_id:
                        links.append({
                            "source": node_id,
                            "target": related_entity_id,
                            "relationship": random.choice(["requires", "references", "updates"]),
                            "strength": random.uniform(0.5, 0.8)
                        })
        else:  # Document
            node_id = f"d{len(doc_nodes) + 1}"
            doc_nodes.append({
                "id": node_id,
                "name": form["name"],
                "type": "document",
                "category": form["category"].capitalize()
            })
            
            # Link document to entity (document displays/reports entity)
            if entity_id:
                links.append({
                    "source": node_id,
                    "target": entity_id,
                    "relationship": "displays",
                    "strength": 0.9
                })
    
    nodes.extend(form_nodes)
    nodes.extend(doc_nodes)
    
    # Generate additional standalone documents to reach target
    doc_templates = [
        ("Compliance Report", "compliance"), ("Audit Trail", "compliance"),
        ("Risk Assessment", "compliance"), ("Policy Document", "compliance"),
        ("User Manual", "research"), ("Technical Specification", "research"),
        ("Analysis Report", "research"), ("White Paper", "research"),
        ("Monthly Statement", "reporting"), ("Quarterly Review", "reporting"),
        ("Annual Report", "reporting"), ("Performance Summary", "reporting")
    ]
    
    additional_docs_needed = max(0, target_documents - len(doc_nodes))
    for i in range(additional_docs_needed):
        doc_template, doc_category = random.choice(doc_templates)
        doc_id = f"d{len(doc_nodes) + 1}"
        doc_nodes.append({
            "id": doc_id,
            "name": f"{doc_template} #{i+1}",
            "type": "document",
            "category": doc_category.capitalize()
        })
        
        # Link to 1-3 random entities
        num_links = random.randint(1, 3)
        linked_entities = random.sample(list(entity_id_map.values()), min(num_links, len(entity_id_map)))
        for entity_id in linked_entities:
            links.append({
                "source": doc_id,
                "target": entity_id,
                "relationship": random.choice(["documents", "reports", "analyzes"]),
                "strength": random.uniform(0.7, 0.95)
            })
    
    # Generate process nodes to reach target
    process_templates = [
        ("Onboarding", "client"), ("Account Setup", "investment"),
        ("Trade Execution", "trading"), ("Order Processing", "trading"),
        ("Risk Assessment", "compliance"), ("Compliance Check", "compliance"),
        ("Performance Calculation", "reporting"), ("Report Generation", "reporting"),
        ("Plan Review", "planning"), ("Goal Setting", "planning"),
        ("Data Validation", "research"), ("Analysis Pipeline", "research")
    ]
    
    for i in range(target_processes):
        proc_id = f"p{i+1}"
        proc_template, proc_category = random.choice(process_templates)
        proc_name = f"{proc_template} Process #{i+1}"
        
        nodes.append({
            "id": proc_id,
            "name": proc_name,
            "type": "process",
            "category": proc_category.capitalize()
        })
        
        # Link processes to 2-5 related entities
        num_links = random.randint(2, 5)
        linked_entities = random.sample(list(entity_id_map.values()), min(num_links, len(entity_id_map)))
        for entity_id in linked_entities:
            links.append({
                "source": proc_id,
                "target": entity_id,
                "relationship": random.choice(["manages", "processes", "validates", "transforms"]),
                "strength": random.uniform(0.7, 0.95)
            })
    
    # Generate dashboard nodes to reach target
    dashboard_templates = [
        ("Executive", "investment"), ("Operations", "client"),
        ("Trading", "trading"), ("Risk", "compliance"),
        ("Performance", "reporting"), ("Analytics", "research"),
        ("Planning", "planning"), ("Monitoring", "compliance")
    ]
    
    for i in range(target_dashboards):
        dash_id = f"dash{i+1}"
        dash_template, dash_category = random.choice(dashboard_templates)
        dash_name = f"{dash_template} Dashboard #{i+1}"
        
        nodes.append({
            "id": dash_id,
            "name": dash_name,
            "type": "dashboard",
            "category": dash_category.capitalize()
        })
        
        # Link dashboards to 3-8 entities they display
        num_links = random.randint(3, 8)
        linked_entities = random.sample(list(entity_id_map.values()), min(num_links, len(entity_id_map)))
        for entity_id in linked_entities:
            links.append({
                "source": dash_id,
                "target": entity_id,
                "relationship": random.choice(["queries", "displays", "monitors", "aggregates"]),
                "strength": random.uniform(0.85, 1.0)
            })
        
        # Link dashboards to some documents
        if doc_nodes and random.random() > 0.6:
            num_doc_links = random.randint(1, 3)
            linked_docs = random.sample([d["id"] for d in doc_nodes], min(num_doc_links, len(doc_nodes)))
            for doc_id in linked_docs:
                links.append({
                    "source": dash_id,
                    "target": doc_id,
                    "relationship": "generates",
                    "strength": random.uniform(0.6, 0.85)
                })
    
    # Add entity-to-entity relationships (10-20% of entities)
    entity_ids = list(entity_id_map.values())
    relationship_types = ["contains", "belongs_to", "relates_to", "depends_on", "aggregates", "derives_from"]
    num_entity_relationships = int(len(entity_ids) * 0.15)
    
    for _ in range(num_entity_relationships):
        if len(entity_ids) >= 2:
            source_id, target_id = random.sample(entity_ids, 2)
            links.append({
                "source": source_id,
                "target": target_id,
                "relationship": random.choice(relationship_types),
                "strength": random.uniform(0.6, 0.95)
            })
    
    return {
        "nodes": nodes,
        "links": links
    }

def generate_three_call_mock_data(mode='full'):
    """Main function to generate Four-Call API mock data
    
    Args:
        mode: 'light' for Netlify (24 forms), 'full' for local (408 forms), 'scale' for performance test (1300 forms)
    """
    if mode == 'light':
        form_limit = 24
        mode_label = "LIGHT (Netlify)"
    elif mode == 'scale':
        form_limit = 1300
        mode_label = "SCALE TEST (Performance Testing - 1300 forms, 800+ entities, 1000+ queries)"
        print(f"\n  >> Generating large dataset for performance testing...")
    else:
        form_limit = None
        mode_label = "FULL (Local Development)"
    
    print(f"\n*** SPX Magic Selector - Four-Call API Mock Data Generator [{mode_label}] ***")
    print("=" * 70)
    
    # Call A: Generate form summaries (lightweight dropdown data)
    print("\n[1/4] Call A: Generating Form Summaries...")
    form_summaries = generate_realistic_forms(limit=form_limit)
    save_json("form-summaries.json", form_summaries)
    
    # Call B: Generate form metadata (queries and details per form)
    print("\n[2/4] Call B: Generating Form Metadata...")
    form_metadata = generate_form_metadata(form_summaries)
    save_json("form-metadata.json", form_metadata)
    
    # Call C: Generate preview data for each query
    print("\n[3/4] Call C: Generating Preview Data Files...")
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
    
    # Generate dependency graph with realistic enterprise scale
    print("\n[4/4] Generating Dependency Graph...")
    # Use scaled numbers for full mode, minimal for light mode
    if mode == 'light':
        target_entities = 24
        target_forms = 24
        target_documents = 12
        target_processes = 6
        target_dashboards = 6
    elif mode == 'scale':
        print("  >> Scale Test Mode: Generating 800 entities, 400 forms, 100 documents...")
        target_entities = 800
        target_forms = 400
        target_documents = 100
        target_processes = 50
        target_dashboards = 20
    else:  # full
        target_entities = len(set(f["entityName"] for f in form_summaries))
        target_forms = min(len(form_summaries), 408)
        target_documents = 100
        target_processes = 20
        target_dashboards = 15
    
    dependency_graph = generate_dependency_graph(
        form_summaries,
        target_entities=target_entities,
        target_dashboards=target_dashboards,
        target_processes=target_processes,
        target_documents=target_documents
    )
    save_json("dependency-graph.json", dependency_graph)
    
    # Count node types
    node_counts = {
        "entity": 0,
        "form": 0,
        "document": 0,
        "process": 0,
        "dashboard": 0
    }
    for node in dependency_graph['nodes']:
        node_type = node['type']
        if node_type in node_counts:
            node_counts[node_type] += 1
    
    # Summary
    print("\n" + "=" * 70)
    print(f"[SUCCESS] Four-Call API mock data generated in {BASE_DIR}")
    print("\n>> Production-Ready API Pattern:")
    print(f"  Call A (Dropdown):     form-summaries.json ({len(form_summaries)} forms)")
    print(f"  Call B (Metadata):     form-metadata.json ({len(form_metadata)} forms)")
    print(f"  Call C (Preview):      {preview_files_created} preview-data-*.json files")
    print(f"  Call D (Dependencies): dependency-graph.json ({len(dependency_graph['nodes'])} nodes, {len(dependency_graph['links'])} links)")
    
    total_queries = sum(len(metadata["queries"]) for metadata in form_metadata.values())
    print(f"\n>> Data Breakdown:")
    print(f"  * Business Forms:      {len(form_summaries)}")
    print(f"  * Query Definitions:   {total_queries}")
    print(f"  * Preview Data Files:  {preview_files_created}")
    print(f"\n>> Dependency Graph Breakdown:")
    print(f"  * Total Nodes:         {len(dependency_graph['nodes'])}")
    print(f"    - Entities:          {node_counts['entity']}")
    print(f"    - Forms:             {node_counts['form']}")
    print(f"    - Documents:         {node_counts['document']}")
    print(f"    - Processes:         {node_counts['process']}")
    print(f"    - Dashboards:        {node_counts['dashboard']}")
    print(f"  * Total Links:         {len(dependency_graph['links'])}")
    
    print(f"\n>> Three-Call Integration Pattern:")
    print(f"  1. Load form-summaries.json -> populate ng-select dropdown")
    print(f"  2. User selects form -> load form-metadata.json[formId] -> show queries")
    print(f"  3. User clicks query -> load preview-data-{{entityId}}-{{queryId}}.json")
    print(f"  4. Dependency Inspector -> load dependency-graph.json -> visualize relationships")
    
    print(f"\n>> This simulates production API calls:")
    print(f"  GET /api/forms/summary")
    print(f"  GET /api/forms/{{id}}/metadata") 
    print(f"  GET /api/entities/{{entityId}}/records?queryId={{queryId}}")
    print(f"  GET /api/dependencies/graph")
    print("\n")

if __name__ == "__main__":
    # Parse command-line arguments
    parser = argparse.ArgumentParser(
        description="Generate mock data for SPX Magic Selector",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/generate-mock-data.py              # Full dataset (408 forms)
  python scripts/generate-mock-data.py --light      # Light dataset (24 forms for Netlify)
  python scripts/generate-mock-data.py --scale      # Scale test (1300 forms, 800 entities, 1000 queries, 400 forms, 100 docs)
        """
    )
    parser.add_argument(
        '--light',
        action='store_true',
        help='Generate light dataset (24 forms) for Netlify builds'
    )
    parser.add_argument(
        '--scale',
        action='store_true',
        help='Generate scale test dataset (1300 forms total) for performance testing'
    )
    
    args = parser.parse_args()
    
    if args.scale:
        mode = 'scale'
    elif args.light:
        mode = 'light'
    else:
        mode = 'full'
    
    try:
        generate_three_call_mock_data(mode=mode)
    except ImportError:
        print("\n[ERROR] 'faker' library not installed")
        print("Please install it using: pip install faker")
        print("\n")
    except Exception as e:
        print(f"\n[ERROR] {str(e)}")
        print("\n")
