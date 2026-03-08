import { Endpoint } from "@/components/docs/Endpoint";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { ParamTable } from "@/components/docs/ParamTable";

export default function ReplaysDocs() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Replays</h1>
        <p className="mt-3 text-lg text-text-secondary leading-relaxed">
          Replays let you re-deliver events that previously failed or need to be
          sent again. Create a replay batch from one or more delivery IDs to
          generate fresh deliveries with the original payloads.
        </p>
      </div>

      <Endpoint
        method="POST"
        path="/v1/replays"
        description="Create a replay batch. Each delivery ID in the request produces a new delivery for the same event and endpoint. Use dry_run to preview without creating deliveries."
      >
        <ParamTable
          title="Request body"
          params={[
            {
              name: "delivery_ids",
              type: "string[]",
              required: true,
              description:
                "Array of delivery IDs to replay (e.g. del_6ba7b810-...). Max 1000.",
            },
            {
              name: "dry_run",
              type: "boolean",
              required: false,
              description:
                "If true, returns what would be created without actually creating deliveries. Defaults to false.",
            },
          ]}
        />
        <CodeBlock title="Request">{`{
  "delivery_ids": [
    "del_6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "del_a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  ],
  "dry_run": false
}`}</CodeBlock>
        <CodeBlock title="201 Response">{`{
  "batch_id": "bat_7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "created_deliveries": 2,
  "dry_run": false
}`}</CodeBlock>
      </Endpoint>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface/30 p-5">
          <h3 className="text-[13px] font-semibold text-text-primary mb-2">
            Batch size limits
          </h3>
          <p className="text-[13px] text-text-secondary leading-relaxed">
            A single replay request can include up to{" "}
            <code className="text-accent bg-accent/8 px-1.5 py-0.5 rounded text-[11px] font-mono">
              1000
            </code>{" "}
            delivery IDs. For larger replays, split them across multiple
            requests.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface/30 p-5">
          <h3 className="text-[13px] font-semibold text-text-primary mb-2">
            Dry run mode
          </h3>
          <p className="text-[13px] text-text-secondary leading-relaxed">
            Set{" "}
            <code className="text-accent bg-accent/8 px-1.5 py-0.5 rounded text-[11px] font-mono">
              dry_run: true
            </code>{" "}
            to preview the replay without creating any deliveries.
          </p>
        </div>
      </div>
    </div>
  );
}
