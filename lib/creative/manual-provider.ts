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
 * The manual creative processing "provider". It performs no *automated*
 * image processing — every automated capability truthfully reports
 * UNSUPPORTED — but it does support one real, non-automated capability:
 * recording a region a human selected themselves. Region selection made by
 * a person is genuinely completed work, not a simulation, so `selectRegion`
 * is the one call this provider can honestly answer with "COMPLETED".
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
    return [CreativeCapability.SELECT_REGION];
  }

  async analyzeImage(
    _params: AnalyzeImageParams,
  ): Promise<CreativeOperationResult<AnalyzeImageResult>> {
    return unsupported(
      "Manual provider does not perform automated analysis. Mark regions by hand.",
    );
  }

  async selectRegion(
    params: SelectRegionParams,
  ): Promise<CreativeOperationResult<SelectRegionResult>> {
    // Not automation: this records the region a human already selected.
    // There is no detection or inference here, so it is honest to report
    // it as completed rather than unsupported.
    return {
      status: "COMPLETED",
      provider: PROVIDER_ID,
      data: { asset: params.asset },
    };
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
