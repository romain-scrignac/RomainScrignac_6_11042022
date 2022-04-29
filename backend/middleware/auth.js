// On importe jsonwebtoken
const jwt = require ('jsonwebtoken');

// On importe la clé
const key = require('../modules/module').key;

// On importe le modèle User
const User = require('../models/User');

// On l'exporte
module.exports = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        if(!authorization) {    // Vérification de présence du header authorization
            throw "Utilisateur non authentifié !";
        }
        const token = authorization.split(' ')[1];
        req.auth = jwt.verify(token, key);      // Vérification du token et on le retourne dans le header de la requête
        const user = await User.findOne({ _id: req.auth.userId });
        if(!user) {     // Vérification de l'existence de l'utilisateur dans la bdd
            throw "Id d\'utilisateur invalide !";
        }
        next();
    } catch (error) {
        switch (error) {
            case "Utilisateur non authentifié !":
                statusCode = 401;
                break;
            case "Id d\'utilisateur invalide !":
                statusCode = 422;
                break;
            default:
                statusCode = 500;
        }
        res.status(statusCode).json({ error });
    }
};