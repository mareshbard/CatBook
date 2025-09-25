var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const User = require('../models/User'); // Importar o modelo User

/* GET registration page */
router.get('/', (req, res) => {
    res.render('register', { title: 'Cadastro', errors: [] });
});

/* POST registration form */
router.post(
    '/',
    [
        body('nome').notEmpty().withMessage('Nome é obrigatório.'),
        body('email').isEmail().withMessage('Email inválido.'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Senha deve ter pelo menos 6 caracteres.'),
        body('confirm_password').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('As senhas não coincidem.');
            }
            return true;
        }),
    ],
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('register', {
                title: 'Cadastro',
                errors: errors.array(),
            });
        }

        const { nome, email, password } = req.body;

        try {
            const existingUser = await User.findOne({ email });

            if (existingUser) {
                return res.render('register', {
                    title: 'Cadastro',
                    errors: [{ msg: 'O e-mail já está registrado.' }],
                });
            }

            const hash = await bcrypt.hash(password, 10);

            const newUser = new User({
                nome,
                email,
                senha: hash,
            });

            await newUser.save();
            res.redirect('/');
        } catch (err) {
            console.error(err);
            res.status(500).send('Erro ao cadastrar usuário.');
        }
    }
);

module.exports = router;
