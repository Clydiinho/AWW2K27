// Chapter 01 editorial copy. Client copy is reproduced verbatim; do not edit
// strings here without client sign-off. Components consume this module so no
// visible copy is hard-coded in JSX.
export interface ChapterCopy {
  eyebrow: string;
  headline: string;
  body: string;
  tagline: string;
  credit: string;
}

export interface SiteContent {
  headerLeft: string;
  headerRight: string;
  invitation: ChapterCopy;
  // UI copy supplied for the scroll badge (rule exception, not client verbatim copy).
  scrollBadge: { label: string; ariaLabel: string };
}

export const site: SiteContent = {
  headerLeft: "AFRICA WATCH WEEK",
  headerRight: "CAPE TOWN · 2027",
  scrollBadge: { label: "KEEP SCROLLING", ariaLabel: "Scroll down" },
  invitation: {
    eyebrow: "01 — THE INVITATION",
    headline: "WELCOME TO AFRICA WATCH WEEK",
    body: "An invitation to a select circle of organisations to help establish a new cultural platform celebrating horology, craftsmanship and collecting on the African continent.",
    tagline: "A new chapter in African horology begins.",
    credit: "AN EXPERIENCE BY THE INDEX AFRIKA",
  },
};
