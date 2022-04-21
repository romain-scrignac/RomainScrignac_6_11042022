// On importe bcrypt
const bcrypt = require('bcrypt');

// On importe jsonwebtoken
const jwt = require('jsonwebtoken');

// On importe User.js
const User = require('../models/User');

// On importe la clé
const key = require('../modules/module').key;

// Middleware pour l'enregistrement des utilisateurs (hashage du mdp + envoi dans la bdd)
exports.signup = (req, res, next) => {
    bcrypt.hash(req.body.password, 10)      // On "sale" le mot de passe 10 fois par mesure de sécurité
        .then(hash => {
            const user = new User({         // On crée un nouvel utilisateur
                email: req.body.email,
                password: hash
            });
            user.save()                     // On l'enregistre dans la bdd
                .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))    // code 201 (nouvel objet créé)
                .catch(error => res.status(400).json({ error }));                       // code 400 (erreur requête client)
        })
        .catch(error => res.status(500).json({ error }));   // code 500 (erreur serveur)
};

// Middleware pour la connection des utilisateurs
exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user) {
                return res.status(401).json({ message: 'Utilisateur non trouvé !' });   // code 401 (non autorisé)
            }
            bcrypt.compare(req.body.password, user.password)    // On compare le password entré et celui de l'user de la bdd
                .then(valid => {
                    if (!valid) {
                        return res.status(401).json({ message: 'Mot de passe incorrect !' });
                    }
                    // Fonction jwt.sign pour encoder le token avec l'userId + la clé cryptée + délais d'expiration
                    const token = jwt.sign({ userId: user.id }, key, { expiresIn: '24h' });
                    res.status(200).json({ userId: user.id, token });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};