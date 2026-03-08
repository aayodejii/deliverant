import { Endpoint } from "@/components/docs/Endpoint";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { ParamTable } from "@/components/docs/ParamTable";

export default function AnalyticsDocs() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-3 text-lg text-text-secondary leading-relaxed">
          Query delivery metrics, success rates, latency distributions, and
          per-endpoint health. All analytics endpoints return data for a
          configurable time window.
        </p>
      </div>

      <Endpoint
        method="GET"
        path="/v1/analytics/delivery-volume"
        description="Returns hourly delivery counts broken down by outcome."
      >
        <ParamTable
          title="Query parameters"
          params={[
            {
              name: "hours",
              type: "integer",
              required: false,
              description: "Lookback window in hours (default 24).",
            },
          ]}
        />
        <CodeBlock title="200 Response">{`[
  {
    "hour": "2024-01-01T00:00:00Z",
    "total": 100,
    "delivered": 90,
    "failed": 10
  },
  {
    "hour": "2024-01-01T01:00:00Z",
    "total": 85,
    "delivered": 82,
    "failed": 3
  }
]`}</CodeBlock>
      </Endpoint>

      <Endpoint
        method="GET"
        path="/v1/analytics/success-rate"
        description="Returns hourly success rate as a percentage."
      >
        <ParamTable
          title="Query parameters"
          params={[
            {
              name: "hours",
              type: "integer",
              required: false,
              description: "Lookback window in hours (default 24).",
            },
          ]}
        />
        <CodeBlock title="200 Response">{`[
  {
    "hour": "2024-01-01T00:00:00Z",
    "rate": 90.0,
    "total": 100
  },
  {
    "hour": "2024-01-01T01:00:00Z",
    "rate": 96.5,
    "total": 85
  }
]`}</CodeBlock>
      </Endpoint>

      <Endpoint
        method="GET"
        path="/v1/analytics/latency-distribution"
        description="Returns the distribution of attempt latencies over the last 24 hours, bucketed by response time."
      >
        <CodeBlock title="200 Response">{`[
  { "bucket": "<100ms", "count": 50 },
  { "bucket": "100-300ms", "count": 30 },
  { "bucket": "300-1000ms", "count": 15 },
  { "bucket": "1-5s", "count": 4 },
  { "bucket": ">5s", "count": 1 }
]`}</CodeBlock>
      </Endpoint>

      <Endpoint
        method="GET"
        path="/v1/analytics/endpoint-health"
        description="Returns per-endpoint delivery statistics including success rates and average latency."
      >
        <CodeBlock title="200 Response">{`[
  {
    "endpoint_id": "ep_550e8400-e29b-41d4-a716-446655440000",
    "name": "my-webhook",
    "status": "ACTIVE",
    "total": 100,
    "delivered": 90,
    "success_rate": 90.0,
    "avg_latency_ms": 150
  },
  {
    "endpoint_id": "ep_f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "payment-processor",
    "status": "ACTIVE",
    "total": 250,
    "delivered": 248,
    "success_rate": 99.2,
    "avg_latency_ms": 89
  }
]`}</CodeBlock>
      </Endpoint>
    </div>
  );
}
