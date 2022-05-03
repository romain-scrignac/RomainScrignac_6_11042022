// On importe jsonwebtoken
const jwt = require ('jsonwebtoken');

// On importe le modèle User
const User = require('../models/User');

// On l'exporte
module.exports = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        if(!authorization) {    // Vérification de présence du header authorization
            throw 'Unauthenticated user !';
        }
        const token = authorization.split(' ')[1];
        req.auth = jwt.verify(token, process.env.JWT_KEY);      // Vérification du token et on le retourne dans le header de la requête
        const user = await User.findOne({ _id: req.auth.userId });
        if(!user) {     // Vérification de l'existence de l'utilisateur dans la bdd
            throw 'Invalid user id !';
        }
        next();
    } catch (error) {
        switch (error) {
            case "Unauthenticated user !":
                statusCode = 401;
                break;
            case "Invalid user id !":
                statusCode = 422;
                break;
            default:
                statusCode = 500;
        }
        res.status(statusCode).json({ error });
    }
};