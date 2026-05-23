import Dexie, { type Table } from 'dexie';

export interface CrewSession {
  id?: number;
  crewId: string;       // Distinct parameter field
  crewName: string;
  signOnTime: string;
  signOffTime?: string;
  locoNumber: string;
  trainNumber: string;
  location: string;
  status: 'Active' | 'Completed';
}

export class CrewMonitorDB extends Dexie {
  sessions!: Table<CrewSession>;

  constructor() {
    super('CrewMonitorDB');
    this.version(2).stores({
      // Added crewId to indexed stores
      sessions: '++id, crewId, crewName, signOnTime, locoNumber, trainNumber, status'
    });
  }
}

export const db = new CrewMonitorDB();