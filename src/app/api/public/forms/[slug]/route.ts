import { NextResponse, type NextRequest } from "next/server";
import { getPublishedForm } from "@/lib/public-form";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const form = await getPublishedForm(slug);

    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404, headers }
      );
    }

    return NextResponse.json(
      {
        title: form.config.title,
        primaryColor: form.config.primaryColor,
      },
      { headers }
    );
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers }
    );
  }
}