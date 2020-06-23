const Event = use("Event");
const Notification = use("App/Models/Notification");

Event.on("new::rate", async ({ auth, theme, rate }) => {
  const user = await auth.getUser();

  const notification = new Notification();
  notification.username = user.username;
  notification.themeId = theme.id;
  notification.payload = `${user.username} rated your theme ${rate}`;

  await notification.save();
});
