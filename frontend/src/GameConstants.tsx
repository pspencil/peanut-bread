export const RoleArray = [
    'Doppelganger',
    'Werewolf',
    'Alpha_Wolf',
    'Mystic_Wolf',
    'Dream_Wolf',
    'Minion',
    'Tanner',
    'Mason',
    'Seer',
    'Hunter',
    'Robber',
    'Voodoo_Lou',
    'Troublemaker',
    'Drunk',
    'Insomniac',
] as const;

// Create a type from the RoleArray
export type Role = typeof RoleArray[number];

export function roleName(role: Role): string {
    return role.replace("_", " ");
}

export function ofRustRole(role: string): Role {
    // Find the corresponding role in RoleArray by ignoring underscores
    const foundRole = RoleArray.find(r => r.replace(/_/g, "") === role);

    if (!foundRole) {
        throw new Error(`Invalid role: ${role}`);
    }

    return foundRole;
}

export function toRustRole(role: Role): string {
    return role.replace("_", "");
}