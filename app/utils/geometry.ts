import { SkillNode, SkillGroup, Constants } from '../types';

export const ORBIT_RADIUS_OVERRIDES: Record<number, number> = {
    // If specific orbits need override, usually the data.json provides correct radii in constants.orbitRadii
};

export function getOrbitAngle(orbitIndex: number, skillsInOrbit: number): number {
    return (2 * Math.PI * orbitIndex) / skillsInOrbit - Math.PI / 2;
}

export function getPosition(
    node: SkillNode,
    group: SkillGroup,
    constants: Constants
): { x: number; y: number } {
    const orbit = node.orbit || 0;
    const orbitIndex = node.orbitIndex || 0;

    const skillsInOrbit = constants.skillsPerOrbit[orbit];
    const radius = constants.orbitRadii[orbit];

    if (skillsInOrbit === 0) {
        return { x: group.x, y: group.y };
    }

    const angle = getOrbitAngle(orbitIndex, skillsInOrbit);
    
    // The y axis might be inverted in some coordinate systems, but usually for web canvas/svg:
    // x = r * cos(theta)
    // y = r * sin(theta)
    // The group.x and group.y are the center.
    
    return {
        x: group.x + radius * Math.cos(angle),
        y: group.y + radius * Math.sin(angle),
    };
}
