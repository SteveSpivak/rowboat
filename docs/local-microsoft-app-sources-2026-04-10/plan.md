# Plan

## Stage 1: Reality Check

- Prove what local Microsoft artifacts actually exist on this machine.
- Check:
  - Outlook local data stores or exportable local paths
  - Teams local data or caches
  - OneDrive local sync roots
- Classify each candidate as:
  - usable source
  - partial/noisy source
  - unsupported without API

## Stage 2: Product Model Correction

- Split Microsoft support into:
  - local Microsoft sources
  - optional cloud Microsoft connectors
- Stop using connected-account UI copy as the only Microsoft story when local-source support is the target.

## Stage 3: First Executable Slice

- easiest likely path:
  - OneDrive synced local folders as first-class folder roots
- next possible path:
  - Outlook local-source ingestion if there is a stable local store or export path
- highest-risk path:
  - Teams local ingestion, because local caches may be weak or unsuitable

## Stage 4: Proof Surface

- collect actual filesystem evidence
- confirm readable artifacts
- define the exact Rowboat entry surface:
  - folder source
  - knowledge source
  - local app source
  - optional connected account

## Current Recommendation

- Treat OneDrive as the first likely success path.
- Treat Outlook as a candidate pending local-store proof.
- Treat Teams as provisional until the local-artifact quality is proven.
