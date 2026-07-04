import { describe, expect, it } from "vitest";
import { PHOTO_CREDIT_PREFIX, generatePhotoCredit } from "../src/core/credit/photoCredit";

describe("generatePhotoCredit", () => {
  it("prefixes a plain author name", () => {
    expect(generatePhotoCredit("Mévin Grivault")).toBe("Crédit photo : Mévin Grivault");
  });

  it("trims leading and trailing whitespace", () => {
    expect(generatePhotoCredit("  Mévin Grivault  ")).toBe("Crédit photo : Mévin Grivault");
  });

  it("returns null for an empty string", () => {
    expect(generatePhotoCredit("")).toBeNull();
  });

  it("returns null for whitespace-only input", () => {
    expect(generatePhotoCredit("   ")).toBeNull();
  });

  it("returns null for undefined / null", () => {
    expect(generatePhotoCredit(undefined)).toBeNull();
    expect(generatePhotoCredit(null)).toBeNull();
  });

  it("preserves accented characters (UTF-8)", () => {
    expect(generatePhotoCredit("Édouard Touzan")).toBe("Crédit photo : Édouard Touzan");
  });

  it("preserves apostrophes", () => {
    expect(generatePhotoCredit("Jean-Pierre O'Brien")).toBe("Crédit photo : Jean-Pierre O'Brien");
    expect(generatePhotoCredit("François L'Écuyer")).toBe("Crédit photo : François L'Écuyer");
  });

  it("preserves dashes", () => {
    expect(generatePhotoCredit("Jean-Pierre")).toBe("Crédit photo : Jean-Pierre");
  });

  it("uses the centralized prefix constant", () => {
    expect(PHOTO_CREDIT_PREFIX).toBe("Crédit photo : ");
    expect(generatePhotoCredit("X")).toBe(`${PHOTO_CREDIT_PREFIX}X`);
  });
});
