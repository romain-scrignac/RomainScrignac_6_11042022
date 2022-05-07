module.exports = 
/**
 * @description This function checks the validity of the form
 * 
 * @param {Object} req the request to be processed
 * @param {Object} sauceObject the body of the request
 **/
function validateSaucePayload(req, sauceObject) {
    const {
        manufacturer, 
        description,
        mainPepper,
        heat,
        userId,
        name
    } = sauceObject;

    if (!sauceObject) {
        throw 'Bad request !';
    } 
    else if (!name || !manufacturer || !description || !mainPepper || !heat || !userId) {
        throw 'Invalid form !';
    } 
    else if (name.trim() === "" || manufacturer.trim() === "" || description.trim() === "" 
    || mainPepper.trim() === "" || userId.trim() === "") {
        throw 'Missing field(s) !';
    }
    else if (typeof name !== "string" || typeof manufacturer !== "string" || typeof description !== "string" 
    || typeof mainPepper !== "string" || typeof heat !== "number" || typeof userId !== "string" || userId !== req.auth.userId) {
        throw 'Invalid field(s) !';
    }
    else if (!Number.isInteger(heat) || heat < 1 || heat > 10) {
        throw 'Invalid number for heat !';
    }
    else if (name.length < 3 || name.length >= 30 || manufacturer.length < 3 || description.length < 30) {
        throw 'Not enough characters !';
    }
};