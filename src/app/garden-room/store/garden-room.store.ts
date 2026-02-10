import {
  signalStore,
  withState,
  withComputed,
  patchState,
} from "@ngrx/signals";
import { computed, inject } from "@angular/core";
import { BuildEnvelope } from "../models/build-envelope.model";
import { Wall } from "../models/wall.model";
import { MaterialLibrary } from "../models/material-library.model";
import { HardwareRuleSet } from "../models/hardware-rule-set.model";
import { MaterialOptimizationService } from "../services/material-optimization.service";
import { StructuralCalculationService } from "../services/structural-calculation.service";

/**
 * BuildEnvelopeState - state shape for build envelope
 */
export interface BuildEnvelopeState {
  buildEnvelope: BuildEnvelope;
  walls: Wall[];
  materialLibrary: MaterialLibrary;
  hardwareRules: HardwareRuleSet;
}

/**
 * Initial state with default values
 */
const initialState: BuildEnvelopeState = {
  buildEnvelope: {
    maxLegalHeightMm: 2500,
    concreteOffsetMm: 50,
    roofSystemMm: 200,
    floorSystemMm: 150,
    fallRatio: { rise: 1, run: 40 },
  },
  walls: [
    {
      id: "front",
      name: "Front",
      lengthMm: 5000,
      heightMm: 0,
      isMasterHeight: true,
      decorativeOffsetMm: 100,
      studGapMm: 400,
      timberSection: "47x100-c24",
      wallThicknessMm: 100,
      hasNoggins: true,
      members: [],
    },
    {
      id: "back",
      name: "Back",
      lengthMm: 5000,
      heightMm: 0,
      isMasterHeight: false,
      decorativeOffsetMm: 100,
      studGapMm: 400,
      timberSection: "47x100-c24",
      wallThicknessMm: 100,
      hasNoggins: true,
      members: [],
    },
    {
      id: "left",
      name: "Left",
      lengthMm: 3000,
      heightMm: 0,
      isMasterHeight: false,
      decorativeOffsetMm: 0,
      studGapMm: 400,
      timberSection: "47x100-c24",
      wallThicknessMm: 100,
      hasNoggins: true,
      members: [],
    },
    {
      id: "right",
      name: "Right",
      lengthMm: 3000,
      heightMm: 0,
      isMasterHeight: false,
      decorativeOffsetMm: 0,
      studGapMm: 400,
      timberSection: "47x100-c24",
      wallThicknessMm: 100,
      hasNoggins: true,
      members: [],
    },
    {
      id: "base",
      name: "Base",
      lengthMm: 5000, // Front width - will be computed dynamically
      heightMm: 3000, // Left width - will be computed dynamically
      isMasterHeight: false,
      decorativeOffsetMm: 0,
      studGapMm: 400,
      timberSection: "47x100-c24",
      wallThicknessMm: 100,
      hasNoggins: false, // Base typically doesn't need noggins
      members: [],
    },
    {
      id: "roof",
      name: "Roof",
      lengthMm: 5200, // Front width + front extension + back extension - will be computed dynamically
      heightMm: 3200, // Left width + (2 × decorative offset) - will be computed dynamically
      isMasterHeight: false,
      decorativeOffsetMm: 0,
      studGapMm: 400,
      timberSection: "47x100-c24",
      wallThicknessMm: 100,
      hasNoggins: false, // Roof has different framing pattern
      roofFrontExtensionMm: 100,
      roofBackExtensionMm: 100,
      members: [],
    },
  ],
  materialLibrary: {
    sheetMaterials: [
      {
        id: "osb3-2400x1200x11",
        name: "OSB3 Zero Sheet",
        widthMm: 2400,
        heightMm: 1200,
        thicknessMm: 11,
        pricePerSheet: 28.82,
        currency: "GBP",
        available: true,
      },
      {
        id: "osb3-2400x590x18",
        name: "Norbord OSB3 Zero Tongue & Groove",
        widthMm: 2400,
        heightMm: 590,
        thicknessMm: 18,
        pricePerSheet: 27.62,
        currency: "GBP",
        available: true,
      },
      {
        id: "osb3-2400x600x22",
        name: "Cabershield Plus Tongue & Groove Chipboard 2400mm x 600mm x 22mm",
        widthMm: 2400,
        heightMm: 600,
        thicknessMm: 22,
        pricePerSheet: 27.53,
        currency: "GBP",
        available: true,
      },
    ],
    timberSections: [
      {
        id: "47x50-c16",
        name: "47x50 C16 Timber",
        widthMm: 47,
        heightMm: 50,
        grade: "C16",
        lengthOptions: [
          {
            lengthMm: 2400,
            pricePerPiece: 4.68,
            currency: "GBP",
            available: true,
          },
          {
            lengthMm: 3000,
            pricePerPiece: 5.84,
            currency: "GBP",
            available: true,
          },
          {
            lengthMm: 3600,
            pricePerPiece: 7.03,
            currency: "GBP",
            available: true,
          },
          {
            lengthMm: 4800,
            pricePerPiece: 9.37,
            currency: "GBP",
            available: true,
          },
        ],
      },
      {
        id: "47x100-c24",
        name: "47x100 C24 Timber",
        widthMm: 47,
        heightMm: 100,
        grade: "C24",
        lengthOptions: [
          {
            lengthMm: 2400,
            pricePerPiece: 7.64,
            currency: "GBP",
            available: true,
          },
          {
            lengthMm: 3000,
            pricePerPiece: 9.55,
            currency: "GBP",
            available: true,
          },
          {
            lengthMm: 3600,
            pricePerPiece: 11.48,
            currency: "GBP",
            available: true,
          },
          {
            lengthMm: 4200,
            pricePerPiece: 13.38,
            currency: "GBP",
            available: true,
          },
          {
            lengthMm: 4800,
            pricePerPiece: 15.28,
            currency: "GBP",
            available: true,
          },
          {
            lengthMm: 6000,
            pricePerPiece: 19.1,
            currency: "GBP",
            available: true,
          },
        ],
      },
      {
        id: "47x150-c24",
        name: "47x150 C24 Timber",
        widthMm: 47,
        heightMm: 150,
        grade: "C24",
        lengthOptions: [
          {
            lengthMm: 3000,
            pricePerPiece: 14.32,
            currency: "GBP",
            available: true,
          },
          {
            lengthMm: 3600,
            pricePerPiece: 17.21,
            currency: "GBP",
            available: true,
          },
          {
            lengthMm: 4200,
            pricePerPiece: 20.08,
            currency: "GBP",
            available: true,
          },
          {
            lengthMm: 4800,
            pricePerPiece: 22.94,
            currency: "GBP",
            available: true,
          },
          {
            lengthMm: 6000,
            pricePerPiece: 35.75,
            currency: "GBP",
            available: true,
          },
        ],
      },
    ],
    pirBoards: [
      {
        id: "kingspan-tp10-100mm",
        name: "Kingspan TP10 PIR Board",
        widthMm: 1200,
        heightMm: 2400,
        thicknessMm: 100,
        thermalConductivity: 0.022,
        pricePerBoard: 45.3,
        currency: "GBP",
        available: true,
      },
      {
        id: "kingspan-tp10-120mm",
        name: "Kingspan TP10 PIR Board",
        widthMm: 1200,
        heightMm: 2400,
        thicknessMm: 120,
        thermalConductivity: 0.022,
        pricePerBoard: 54.36,
        currency: "GBP",
        available: true,
      },
      {
        id: "celotex-ga4100-100mm",
        name: "Celotex GA4100 PIR Board",
        widthMm: 1200,
        heightMm: 2400,
        thicknessMm: 100,
        thermalConductivity: 0.021,
        pricePerBoard: 42.8,
        currency: "GBP",
        available: true,
      },
    ],
  },
  hardwareRules: {
    screwsPerLinearMeter: 10,
    tapePerSquareMeter: 1.2,
    membranePerSquareMeter: 1.1,
  },
};

/**
 * GardenRoomStore - reactive state store for garden room calculations
 * Uses @ngrx/signals for reactive derived values
 */
export const GardenRoomStore = signalStore(
  { providedIn: "root" },
  withState(initialState),
  withComputed(({ buildEnvelope, walls, materialLibrary, hardwareRules }) => {
    const optimizationService = inject(MaterialOptimizationService);
    const structuralService = inject(StructuralCalculationService);

    return {
      /**
       * Computed: Maximum wall frame height
       */
      maxWallFrameHeightMm: computed(() => {
        const env = buildEnvelope();
        return (
          env.maxLegalHeightMm -
          env.concreteOffsetMm -
          env.roofSystemMm -
          env.floorSystemMm
        );
      }),

      /**
       * Computed: Front wall height (uses maxWallFrameHeight)
       */
      frontWallHeightMm: computed(() => {
        const env = buildEnvelope();
        return (
          env.maxLegalHeightMm -
          env.concreteOffsetMm -
          env.roofSystemMm -
          env.floorSystemMm
        );
      }),

      /**
       * Computed: Back wall height (front height - fall)
       */
      backWallHeightMm: computed(() => {
        const env = buildEnvelope();
        const frontHeight =
          env.maxLegalHeightMm -
          env.concreteOffsetMm -
          env.roofSystemMm -
          env.floorSystemMm;
        const wallList = walls();
        const frontWall = wallList.find((w) => w.name === "Front");
        const spanMm = frontWall?.lengthMm || 0;
        const fallMm = (spanMm * env.fallRatio.rise) / env.fallRatio.run;
        return frontHeight - fallMm;
      }),

      /**
       * Computed: Validation - is maxWallFrameHeight positive?
       */
      isHeightValid: computed(() => {
        const env = buildEnvelope();
        const maxFrameHeight =
          env.maxLegalHeightMm -
          env.concreteOffsetMm -
          env.roofSystemMm -
          env.floorSystemMm;
        return maxFrameHeight > 0;
      }),
      /**
       * Computed: Base wall with dynamic dimensions (front width x left width)
       */
      baseWallDimensions: computed(() => {
        const wallList = walls();
        const frontWall = wallList.find((w) => w.name === "Front");
        const leftWall = wallList.find((w) => w.name === "Left");
        return {
          lengthMm: frontWall?.lengthMm || 5000, // Front width
          heightMm: leftWall?.lengthMm || 3000, // Left width (depth)
        };
      }),

      /**
       * Computed: Roof dimensions with custom front/back extensions
       */
      roofDimensions: computed(() => {
        const wallList = walls();
        const frontWall = wallList.find((w) => w.name === "Front");
        const leftWall = wallList.find((w) => w.name === "Left");
        const roofWall = wallList.find((w) => w.name === "Roof");

        // Get roof extensions from roof wall
        const frontExtension = roofWall?.roofFrontExtensionMm || 100;
        const backExtension = roofWall?.roofBackExtensionMm || 100;

        // Roof length = front wall width + custom front extension + custom back extension
        const roofLength =
          (frontWall?.lengthMm || 5000) + frontExtension + backExtension;

        // Roof width = left wall width + (2 × decorative offset from front wall)
        const decorativeOffset = frontWall?.decorativeOffsetMm || 100;
        const roofWidth = (leftWall?.lengthMm || 3000) + 2 * decorativeOffset;

        return {
          lengthMm: roofLength,
          heightMm: roofWidth, // Using heightMm as width for consistency
          frontExtensionMm: frontExtension,
          backExtensionMm: backExtension,
          sideExtensionMm: decorativeOffset,
        };
      }),

      /**
       * Computed: Walls with updated base and roof dimensions
       */
      wallsWithBaseSync: computed(() => {
        const wallList = walls();
        const baseDimensions = computed(() => {
          const frontWall = wallList.find((w) => w.name === "Front");
          const leftWall = wallList.find((w) => w.name === "Left");
          return {
            lengthMm: frontWall?.lengthMm || 5000,
            heightMm: leftWall?.lengthMm || 3000,
          };
        })();

        const roofDimensions = computed(() => {
          const frontWall = wallList.find((w) => w.name === "Front");
          const leftWall = wallList.find((w) => w.name === "Left");
          const roofWall = wallList.find((w) => w.name === "Roof");

          const frontExtension = roofWall?.roofFrontExtensionMm || 100;
          const backExtension = roofWall?.roofBackExtensionMm || 100;

          const roofLength =
            (frontWall?.lengthMm || 5000) + frontExtension + backExtension;
          const decorativeOffset = frontWall?.decorativeOffsetMm || 100;
          const roofWidth = (leftWall?.lengthMm || 3000) + 2 * decorativeOffset;

          return {
            lengthMm: roofLength,
            heightMm: roofWidth,
          };
        })();

        return wallList.map((wall) => {
          if (wall.id === "base") {
            return {
              ...wall,
              lengthMm: baseDimensions.lengthMm,
              heightMm: baseDimensions.heightMm,
            };
          } else if (wall.id === "roof") {
            return {
              ...wall,
              lengthMm: roofDimensions.lengthMm,
              heightMm: roofDimensions.heightMm,
            };
          }
          return wall;
        });
      }),
      /**
       * Computed: Stud layout for selected wall
       * Calculates standard, decorative, and resolved stud positions
       * Handles door openings by excluding studs in the opening area
       */
      studLayoutForWall: computed(() => (wallId: string) => {
        const wallList = walls();
        const wall = wallList.find((w) => w.id === wallId);
        if (!wall) return null;

        // Handle door opening (front wall only) - exclude studs in the opening area
        if (wall.hasDoorOpening && wall.name === "Front") {
          // Calculate door opening boundaries
          const pillarWidthMm = wall.pillarWidthMm || 45; // default pillar width
          const leftWallWidthMm = wall.leftWallWidthMm || 1500; // default left wall width
          const doorSpaceWidthMm = wall.doorSpaceWidthMm || 900; // default door space width

          // Calculate section boundaries
          const leftWallEnd = leftWallWidthMm;
          const doorSpaceStart = leftWallEnd + pillarWidthMm;
          const doorSpaceEnd = doorSpaceStart + doorSpaceWidthMm;
          const rightWallStart = doorSpaceEnd + pillarWidthMm;

          // Get the full wall layout first
          const fullLayout = structuralService.generateStudLayout(wall);

          // Filter out studs that would be in the door opening area
          // Keep studs that are outside the door opening zone
          const filteredStudPositions =
            fullLayout.resolvedStudPositionsMm.filter((position) => {
              // Keep studs that are completely before the door opening or after it
              const studWidthMm = wall.studWidthMm || 45;
              const studStart = position - studWidthMm / 2;
              const studEnd = position + studWidthMm / 2;

              // Keep if stud is completely outside the door opening area
              return studEnd <= doorSpaceStart || studStart >= rightWallStart;
            });

          // Calculate how many standard and decorative studs remain
          const standardStudsRemaining =
            fullLayout.standardStudPositionsMm.filter((position) => {
              const studWidthMm = wall.studWidthMm || 45;
              const studStart = position - studWidthMm / 2;
              const studEnd = position + studWidthMm / 2;
              return studEnd <= doorSpaceStart || studStart >= rightWallStart;
            });

          const decorativeStudsRemaining =
            fullLayout.decorativeStudPositionsMm.filter((position) => {
              const studWidthMm = wall.studWidthMm || 45;
              const studStart = position - studWidthMm / 2;
              const studEnd = position + studWidthMm / 2;
              return studEnd <= doorSpaceStart || studStart >= rightWallStart;
            });

          return {
            ...fullLayout,
            standardStudPositionsMm: standardStudsRemaining,
            decorativeStudPositionsMm: decorativeStudsRemaining,
            resolvedStudPositionsMm: filteredStudPositions,
          };
        }

        // Use the structural calculation service for consistent stud placement
        return structuralService.generateStudLayout(wall);
      }),

      /**
       * Computed: Total member count across all walls
       */
      totalMemberCount: computed(() => {
        const wallList = walls();
        return wallList.reduce((sum, wall) => sum + wall.members.length, 0);
      }),

      /**
       * Computed: All members across all walls
       */
      allMembers: computed(() => {
        const wallList = walls();
        return wallList.flatMap((wall) => wall.members);
      }),

      /**
       * Computed: Cut requirements for all members
       */
      cutRequirements: computed(() => {
        const wallList = walls();
        const members = wallList.flatMap((wall) => wall.members);
        return optimizationService.generateCutRequirements(members);
      }),

      /**
       * Computed: Optimized cut plans
       */
      cutList: computed(() => {
        const wallList = walls();
        const members = wallList.flatMap((wall) => wall.members);
        const requirements =
          optimizationService.generateCutRequirements(members);
        const library = materialLibrary();
        return optimizationService.optimizeCutPlans(requirements, library);
      }),

      /**
       * Computed: Buy list with timber and sheet materials
       */
      buyList: computed(() => {
        const wallList = walls();
        const members = wallList.flatMap((wall) => wall.members);
        const requirements =
          optimizationService.generateCutRequirements(members);
        const library = materialLibrary();
        const cutPlans = optimizationService.optimizeCutPlans(
          requirements,
          library,
        );
        return optimizationService.generateBuyList(cutPlans, library, wallList);
      }),

      /**
       * Computed: Hardware requirements list
       */
      hardwareList: computed(() => {
        const wallList = walls();
        const members = wallList.flatMap((wall) => wall.members);
        const rules = hardwareRules();
        return optimizationService.calculateHardware(members, rules);
      }),

      /**
       * Computed: Total waste across all cut plans
       */
      totalWasteMm: computed(() => {
        const wallList = walls();
        const members = wallList.flatMap((wall) => wall.members);
        const requirements =
          optimizationService.generateCutRequirements(members);
        const library = materialLibrary();
        const cutPlans = optimizationService.optimizeCutPlans(
          requirements,
          library,
        );
        return cutPlans.reduce((sum, plan) => sum + plan.wasteMm, 0);
      }),
    };
  }),
);

/**
 * Update build envelope in store
 */
export function updateBuildEnvelope(store: any, envelope: BuildEnvelope): void {
  patchState(store, { buildEnvelope: envelope });
}

/**
 * Update walls in store
 */
export function updateWalls(store: any, walls: Wall[]): void {
  patchState(store, { walls });
}

/**
 * Update material library in store
 */
export function updateMaterialLibrary(
  store: any,
  library: MaterialLibrary,
): void {
  patchState(store, { materialLibrary: library });
}

/**
 * Update hardware rules in store
 */
export function updateHardwareRules(store: any, rules: HardwareRuleSet): void {
  patchState(store, { hardwareRules: rules });
}
