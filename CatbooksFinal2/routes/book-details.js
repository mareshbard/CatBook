app.get("/book-details", (req, res) => {
  const livroId = req.query.image; // Pega o ID do livro da query string

  // Busca o livro correspondente no banco de dados
  dbcatbooks.get("SELECT * FROM livros WHERE id = ?", [livroId], (err, row) => {
    if (err) {
      console.error("Erro ao buscar livro:", err.message);
      return res.status(500).send("Erro ao buscar detalhes do livro!");
    }

    if (row) {
      // Renderiza a página de detalhes, passando os dados do livro
      res.render("book-details", { livro: row });
    } else {
      res.status(404).send("Livro não encontrado!");
    }
  });
});
