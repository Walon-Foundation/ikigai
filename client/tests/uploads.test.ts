import { describe, expect, test } from "bun:test";
import { DOCUMENT_LIMITS, maxSizeLabel, rejectDocument } from "@/lib/uploads";

// A File the pre-flight check can inspect. `type` is deliberately settable to
// "" because that is what several cheap Android browsers hand back.
function fileOf(name: string, type: string, size: number): File {
  const file = new File([new Uint8Array(1)], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

const MB = 1024 * 1024;
const CV = DOCUMENT_LIMITS.mentorCv;
const ID = DOCUMENT_LIMITS.governmentId;
const PHOTO = DOCUMENT_LIMITS.taskEvidencePhoto;

describe("mentor CV: PDF only, 10MB", () => {
  test("accepts a normal PDF", () => {
    expect(rejectDocument(fileOf("cv.pdf", "application/pdf", MB), CV)).toBe(
      null,
    );
  });

  test("rejects an image", () => {
    const r = rejectDocument(fileOf("cv.jpg", "image/jpeg", MB), CV);
    expect(r?.title).toBe("Wrong file format");
    expect(r?.description).toContain("PDF");
  });

  test("rejects a .docx", () => {
    expect(rejectDocument(fileOf("cv.docx", "", MB), CV)?.title).toBe(
      "Wrong file format",
    );
  });

  test("10MB exactly is allowed; one byte over is not", () => {
    expect(
      rejectDocument(fileOf("cv.pdf", "application/pdf", 10 * MB), CV),
    ).toBe(null);
    const over = rejectDocument(
      fileOf("cv.pdf", "application/pdf", 10 * MB + 1),
      CV,
    );
    expect(over?.title).toBe("File is too large");
    expect(over?.description).toContain("10MB");
  });

  test("an empty file is refused rather than uploaded", () => {
    expect(
      rejectDocument(fileOf("cv.pdf", "application/pdf", 0), CV)?.title,
    ).toBe("That file is empty");
  });

  test("a PDF with an empty MIME type is accepted on its extension", () => {
    // The Android case. Rejecting these would reject valid PDFs.
    expect(rejectDocument(fileOf("cv.PDF", "", MB), CV)).toBe(null);
  });

  test("a PDF with no extension is accepted on its MIME type", () => {
    expect(rejectDocument(fileOf("cv", "application/pdf", MB), CV)).toBe(null);
  });

  test("format is checked before size, so a huge image says 'wrong format'", () => {
    expect(
      rejectDocument(fileOf("x.jpg", "image/jpeg", 900 * MB), CV)?.title,
    ).toBe("Wrong file format");
  });
});

describe("government ID: images allowed, 10MB", () => {
  test("accepts a photo and a PDF", () => {
    expect(rejectDocument(fileOf("id.jpg", "image/jpeg", MB), ID)).toBe(null);
    expect(rejectDocument(fileOf("id.pdf", "application/pdf", MB), ID)).toBe(
      null,
    );
  });

  test("a modern phone photo is under the ceiling, not over it", () => {
    // The ceiling used to be 8MB, which a single photo from a recent phone can
    // clear. Applicants were told their own ID was too large.
    expect(rejectDocument(fileOf("id.jpg", "image/jpeg", 9 * MB), ID)).toBe(
      null,
    );
  });

  test("10MB exactly is allowed; one byte over is not", () => {
    expect(rejectDocument(fileOf("id.jpg", "image/jpeg", 10 * MB), ID)).toBe(
      null,
    );
    const over = rejectDocument(
      fileOf("id.jpg", "image/jpeg", 10 * MB + 1),
      ID,
    );
    expect(over?.title).toBe("File is too large");
    expect(over?.description).toContain("10MB");
  });

  test("a HEIC photo with an empty MIME type passes on its extension", () => {
    expect(rejectDocument(fileOf("IMG_2231.HEIC", "", MB), ID)).toBe(null);
  });
});

test("both mentor vetting documents share the same 10MB ceiling", () => {
  // The onboarding screen states one number for both. If these ever drift, one
  // of the two fields refuses a file the screen said it would take.
  expect(ID.maxBytes).toBe(CV.maxBytes);
  expect(maxSizeLabel(ID)).toBe("10MB");
});

describe("task evidence photo: images only", () => {
  test("a PDF is not a photo", () => {
    expect(
      rejectDocument(fileOf("work.pdf", "application/pdf", MB), PHOTO)?.title,
    ).toBe("Wrong file format");
  });

  test("accepts what a phone camera produces", () => {
    for (const [name, type] of [
      ["IMG_0001.jpg", "image/jpeg"],
      ["IMG_0001.HEIC", "image/heic"],
      ["shot.png", "image/png"],
    ]) {
      expect(rejectDocument(fileOf(name, type, MB), PHOTO)).toBe(null);
    }
  });
});

test("maxSizeLabel matches the bytes actually enforced", () => {
  expect(maxSizeLabel(CV)).toBe("10MB");
  expect(maxSizeLabel(ID)).toBe("10MB");
  // The label and the UploadThing string must agree, or the screen promises a
  // limit the server does not enforce.
  for (const limit of Object.values(DOCUMENT_LIMITS)) {
    expect(limit.maxFileSize).toBe(maxSizeLabel(limit));
  }
});
