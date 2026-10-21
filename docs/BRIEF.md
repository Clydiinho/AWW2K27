# BRIEF — open questions

Client copy status and open items, tracked so nothing lands as "final" without
a client answer.

## Open questions

1. **Chapter 05 copy** — the client has not supplied real copy for card 05
   ("05 — THE EXPERIENCE"). The current text is DRAFT, built only from the
   client's own phrases (rooms "01 / DISCOVER", "02 / EXCHANGE", "03 / CONNECT"
   and the closing line). Marked `draft: true` in `src/content/site.ts`; the
   "DRAFT COPY" tag renders only with the review-only `?review=1` flag.
2. **Final call to action** — the client has not said what the final action is.
   Card 05 therefore has no button. The finale's "Register your interest"
   button is also still PLACEHOLDER copy.
3. **Closing line duplication** — "A new chapter begins in Cape Town, 2027."
   currently appears on both card 03 (closing) and card 05 (closing). May the
   closing line appear twice, or should card 03 get a distinct closing?

## Short copy (awaiting client approval)

4. **Short chapter copy** — the cards currently render `copy.short`
   (`COPY_VERSION = "short"` in `src/content/site.ts`): one tightened paragraph
   per chapter card plus short "NEXT: …" links, as requested to keep each card
   to one screen. The client's full approved copy is kept untouched as
   `copy.full`; switching `COPY_VERSION` back to `"full"` restores the original
   text AND the original big CTA buttons. The short strings were built from the
   client's own phrases but are NOT client-approved yet (see item 1: card 05
   stays DRAFT in both versions).
   The short version also retires the "closing line appears twice" question for
   card 03 (its short copy has no closing line; card 05 keeps it).
