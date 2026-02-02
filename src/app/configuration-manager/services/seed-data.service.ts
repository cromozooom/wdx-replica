import { Injectable } from '@angular/core';
import { Configuration } from '../models/configuration.model';
import { ConfigurationType } from '../models/configuration-type.enum';

@Injectable({
  providedIn: 'root',
})
export class SeedDataService {
  generateSeedData(): Configuration[] {
    const configurations: Configuration[] = [];
    let id = 1;

    // 1. Dashboard Configs (15)
    for (let i = 1; i <= 15; i++) {
      configurations.push({
        id: id++,
        name: `Dashboard Config ${i}`,
        type: ConfigurationType.DashboardConfig,
        version: 'V1.0.0',
        value: JSON.stringify({
          layout: 'grid',
          columns: 12,
          widgets: [
            { type: 'chart', position: { row: 0, col: 0, width: 6, height: 4 } },
            { type: 'metrics', position: { row: 0, col: 6, width: 6, height: 4 } },
          ],
          theme: 'professional',
        }, null, 2),
        createdDate: new Date(2026, 0, i),
        lastModifiedDate: new Date(2026, 0, i),
        createdBy: 'system',
        lastModifiedBy: 'system',
        updates: [],
      });
    }

    // 2. Form Configs (15)
    for (let i = 1; i <= 15; i++) {
      configurations.push({
        id: id++,
        name: `Form Config ${i}`,
        type: ConfigurationType.FormConfig,
        version: 'V1.0.0',
        value: JSON.stringify({
          schema: {
            type: 'object',
            properties: {
              field1: { type: 'string', title: 'Field 1' },
              field2: { type: 'number', title: 'Field 2' },
            },
          },
        }, null, 2),
        createdDate: new Date(2026, 0, 15 + i),
        lastModifiedDate: new Date(2026, 0, 15 + i),
        createdBy: 'system',
        lastModifiedBy: 'system',
        updates: [],
      });
    }

    // 3. FetchXML Queries (15)
    for (let i = 1; i <= 15; i++) {
      configurations.push({
        id: id++,
        name: `FetchXML Query ${i}`,
        type: ConfigurationType.FetchXMLQuery,
        version: 'V1.0.0',
        value: `<fetch version="1.0" output-format="xml-platform" mapping="logical">
  <entity name="contact">
    <attribute name="fullname" />
    <attribute name="emailaddress1" />
    <filter type="and">
      <condition attribute="statecode" operator="eq" value="0" />
    </filter>
  </entity>
</fetch>`,
        createdDate: new Date(2026, 0, 30 + i),
        lastModifiedDate: new Date(2026, 0, 30 + i),
        createdBy: 'system',
        lastModifiedBy: 'system',
        updates: [],
      });
    }

    // 4. Dashboard Queries (15)
    for (let i = 1; i <= 15; i++) {
      configurations.push({
        id: id++,
        name: `Dashboard Query ${i}`,
        type: ConfigurationType.DashboardQuery,
        version: 'V1.0.0',
        value: `<fetch version="1.0" output-format="xml-platform" aggregate="true">
  <entity name="opportunity">
    <attribute name="estimatedvalue" aggregate="sum" alias="total_value" />
    <filter type="and">
      <condition attribute="statecode" operator="eq" value="0" />
    </filter>
  </entity>
</fetch>`,
        createdDate: new Date(2026, 1, i),
        lastModifiedDate: new Date(2026, 1, i),
        createdBy: 'system',
        lastModifiedBy: 'system',
        updates: [],
      });
    }

    // 5. Processes (15)
    for (let i = 1; i <= 15; i++) {
      configurations.push({
        id: id++,
        name: `Process ${i}`,
        type: ConfigurationType.Process,
        version: 'V1.0.0',
        value: `// Automated process ${i}
async function execute() {
  console.log('Starting process ${i}');
  // Process logic here
  return { success: true };
}

execute();`,
        createdDate: new Date(2026, 1, 15 + i),
        lastModifiedDate: new Date(2026, 1, 15 + i),
        createdBy: 'system',
        lastModifiedBy: 'system',
        updates: [],
      });
    }

    // 6. System Settings (1)
    configurations.push({
      id: id++,
      name: 'Global System Settings',
      type: ConfigurationType.SystemSetting,
      version: 'V1.0.0',
      value: JSON.stringify({
        platform: {
          name: 'Wealth Dynamics Platform',
          version: '2.5.0',
          environment: 'production',
        },
        features: {
          autoRebalancing: true,
          taxLossHarvesting: true,
          esgScreening: true,
        },
        limits: {
          maxPortfolioSize: 10000000,
          minTradeAmount: 100,
        },
      }, null, 2),
      createdDate: new Date(2026, 1, 1),
      lastModifiedDate: new Date(2026, 1, 1),
      createdBy: 'admin',
      lastModifiedBy: 'admin',
      updates: [],
    });

    return configurations;
  }
}
