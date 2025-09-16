import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { AutomationItem, AutomationStep, PreviewRecord } from './widget-automation-content.models';
import { widgetDemoAutomations } from './widget-automation-content.dummy-data';

export const WidgetAutomationContentStore = signalStore(
  { providedIn: 'root' },
  withState({
    selectedAutomationId: widgetDemoAutomations[0]?.id ?? '',
    selectedStepIndex: 0 as number,
    toastMessage: '' as string,
    toastVariant: 'warning' as 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info',
    showToast: false as boolean,
    editingAutomationId: null as string | null,
    editingAutomationName: '' as string,
    automations: widgetDemoAutomations as AutomationItem[],
  }),
  withComputed((store) => {
    const automationsArr = computed<AutomationItem[]>(() => store.automations?.() ?? []);
    const selectedAutomation = computed<AutomationItem | undefined>(() => {
      const id = store.selectedAutomationId?.() as string;
      let a = automationsArr();
      return a.find((a: AutomationItem) => a.id === id);
    });
    const steps = computed<AutomationStep[]>(() => selectedAutomation()?.steps ?? []);
    const selectedStep = computed<AutomationStep | undefined>(() => {
      const idx = store.selectedStepIndex?.() as number;
      const list = steps();
      return idx >= 0 && idx < list.length ? list[idx] : undefined;
    });
    const selectedStepResults = computed<PreviewRecord[]>(() => selectedStep()?.results ?? []);
    const resultsCount = computed<number>(() => selectedStepResults().length);
    const isReady = computed<boolean>(() => steps().every((step: AutomationStep) => step.status === 'ready' || step.status === 'idle'));
    return {
      automations: automationsArr,
      selectedAutomation,
      steps,
      stepCount: computed<number>(() => steps().length),
      selectedStep,
      selectedStepResults,
      resultsCount,
      isReady,
    };
  }),
  withMethods((store) => ({
    selectStepById(stepId: string) {
      const steps = store.steps?.() ?? [];
      const idx = steps.findIndex((s) => s.id === stepId);
      if (idx >= 0) {
        patchState(store, { selectedStepIndex: idx } as any);
      }
    },
    selectAutomation(id: string) {
      patchState(store, { selectedAutomationId: id, selectedStepIndex: 0 } as any);
    },
    selectStep(stepId: string) {
      const steps = store.steps?.() ?? [];
      const idx = steps.findIndex((s) => s.id === stepId);
      if (idx >= 0) {
        patchState(store, { selectedStepIndex: idx } as any);
      }
    },
    showToastMessage(message: string, variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' = 'warning') {
      patchState(store, { toastMessage: message, toastVariant: variant, showToast: true } as any);
      setTimeout(() => patchState(store, { showToast: false } as any), 3000);
    },
    hideToast() {
      patchState(store, { showToast: false } as any);
    },
    setEditingAutomationName(name: string) {
      patchState(store, { editingAutomationName: name } as any);
    },
    cancelRenameAutomation() {
      patchState(store, { editingAutomationId: null, editingAutomationName: '' } as any);
    },
  })),
);
