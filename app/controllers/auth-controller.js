module.exports = function (roles, userRol) {
    if (roles.includes(userRol)) {
        return true;
    } else {
        return false;
    }
}