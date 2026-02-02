import { Injectable } from "@angular/core";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  autohide: boolean;
  delay?: number;
}

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private toasts: Toast[] = [];
  private nextId = 1;

  getToasts(): Toast[] {
    return this.toasts;
  }

  show(
    message: string,
    type: ToastType = "info",
    autohide = true,
    delay = 5000,
  ): void {
    const toast: Toast = {
      id: this.nextId++,
      type,
      message,
      autohide,
      delay,
    };

    this.toasts.push(toast);

    if (autohide) {
      setTimeout(() => this.remove(toast.id), delay);
    }
  }

  success(message: string): void {
    this.show(message, "success");
  }

  error(message: string): void {
    this.show(message, "error", true, 7000);
  }

  warning(message: string): void {
    this.show(message, "warning", true, 6000);
  }

  info(message: string): void {
    this.show(message, "info");
  }

  remove(id: number): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  clear(): void {
    this.toasts = [];
  }
}
