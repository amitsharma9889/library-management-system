const express = require("express");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const app = express();
const port = Number.parseInt(process.env.PORT, 10) || 3000;

let books = [
  {
    id: randomUUID(),
    bookName: "Rudest Book Ever",
    bookAuthor: "Shwetabh Gangwar",
    bookPages: 200,
    bookPrice: 240,
    bookState: "Available",
  },
  {
    id: randomUUID(),
    bookName: "Do Epic Shit",
    bookAuthor: "Ankur Warikoo",
    bookPages: 200,
    bookPrice: 240,
    bookState: "Available",
  },
];

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.render("home", { books });
});

app.post("/books", (req, res) => {
  const { bookName, bookAuthor, bookPages, bookPrice } = req.body;
  const pages = Number(bookPages);
  const price = Number(bookPrice);

  if (
    typeof bookName !== "string" ||
    !bookName.trim() ||
    typeof bookAuthor !== "string" ||
    !bookAuthor.trim() ||
    !Number.isInteger(pages) ||
    pages < 1 ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    return res.status(400).send("Enter a title, author, positive page count, and valid price.");
  }

  books.push({
    id: randomUUID(),
    bookName: bookName.trim(),
    bookAuthor: bookAuthor.trim(),
    bookPages: pages,
    bookPrice: price,
    bookState: "Available",
  });

  return res.redirect(303, "/");
});

app.post("/books/:id/issue", (req, res) => {
  const book = books.find(({ id }) => id === req.params.id);
  if (!book) return res.status(404).send("Book not found.");
  if (book.bookState !== "Available") {
    return res.status(409).send("This book is already issued.");
  }

  book.bookState = "Issued";
  return res.redirect(303, "/");
});

app.post("/books/:id/return", (req, res) => {
  const book = books.find(({ id }) => id === req.params.id);
  if (!book) return res.status(404).send("Book not found.");
  if (book.bookState !== "Issued") {
    return res.status(409).send("This book is not currently issued.");
  }

  book.bookState = "Available";
  return res.redirect(303, "/");
});

app.post("/books/:id/delete", (req, res) => {
  const bookIndex = books.findIndex(({ id }) => id === req.params.id);
  if (bookIndex === -1) return res.status(404).send("Book not found.");

  books.splice(bookIndex, 1);
  return res.redirect(303, "/");
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Library Management System is running at http://localhost:${port}`);
  });
}

module.exports = app;
