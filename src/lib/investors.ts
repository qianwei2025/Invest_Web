export const investors = {
  sherman: {
    slug: 'sherman',
    name: 'Sherman Shen',
    shortName: 'Sherman',
    role: 'Investor 1',
    tagline: 'Curious about how companies actually work.',
    bio: 'Sherman is learning to look past the product he likes and ask: how does this business make money, and what could go wrong? He writes in his own words, even when the idea is still forming.',
    started: 2026,
    interests: ['technology', 'how things are made', 'asking why'],
    portrait: 'sherman-portrait.jpg',
    accent: 'moss',
  },
  roy: {
    slug: 'roy',
    name: 'Roy Shen',
    shortName: 'Roy',
    role: 'Investor 2',
    tagline: 'Starts with games, stories, and things people love.',
    bio: 'Roy pays attention to what kids and families actually use. He is practicing the difference between “I like this” and “this might be a good business.” His journal is allowed to change its mind.',
    started: 2026,
    interests: ['games', 'stories', 'what people choose'],
    portrait: 'roy-portrait.jpg',
    accent: 'copper',
  },
} as const;

export type InvestorSlug = keyof typeof investors;
export type Investor = (typeof investors)[InvestorSlug];

export function isInvestorSlug(value: string): value is InvestorSlug {
  return value in investors;
}

export function allInvestors() {
  return Object.values(investors);
}

export function investorStaticPaths() {
  return (Object.keys(investors) as InvestorSlug[]).map((investor) => ({
    params: { investor },
  }));
}
