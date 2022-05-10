// On importe mongoose
const mongoose = require("mongoose");

// On importe fs de node (filesystem)
const fs = require('fs');

// On importe le modèle Sauce
const Sauce = require('../models/Sauce');

// On importe la fonction de validation du formulaire
const validateSaucePayload = require("../functions/validateform");

// Fonction qui affiche toutes les sauces
exports.getAllSauces = (req, res) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
};

// Fonction qui affiche une seule sauce
exports.getOneSauce = (req, res) => {
    Sauce.findOne({ _id: req.params.id})
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));
};

// Fonction pour créer une nouvelle sauce
exports.createSauce = async (req, res) => {
    try {
        if (!req.file) {
            throw 'Image required !';
        }
        const sauceObject = JSON.parse(req.body.sauce);
        
        // Vérification du formulaire
        validateSaucePayload(req, sauceObject);

        const sauce = new Sauce({
            ...sauceObject,
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`  // On génère l'url du fichier dynamiquement
        });
        const saveSauce = await sauce.save();    // On ajoute la sauce à la base de données
        if(!saveSauce) {
            throw 'An error has occurred !';
        }
        res.status(201).json({ message: 'Sauce registered !' });
    } catch (error) {
        res.status(500).json({ error });
    }
};

// Fonction pour modifier une sauce
exports.modifySauce = async (req, res) => {
    try {
        if(!mongoose.isValidObjectId(req.params.id)) {
            throw 'Invalid sauce id !';
        }
        const sauce = await Sauce.findOne({ _id: req.params.id });
        if (!sauce) {
            throw 'Sauce not found !';
        }
        if (!req.auth.userId || (sauce.userId !== req.auth.userId)) {
            throw 'Unauthorized request !';
        }
        // On réucpère le nom de l'ancienne image
        const fileName = sauce.imageUrl.split('images/')[1];

        // Condition ternaire pour vérifier si nouvelle image et exécution différente selon oui ou non
        const sauceObject = req.file ?
        {
            ...JSON.parse(req.body.sauce),      // On récupère l'objet sauce et on défini l'adresse de l'image
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body };

        // Vérification du formulaire
        validateSaucePayload(req, sauceObject);
        
        // Si nouvelle image on supprime l'ancienne
        if (req.file) {
            fs.unlink(`images/${fileName}`, (error) => {
                if (error) throw error;
                console.log(`Old image deleted (${fileName})`);
            });
        }
        const saveSauce = await Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id });
        if (!saveSauce) {
            throw 'An error has occured !';
        }
        res.status(200).json({ message: 'Sauce modified !' });
    } catch (error) {
        switch(error) {
            case "Invalid sauce id !":
                statusCode = 422;   // Entité non traitable
                break;
            case "Sauce not found !":
                statusCode = 404;   // Objet non trouvé
                break;
            case "Unauthorized request !":
                statusCode = 403;   // Accès interdit
                break;
            default:
                statusCode = 400;   // Mauvaise requête
        }
        res.status(statusCode).json({ error });
    }
};

// Fonction pour supprimer une sauce
exports.deleteSauce = async (req, res) => {
    try {
        if(!mongoose.isValidObjectId(req.params.id)) {
            throw 'Invalid sauce id !';
        }
        const sauce = await Sauce.findOne({ _id: req.params.id })
        if (!sauce) {
            throw 'Sauce not found !';
        }
        if (!req.auth.userId || (sauce.userId !== req.auth.userId)) {
            throw 'Unauthorized request !';
        }
        const fileName = sauce.imageUrl.split('images/')[1];    // On récupère le nom de l'image
        fs.unlink(`images/${fileName}`, async () => {           // On supprime le fichier du serveur
            await Sauce.deleteOne({ _id: req.params.id })
            res.status(200).json({ message: 'Deleted sauce !' });
        });
    } catch (error) {
        switch (error) {
            case "Invalid sauce id !":
                statusCode = 422;   // Entité non traitable
                break;
            case "Sauce not found !":
                statusCode = 404;   // Objet non trouvé
                break;
            case "Unauthorized request !":
                statusCode = 403;   // Accès interdit
                break;
            default:
                statusCode = 400;   // Mauvaise requête
        }
        res.status(statusCode).json({ error });
    }
};

// Fonction pour le système de likes
exports.likeSauce = async (req, res) => {
    try {
        if(!mongoose.isValidObjectId(req.params.id)) {
            throw 'Invalid sauce id !';
        }
        const sauce = await Sauce.findOne({ _id: req.params.id });
        const like = req.body.like;
        const userId = req.body.userId;
        const usersLiked = sauce.usersLiked;
        const usersDisliked = sauce.usersDisliked;

        if(!mongoose.isValidObjectId(userId) || !userId) {
            throw 'Invalid user id !';
        }

        if (req.auth.userId !== userId) {
            throw 'Unauthorized request !'
        }

        // Si l'utilisateur like une sauce
        if (!usersLiked.includes(userId) && !usersDisliked.includes(userId) && like === 1) {
            await Sauce.updateOne(
                { _id: req.params.id }, {$inc: { likes: 1 }, $push: { usersLiked: userId }}
            )
            res.status(200).json({ message: 'Like added !' });
        }
        // Si l'utilisateur retire son like
        else if (usersLiked.includes(userId) && like === 0) {
            await Sauce.updateOne(
                { _id: req.params.id }, {$inc: { likes: -1 }, $pull: { usersLiked: userId }}
            )
            res.status(200).json({ message: 'Like removed !' });
        }
        // Si l'utilisateur dislike une sauce
        else if (!usersDisliked.includes(userId) && !usersLiked.includes(userId) && like === -1) {
            await Sauce.updateOne(
                { _id: req.params.id }, {$inc: { dislikes: 1 }, $push: { usersDisliked: userId }}
            )
            res.status(200).json({ message: 'Dislike added !' });
        }
        // Si l'utilisateur retire son dislike
        else if (usersDisliked.includes(userId) && like === 0) {
            await Sauce.updateOne(
                { _id: req.params.id }, {$inc: { dislikes: -1 }, $pull: { usersDisliked: userId }}
            )
            res.status(200).json({ message: 'Dislike removed !' });
        }
        else {
            throw 'Wrong request !';
        }
    } catch(error) {
        switch (error) {
            case "Invalid sauce id !":
            case "Invalid user id !":
                statusCode = 422;   // Entité non traitable
                    break;
            case "Unauthorized request !":
                statusCode = 403;   // Accès interdit
                break;
            default:
                statusCode = 400;   // Mauvaise requête
        }
        res.status(statusCode).json({ error });
    }
};