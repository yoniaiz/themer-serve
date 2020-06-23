"use strict";
const Database = use("Database");
const Event = use("Event");
const fs = require("fs");
const Env = use("Env");
const { validateAll } = use("Validator");

const User = use("App/Models/User");

class UserController {
  async register({ auth, request, response }) {
    let user;
    const rules = {
      username: `required|min:3|max:255|unique:users,username`,
      email: `required|email|unique:users,email`,
      password: "required|min:6|max:255",
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

      Event.fire("new::user", user);
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

  async uploadProfile({ auth, request, response }) {
    const randomNumber =
      new Date().getTime() + Math.floor(Math.random() * 1000);

    const profilePic = request.file("profile_pic", {
      types: ["image"],
      size: ["2mb"],
      allowedExtensions: ["jpg", "png", "jpeg"],
    });

    if (!profilePic) {
      return response.badRequest();
    }

    const name = randomNumber + "custom-name.jpg";

    await profilePic.move("public", {
      name,
    });

    if (!profilePic.moved()) {
      return profilePic.error();
    }

    const user = await auth.getUser();
    const fileName = `${name}`;

    user.profilePath = fileName;
    await user.save();

    return response.created({ user });
  }

  async getImage({ request, response }) {
    const { path } = request.get();
    try {
      await fs.promises.access(`public/${path}`);
      return `${Env.get("APP_URL")}/${path}`;
    } catch (error) {
      return `${Env.get("APP_URL")}/default-avatar.png`;
    }
  }
}

module.exports = UserController;
