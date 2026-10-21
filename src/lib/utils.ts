// Minimal zero-dependency cls(): joins truthy tokens (same contract as the
// shadcn cn helper minus tailwind-merge, which this project does not use).
export type ClassValue = string | number | null | undefined | false;

export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(" ");
}
