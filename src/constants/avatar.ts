import { encryptPath } from '@/utils/encryption';

export const AVATAR_BORDERS_DATA = [
    { id: 'none', name: 'None', image: null, scale: 1 },
    { id: 'Border 1', name: 'Neon Splash Ring', image: '/images/avatar-border/avatar-4.png', scale: 1.5 },
    { id: 'Border 2', name: 'Candy Pop Celebration', image: '/images/avatar-border/avatar-1.png', scale: 1.5 },
    { id: 'Border 3', name: 'Dreamy Cloud Garden', image: '/images/avatar-border/avatar-5.png', scale: 1.5 },
    { id: 'Border 4', name: 'Royal Victory Crest', image: '/images/avatar-border/avatar-6.png', scale: 1.45 },
    { id: 'Border 5', name: 'Bunny Meadow Frame', image: '/images/avatar-border/avatar-8.png', scale: 1.5 },
    { id: 'Border 6', name: 'Kawaii Star Pop', image: '/images/avatar-border/avatar-10.png', scale: 1.25 },
    { id: 'Border 7', name: 'Crimson Flame Aura', image: '/images/avatar-border/avatar-11.png', scale: 1.25 },
    { id: 'Border 8', name: 'Rage Comic Burst', image: '/images/avatar-border/avatar-12.png', scale: 1.25 },
    { id: 'Border 9', name: 'Sweet Ribbon Charm', image: '/images/avatar-border/avatar-13.png', scale: 1.25 },
    { id: 'Border 10', name: 'Galaxy Mist Frame', image: '/images/avatar-border/avatar-14.png', scale: 1.25 },
    { id: 'Border 11', name: 'Midnight Star Dream', image: '/images/avatar-border/avatar-15.png', scale: 1.25 },
    { id: 'Border 12', name: 'Holographic Pulse Ring', image: '/images/avatar-border/avatar-16.png', scale: 1.25 },
    { id: 'Border 13', name: 'Angel Beats Halo', image: '/images/avatar-border/avatar-17.png', scale: 1.25 },
]

export const AVATAR_BORDERS = AVATAR_BORDERS_DATA.map(border => ({
    ...border,
    image: border.image ? encryptPath(border.image) : null
}));
