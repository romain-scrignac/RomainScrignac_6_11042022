// On importe bcrypt
const bcrypt = require('bcrypt');

// On importe jsonwebtoken
const jwt = require('jsonwebtoken');

// On importe le modèle User
const User = require('../models/User');

// Middleware pour l'enregistrement des utilisateurs (hashage du mdp + envoi dans la bdd)
exports.signup = (req, res) => {
    const regexEmail = /^([a-z0-9]{1,20})([\.|_|-]{1}[a-z0-9]{1,20})?@{1}([a-z0-9]{2,15})\.[a-z]{2,4}$/;
    // Vérification du formulaire, si c'est bon on crée le nouvel utilisateur
    if (!req.body || !req.body.email || !req.body.password) {
        res.status(400).json({ error: 'Invalid form !' });
    }else if (!req.body.email.match(regexEmail)) {
        res.status(400).json({ error: 'Invalid email format !' });
    }else if (!req.body.password.match(/[a-z]/) || !req.body.password.match(/[A-Z]/) || !req.body.password.match(/[0-9]/)
    || req.body.password.length < 8) {
        res.status(400).json({ error: 'Password not strong enough !' });
    } else if (req.body.password.match(/\s/)) {
        res.status(400).json({ error: 'Espaces characters are not allowed !' });
    } else {
        bcrypt.hash(req.body.password, 10)      // On "sale" le mot de passe 10 fois par mesure de sécurité
        .then(hash => {
            const user = new User({         // On crée un nouvel utilisateur
                email: req.body.email,
                password: hash
            });
            user.save()     // On l'enregistre dans la bdd
                .then(() => res.status(201).json({ message: 'User created !' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
    }
};

// Middleware pour la connection des utilisateurs
exports.login = (req, res) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user) {
                return res.status(401).json({ message: 'User not found !' });   // code 401 (non autorisé)
            }
            bcrypt.compare(req.body.password, user.password)    // On compare le password entré et celui de l'user de la bdd
                .then(valid => {
                    if (!valid) {
                        return res.status(401).json({ message: 'Wrong password !' });
                    }
                    // Fonction jwt.sign pour encoder le token avec l'userId + la clé cryptée + délais d'expiration
                    const token = jwt.sign({ userId: user.id }, process.env.JWT_KEY, { expiresIn: '24h' });
                    res.status(200).json({ userId: user.id, token });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};