"use strict";
const Database = use("Database");
const { validateAll } = use("Validator");

const User = use("App/Models/User");

class UserController {
  async register({ auth, request, response }) {
    let user;
    const rules = {
      username: `required|min:3|max:255|unique:users,username`,
      email: `required|email|unique:users,email`,
      password: "required",
    };

    const validation = await validateAll(request.all(), rules);
    if (validation.fails()) {
      return response.badRequest(validation.messages());
    }

    try {
      const { username, email, password } = request.only([
        "username",
        "email",
        "password",
      ]);

      user = await User.create({
        username,
        email,
        password,
      });

      let accessToken = await auth.generate(user);
      return response.created({ user: user, access_token: accessToken });
    } catch (e) {
      console.error(e);
      return response.internalServerError({ error: e.message });
    }
  }

  async login({ auth, request, response }) {
    const { email, password } = request.all();

    try {
      if (await auth.attempt(email, password)) {
        const user = await User.findBy("email", email);
        const themes = await Database.table("themes").where(
          "username",
          user.username
        );
        let accessToken = await auth.generate(user);
        return response.json({ user: user, access_token: accessToken, themes });
      }
      return response.badRequest({ error: "User not exist" });
    } catch (e) {
      return response.internalServerError({ error: e.message });
    }
  }

  show({ auth, params }) {
    if (auth.user.id !== Number(params.id)) {
      return "You cannot see someone else's profile";
    }
    return auth.user;
  }
}

module.exports = UserController;
