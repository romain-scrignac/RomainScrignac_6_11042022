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
            const heat = sauceObject.heat;
            const userId = sauceObject.userId;
            let sauceName = sauceObject.name;

            if (file.mimetype !== "image/jpeg" && file.mimetype !== "image/png") {
                const error = new Error('Invalid image format');
                callback(error, '');
            } else if (!sauceName || !manufacturer || !description || !mainPepper || !heat || !userId) {
                const error = new Error("Invalid form");
                callback(error, '');
            } else if (typeof sauceName !== 'string' || typeof manufacturer !== 'string' || typeof description !== 'string' 
            || typeof mainPepper !== 'string' || typeof userId !== 'string' || typeof heat !== 'number') {
                const error = new Error("Invalid form");
                callback(error, '');
            } else if (sauceName.trim() === "" && manufacturer.trim() === "" && description.trim() === "" && mainPepper.trim() === "" 
            && heat.trim() === "") {
                const error = new Error("Missing field");
                callback(error, '');
            } else {
                const chars = /[À-ÿ!-@[-`{-~]/g;  // Caractères indésirables (Table Unicode/U0000)
                sauceName = sauceObject.name.replace(chars, '').toLowerCase().split(' ').join('+');
                callback(null, sauceName + '_' + Date.now() + '.' + extension);
            } 
        } else {
            const error = new Error("File required");
            callback(error, '');
        }
    }
});

module.exports = multer({ storage }).single('image');   // fonction single de multer pour indiquer qu'il s'agit d'une seule image