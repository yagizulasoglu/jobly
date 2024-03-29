"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  const authHeader = req.headers?.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^[Bb]earer /, "").trim();

    try {
      res.locals.user = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      /* ignore invalid tokens (but don't store user!) */
    }
  }
  return next();

}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  if (res.locals.user?.username) return next();
  throw new UnauthorizedError();
}

/** Middleware to use when they must be admin.
 *
 * If not, raises Unauthorized.
*/

function ensureAdmin(req, res, next) {
  if (res.locals.user?.isAdmin || res.locals.sameUser) return next();
  throw new UnauthorizedError();
}

/** Middleware to use when they must be admin or that specific user.
 *
 * If not, raises Unauthorized.
*/

function ensureCorrectUserOrAdmin(req, res, next) {
  const currentUser = res.locals.user?.username;
  const user = req.params.username;
  if (res.locals.user?.isAdmin || currentUser === user) return next();
  throw new UnauthorizedError();
}

// function ensureCorrectUser(req, res, next) {
//   console.log('ran correct user in middleware')
//   const specificUser = req.params.username;
//   const currentUser = res.locals.user?.username;
//   // console.log('req params', req.params)
//   // console.log('cur user', currentUser)
//   // check current user against specific user
//   // if they don't match, call next
//   // if they do, set flag on req of sameUser = true

//   // boolean
//   res.locals.sameUser = (specificUser === currentUser);
//   console.log('res.locals.sameUser', res.locals.sameUser)
//   return next();
// }

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureCorrectUserOrAdmin
};
