const express = require("express");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();

// Configuração do armazenamento de imagens
const upload = multer({ dest: "public/uploads/" }); // Diretório para salvar as imagens

// Conexão com o banco de dados
const dbcatbooks = new sqlite3.Database("./catbooks.db", (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.message);
  } else {
    console.log("Conectado ao banco de dados!");
  }
});

// Rota para exibir o formulário de adicionar livro
router.get("/add-book", (req, res) => {
  res.render("add-book"); // Renderiza a view do formulário
});

// Rota para processar o formulário de adicionar livro
router.post("/add-book", upload.single("imagem"), (req, res) => {
  const { titulo, autor, ano_publicacao, resumo, genero, categoria } = req.body;
  const imagem = req.file ? `/uploads/${req.file.filename}` : null; // Caminho da imagem

  // Prepara a consulta SQL para inserir o novo livro
  const stmt = dbcatbooks.prepare(
    "INSERT INTO livros (titulo, autor, ano_publicacao, resumo, genero, categoria, imagem) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  // Executa a inserção no banco de dados
  stmt.run(
    titulo,
    autor,
    ano_publicacao,
    resumo,
    genero,
    categoria,
    imagem,
    function (err) {
      if (err) {
        console.error("Erro ao adicionar livro:", err.message);
        return res.status(500).render("error", {
          message: `Erro ao adicionar livro: ${err.message}`,
        });
      }
      res.send(`
        <html>
        <head></head>
        <body>
            <p>Livro adicionado com sucesso!</p>
            <a href="/start">Voltar para a lista de livros</a>
        </body>
        </html>
      `);
    }
  );

  // Finaliza a declaração
  stmt.finalize();
});

// Exporta o roteador
module.exports = router;
