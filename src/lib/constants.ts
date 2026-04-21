export const CATEGORIES = [
  "Electronics",
  "Documents & IDs",
  "Keys",
  "Bags & Backpacks",
  "Clothing",
  "Books & Notes",
  "Jewelry & Watches",
  "Wallets & Cards",
  "Water Bottles",
  "Other",
] as const;

export const LOCATIONS = [
  "Main Building (Stokłosy 3)",
  "Library",
  "Cafeteria",
  "Lecture Hall A",
  "Lecture Hall B",
  "Computer Lab",
  "Sports Hall",
  "Parking Lot",
  "Garden / Outdoor",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];
export type Location = (typeof LOCATIONS)[number];

export const ALLOWED_EMAIL_DOMAINS = [
  "stu.vistula.edu.pl", // students
  "vistula.edu.pl", // staff
] as const;

export const ALLOWED_EMAIL_DOMAINS_LABEL = "@stu.vistula.edu.pl or @vistula.edu.pl";

export function isUniversityEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.some((d) => normalized.endsWith(`@${d}`));
}
