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
    if (!req.body.email.match(regexEmail)) {
        res.status(400).json({ error: 'Format d\'email invalide !' });
    } else if (req.body.password.length < 5) {
        res.status(400).json({ error: 'Mot de passe trop court !' });
    } else {
        bcrypt.hash(req.body.password, 10)      // On "sale" le mot de passe 10 fois par mesure de sécurité
        .then(hash => {
            const user = new User({         // On crée un nouvel utilisateur
                email: req.body.email,
                password: hash
            });
            user.save()                     // On l'enregistre dans la bdd
                .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
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
                return res.status(401).json({ message: 'Utilisateur non trouvé !' });   // code 401 (non autorisé)
            }
            bcrypt.compare(req.body.password, user.password)    // On compare le password entré et celui de l'user de la bdd
                .then(valid => {
                    if (!valid) {
                        return res.status(401).json({ message: 'Mot de passe incorrect !' });
                    }
                    // Fonction jwt.sign pour encoder le token avec l'userId + la clé cryptée + délais d'expiration
                    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
                    res.status(200).json({ userId: user.id, token });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};