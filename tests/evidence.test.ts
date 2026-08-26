import { describe, expect, test } from "bun:test";
import {
  isEvidenceKind,
  isSubmissionComplete,
  missingEvidence,
  TEST_PASS_RATIO,
} from "@/lib/tasks";

// The evidence rule is the gate on the mentor's Complete button. If these are
// wrong, a task completes without evidence or refuses one that has it.

const base = {
  kind: "test_and_photo",
  testPassedAt: null as Date | null,
  photoFileKey: null as string | null,
  pdfFileKey: null as string | null,
};

describe("isSubmissionComplete", () => {
  test("nothing submitted is not complete", () => {
    expect(isSubmissionComplete(null)).toBe(false);
    expect(isSubmissionComplete(undefined)).toBe(false);
  });

  test("test_and_photo needs BOTH halves", () => {
    expect(isSubmissionComplete({ ...base })).toBe(false);
    expect(isSubmissionComplete({ ...base, testPassedAt: new Date() })).toBe(
      false,
    );
    expect(isSubmissionComplete({ ...base, photoFileKey: "k" })).toBe(false);
    expect(
      isSubmissionComplete({
        ...base,
        testPassedAt: new Date(),
        photoFileKey: "k",
      }),
    ).toBe(true);
  });

  test("a pdf on a test_and_photo submission does not satisfy it", () => {
    expect(isSubmissionComplete({ ...base, pdfFileKey: "k" })).toBe(false);
  });

  test("pdf needs the pdf, and ignores a stray photo or test", () => {
    expect(isSubmissionComplete({ ...base, kind: "pdf" })).toBe(false);
    expect(
      isSubmissionComplete({
        ...base,
        kind: "pdf",
        testPassedAt: new Date(),
        photoFileKey: "k",
      }),
    ).toBe(false);
    expect(
      isSubmissionComplete({ ...base, kind: "pdf", pdfFileKey: "k" }),
    ).toBe(true);
  });

  test("an unknown kind is never complete", () => {
    expect(
      isSubmissionComplete({
        ...base,
        kind: "whatever",
        pdfFileKey: "k",
        photoFileKey: "k",
        testPassedAt: new Date(),
      }),
    ).toBe(false);
  });
});

describe("missingEvidence", () => {
  test("names both halves when neither is done", () => {
    expect(missingEvidence({ ...base })).toEqual([
      "Pass the task test.",
      "Add a photo of your work.",
    ]);
  });

  test("names only what is left", () => {
    expect(missingEvidence({ ...base, testPassedAt: new Date() })).toEqual([
      "Add a photo of your work.",
    ]);
  });

  test("is empty exactly when isSubmissionComplete is true", () => {
    const complete = {
      ...base,
      testPassedAt: new Date(),
      photoFileKey: "k",
    };
    expect(missingEvidence(complete)).toEqual([]);
    expect(isSubmissionComplete(complete)).toBe(true);
  });
});

describe("isEvidenceKind", () => {
  test("accepts only the two programme routes", () => {
    expect(isEvidenceKind("test_and_photo")).toBe(true);
    expect(isEvidenceKind("pdf")).toBe(true);
    for (const bad of ["", "PDF", "photo", null, undefined, 1, {}, []]) {
      expect(isEvidenceKind(bad)).toBe(false);
    }
  });
});

test("pass mark is 70%", () => {
  expect(TEST_PASS_RATIO).toBe(0.7);
  // 7/10 passes, 6/10 does not — the boundary is inclusive.
  expect(7 / 10 >= TEST_PASS_RATIO).toBe(true);
  expect(6 / 10 >= TEST_PASS_RATIO).toBe(false);
  // 2/3 is 0.66 and must fail; 3/4 is 0.75 and must pass.
  expect(2 / 3 >= TEST_PASS_RATIO).toBe(false);
  expect(3 / 4 >= TEST_PASS_RATIO).toBe(true);
});
