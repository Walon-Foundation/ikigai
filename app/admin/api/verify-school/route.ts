export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return Response.json({
    success: true,
    school: { id: body.schoolId ?? "ps1", status: body.action ?? "approved" },
  });
}
