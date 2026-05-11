import {
  db,
  reviewInsightsTable,
  weeklyReportsTable,
  type ReviewInsight,
  type WeeklyReport,
} from "@workspace/db";
import { desc, eq } from "drizzle-orm";

function inspectErrorChain(error: unknown): unknown[] {
  const out: unknown[] = [error];
  if (error instanceof Error && error.cause !== undefined) out.push(error.cause);
  return out;
}

/** True when MySQL reports that a referenced table does not exist (pending migrations). */
export function isMissingTableError(error: unknown, tableSqlName: string): boolean {
  const hint = tableSqlName.replace(/`/g, "");
  for (const e of inspectErrorChain(error)) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "ER_NO_SUCH_TABLE") {
      const msg = e instanceof Error ? e.message : String(e);
      return msg.includes(hint);
    }
    const msg = e instanceof Error ? e.message : String(e);
    if (new RegExp(`['\`]${hint}['\`]`, "i").test(msg) && /doesn't exist|Unknown table/i.test(msg)) return true;
  }
  return false;
}

export async function selectReviewInsightsForBusiness(businessId: number): Promise<ReviewInsight[]> {
  try {
    return await db.select().from(reviewInsightsTable).where(eq(reviewInsightsTable.businessId, businessId));
  } catch (error) {
    if (isMissingTableError(error, "review_insights")) return [];
    throw error;
  }
}

export async function selectLatestWeeklyReportForBusiness(businessId: number): Promise<WeeklyReport | null> {
  try {
    const [row] = await db
      .select()
      .from(weeklyReportsTable)
      .where(eq(weeklyReportsTable.businessId, businessId))
      .orderBy(desc(weeklyReportsTable.createdAt))
      .limit(1);
    return row ?? null;
  } catch (error) {
    if (isMissingTableError(error, "weekly_reports")) return null;
    throw error;
  }
}
