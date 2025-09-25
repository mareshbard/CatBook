const express = require("express");
const router = express.Router();
const User = require("../models/User"); // Importar o modelo de usuário
const { body, validationResult } = require("express-validator");

// Middleware para parsear dados do corpo da requisição
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

/* GET login page */
router.get("/", (req, res) => {
    res.render("login", { title: "Login", errors: [] });
});

/* POST login form */
router.post(
    "/",
    [
        body("email").isEmail().withMessage("Email inválido."),
        body("password").notEmpty().withMessage("Senha é obrigatória."),
    ],
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render("login", {
                title: "Login",
                errors: errors.array(),
            });
        }

        const { email, password } = req.body;

        try {
            // Procurar usuário pelo email
            const user = await User.findOne({ email });
            if (!user) {
                return res.render("login", {
                    title: "Login",
                    errors: [{ msg: "Usuário não encontrado." }],
                });
            }

            // Comparar senha
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.render("login", {
                    title: "Login",
                    errors: [{ msg: "Senha incorreta." }],
                });
            }

            // Se a autenticação for bem-sucedida, redirecione para a página "start"
            req.session.userId = user._id; // Supondo que você está usando sessões para gerenciar autenticação
            res.redirect("/start");
        } catch (err) {
            console.error(err);
            res.status(500).send("Erro ao processar a autenticação.");
        }
    },
);

module.exports = router;
