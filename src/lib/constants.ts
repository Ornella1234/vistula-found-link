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

export const ALLOWED_EMAIL_DOMAIN = "vistula.edu.pl";

export function isUniversityEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}
