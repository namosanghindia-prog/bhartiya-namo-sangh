import { NextResponse } from "next/server";
import { readSlides, writeSlides, type Slide } from "@/lib/slider-data";

export async function GET() {
  const slides = await readSlides();
  return NextResponse.json({ slides });
}

export async function PUT(request: Request) {
  // NOTE: No auth check yet — once NextAuth is wired up, verify the
  // session role is ADMIN or SUPER_ADMIN before allowing this write.
  const body = await request.json();
  const slides = body?.slides as Slide[] | undefined;

  if (!Array.isArray(slides)) {
    return NextResponse.json(
      { error: "Expected { slides: Slide[] }" },
      { status: 400 }
    );
  }

  await writeSlides(slides);
  return NextResponse.json({ slides });
}
