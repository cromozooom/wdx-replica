import { computed } from "@angular/core";
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from "@ngrx/signals";
import {
  AutomationItem,
  PreviewRecord,
} from "./widget-automation-content.models";
import { widgetDemoAutomations } from "./widget-automation-content.dummy-data";

export const WidgetAutomationContentStore = signalStore(
  { providedIn: "root" },
  withState({
    selectedAutomationId: widgetDemoAutomations[0]?.id ?? "",
    selectedStepIndex: 0 as number,
    toastMessage: "" as string,
    toastVariant: "warning" as
      | "primary"
      | "secondary"
      | "success"
      | "danger"
      | "warning"
      | "info",
    showToast: false as boolean,
    editingAutomationId: null as string | null,
    editingAutomationName: "" as string,
    automations: widgetDemoAutomations as AutomationItem[],
  }),
  withComputed((store) => {
    const automationsArr = computed<AutomationItem[]>(
      () => store.automations?.() ?? []
    );
    const selectedAutomation = computed<AutomationItem | undefined>(() => {
      const id = store.selectedAutomationId?.() as string;
      let a = automationsArr();
      return a.find((a: AutomationItem) => a.id === id);
    });

    return {
      selectedAutomation,
    };
  }),
  withMethods((store) => ({}))
);
