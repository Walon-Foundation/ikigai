export async function GET() {
  return Response.json({
    matches: [
      {
        id: "m1",
        displayName: "Dr. Ibrahim Sesay",
        matchScore: 92,
        interestTags: ["technology", "engineering"],
        bio: "Software engineer at a Freetown tech startup. 8 years experience.",
      },
      {
        id: "m2",
        displayName: "Fatmata Bangura",
        matchScore: 87,
        interestTags: ["entrepreneurship", "finance"],
        bio: "Founded two SMEs in Freetown. Passionate about women in business.",
      },
      {
        id: "m3",
        displayName: "Mohamed Jalloh",
        matchScore: 78,
        interestTags: ["environmental_science", "agriculture"],
        bio: "Environmental researcher at Njala University.",
      },
    ],
  });
}
