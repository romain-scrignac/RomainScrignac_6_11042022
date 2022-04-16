// On importer multer
const multer = require('multer');

// On importe fs
const fs = require('fs');

// Création dictionnaire pour les extensions
const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png'
};

// Création d'un objet de configuration pour multer
const storage = multer.diskStorage({            // fonction diskStorage de multer qui a besoin de 2 paramètres: destination et filename
    destination: (req, file, callback) => {
        callback(null, 'images')                // pas d'erreur + dossier de destination
    },
    filename: (req, file, callback) => {
        const extension = MIME_TYPES[file.mimetype];    // On crée l'extension avec la propriété mimetype de file avec multer
        const reqSauce= req.body["sauce"];
        const sauceObject = JSON.parse(reqSauce);
        const sauceName = (sauceObject["name"]).toLowerCase().split(' ').join('+');
        callback(null, sauceName + '_' + Date.now() + '.' + extension);
    }
});

module.exports = multer({ storage }).single('image');   // fonction single de multer pour indiquer qu'il s'agit d'une seule image