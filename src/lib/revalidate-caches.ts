import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";

/** Invalidate list caches after mutations (server actions only). */
export function revalidateClientsListCache() {
  updateTag(CACHE_TAGS.clientsList);
}

export function revalidateDealsCaches() {
  updateTag(CACHE_TAGS.dealsIndex);
  updateTag(CACHE_TAGS.dealBoardTabs);
}

export function revalidateMessagesCaches() {
  updateTag(CACHE_TAGS.messagesSidebar);
  updateTag(CACHE_TAGS.clientChannels);
}

export function revalidateDashboardCaches() {
  updateTag(CACHE_TAGS.dashboardOrgStats);
  updateTag(CACHE_TAGS.adminDashboardBundle);
}
