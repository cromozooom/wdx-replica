/**
 * Validates Jira ticket format: WPO-#####
 * @param ticket Jira ticket string to validate
 * @returns true if valid, false otherwise
 */
export function isValidJiraTicket(ticket: string): boolean {
  const jiraRegex = /^WPO-\d{5}$/;
  return jiraRegex.test(ticket);
}

/**
 * Extracts ticket number from Jira ticket string
 * @param ticket Jira ticket (e.g., "WPO-12345")
 * @returns Ticket number or null if invalid
 */
export function extractJiraNumber(ticket: string): number | null {
  if (!isValidJiraTicket(ticket)) {
    return null;
  }

  const number = parseInt(ticket.substring(4), 10);
  return isNaN(number) ? null : number;
}
