import DoppelgangerImg from '../assets/doppelganger.png';
import WerewolfImg from '../assets/werewolf.png';
import AlphaWolfImg from '../assets/alpha_wolf.png';
import MysticWolfImg from '../assets/mystic_wolf.png';
import DreamWolfImg from '../assets/dream_wolf.png';
import MinionImg from '../assets/minion.png';
import TannerImg from '../assets/tanner.png';
import MasonImg from '../assets/mason.png';
import SeerImg from '../assets/seer.png';
import HunterImg from '../assets/hunter.png';
import RobberImg from '../assets/robber.png';
import TroublemakerImg from '../assets/troublemaker.png';
import DrunkImg from '../assets/drunk.png';
import InsomniacImg from '../assets/insomniac.png';
import VillagerImg from '../assets/villager.png';
import VoodooLouImg from '../assets/witch.png';

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
    'Villager',
] as const;

// Create a type from the RoleArray
export type Role = typeof RoleArray[number];

const roleImages: Record<Role, string> = {
    Doppelganger: DoppelgangerImg,
    Werewolf: WerewolfImg,
    Alpha_Wolf: AlphaWolfImg,
    Mystic_Wolf: MysticWolfImg,
    Dream_Wolf: DreamWolfImg,
    Minion: MinionImg,
    Tanner: TannerImg,
    Mason: MasonImg,
    Seer: SeerImg,
    Hunter: HunterImg,
    Robber: RobberImg,
    Voodoo_Lou: VoodooLouImg,
    Troublemaker: TroublemakerImg,
    Drunk: DrunkImg,
    Insomniac: InsomniacImg,
    Villager: VillagerImg,
};

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