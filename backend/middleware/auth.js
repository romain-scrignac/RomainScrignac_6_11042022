// On importe jsonwebtoken
const jwt = require ('jsonwebtoken');

// On importe la clé
const key = require('../modules/module').key;

const User = require('../models/User');

// On l'exporte
module.exports = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        if(!authorization) throw "Utilisateur non authentifié !";   // Vérification de présence du header authorization
        const token = authorization.split(' ')[1];  // On défini le token du header
        req.auth = jwt.verify(token, key);    // Vérification du token et on le retourne dans le header de la requête
        const user = await User.findOne({ _id: req.auth.userId });
        if(!user) throw 'Id d\'utilisateur invalide !';     // Vérification de l'existence de l'utilisateur dans la bdd
        next();
    } catch (error) {
        res.status(401).json({ error });  // code 401 (non autorisé)
    }
};