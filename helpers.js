function findUserByEmail(email, usersdb) {
  for (const u in usersdb) {
    if (email === usersdb[u].email) {
      return usersdb[u];
    }
  }
  return false;
};

module.exports = findUserByEmail;