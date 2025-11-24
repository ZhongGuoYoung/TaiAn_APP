export interface Task {
  id: string;
  name: string;
  rate: number;
  doLaw: boolean;
  time: string;
  type: string;
  isVeto?: boolean;
  allRate?: number;
  [key: string]: any;
}

export interface TaskList {
  title: string;
  tasks: Task[];
}
