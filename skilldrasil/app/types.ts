export interface SkillNode {
  skill?: number;
  name?: string;
  icon?: string;
  isKeystone?: boolean;
  isNotable?: boolean;
  isMastery?: boolean;
  inactiveIcon?: string;
  activeIcon?: string;
  activeEffectImage?: string;
  group?: number;
  orbit?: number;
  orbitIndex?: number;
  out?: string[];
  in?: string[];
  stats?: string[];
  ascendancyName?: string;
  reminderText?: string[];
}

export interface SkillGroup {
  x: number;
  y: number;
  orbits: number[];
  nodes: string[];
}

export interface Constants {
  classes: any;
  characterAttributes: any;
  PSSCentreInnerRadius: number;
  skillsPerOrbit: number[];
  orbitRadii: number[];
}

export interface SkillTreeData {
  nodes: Record<string, SkillNode>;
  groups: Record<string, SkillGroup>;
  constants: Constants;
  min_x: number;
  min_y: number;
  max_x: number;
  max_y: number;
  assets: Record<string, Record<string, string>>;
}
