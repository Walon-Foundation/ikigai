import { describe, expect, test } from "bun:test";
import { scoreClub, slugifyClubName } from "@/lib/clubs";
import type { SkillStage } from "@/lib/skill-stages";

describe("slugifyClubName", () => {
  test("makes a URL segment from an ordinary name", () => {
    expect(slugifyClubName("Coding Club")).toBe("coding-club");
    expect(slugifyClubName("Girls in STEM  ")).toBe("girls-in-stem");
  });

  test("strips accents rather than dropping the letters", () => {
    expect(slugifyClubName("Café Réunion!!")).toBe("cafe-reunion");
  });

  test("never returns an empty slug", () => {
    // A name of pure punctuation or non-Latin script would otherwise slugify to
    // "", and every such club would collide on the unique index.
    expect(slugifyClubName("???")).toBe("club");
    expect(slugifyClubName("   ")).toBe("club");
    expect(slugifyClubName("日本語")).toBe("club");
  });

  test("has no leading or trailing dashes, and is bounded", () => {
    expect(slugifyClubName("--hello--")).toBe("hello");
    const long = slugifyClubName("a".repeat(200));
    expect(long.length).toBeLessThanOrEqual(60);
    expect(long.startsWith("-")).toBe(false);
    expect(long.endsWith("-")).toBe(false);
  });
});

describe("scoreClub", () => {
  const at = (stage: SkillStage) => stage;

  test("a club matching every interest at the mentee's stage scores 100", () => {
    const { score, sharedTags } = scoreClub(["coding", "music"], at("build"), {
      interestTags: ["coding"],
      stage: "build",
    });
    expect(score).toBe(100);
    expect(sharedTags).toEqual(["coding"]);
  });

  test("matching is case- and whitespace-insensitive", () => {
    const { sharedTags } = scoreClub([" Coding "], at("discover"), {
      interestTags: ["CODING"],
      stage: null,
    });
    expect(sharedTags).toEqual(["coding"]);
  });

  test("a focused club is not penalised for the mentee's other interests", () => {
    // Scored against the CLUB's tags. A mentee with ten interests should see a
    // single-subject club they care about score as highly as a mentee with one.
    const focused = { interestTags: ["coding"], stage: at("build") };
    const few = scoreClub(["coding"], at("build"), focused).score;
    const many = scoreClub(
      ["coding", "a", "b", "c", "d", "e", "f", "g", "h", "i"],
      at("build"),
      focused,
    ).score;
    expect(many).toBe(few);
  });

  test("stage fit is graded, not binary", () => {
    const club = (stage: SkillStage) => ({ interestTags: ["x"], stage });
    const same = scoreClub([], at("discover"), club("discover")).score;
    const near = scoreClub([], at("discover"), club("thrive")).score;
    const far = scoreClub([], at("discover"), club("lead")).score;
    expect(same).toBeGreaterThan(near);
    expect(near).toBeGreaterThan(far);
  });

  test("a club naming no stage suits anyone, and beats a badly-matched stage", () => {
    const open = scoreClub([], at("discover"), {
      interestTags: ["x"],
      stage: null,
    }).score;
    const wrong = scoreClub([], at("discover"), {
      interestTags: ["x"],
      stage: "lead",
    }).score;
    expect(open).toBeGreaterThan(wrong);
  });

  test("a club with no tags still scores, so it is findable", () => {
    const { score } = scoreClub(["coding"], at("discover"), {
      interestTags: [],
      stage: null,
    });
    expect(score).toBeGreaterThan(0);
  });

  test("shared tags never include an interest the club doesn't list", () => {
    const { sharedTags } = scoreClub(["coding", "music"], at("discover"), {
      interestTags: ["coding"],
      stage: null,
    });
    expect(sharedTags).not.toContain("music");
  });

  test("score stays inside 0–100 for every stage pairing", () => {
    const stages: SkillStage[] = ["discover", "thrive", "build", "lead"];
    for (const mentee of stages) {
      for (const club of [...stages, null]) {
        for (const tags of [[], ["coding"], ["coding", "music"]]) {
          const { score } = scoreClub(["coding"], mentee, {
            interestTags: tags,
            stage: club,
          });
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  test("null and undefined tag lists are handled", () => {
    expect(() =>
      scoreClub(null, at("discover"), { interestTags: null, stage: null }),
    ).not.toThrow();
  });
});
