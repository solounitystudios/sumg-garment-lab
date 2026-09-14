import {
  CreativeCapability,
  ProviderAvailability,
  type AnalyzeImageParams,
  type AnalyzeImageResult,
  type CleanupArtworkParams,
  type CleanupArtworkResult,
  type CreativeOperationResult,
  type CreativeProcessingProvider,
  type CropObjectParams,
  type CropObjectResult,
  type ExportAssetParams,
  type ExportAssetResult,
  type InspectArtworkParams,
  type InspectArtworkResult,
  type ReconstructArtworkParams,
  type ReconstructArtworkResult,
  type RemoveBackgroundParams,
  type RemoveBackgroundResult,
  type SelectRegionParams,
  type SelectRegionResult,
  type VectorizeArtworkParams,
  type VectorizeArtworkResult,
} from "./types";

const PROVIDER_ID = "manual";
const PROVIDER_NAME = "Manual";

function unsupported<TData>(
  reason: string,
): CreativeOperationResult<TData> {
  return { status: "UNSUPPORTED", provider: PROVIDER_ID, reason };
}

/**
 * The manual creative processing "provider": it performs no automated
 * image processing at all. It exists so the rest of the system can treat
 * "a human does this outside Garment Lab and uploads the result" as a
 * first-class, always-available path rather than a special case — and so
 * every automated capability has a truthful, explicit UNSUPPORTED result
 * instead of silently failing or faking output.
 */
export class ManualCreativeProvider implements CreativeProcessingProvider {
  readonly id = PROVIDER_ID;
  readonly name = PROVIDER_NAME;

  getAvailability(): ProviderAvailability {
    // The manual path requires no external service, so it is always
    // operational — it just does not automate anything.
    return ProviderAvailability.AVAILABLE;
  }

  getSupportedCapabilities(): CreativeCapability[] {
    return [];
  }

  async analyzeImage(
    _params: AnalyzeImageParams,
  ): Promise<CreativeOperationResult<AnalyzeImageResult>> {
    return unsupported(
      "Manual provider does not perform automated analysis. Mark regions by hand.",
    );
  }

  async selectRegion(
    _params: SelectRegionParams,
  ): Promise<CreativeOperationResult<SelectRegionResult>> {
    return unsupported(
      "Manual provider does not perform automated region selection.",
    );
  }

  async cropObject(
    _params: CropObjectParams,
  ): Promise<CreativeOperationResult<CropObjectResult>> {
    return unsupported(
      "Manual provider does not perform automated cropping.",
    );
  }

  async removeBackground(
    _params: RemoveBackgroundParams,
  ): Promise<CreativeOperationResult<RemoveBackgroundResult>> {
    return unsupported(
      "Manual provider does not perform automated background removal.",
    );
  }

  async cleanupArtwork(
    _params: CleanupArtworkParams,
  ): Promise<CreativeOperationResult<CleanupArtworkResult>> {
    return unsupported(
      "Manual provider does not perform automated cleanup.",
    );
  }

  async reconstructArtwork(
    _params: ReconstructArtworkParams,
  ): Promise<CreativeOperationResult<ReconstructArtworkResult>> {
    return unsupported(
      "Manual provider does not perform automated reconstruction.",
    );
  }

  async vectorizeArtwork(
    _params: VectorizeArtworkParams,
  ): Promise<CreativeOperationResult<VectorizeArtworkResult>> {
    return unsupported(
      "Manual provider does not perform automated vectorization.",
    );
  }

  async inspectArtwork(
    _params: InspectArtworkParams,
  ): Promise<CreativeOperationResult<InspectArtworkResult>> {
    return unsupported(
      "Manual provider does not perform automated inspection.",
    );
  }

  async exportAsset(
    _params: ExportAssetParams,
  ): Promise<CreativeOperationResult<ExportAssetResult>> {
    return unsupported(
      "Manual provider does not perform automated export.",
    );
  }
}
