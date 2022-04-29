// On importe mongoose
const mongoose = require("mongoose");

// On importe fs de node (filesystem)
const fs = require('fs');

// On importe le modèle Sauce
const Sauce = require('../models/Sauce');

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
        .catch(error => res.status(404).json({ error }));
};

// Fonction pour créer une nouvelle sauce
exports.createSauce = async (req, res, next) => {
    try {
        const sauceObject = JSON.parse(req.body.sauce);     // On extrait l'objet JSON de sauce (pour les images)
        const sauce = new Sauce({
            ...sauceObject,
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`  // On génère l'url du fichier dynamiquement
        });
        const saveSauce = await sauce.save();    // On ajoute la sauce à la base de données
        if(!saveSauce) {
            throw 'Une erreur est survenue !';
        }
        res.status(201).json({ message: `Sauce ${sauceObject.name} enregistrée !` });
    } catch (error) {
        res.status(500).json({ error });
    }
};

// Fonction pour modifier une sauce
exports.modifySauce = async (req, res, next) => {
/**
 * @description This function looks for the url of the image and returns its name 
 *              before modifying the sauce. If the creator of the sauce is not authenticated 
 *              his name will be undefined and the rest of the code will not be executed.
 **/
    async function getFileName() {
        try {
            if(!mongoose.isValidObjectId(req.params.id)) {
                throw 'Id de Sauce invalide !';
            }
            const sauce = await Sauce.findOne({ _id: req.params.id });
            if (!sauce) {
                throw 'Sauce non trouvée !';
            }
            if (!req.auth.userId || (sauce.userId !== req.auth.userId)) {
                throw 'Requête non autorisée !';
            } 
            const imgUrl = sauce.imageUrl;
            const fileName = imgUrl.split('images/')[1];
            return fileName;
        } catch (error) {
            switch(error) {
                case "Id de Sauce invalide !":
                    statusCode = 422;   // Entité non traitable
                    break;
                case "Sauce non trouvée !":
                    statusCode = 404;   // Objet non trouvé
                    break;
                case "Requête non autorisée !":
                    statusCode = 403;   // Accès interdit
                    break;
                default:
                    statusCode = 400;   // Mauvaise requête
            }
            res.status(statusCode).json({ error });
        }
    }
    const fileName = await getFileName();

    if (fileName !== undefined) {
        // Condition ternaire pour vérifier si nouvelle image et exécution différente selon oui ou non
        const sauceObject = req.file ?
        {
            ...JSON.parse(req.body.sauce),      // On récupère l'objet sauce et on défini l'adresse de l'image
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body };

        // On met à jour la sauce et on supprime l'ancienne image si nouvelle
        await Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })  
            .then(() => {
                if(req.file) {
                    fs.unlink(`images/${fileName}`, (error) => {
                        if (error) throw error;
                        console.log(`Ancienne image (${fileName}) supprimée`);
                    });
                } else { console.log("Pas de nouvelle image"); }
                res.status(200).json({ message: 'Sauce modifiée !' });
            })
            .catch(error => res.status(400).json({ error }));
    }
};

// Fonction pour supprimer une sauce
exports.deleteSauce = async (req, res, next) => {
    try {
        if(!mongoose.isValidObjectId(req.params.id)) {
            throw 'Id de Sauce invalide !';
        }
        const sauce = await Sauce.findOne({ _id: req.params.id })
        if (!sauce) {
            statusCode = 404;
            throw 'Sauce non trouvée !';
        }
        if (!req.auth.userId || (sauce.userId !== req.auth.userId)) {
            statusCode = 403;
            throw 'Requête non autorisée !';
        }
        const fileName = sauce.imageUrl.split('images/')[1];    // On récupère le nom de l'image
        fs.unlink(`images/${fileName}`, async () => {           // On supprime le fichier du serveur
            await Sauce.deleteOne({ _id: req.params.id })
            res.status(200).json({ message: 'Sauce supprimée !' });
        });
    } catch (error) {
        switch (error) {
            case "Id de Sauce invalide !":
                statusCode = 422;   // Entité non traitable
                break;
            case "Sauce non trouvée !":
                statusCode = 404;   // Objet non trouvé
                break;
            case "Requête non autorisée !":
                statusCode = 403;   // Accès interdit
                break;
            default:
                statusCode = 400;   // Mauvaise requête
        }
        res.status(statusCode).json({ error });
    }
};

// Fonction pour le système de likes
exports.likeSauce = async (req, res, next) => {
    try {
        if(!mongoose.isValidObjectId(req.params.id)) {
            throw 'Id de Sauce invalide !';
        }
        const sauce = await Sauce.findOne({ _id: req.params.id });
        const like = req.body.like;
        const userId = req.body.userId;
        const usersLiked = sauce.usersLiked;
        const usersDisliked = sauce.usersDisliked;

        if(!mongoose.isValidObjectId(userId) || !userId) {
            throw 'Id d\'utilisateur invalide !';
        }

        // Si l'utilisateur like une sauce
        if (!usersLiked.includes(userId) && !usersDisliked.includes(userId) && like === 1) {
            await Sauce.updateOne(
                { _id: req.params.id }, {$inc: { likes: 1 }, $push: { usersLiked: userId }}
            )
            res.status(200).json({ message: 'Like ajouté !' });
        }
        // Si l'utilisateur retire son like
        if (usersLiked.includes(userId) && like === 0) {
            await Sauce.updateOne(
                { _id: req.params.id }, {$inc: { likes: -1 }, $pull: { usersLiked: userId }}
            )
            res.status(200).json({ message: 'Like retiré !' });
        }
        // Si l'utilisateur dislike une sauce
        if (!usersDisliked.includes(userId) && !usersLiked.includes(userId) && like === -1) {
            await Sauce.updateOne(
                { _id: req.params.id }, {$inc: { dislikes: 1 }, $push: { usersDisliked: userId }}
            )
            res.status(200).json({ message: 'Dislike ajouté !' });
        }
        // Si l'utilisateur retire son dislike
        if (usersDisliked.includes(userId) && like === 0) {
            await Sauce.updateOne(
                { _id: req.params.id }, {$inc: { dislikes: -1 }, $pull: { usersDisliked: userId }}
            )
            res.status(200).json({ message: 'Dislike retiré !' });
        }
    } catch(error) {
        switch (error) {
            case 'Id de Sauce invalide !':
            case 'Id d\'utilisateur invalide !':
                statusCode = 422;
                    break;
            default:
                statusCode = 400;
        }
        res.status(statusCode).json({ error });
    }
};