export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return Response.json({
    success: true,
    reportId: body.reportId ?? "r1",
    resolvedAt: new Date().toISOString(),
  });
}
