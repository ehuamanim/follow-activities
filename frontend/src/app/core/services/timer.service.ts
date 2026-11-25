import { Injectable } from '@angular/core';

const KEY = 'activity_timer';

export interface TimerState {
  projectId: number | null;
  startedAt: string;
  note: string;
}

@Injectable({ providedIn: 'root' })
export class TimerService {
  get(): TimerState | null {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as TimerState;
    } catch {
      return null;
    }
  }

  start(projectId: number | null, note = ''): TimerState {
    const state: TimerState = {
      projectId,
      startedAt: new Date().toISOString(),
      note
    };
    localStorage.setItem(KEY, JSON.stringify(state));
    return state;
  }

  stop(): { hours: number; state: TimerState } | null {
    const state = this.get();
    if (!state) return null;
    const ms = Date.now() - new Date(state.startedAt).getTime();
    const hours = Math.max(0.5, Math.round((ms / 3600000) * 2) / 2);
    localStorage.removeItem(KEY);
    return { hours, state };
  }

  isRunning(): boolean {
    return !!this.get();
  }
}
