export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return Response.json({
    success: true,
    mentor: { id: body.mentorId ?? "pm1", status: body.action ?? "approved" },
  });
}
