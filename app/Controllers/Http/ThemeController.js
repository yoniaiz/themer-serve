"use strict";
const { validateAll } = use("Validator");
const Event = use("Event");

const Theme = use("App/Models/Theme");

class ThemeController {
  async index() {
    const themes = (await Theme.all()).toJSON();
    return themes;
  }

  async _validateFields(request, required = true) {
    const req = required ? "required|" : "";
    const rules = {
      themeName: `${req}min:3|max:255|unique:themes,themeName`,
      mainColor: `${req}min:3|max:255`,
      secondaryColor: `${req}min:3|max:255`,
      fontColor: `${req}min:3|max:255`,
      backgroundColor: `${req}min:3|max:255`,
    };

    const validation = await validateAll(request.all(), rules);

    return [validation.fails(), validation.messages()];
  }

  _updateThemeFieldsFromBody(body, theme) {
    const regex = "^#[0-9A-Fa-f]{6}$";

    Object.keys(body).forEach((param) => {
      if (param !== "themeName" && !body[param].match(regex)) {
        throw new Error(`${param} is not in hex format`);
      }

      theme[param] = body[param];
    });
  }

  async _getTheme(id) {
    let error = null;
    const theme = await Theme.find(id);

    if (!theme) error = { error: "Theme not exist!" };

    return [theme, error];
  }

  async store({ auth, request, response }) {
    try {
      const [fail, messages] = await this._validateFields(request);

      if (fail) {
        return response.badRequest(messages);
      }

      const theme = new Theme();

      try {
        const user = await auth.getUser();
        this._updateThemeFieldsFromBody(request.body, theme);
        theme.username = user.username;
      } catch (e) {
        return response.badRequest({ error: e.message });
      }

      await theme.save();
      return response.created(theme);
    } catch (e) {
      console.error(e);
      return response.internalServerError({ error: "Something went wrong" });
    }
  }

  async show({ params, response }) {
    const [theme, error] = await this._getTheme(params.id);
    if (error) return response.notFound(error);

    return response.ok(theme);
  }

  async update({ auth, params, request, response }) {
    const [theme, error] = await this._getTheme(params.id);
    if (error) return response.notFound(error);

    const user = await auth.getUser();
    if (theme.username !== user.username) {
      return response.forbidden();
    }

    const [fail, messages] = await this._validateFields(request, false);

    if (fail) {
      return response.badRequest(messages);
    }
    try {
      this._updateThemeFieldsFromBody(request.body, theme);
    } catch (e) {
      return response.badRequest({ error: e.message });
    }

    await theme.save();

    return response.ok(theme);
  }

  async destroy({ auth, params, response }) {
    const [theme, error] = await this._getTheme(params.id);
    if (error) return response.notFound(error);

    const user = await auth.getUser();
    if (theme.username !== user.username) {
      return response.forbidden();
    }

    await theme.delete();

    return response.ok(theme);
  }

  async rateTheme({ auth, params, request, response }) {
    try {
      await auth.check();
      const { rate } = request.only(["rate"]);

      if (rate <= 0 || rate > 5) {
        return response.badRequest({ message: "invalid rate" });
      }

      const [theme, error] = await this._getTheme(params.id);
      if (error) return response.notFound(error);

      let count = theme.rateCount;
      const totalPrevRate = theme.rate * count;
      theme.rate = (totalPrevRate + rate) / ++count;
      theme.rateCount = count;

      await theme.save();

      Event.fire("new::rate", { auth, theme, rate});
      return response.json({
        theme,
        rate,
      });
    } catch (e) {
      return response.internalServerError({ error: e.message });
    }
  }
}

module.exports = ThemeController;
