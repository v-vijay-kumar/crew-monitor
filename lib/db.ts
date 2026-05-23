import Dexie, { type Table } from 'dexie';

export interface CrewSession {
  id?: number;
  crewId: string;
  crewName: string;
  signOnTime: string;
  signOffTime?: string;
  locoNumber: string;
  trainNumber: string;
  location: string;
  status: 'Active' | 'Completed';
  // New Operational Parameters for Control Desks
  dyChcInformed?: boolean;
  plannedReliefStation?: string;
  assignedReliefCrewId?: string;
}

export class CrewMonitorDB extends Dexie {
  sessions!: Table<CrewSession>;

  constructor() {
    super('CrewMonitorDB');
    this.version(3).stores({
      sessions: '++id, crewId, crewName, signOnTime, locoNumber, trainNumber, status'
    });
  }
}

export const db = new CrewMonitorDB();