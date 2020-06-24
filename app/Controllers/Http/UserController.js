"use strict";
const Helpers = use("Helpers");
const Env = use("Env");
const { validateAll } = use("Validator");
const fs = require("fs");

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

      const createdUser = await User.findBy("email", email)
      let accessToken = await auth.generate(createdUser);

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
        const themes = await user.themes().fetch();

        const send_notifications = await user.send_notifications().fetch();
        const received_notifications = await user
          .received_notifications()
          .orderBy("created_at", "desc")
          .fetch();

        let accessToken = await auth.generate(user);

        return response.json({
          user,
          access_token: accessToken,
          themes,
          send_notifications,
          received_notifications,
        });
      }
      return response.badRequest();
    } catch (e) {
      if (e.name === "UserNotFoundException") {
        return response.notFound({ error: "User not exist" });
      }
      return response.internalServerError({ error: e.message });
    }
  }

  show({ auth, params }) {
    if (auth.user.id !== Number(params.id)) {
      return "You cannot see someone else profile";
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

  async getImage({ request }) {
    const { path } = request.get();
    try {
      await fs.promises.access(Helpers.publicPath(path));
      return `${Env.get("APP_URL")}/${path}`;
    } catch (error) {
      return `${Env.get("APP_URL")}/default-avatar.png`;
    }
  }
}

module.exports = UserController;
