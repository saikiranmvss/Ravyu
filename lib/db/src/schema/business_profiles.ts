import { mysqlTable, int, text, boolean, timestamp, varchar } from "drizzle-orm/mysql-core";
import { usersTable } from "./users";

export const businessProfilesTable = mysqlTable("business_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  logoUrl: text("logo_url"),
  coverImageUrl: text("cover_image_url"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  googleMapsUrl: text("google_maps_url"),
  googlePlaceId: text("google_place_id"),
  primaryColor: text("primary_color").default("#4F46E5"),
  secondaryColor: text("secondary_color").default("#F59E0B"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  twitterUrl: text("twitter_url"),
  linkedinUrl: text("linkedin_url"),
  businessHours: text("business_hours"),
  pageViews: int("page_views").notNull().default(0),
  reviewClicks: int("review_clicks").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type BusinessProfile = typeof businessProfilesTable.$inferSelect;
