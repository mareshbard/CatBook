require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const session = require("express-session");
const path = require("path");
const multer = require("multer");
const saltRounds = 10;

const app = express();
const port = process.env.PORT || 3000;


const upload = multer({ dest: "public/uploads/" }); 

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', { 
        message: err.message, 
        error: err 
    });
});

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    }),
);
app.use(express.urlencoded({ extended: true })); 
app.use(express.json()); 
app.use(express.static(path.join(__dirname, "public"))); 
app.set("view engine", "ejs"); 
app.set("views", path.join(__dirname, "views")); 

const dbcatbooks = new sqlite3.Database("./catbooks.db", (err) => {
    if (err) {
        console.error("Erro ao conectar ao banco de dados:", err.message);
    } else {
        console.log("Conectado ao banco de dados!!");
    }
});

// Criação das tabelas no banco de dados
dbcatbooks.serialize(() => {
    // Criar a tabela users
    dbcatbooks.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      password TEXT NOT NULL
  )`);

    // Criar a tabela livros com a coluna categoria
    dbcatbooks.run(`CREATE TABLE IF NOT EXISTS livros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      autor TEXT NOT NULL,
      ano_publicacao INTEGER NOT NULL,
      resumo TEXT,
      genero TEXT,
      categoria TEXT, 
      imagem TEXT
  )`);
});

// Rota para exibir o formulário de adicionar livro
app.get("/add-book", (req, res) => {
    res.render("add-book");
});

// Rota para processar o formulário de adicionar livro
app.post("/add-book", upload.single("imagem"), (req, res) => {
    const { titulo, autor, ano_publicacao, resumo, genero, categoria } = req.body;
    const imagem = req.file ? `/uploads/${req.file.filename}` : null;

    const stmt = dbcatbooks.prepare(
        "INSERT INTO livros (titulo, autor, ano_publicacao, resumo, genero, categoria, imagem) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
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
                return res.status(500).render("error", { message: `Erro ao adicionar livro: ${err.message}` });
            }
            res.send("Livro adicionado com sucesso!");
        }
    );
    stmt.finalize();
});


app.get("/start", (req, res) => {
    dbcatbooks.all("SELECT * FROM livros", (err, rows) => {
        if (err) {
            console.error("Erro ao buscar livros:", err.message);
            return res.status(500).send("Erro ao buscar livros!");
        }
        console.log(rows); // Log dos livros
        res.render("start", { livros: rows });
    });
});



app.get("/", (req, res) => {
    res.render("index");
});

app.get("/login", (req, res) => {
    res.render("login");
});
app.get("/book-details", (req, res) => {
  const livroId = req.query.image;

  dbcatbooks.get("SELECT * FROM livros WHERE id = ?", [livroId], (err, row) => {
    if (err) {
      return res.status(500).send("Erro ao buscar detalhes do livro!");
    }

    if (row) {
      res.render("book-details", { livro: row });
    } else {
      res.status(404).send("Livro não encontrado!");
    }
  });
});
app.get("/sobre", (req, res) => {
    res.render("sobre");
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    dbcatbooks.get(
        "SELECT * FROM users WHERE username = ?",
        [username],
        (err, row) => {
            if (err) {
                return res.status(500).send("Erro ao verificar usuário!");
            }

            if (row) {
                bcrypt.compare(password, row.password, (err, result) => {
                    if (err) {
                        return res.status(500).send("Erro ao comparar senha!");
                    }

                    if (result) {
                        req.session.username = username;
                        res.redirect("/start");
                    } else {
                        res.status(401).send("Usuário ou senha inválidos!");
                    }
                });
            } else {
                res.status(401).send("Usuário ou senha inválidos!");
            }
        },
    );
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    const { username, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res
            .status(400)
            .render("error", { message: "As senhas não coincidem!" });
    }

    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            return res
                .status(500)
                .render("error", {
                    message: "Erro ao criar hash da senha!",
                });
        }

        const stmt = dbcatbooks.prepare(
            "INSERT INTO users (username, password) VALUES (?, ?)",
        );
        stmt.run(username, hash, function (err) {
            if (err) {
                console.error("Erro ao cadastrar usuário:", err.message);
                return res
                    .status(500)
                    .render("error", {
                        message: `Erro ao cadastrar usuário: ${err.message}`,
                    });
            }
            res.send(`
        <html>
        <head></head>
        <body>
            <p>Cadastro realizado!</p>
        </body>
        </html>
      `);
        });
        stmt.finalize();
    });
});

app.get("/user", (req, res) => {
    if (req.session.username) {
        res.json({ username: req.session.username });
    } else {
        res.status(401).send("Não autenticado");
    }
});

app.get("/livros", (req, res) => {
    dbcatbooks.all("SELECT * FROM livros", (err, rows) => {
        if (err) {
            console.error("Erro ao buscar livros:", err.message);
            return res.status(500).send("Erro ao buscar livros!");
        }
        res.render("list-books", { livros: rows });
    });
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
