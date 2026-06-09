import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export const config = {
  api: { bodyParser: false },
};

const SYNC_USER = process.env.CARDDAV_SYNC_USER ?? "sync";
const SYNC_PASSWORD = process.env.CARDDAV_SYNC_PASSWORD ?? "";

function checkAuth(req: NextApiRequest): boolean {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(auth.slice(6), "base64").toString("utf8");
  const colon = decoded.indexOf(":");
  if (colon === -1) return false;
  return (
    decoded.slice(0, colon) === SYNC_USER &&
    decoded.slice(colon + 1) === SYNC_PASSWORD &&
    SYNC_PASSWORD !== ""
  );
}

function unauthorized(res: NextApiResponse) {
  res.setHeader("WWW-Authenticate", 'Basic realm="CardDAV Sync"');
  res.status(401).end("Unauthorized");
}

interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
}

function toVCard(c: Client): string {
  const parts = c.name.trim().split(/\s+/);
  const first = parts[0] ?? "";
  const last = parts.slice(1).join(" ");

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `UID:${c.id}@hairbook`,
    `FN:${esc(c.name)}`,
    `N:${esc(last)};${esc(first)};;;`,
  ];
  if (c.phone) lines.push(`TEL;TYPE=CELL,VOICE:${c.phone.replace(/\s/g, "")}`);
  if (c.email) lines.push(`EMAIL;TYPE=INTERNET:${c.email}`);
  if (c.notes) lines.push(`NOTE:${esc(c.notes)}`);
  lines.push("END:VCARD");
  return lines.join("\r\n") + "\r\n";
}

function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function xmlEsc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function etag(id: string) {
  return `"${id}"`;
}

const DAV_HEADERS = {
  DAV: "1, addressbook",
  Allow: "OPTIONS, GET, HEAD, PROPFIND, REPORT",
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!checkAuth(req)) return unauthorized(res);

  Object.entries(DAV_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  const method = (req.method ?? "GET").toUpperCase();
  const rawPath = req.query.path;
  const segments = Array.isArray(rawPath) ? rawPath : rawPath ? [rawPath] : [];
  const pathStr = "/" + segments.join("/");

  switch (method) {
    case "OPTIONS":
      res.setHeader("Content-Length", "0");
      return res.status(200).end();

    case "GET":
    case "HEAD":
      return handleGet(res, segments, method === "HEAD");

    case "PROPFIND":
      return handlePropfind(req, res, pathStr);

    case "REPORT":
      return handleReport(res, pathStr);

    default:
      return res.status(405).end("Method Not Allowed");
  }
}

async function handleGet(res: NextApiResponse, segments: string[], headOnly: boolean) {
  const filename = segments[segments.length - 1];
  if (!filename?.endsWith(".vcf")) return res.status(404).end("Not Found");

  const client = await prisma.client.findUnique({ where: { id: filename.slice(0, -4) } });
  if (!client) return res.status(404).end("Not Found");

  res.setHeader("Content-Type", "text/vcard; charset=utf-8");
  res.setHeader("ETag", etag(client.id));
  return headOnly ? res.status(200).end() : res.status(200).send(toVCard(client));
}

async function handlePropfind(req: NextApiRequest, res: NextApiResponse, pathStr: string) {
  const depth = req.headers.depth ?? "1";
  res.setHeader("Content-Type", "application/xml; charset=utf-8");

  if (pathStr === "/" || pathStr === "") {
    return res.status(207).send(`<?xml version="1.0" encoding="UTF-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:card="urn:ietf:params:xml:ns:carddav">
  <d:response>
    <d:href>/api/carddav/</d:href>
    <d:propstat>
      <d:prop>
        <d:current-user-principal><d:href>/api/carddav/</d:href></d:current-user-principal>
        <card:addressbook-home-set><d:href>/api/carddav/addressbook/</d:href></card:addressbook-home-set>
        <d:resourcetype><d:principal/></d:resourcetype>
        <d:displayname>Sync</d:displayname>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`);
  }

  if (pathStr === "/addressbook" || pathStr === "/addressbook/") {
    const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });

    let cards = "";
    if (depth !== "0") {
      cards = clients
        .map(
          (c) => `  <d:response>
    <d:href>/api/carddav/addressbook/${c.id}.vcf</d:href>
    <d:propstat>
      <d:prop>
        <d:getetag>${xmlEsc(etag(c.id))}</d:getetag>
        <d:resourcetype/>
        <d:getcontenttype>text/vcard; charset=utf-8</d:getcontenttype>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>`
        )
        .join("\n");
    }

    return res.status(207).send(`<?xml version="1.0" encoding="UTF-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:card="urn:ietf:params:xml:ns:carddav">
  <d:response>
    <d:href>/api/carddav/addressbook/</d:href>
    <d:propstat>
      <d:prop>
        <d:resourcetype><d:collection/><card:addressbook/></d:resourcetype>
        <d:displayname>Klienci</d:displayname>
        <d:supported-report-set>
          <d:supported-report><d:report><card:addressbook-multiget/></d:report></d:supported-report>
          <d:supported-report><d:report><card:addressbook-query/></d:report></d:supported-report>
        </d:supported-report-set>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
${cards}
</d:multistatus>`);
  }

  return res.status(404).end("Not Found");
}

async function handleReport(res: NextApiResponse, pathStr: string) {
  if (pathStr !== "/addressbook" && pathStr !== "/addressbook/") {
    return res.status(404).end("Not Found");
  }

  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });

  const cards = clients
    .map(
      (c) => `  <d:response>
    <d:href>/api/carddav/addressbook/${c.id}.vcf</d:href>
    <d:propstat>
      <d:prop>
        <d:getetag>${xmlEsc(etag(c.id))}</d:getetag>
        <card:address-data>${xmlEsc(toVCard(c))}</card:address-data>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>`
    )
    .join("\n");

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  return res.status(207).send(`<?xml version="1.0" encoding="UTF-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:card="urn:ietf:params:xml:ns:carddav">
${cards}
</d:multistatus>`);
}
