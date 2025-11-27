import { expect, test } from "bun:test";
import { app } from "./index";

test("GET / plain text", async () => {
  const req = new Request("http://localhost/?plain=true");
  const res = await app.fetch(req);
  expect(res.status).toBe(200);

  const body = await res.text();

  // Check for ASCII art border structure
  expect(body).toContain("╔");
  expect(body).toContain("╗");
  expect(body).toContain("╚");
  expect(body).toContain("╝");
  expect(body).toContain("║");

  // Check for tagline
  expect(body).toContain("Your Knowledge, Crystallized");

  // Check for ASCII art content (box drawing characters indicate presence)
  expect(body).toContain("█████");
  expect(body).toContain("║");
});

test("GET / HTML", async () => {
  const req = new Request("http://localhost/");
  const res = await app.fetch(req);
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toContain("text/html");

  const body = await res.text();
  expect(body).toContain("<!DOCTYPE html>");
  expect(body).toContain("OBSIDIANIZE");
  expect(body).toContain("Your Knowledge, Crystallized");
  // Verify external CSS is linked (styles moved from inline to landing.css)
  expect(body).toContain('<link rel="stylesheet" href="/styles/landing.css">');
});

test("Performance: Response time under 100ms", async () => {
  const req = new Request("http://localhost/?plain=true");
  const start = performance.now();
  const res = await app.fetch(req);
  const end = performance.now();

  expect(res.status).toBe(200);
  expect(end - start).toBeLessThan(100); // Response under 100ms
});