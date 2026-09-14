import { describe, expect, it } from "vitest";
import { CandidateRegionType } from "@/types/domain";
import { ManualCreativeProvider } from "./manual-provider";
import { CreativeCapability, ProviderAvailability } from "./types";

const asset = { id: "asset-1", uri: "https://example.com/a.png", mimeType: "image/png" };

describe("ManualCreativeProvider", () => {
  const provider = new ManualCreativeProvider();

  it("is always available (the manual path needs no external service)", () => {
    expect(provider.getAvailability()).toBe(ProviderAvailability.AVAILABLE);
  });

  it("declares support for exactly SELECT_REGION, no automated capability", () => {
    expect(provider.getSupportedCapabilities()).toEqual([CreativeCapability.SELECT_REGION]);
  });

  it("completes selectRegion — a human's own selection, not automation", async () => {
    const region = {
      type: CandidateRegionType.LOGO,
      boundingBox: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
    };
    const result = await provider.selectRegion({ asset, region });
    expect(result.status).toBe("COMPLETED");
  });

  const automatedCalls: Array<
    [name: string, call: () => Promise<{ status: string }>]
  > = [
    ["analyzeImage", () => provider.analyzeImage({ asset })],
    ["cropObject", () => provider.cropObject({ asset, boundingBox: { x: 0, y: 0, width: 1, height: 1 } })],
    ["removeBackground", () => provider.removeBackground({ asset })],
    ["cleanupArtwork", () => provider.cleanupArtwork({ asset })],
    ["reconstructArtwork", () => provider.reconstructArtwork({ asset })],
    ["vectorizeArtwork", () => provider.vectorizeArtwork({ asset })],
    ["inspectArtwork", () => provider.inspectArtwork({ asset })],
    ["exportAsset", () => provider.exportAsset({ asset, format: "png" })],
  ];

  it.each(automatedCalls)(
    "%s never reports a fake COMPLETED result",
    async (_name, call) => {
      const result = await call();
      expect(result.status).not.toBe("COMPLETED");
      expect(result.status).toBe("UNSUPPORTED");
    },
  );
});
