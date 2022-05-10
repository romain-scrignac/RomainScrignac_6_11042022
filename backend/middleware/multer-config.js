// On importer multer
const multer = require('multer');

// On importe la fonction de validation du formulaire
const validateSaucePayload = require("../functions/validateform");

// Création dictionnaire pour les extensions
const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png'
};

// Création d'un objet de configuration pour multer
const storage = multer.diskStorage({    // fonction diskStorage de multer qui a besoin de 2 paramètres: destination et filename
    destination: (req, file, callback) => {
        callback(null, 'images')
    },
    filename: (req, file, callback) => {
        const extension = MIME_TYPES[file.mimetype];    // On crée l'extension avec la propriété mimetype de file
        const sauceObject = JSON.parse(req.body.sauce);
        let sauceName = sauceObject.name;
        const chars = /[À-ÿ!-@[-`{-~]/g;  // Caractères indésirables pour un nom de fichier (Table Unicode/U0000)
        sauceName = sauceObject.name.replace(chars, '').toLowerCase().split(' ').join('+');
        callback(null, sauceName + '_' + Date.now() + '.' + extension);
    }
});

module.exports = multer({
    storage,
    fileFilter: function (req, file, callback) {    

        let success = true;
        try {
            if (req.body.sauce != undefined) {
                const sauceObject = JSON.parse(req.body.sauce);
                validateSaucePayload(req, sauceObject); // Check du formulaire avant de sauvegarder l'image sur le serveur
            } else {
                success = false;
                callback(new Error("Invalid Form !"));
            }
        } catch (error) {
            success = false;
            callback(new Error(error));
        }
        
        // On vérifie le format de l'image
        if(file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png') {
            success = false;
            callback({ message: "Invalid Image !" }, false);
        }

        if (success) {
            callback(null, true);
        }
    },
    limits: {   // On vérifie le poids de l'image
        fileSize: 1024 * 1024
}}).single('image');   // fonction single de multer pour indiquer qu'il s'agit d'une seule image