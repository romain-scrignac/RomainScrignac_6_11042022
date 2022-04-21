// On importe Sauce
const Sauce = require('../models/Sauce');

// On importe fs de node (filesystem)
const fs = require('fs');

// Fonction qui affiche toutes les sauces
exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
};

// Fonction qui affiche une seule sauce
exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id})
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));   // Erreur 404 pour objet non trouvé
};

// Fonction pour créer une nouvelle sauce
exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);      // On extrait l'objet JSON de sauce (pour les images)
    const sauce = new Sauce({                   
        ...sauceObject,           // ... -> Opérateur spread pour faire une copie de tous les éléments de req.body
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`  // Pour générer l'url du fichier dynamiquement
    });
    sauce.save()        // Méthode pour enregistrer le nouvel objet dans la bdd
        .then(() => res.status(201).json({ message: 'Sauce enregistrée !' }))   // Envoi d'une réponse pour éviter l'expiration de la requête 
        .catch(error => res.status(400).json({ error }));                       // code 201 pour réussite et 400 pour échec
};


// Fonction pour modifier une sauce
exports.modifySauce = async (req, res, next) => {
/**
 * @description This function looks for the url of the image and returns its name 
 *              before modifying the sauce. If the creator of the sauce is not authenticated 
 *              his name will be undefined and the rest of the code will not be executed.
 **/
    async function getUrl() {
        try {
            const sauce = await Sauce.findOne({ _id: req.params.id })
            if (sauce._id.valueOf() !== req.params.id) {
                throw 'Sauce non trouvée !';
            }
            if (!req.auth.userId || (sauce.userId !== req.auth.userId)) {
                throw 'Requête non autorisée !';
            } 
            const imgUrl = sauce.imageUrl;
            const fileName = imgUrl.split('images/')[1];
            return fileName;
        } catch (error) {
            res.status(400).json({ error });
        }
    }
    const fileName = await getUrl();

    if (fileName !== undefined) {
        // Condition ternaire pour vérifier si nouvelle image et exécution différente selon oui ou non
        const sauceObject = req.file ?
        {
            ...JSON.parse(req.body.sauce),      // On récupère l'objet sauce et on défini son adresse
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body };

        // On met à jour la sauce et on supprime l'ancienne image si nouvelle
        await Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })  
            .then(() => {
                if(req.file) {
                    fs.unlink(`images/${fileName}`, (err) => {
                        if (err) throw err;
                        console.log(`Ancienne image (${fileName}) supprimée`);
                    });
                } else { console.log("Pas de nouvelle image"); }
                res.status(200).json({ message: 'Sauce modifiée !' });
            })
            .catch(error => res.status(400).json({ error }));
    }
};

// Fonction pour supprimer une sauce
exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            if (!sauce) {
                throw 'Sauce non trouvée !';
            }
            if (sauce.userId !== req.auth.userId) {
                throw 'Requête non autorisée !';
            }
            const filename = sauce.imageUrl.split('images/')[1];    // On récupère le nom de l'image
            fs.unlink(`images/${filename}`, () => {                 // unlink de fs pour supprimer le fichier du serveur
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Sauce supprimée !' }))
                    .catch(error => res.status(400).json({ error }));
            })
        })
        .catch(error => res.status(500).json({ error }));
};

// Fonction pour le système de likes
exports.likeSauce = async (req, res, next) => {
    try {
        const sauce = await Sauce.findOne({ _id: req.params.id });
        const like = req.body.like;
        const userId = req.body.userId;

        if (!sauce.usersLiked.includes(userId) && like === 1) {             // Si l'utilisateur like une sauce
            await Sauce.updateOne(
            {
                _id: req.params.id
            },
            {
                $inc: { likes: 1 }, $push: { usersLiked: userId }
            })
            res.status(200).json({ message: 'Like ajouté !' });
        } else if (sauce.usersLiked.includes(userId) && like === 0) {       // Si l'utilisateur retire son like
            await Sauce.updateOne(
            { 
                _id: req.params.id 
            }, 
            { 
                $inc: { likes: -1 }, $pull: { usersLiked: userId }
            })
            res.status(200).json({ message: 'Like retiré !' });
        } else if (!sauce.usersDisliked.includes(userId) && like === -1) {  // Si l'utilisateur dislike une sauce
            await Sauce.updateOne(
            { 
                _id: req.params.id 
            }, 
            { 
                $inc: { dislikes: 1 }, $push: { usersDisliked: userId }
            })
            res.status(200).json({ message: 'Dislike ajouté !' });
        } else if (sauce.usersDisliked.includes(userId) && like === 0) {    // Si l'utilisateur retire son dislike
            await Sauce.updateOne(
            { 
                _id: req.params.id 
            }, 
            { 
                $inc: { dislikes: -1 }, $pull: { usersDisliked: userId }
            })
            res.status(200).json({ message: 'Dislike retiré !' });
        }
    }
    catch(error) {
        res.status(400).json({ error });
    }
};