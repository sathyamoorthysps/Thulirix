import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectResponse } from '@/types';

interface ProjectState {
  activeProject: ProjectResponse | null;
  setActiveProject: (project: ProjectResponse) => void;
  clearActiveProject: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      activeProject: null,
      setActiveProject: (project) => set({ activeProject: project }),
      clearActiveProject: () => set({ activeProject: null }),
    }),
    { name: 'thulirix-project' },
  ),
);
