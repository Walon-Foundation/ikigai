export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const audienceCounts: Record<string, number> = {
    all: 523,
    mentees: 398,
    mentors: 87,
    club_leads: 38,
  };
  const sent = audienceCounts[body.audience ?? "all"] ?? 523;
  return Response.json({ success: true, sent });
}
