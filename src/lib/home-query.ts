import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { readSlides } from "@/lib/slider-data";
import {
  FALLBACK_ACTIVITIES,
  FALLBACK_BRANCHES,
  type HomeBranch,
  type HomeEvent,
  type HomePhoto,
} from "@/lib/home-content";

export type HomepageContent = {
  branches: HomeBranch[];
  events: HomeEvent[];
  photos: HomePhoto[];
  sliderImages: string[];
  usingLiveBranches: boolean;
  usingLiveEvents: boolean;
};

function folderOf(
  folder: { slug: string; name: string }[] | { slug: string; name: string } | null
) {
  if (!folder) return null;
  return Array.isArray(folder) ? (folder[0] ?? null) : folder;
}

export async function getHomepageContent(): Promise<HomepageContent> {
  const supabase = createPublicClient();

  const [branchesRes, eventsRes, photosRes, slides] = await Promise.all([
    supabase
      .from("branches")
      .select("id, slug, name, city, state, member_count, manager_name, established_year, is_active")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("events")
      .select(
        "id, slug, title, category, date, location, target_participants, branch:branches(name, city, state)"
      )
      .eq("is_published", true)
      .eq("is_cancelled", false)
      .order("date", { ascending: false })
      .limit(12),
    supabase
      .from("gallery_images")
      .select(
        "id, image_url, caption, folder:gallery_folders!gallery_images_folder_id_fkey(slug, name)"
      )
      .order("created_at", { ascending: false })
      .limit(24),
    readSlides().catch(() => []),
  ]);

  const liveBranches: HomeBranch[] = (branchesRes.data || []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    state: row.state,
    memberCount: row.member_count ?? 0,
    managerName: row.manager_name,
    establishedYear: row.established_year,
  }));

  type EventRow = {
    id: string;
    slug: string;
    title: string;
    category: string;
    date: string;
    location: string;
    target_participants: number | null;
    branch:
      | { name: string; city: string; state: string }[]
      | { name: string; city: string; state: string }
      | null;
  };

  const liveEvents: HomeEvent[] = ((eventsRes.data || []) as EventRow[]).map((row) => {
    const branch = Array.isArray(row.branch) ? row.branch[0] : row.branch;
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      category: row.category,
      date: row.date,
      location: row.location,
      city: branch?.city || row.location.split(",")[0]?.trim() || "",
      state: branch?.state || "",
      participants: row.target_participants || 0,
    };
  });

  type PhotoRow = {
    id: string;
    image_url: string;
    caption: string | null;
    folder: { slug: string; name: string }[] | { slug: string; name: string } | null;
  };

  const photos: HomePhoto[] = ((photosRes.data || []) as PhotoRow[]).map((row) => {
    const folder = folderOf(row.folder);
    return {
      id: row.id,
      imageUrl: row.image_url,
      caption: row.caption,
      folderSlug: folder?.slug ?? null,
      folderName: folder?.name ?? null,
    };
  });

  const sliderImages = (slides || [])
    .map((slide) => slide.imageUrl)
    .filter((url): url is string => Boolean(url));

  return {
    branches: liveBranches.length > 0 ? liveBranches : FALLBACK_BRANCHES,
    events: liveEvents.length > 0 ? liveEvents : FALLBACK_ACTIVITIES,
    photos,
    sliderImages,
    usingLiveBranches: liveBranches.length > 0,
    usingLiveEvents: liveEvents.length > 0,
  };
}
