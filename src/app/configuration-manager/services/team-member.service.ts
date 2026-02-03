import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class TeamMemberService {
  private teamMembers: string[] = [
    "John Doe",
    "Jane Smith",
    "Bob Johnson",
    "Alice Williams",
    "Charlie Brown",
    "Diana Prince",
    "System",
  ];

  getTeamMembers(): string[] {
    return [...this.teamMembers];
  }

  getCurrentUser(): string {
    // TODO: Replace with actual auth service integration
    return "System";
  }
}
