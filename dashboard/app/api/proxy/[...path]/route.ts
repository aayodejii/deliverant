import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/session";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiPath = `/${path.join("/")}`;
  const search = request.nextUrl.search;
  return proxyToApi(`${apiPath}${search}`);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiPath = `/${path.join("/")}`;
  const body = await request.text();
  return proxyToApi(apiPath, { method: "POST", body });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiPath = `/${path.join("/")}`;
  const body = await request.text();
  return proxyToApi(apiPath, { method: "PATCH", body });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiPath = `/${path.join("/")}`;
  return proxyToApi(apiPath, { method: "DELETE" });
}
