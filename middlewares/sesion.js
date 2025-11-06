
function verificarSesion(req, res, next) {
    if (req.session && req.session.usuario) {
        next();
    } else {
        res.redirect('/General/ingreso.html');
    }
}

function evitarCache(req, res, next) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
}

module.exports = { verificarSesion, evitarCache };