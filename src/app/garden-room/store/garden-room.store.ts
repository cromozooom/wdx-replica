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
    concreteOffsetMm: 100,
    roofSystemMm: 200,
    floorSystemMm: 150,
    fallRatio: { rise: 1, run: 40 },
  },
  walls: [
    {
      id: "front",
      name: "Front",
      lengthMm: 3000,
      heightMm: 0,
      isMasterHeight: true,
      decorativeOffsetMm: 0,
      studGapMm: 600,
      plateThicknessTopMm: 45,
      plateThicknessBottomMm: 45,
      members: [],
    },
    {
      id: "back",
      name: "Back",
      lengthMm: 3000,
      heightMm: 0,
      isMasterHeight: false,
      decorativeOffsetMm: 0,
      studGapMm: 600,
      plateThicknessTopMm: 45,
      plateThicknessBottomMm: 45,
      members: [],
    },
    {
      id: "left",
      name: "Left",
      lengthMm: 4000,
      heightMm: 0,
      isMasterHeight: false,
      decorativeOffsetMm: 0,
      studGapMm: 600,
      plateThicknessTopMm: 45,
      plateThicknessBottomMm: 45,
      members: [],
    },
    {
      id: "right",
      name: "Right",
      lengthMm: 4000,
      heightMm: 0,
      isMasterHeight: false,
      decorativeOffsetMm: 0,
      studGapMm: 600,
      plateThicknessTopMm: 45,
      plateThicknessBottomMm: 45,
      members: [],
    },
  ],
  materialLibrary: {
    stockLengthsMm: [2400, 3600, 4800],
    sheetMaterials: [],
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
       * Computed: Stud layout for selected wall
       * Calculates standard, decorative, and resolved stud positions
       */
      studLayoutForWall: computed(() => (wallId: string) => {
        const wallList = walls();
        const wall = wallList.find((w) => w.id === wallId);
        if (!wall) return null;

        // Calculate standard stud positions
        const standardPositions: number[] = [];
        standardPositions.push(0);
        let position = wall.studGapMm;
        while (position < wall.lengthMm) {
          standardPositions.push(position);
          position += wall.studGapMm;
        }
        if (standardPositions[standardPositions.length - 1] !== wall.lengthMm) {
          standardPositions.push(wall.lengthMm);
        }

        // Calculate decorative stud positions
        const decorativePositions: number[] = [];
        if (wall.decorativeOffsetMm > 0) {
          if (wall.decorativeOffsetMm < wall.lengthMm / 2) {
            decorativePositions.push(wall.decorativeOffsetMm);
          }
          if (wall.lengthMm - wall.decorativeOffsetMm > wall.lengthMm / 2) {
            decorativePositions.push(wall.lengthMm - wall.decorativeOffsetMm);
          }
        }

        // Resolve clashes
        const resolved: number[] = [...decorativePositions];
        const clashThreshold = 50;
        for (const stdPos of standardPositions) {
          const hasClash = decorativePositions.some(
            (decPos) => Math.abs(decPos - stdPos) <= clashThreshold,
          );
          if (!hasClash) {
            resolved.push(stdPos);
          }
        }

        return {
          standardStudPositionsMm: standardPositions,
          decorativeStudPositionsMm: decorativePositions,
          resolvedStudPositionsMm: resolved.sort((a, b) => a - b),
          clashThresholdMm: clashThreshold,
        };
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
        return optimizationService.generateBuyList(cutPlans, library);
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
