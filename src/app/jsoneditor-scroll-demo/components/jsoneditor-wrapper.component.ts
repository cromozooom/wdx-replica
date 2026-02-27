import {
  Component,
  Input,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ViewChildren,
  QueryList,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  TemplateRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgbModal, NgbModalModule } from "@ng-bootstrap/ng-bootstrap";
import JSONEditor from "jsoneditor";
import { ScrollScenario } from "../models/scroll-scenario.interface";

@Component({
  selector: "app-jsoneditor-wrapper",
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModalModule],
  templateUrl: "./jsoneditor-wrapper.component.html",
  styleUrls: ["./jsoneditor-wrapper.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonEditorWrapperComponent implements AfterViewInit, OnDestroy {
  @ViewChildren("editorContainerRef")
  editorContainers!: QueryList<ElementRef>;

  @ViewChild("fullscreenModal")
  fullscreenModal!: TemplateRef<any>;

  @Input() scenarios: ScrollScenario[] = [];
  @Input() minHeight: number = 0;

  selectedScenarioId: string = "";
  currentScenario: ScrollScenario | null = null;
  isModified = false;

  private editor: any = null;
  private isInitialized = false;
  private originalData: unknown = null;
  private modalEditor: any = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal,
  ) {}

  ngAfterViewInit(): void {
    if (this.scenarios.length > 0) {
      this.selectedScenarioId = this.scenarios[0].id;
      this.currentScenario = this.scenarios[0];
    }

    // Wait for template outlet to render
    this.editorContainers.changes.subscribe(() => {
      if (!this.isInitialized) {
        this.initializeEditor();
      }
    });

    // Also try immediate initialization
    setTimeout(() => {
      if (!this.isInitialized) {
        this.initializeEditor();
      }
    });
  }

  onScenarioChange(isModal: boolean = false): void {
    const scenario = this.scenarios.find(
      (s) => s.id === this.selectedScenarioId,
    );
    if (scenario) {
      this.currentScenario = scenario;
      this.isModified = false;
      if (isModal) {
        this.updateModalEditor();
      } else {
        this.updateEditor();
      }
      this.cdr.markForCheck();
    }
  }

  private initializeEditor(): void {
    const containers = this.editorContainers?.toArray();
    if (
      !this.currentScenario ||
      this.isInitialized ||
      !containers ||
      containers.length === 0
    ) {
      return;
    }

    // Get the main editor container (first one)
    const editorContainer = containers[0]?.nativeElement;
    if (!editorContainer) {
      return;
    }

    try {
      this.editor = new JSONEditor(editorContainer, {
        mode: this.currentScenario.editorMode,
        modes: ["code", "tree"],
        onChange: () => {
          this.isModified = true;
          this.cdr.markForCheck();
        },
      });
      this.originalData = this.currentScenario.sampleData;
      this.editor.set(this.originalData);
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize JSONEditor:", error);
    }
  }

  private updateEditor(): void {
    if (this.editor && this.currentScenario) {
      try {
        this.editor.setMode(this.currentScenario.editorMode);
        this.originalData = this.currentScenario.sampleData;
        this.editor.set(this.originalData);
      } catch (error) {
        console.error("Failed to update editor:", error);
      }
    }
  }

  private updateModalEditor(): void {
    if (this.modalEditor && this.currentScenario) {
      try {
        this.modalEditor.setMode(this.currentScenario.editorMode);
        this.modalEditor.set(this.currentScenario.sampleData);
      } catch (error) {
        console.error("Failed to update modal editor:", error);
      }
    }
  }

  resetContent(): void {
    if (this.editor && this.originalData) {
      try {
        this.editor.set(this.originalData);
        this.isModified = false;
        this.cdr.markForCheck();
      } catch (error) {
        console.error("Failed to reset editor content:", error);
      }
    }
  }

  openFullscreen(): void {
    const modalRef = this.modalService.open(this.fullscreenModal, {
      size: "xl",
      fullscreen: true,
      backdrop: "static",
      keyboard: false,
    });

    // Initialize modal editor after modal opens
    modalRef.shown.subscribe(() => {
      // Trigger change detection to update ViewChildren
      this.cdr.detectChanges();
      this.initializeModalEditor();
    });

    // Sync data back when modal closes
    modalRef.closed.subscribe(() => {
      this.syncFromModalEditor();
    });
  }

  private initializeModalEditor(): void {
    if (!this.currentScenario) {
      return;
    }

    // Wait a tick for the modal to render and ViewChildren to update
    setTimeout(() => {
      const containers = this.editorContainers?.toArray();
      // Get the modal editor container (should be second one when modal is open)
      const modalEditorContainer =
        containers && containers.length > 1
          ? containers[1]?.nativeElement
          : null;

      if (!modalEditorContainer || !this.currentScenario) {
        console.error(
          "Modal editor container not found. Containers:",
          containers?.length,
        );
        return;
      }

      try {
        // Get current data from main editor
        const currentData = this.editor
          ? this.editor.get()
          : this.currentScenario.sampleData;

        this.modalEditor = new JSONEditor(modalEditorContainer, {
          mode: this.currentScenario.editorMode,
          modes: ["code", "tree"],
        });
        this.modalEditor.set(currentData);
      } catch (error) {
        console.error("Failed to initialize modal editor:", error);
      }
    }, 150);
  }

  private syncFromModalEditor(): void {
    if (this.modalEditor && this.editor) {
      try {
        const modalData = this.modalEditor.get();
        this.editor.set(modalData);
        this.isModified = true;
        this.cdr.markForCheck();
      } catch (error) {
        console.error("Failed to sync from modal editor:", error);
      }
    }

    // Cleanup modal editor
    if (this.modalEditor) {
      try {
        this.modalEditor.destroy();
      } catch (error) {
        console.error("Failed to destroy modal editor:", error);
      }
      this.modalEditor = null;
    }
  }

  ngOnDestroy(): void {
    if (this.editor) {
      try {
        this.editor.destroy();
      } catch (error) {
        console.error("Failed to destroy editor:", error);
      }
      this.editor = null;
    }

    if (this.modalEditor) {
      try {
        this.modalEditor.destroy();
      } catch (error) {
        console.error("Failed to destroy modal editor:", error);
      }
      this.modalEditor = null;
    }

    this.isInitialized = false;
  }
}
