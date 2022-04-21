// On importe jsonwebtoken
const jwt = require ('jsonwebtoken');

// On importe la clé
const key = require('../modules/module').key;

// On l'exporte
module.exports = (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        if(!authorization) throw "Utilisateur non authentifié !";
        const token = authorization.split(' ')[1];  // On retourne le token dans le header de la requête
        req.auth = jwt.verify(token, key);    // Méthode pour vérifier le token avec une clé cryptée
        next();
    } catch (error) {
        res.status(401).json({ error });  // code 401 (non autorisé)
    }
};