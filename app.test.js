const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const app = require("./app");

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("manages books through the library workflow", async () => {
  let response = await fetch(baseUrl);
  assert.equal(response.status, 200);
  let html = await response.text();
  assert.match(html, /Rudest Book Ever/);
  assert.match(html, /Do Epic Shit/);

  response = await fetch(`${baseUrl}/books`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      bookName: "New Book",
      bookAuthor: "Author",
      bookPages: "123",
      bookPrice: "9.99",
    }),
    redirect: "manual",
  });
  assert.equal(response.status, 303);

  response = await fetch(baseUrl);
  html = await response.text();
  assert.match(html, /New Book/);
  const bookId = html.match(/New Book[\s\S]*?action="\/books\/([^/]+)\/issue"/)[1];

  response = await fetch(`${baseUrl}/books/${bookId}/issue`, {
    method: "POST",
    redirect: "manual",
  });
  assert.equal(response.status, 303);

  response = await fetch(`${baseUrl}/books/${bookId}/issue`, { method: "POST" });
  assert.equal(response.status, 409);

  response = await fetch(`${baseUrl}/books/${bookId}/return`, {
    method: "POST",
    redirect: "manual",
  });
  assert.equal(response.status, 303);

  response = await fetch(`${baseUrl}/books/${bookId}/delete`, {
    method: "POST",
    redirect: "manual",
  });
  assert.equal(response.status, 303);

  response = await fetch(baseUrl);
  html = await response.text();
  assert.doesNotMatch(html, /New Book/);
});

test("rejects invalid book details", async () => {
  const response = await fetch(`${baseUrl}/books`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      bookName: "",
      bookAuthor: "Author",
      bookPages: "0",
      bookPrice: "invalid",
    }),
  });
  assert.equal(response.status, 400);
});
