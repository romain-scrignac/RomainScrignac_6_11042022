// On importe Sauce
const Sauce = require('../models/Sauce');

// On importe fs de node (filesystem)
const fs = require('fs');

// Fonction qui affiche toutes les sauces
exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))       // On renvoi le tableau des sauces de la bdd
        .catch(error => res.status(400).json({ error }));
};

// Fonction qui affiche une seule sauce, grâce à son identifiant (:id pour passer l'id en paramètres)
exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id})                    // Méthode pour retourner la sauce unique qui a la même _id que le paramètre de la requête
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));   // Erreur 404 pour objet non trouvé
};

// Fonction pour créer une nouvelle sauce
exports.createSauce = (req, res, next) => {
    const sauceObjet = JSON.parse(req.body.sauce);      // On extrait l'objet JSON de sauce (pour les images)
    const sauce = new Sauce({                   
        ...sauceObjet,                                  // ... -> Opérateur spread pour faire une copie de tous les éléments de req.body
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`  // Pour générer l'url du fichier dynamiquement
    });
    sauce.save()                                                                // Méthode pour enregistrer le nouvel objet dans la bdd
        .then(() => res.status(201).json({ message: 'Sauce enregistrée !' }))   // Envoi d'une réponse pour éviter l'expiration de la requête 
        .catch(error => res.status(400).json({ error }));                       // code 201 pour réussite et 400 pour échec
};

// Fonction pour modifier une sauce
exports.modifySauce = (req, res, next) => {
    // TODO get previous document before update => to have its url

    async function getUrl() {
        let imgUrl;
        try {
            const sauce = await Sauce.findOne({ _id: req.params.id });
            imgUrl = sauce.imageUrl;
        } catch(err) {
            throw err;
        }
        console.log(imgUrl);
        return imgUrl;
    }
    console.log(getUrl().then(result => result));

    /*
    const sauceObjet = req.file ?           // Condition ternaire pour vérifier si nouvelle image et exécution différente selon oui ou non
    {
        ...JSON.parse(req.body.sauce),      // On récupère l'objet sauce et on défini son adresse
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
    Sauce.updateOne({ _id: req.params.id }, { ...sauceObjet, _id: req.params.id })  // Méthode pour mettre à jour la sauce avec 2 paramètres
        .then(() => {
            // TODO delete the image
            const imgUrl = getUrl();
            fs.unlink(imgUrl), () => {
                res.status(200).json({ message: 'Sauce modifiée !' });
            }
        })
        .catch(error => res.status(400).json({ error }));
    */
};

// Fonction pour supprimer une sauce
exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            if (!sauce) {
                return res.status(404).json({
                    error: new Error('Sauce non trouvée !')
                });
            }
            if (sauce.userId !== req.auth.userId) {
                return res.status(400).json({
                    error: new Error('Requête non autorisée !')
                });
            }
            const filename = sauce.imageUrl.split('images/')[1];    // On récupère le nom de l'image
            fs.unlink(`images/${filename}`, () => {                 // Fonction unlink de fs pour supprimer le fichier
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
}