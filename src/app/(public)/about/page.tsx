import type { Metadata } from "next";
import AboutHero from "@/components/about/AboutHero";
import WhoWeAre from "@/components/about/WhoWeAre";
import Philosophy from "@/components/about/Philosophy";
import VisionScroll from "@/components/about/VisionScroll";
import AboutImpact from "@/components/about/AboutImpact";
import MissionCarousel from "@/components/about/MissionCarousel";
import WorkMosaic from "@/components/about/WorkMosaic";
import FocusAreas from "@/components/home/FocusAreas";
import OrgTree from "@/components/about/OrgTree";
import Leadership from "@/components/about/Leadership";
import CitizenRole from "@/components/about/CitizenRole";
import Journey from "@/components/about/Journey";
import WorkGallery from "@/components/about/WorkGallery";
import ResolveJoin from "@/components/about/ResolveJoin";
import { getHomepageContent } from "@/lib/home-query";

export const metadata: Metadata = {
  title: "About | Bhartiya Namo Sangh",
  description:
    "Bhartiya Namo Sangh (BNMS) is a social organisation devoted to national interest and community service — its vision, mission, focus areas and organisational structure.",
};

export const revalidate = 300;

export default async function AboutPage() {
  const data = await getHomepageContent();

  return (
    <>
      <AboutHero />
      <WhoWeAre />
      <Philosophy />
      <VisionScroll />
      <AboutImpact />
      <MissionCarousel />
      <WorkMosaic />
      <div id="focus">
        <FocusAreas />
      </div>
      <OrgTree />
      <Leadership />
      <CitizenRole />
      <Journey />
      <WorkGallery photos={data.photos} />
      <ResolveJoin />
    </>
  );
}
