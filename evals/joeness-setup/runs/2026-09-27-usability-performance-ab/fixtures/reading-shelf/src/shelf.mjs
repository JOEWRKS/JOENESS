export function listBooks(books) {
  return books.map(({id, title, author}) => ({id, title, author}));
}

export function addBook(books, book) {
  if (!book.title) throw new Error('title required');
  return [...books, {id: book.id, title: book.title}];
}

export function findBooks(_books, _query) {
  throw new Error('findBooks not implemented');
}
