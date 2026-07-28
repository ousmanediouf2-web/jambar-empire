function isAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ erreur: "Acces reserve a l administrateur" });
  }
  next();
}

module.exports = isAdmin;
