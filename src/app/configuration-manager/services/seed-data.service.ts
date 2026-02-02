import { Injectable } from '@angular/core';
import { Configuration } from '../models/configuration.model';
import { ConfigurationType } from '../models/configuration-type.enum';
import { UpdateEntry } from '../models/update-entry.model';

@Injectable({
  providedIn: 'root',
})
export class SeedDataService {
  private readonly teamMembers = [
    'John Smith',
    'Sarah Johnson',
    'Michael Chen',
    'Emily Rodriguez',
    'David Kim',
  ];

  private readonly jiraTickets = [
    'WPO-10001', 'WPO-10023', 'WPO-10045', 'WPO-10067', 'WPO-10089',
    'WPO-10112', 'WPO-10134', 'WPO-10156', 'WPO-10178', 'WPO-10201',
  ];

  private readonly comments = [
    'Initial configuration setup for **wealth management** dashboard',
    'Updated to support new compliance requirements',
    '## Performance Optimization\n\nReduced query complexity by 40%',
    'Added support for *ESG screening* filters',
    'Fixed bug with `null` values in calculation',
    'Refactored for better **maintainability**',
    '### Security Update\n\nImplemented additional validation checks',
    'Enhanced user experience based on feedback',
    'Optimized for mobile responsiveness',
    'Added multi-currency support',
  ];

  private generateUpdateEntries(configIndex: number, count: number): UpdateEntry[] {
    const entries: UpdateEntry[] = [];
    const baseDate = new Date(2025, 10, 1); // November 2025

    for (let i = 0; i < count; i++) {
      const hasJira = i % 3 !== 0; // 2 out of 3 have Jira tickets
      const hasComment = i % 2 === 0 || !hasJira; // All without Jira must have comment

      entries.push({
        jiraTicket: hasJira ? this.jiraTickets[(configIndex + i) % this.jiraTickets.length] : undefined,
        comment: hasComment ? this.comments[(configIndex + i) % this.comments.length] : undefined,
        date: new Date(baseDate.getTime() + (i * 7 * 24 * 60 * 60 * 1000)), // Weekly updates
        madeBy: this.teamMembers[(configIndex + i) % this.teamMembers.length],
      });
    }

    return entries;
  }

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
        updates: this.generateUpdateEntries(i - 1, i % 2 === 0 ? 3 : 4),
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
        updates: this.generateUpdateEntries(15 + i - 1, i % 3 === 0 ? 3 : 4),
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
        updates: this.generateUpdateEntries(30 + i - 1, i % 4 === 0 ? 5 : 3),
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
        updates: this.generateUpdateEntries(45 + i - 1, 3 + (i % 2)),
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
        updates: this.generateUpdateEntries(60 + i - 1, i % 5 === 0 ? 5 : 3),
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
      updates: this.generateUpdateEntries(75, 6),
    });

    return configurations;
  }
}
