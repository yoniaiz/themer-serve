"use strict";

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use("Route");

Route.resource("theme", "ThemeController").middleware("auth");
Route.post("theme/rate/:id", "ThemeController.rateTheme").middleware("auth");

Route.group(() => {
  Route.get("user/:id", "UserController.show");
  Route.post("login", "UserController.login");
  Route.post("register", "UserController.register");
  Route.post("upload", "UserController.uploadProfile").middleware("auth");
  Route.get("showProfile", "UserController.getImage");
}).prefix("users");

Route.post("/notification", "NotificationController.markAsOpened").middleware(
  "auth"
);

Route.any("*", ({ response }) =>
  response.notFound({ error: "Route not exist!" })
);
