// On importe jsonwebtoken
const jwt = require ('jsonwebtoken');

// On importe la clé
const key = require('../modules/module').key;

// On l'exporte
module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];  // On split l'espace pour retourner un tableau avec 2 éléments (bearer et token), on veut le 2ème
        const decodedToken = jwt.verify(token, key); // Méthode pour vérifier le token avec une clé cryptée
        const userId = decodedToken.userId;         // On récupère l'id qu'on a encodé exprès dans le token
        req.auth = { userId };                      // On ajoute un objet auth à la requête qui contient l'userId afin de sécuriser la route delete
        if (req.body.userId && req.body.userId !== userId) {
            throw 'User ID non valable !';          // On envoi cette erreur dans le catch si condition non valide
        } else {
            next();
        }
    } catch (error) {
        console.log("erreur")
        res.status(401).json({ error: error | 'Requête non authentifiée !' });      // code 401 pour erreur authentification
    }
};