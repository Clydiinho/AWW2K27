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
  story: {
    chapters: StoryChapterCopy[];
    finale: { cta: string; ctaAria: string };
  };
}

export interface StoryCtaCopy {
  label: string; // includes the trailing " →"; CtaButton renders the arrow itself
  href: string;
}

export interface StoryRoomCopy {
  label: string;
  text: string;
}

export interface StoryChapterCopy {
  id: string;
  eyebrow: string;
  headline: string;
  subline?: string;
  lead?: string;
  body?: string[];
  triplet?: string;
  rooms?: StoryRoomCopy[];
  closing: string;
  cta?: StoryCtaCopy;
  draft?: boolean;
}

export const storyChapters: StoryChapterCopy[] = [
  {
    id: "02",
    eyebrow: "02 — INSIDE THE WATCH",
    headline: "The Art. The Science. The Soul of Time.",
    body: [
      "A watch is more than an instrument that measures time.",
      "Behind its dial lies a remarkable world of mechanical ingenuity, artistic expression and human craftsmanship.",
      "From the rhythm of the balance wheel to the precision of the escapement, every component serves a purpose. Together, they transform engineering into something extraordinary.",
      "We invite you to look beyond the surface.",
    ],
    closing: "Discover what makes time worth keeping.",
    cta: { label: "EXPLORE THE MOVEMENT →", href: "#chapter-03" },
  },
  {
    id: "03",
    eyebrow: "03 — THE EVENT",
    headline: "A New Stage for African Horology",
    subline: "Cape Town · 2027",
    body: [
      "Africa Watch Week is conceived as a new cultural meeting point for the world of horology on the African continent.",
      "An intimate, carefully curated gathering bringing together the artistry of watchmaking, the perspectives of collectors and the creative voices shaping contemporary African culture.",
      "Through exceptional timepieces, meaningful conversations and considered experiences, the inaugural edition seeks to create a space where craftsmanship is celebrated, ideas are exchanged and lasting relationships begin.",
      "More than an occasion, Africa Watch Week represents the beginning of a long-term ambition: to establish Africa as an increasingly significant participant in the global horological conversation.",
    ],
    triplet: "An exhibition. A conversation. A gathering.",
    closing: "A new chapter begins in Cape Town, 2027.",
    cta: { label: "DISCOVER THE WORLD →", href: "#chapter-04" },
  },
  {
    id: "04",
    eyebrow: "04 — THE WORLD",
    headline: "A World Connected by Time.",
    lead: "Horology knows no borders.",
    body: [
      "Across generations and continents, the pursuit of precision has given rise to exceptional craftsmanship, technical ingenuity and enduring forms of artistic expression.",
      "From the storied ateliers of Europe and Japan to the independent makers redefining convention, the world of horology continues to evolve — shaped by heritage, imagination and an uncompromising devotion to detail.",
      "Africa brings its own perspective to this global conversation: a distinctive creative energy, a growing culture of collecting and an ambition to shape what comes next.",
      "Africa Watch Week envisions a meeting point between these worlds — where craftsmanship meets culture, established traditions encounter emerging voices, and a shared fascination with time opens the door to new possibilities.",
    ],
    triplet: "One world. Different perspectives. A shared fascination with time.",
    closing: "The world of horology is evolving. Africa has a place in its future.",
    cta: { label: "EXPLORE THE EXPERIENCE →", href: "#chapter-05" },
  },
  {
    // DRAFT COPY — the client has not supplied Chapter 05 copy; built only
    // from the client's own phrases. Show the DRAFT tag only with ?review=1.
    id: "05",
    eyebrow: "05 — THE EXPERIENCE",
    headline: "An exhibition. A conversation. A gathering.",
    rooms: [
      { label: "01 / DISCOVER", text: "Exceptional timepieces and the craftsmanship behind them." },
      { label: "02 / EXCHANGE", text: "Meaningful conversations between collectors, makers and the creative voices shaping contemporary African culture." },
      { label: "03 / CONNECT", text: "Where lasting relationships begin." },
    ],
    closing: "A new chapter begins in Cape Town, 2027.",
    draft: true,
  },
];

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
  story: {
    chapters: storyChapters,
    finale: {
      cta: "PLACEHOLDER — Register your interest", // PLACEHOLDER — awaiting client copy
      ctaAria: "Register your interest", // PLACEHOLDER
    },
  },
};
