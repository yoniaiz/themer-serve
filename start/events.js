const Event = use("Event");
const Notification = use("App/Models/Notification");

Event.on("new::rate", async ({ user, theme, rate }) => {
  try {
    const notification = new Notification();

    notification.from = user.username;
    notification.to = (await theme.user().fetch()).username;
    notification.themeId = theme.id;
    notification.payload = rate;
    notification.message = `${user.username} rated your theme ${theme.themeName} ${rate}`;

    // TODO add login to if user rated few times

    await notification.save();
  } catch (e) {
    console.error("error ! ", e.message);
  }
});
