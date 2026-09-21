import CinematicHero from "@/components/home/CinematicHero";
import ImpactCounters from "@/components/home/ImpactCounters";
import IndiaMapSection from "@/components/home/IndiaMapSection";
import MissionPillars from "@/components/home/MissionPillars";
import ActivityFeed from "@/components/home/ActivityFeed";
import ImpactStories from "@/components/home/ImpactStories";
import FocusAreas from "@/components/home/FocusAreas";
import YouthWomen from "@/components/home/YouthWomen";
import Timeline from "@/components/home/Timeline";
import MediaWall from "@/components/home/MediaWall";
import GlobalSection from "@/components/home/GlobalSection";
import JoinMovement from "@/components/home/JoinMovement";
import Contribution from "@/components/home/Contribution";
import { getHomepageContent } from "@/lib/home-query";

export const revalidate = 300;

export default async function HomePage() {
  const data = await getHomepageContent();

  return (
    <>
      <CinematicHero sliderImages={data.sliderImages} />
      <ImpactCounters />
      <IndiaMapSection
        branches={data.branches}
        events={data.events}
        photos={data.photos}
      />
      <MissionPillars />
      <ActivityFeed events={data.events} live={data.usingLiveEvents} />
      <ImpactStories />
      <FocusAreas />
      <YouthWomen />
      <Timeline />
      <MediaWall photos={data.photos} />
      <GlobalSection />
      <JoinMovement />
      <Contribution />
    </>
  );
}
