// On importe express + création du routeur
const express = require('express');
const router = express.Router();

// On importe sauce (controllers)
const sauceCtrl = require('../controllers/sauce');

// Importation de auth pour vérifier l'authentification
const auth = require('../middleware/auth');

// Importation de multer pour la gestion des images
const multer = require('../middleware/multer-config');

// Middleware pour renvoyer les erreurs au format json
const multerMiddleware = (req, res, next) => {multer(req, res, err => {
    if (err) {
        if (!err.message) {
            err.message = err;
        }
        res.status(400).json({ error: err.message });
    } else {
        next();
    }
})};

// On importe les routes avec sauceCtrl et la fonction createSauce. On ajoute auth et multer
router.get('/', auth, sauceCtrl.getAllSauces);                      // Requête GET pour récupérer toutes les sauces
router.get('/:id', auth, sauceCtrl.getOneSauce);                    // Requête GET pour récupérer une seule sauce
router.post('/', auth, multerMiddleware, sauceCtrl.createSauce);    // Requête POST pour créer une nouvelle sauce
router.put('/:id', auth, multerMiddleware, sauceCtrl.modifySauce);  // Requête PUT pour modifier une sauce
router.delete('/:id', auth, sauceCtrl.deleteSauce);                 // Requête DELETE pour supprimer une sauce
router.post('/:id/like', auth, sauceCtrl.likeSauce);                // Requête POST pour définir le statut "Like" de la sauce

// On exporte le routeur
module.exports = router;