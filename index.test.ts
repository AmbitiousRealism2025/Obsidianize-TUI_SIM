import { expect, test } from "bun:test";
import { app } from "./index";
import figlet from "figlet";

test("GET /", async () => {
  const req = new Request("http://localhost/");
  const res = await app.fetch(req);
  expect(res.status).toBe(200);

  const body = await res.text();
  const expectedBody = figlet.textSync("Hello, Vibecoder!");
  expect(body).toBe(expectedBody);
});