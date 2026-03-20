export const EMBER_TYPES = [
  'hope',
  'ghost',
  'dreams',
  'vents',
  'wisps',
  'echoes',
  'shadows',
  'sparks',
  'hotdog',
  'hearts',
] as const;

export type EmberType = typeof EMBER_TYPES[number];

export const EMBER_TYPE_INFO: Record<EmberType, { label: string; emoji: string }> = {
  hope: { label: 'Hope', emoji: '✨' },
  ghost: { label: 'Ghost', emoji: '👻' },
  dreams: { label: 'Dreams', emoji: '💭' },
  vents: { label: 'Vents', emoji: '🔥' },
  wisps: { label: 'Wisps', emoji: '💨' },
  echoes: { label: 'Echoes', emoji: '🔊' },
  shadows: { label: 'Shadows', emoji: '🌑' },
  sparks: { label: 'Sparks', emoji: '⚡' },
  hotdog: { label: 'Hotdog', emoji: '🌭' },
  hearts: { label: 'Hearts', emoji: '❤️' },
};
