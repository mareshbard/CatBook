const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const dbcatbooks = new sqlite3.Database("./catbooks.db");

// Rota para excluir um livro
router.post("/delete-book/:livroId", (req, res) => {
    const livroId = req.params.livroId;

    console.log("Tentando excluir o livro com ID:", livroId);

    dbcatbooks.run("DELETE FROM livros WHERE id = ?", [livroId], function(err) {
        if (err) {
            console.error("Erro ao excluir o livro:", err.message);
            return res.status(500).send("Erro ao excluir o livro!");
        }

        if (this.changes > 0) {
            res.send(`Livro com ID ${livroId} excluído com sucesso!`);
        } else {
            res.status(404).send("Livro não encontrado ou já excluído.");
        }
    });
});

// Outros endpoints relacionados a livros podem ser adicionados aqui

module.exports = router;
