import { Pipe, PipeTransform } from "@angular/core";
import { User } from "../widget-form-history.models";

@Pipe({ name: "filterById", standalone: true })
export class FilterByIdPipe implements PipeTransform {
  transform(users: User[], id: string | null): User | undefined {
    return users?.find((u) => u.id === id);
  }
}
