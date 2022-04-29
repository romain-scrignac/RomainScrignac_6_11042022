// On importer multer
const multer = require('multer');

// Création dictionnaire pour les extensions
const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png'
};

// Création d'un objet de configuration pour multer
const storage = multer.diskStorage({            // fonction diskStorage de multer qui a besoin de 2 paramètres: destination et filename
    destination: (req, file, callback) => {
        callback(null, 'images')
    },
    filename: (req, file, callback) => {
        const extension = MIME_TYPES[file.mimetype];    // On crée l'extension avec la propriété mimetype de file
        if (req.body.sauce && file) {
            const sauceObject = JSON.parse(req.body.sauce);
            const manufacturer = sauceObject.manufacturer;
            const description = sauceObject.description;
            const mainPepper = sauceObject.mainPepper;
            let sauceName = sauceObject.name;

            if (sauceName.trim() !== "" && manufacturer.trim() !== "" && description.trim() !== "" && mainPepper.trim() !== "") {
                let chars = /[À-ÿ!-@[-`{-~]/g;  // Caractères indésirables
                sauceName = sauceObject.name.replace(chars, '').toLowerCase().split(' ').join('+');
                callback(null, sauceName + '_' + Date.now() + '.' + extension);
            }
        } else {
            const error = new Error("file required");
            callback(error, '');
        }
    }
});

module.exports = multer({ storage }).single('image');   // fonction single de multer pour indiquer qu'il s'agit d'une seule image