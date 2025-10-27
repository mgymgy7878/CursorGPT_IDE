import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UISettingsVersion = 1;

export type UISettingsV1 = {
  version: 1;
  theme: 'dark' | 'light' | 'system';
  rightDockOpen: boolean;
  workbenchOpen: boolean;
  defaultRiskPct: number;
  refreshIntervalsMs: {
    manager: number;
    portfolio: number;
    sseReconnect: number;
  };
  dockLayout?: unknown; // rc-dock saved json; keep any
};

type UISettingsStore = UISettingsV1 & {
  // Actions
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  toggleRightDock: () => void;
  toggleWorkbench: () => void;
  setDefaultRisk: (pct: number) => void;
  setRefresh: (key: keyof UISettingsV1['refreshIntervalsMs'], value: number) => void;
  saveDockLayout: (json: unknown) => void;
  resetAll: () => void;
  importFromJson: (json: UISettingsV1) => void;
  exportAsJson: () => UISettingsV1;
};

const defaultSettings: UISettingsV1 = {
  version: 1,
  theme: 'dark',
  rightDockOpen: true,
  workbenchOpen: true,
  defaultRiskPct: 0.5,
  refreshIntervalsMs: {
    manager: 1500,
    portfolio: 1500,
    sseReconnect: 1500,
  },
};

export const useUISettings = create<UISettingsStore>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      setTheme: (theme) => set({ theme }),
      
      toggleRightDock: () => set((state) => ({ 
        rightDockOpen: !state.rightDockOpen 
      })),
      
      toggleWorkbench: () => set((state) => ({ 
        workbenchOpen: !state.workbenchOpen 
      })),
      
      setDefaultRisk: (pct) => set({ defaultRiskPct: pct }),
      
      setRefresh: (key, value) => set((state) => ({
        refreshIntervalsMs: {
          ...state.refreshIntervalsMs,
          [key]: value,
        },
      })),
      
      saveDockLayout: (json) => set({ dockLayout: json }),
      
      resetAll: () => set(defaultSettings),
      
      importFromJson: (json) => {
        if (json.version === 1) {
          set(json);
        }
      },
      
      exportAsJson: () => {
        const state = get();
        return {
          version: state.version,
          theme: state.theme,
          rightDockOpen: state.rightDockOpen,
          workbenchOpen: state.workbenchOpen,
          defaultRiskPct: state.defaultRiskPct,
          refreshIntervalsMs: state.refreshIntervalsMs,
          dockLayout: state.dockLayout,
        };
      },
    }),
    {
      name: 'spark.ui.v1',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration from older version
          return {
            ...defaultSettings,
            ...persistedState,
            version: 1,
          };
        }
        return persistedState as UISettingsV1;
      },
    }
  )
); 