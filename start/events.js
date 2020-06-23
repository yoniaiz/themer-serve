const Event = use("Event");
const Notification = use("App/Models/Notification");

Event.on("new::rate", async ({ auth, theme, rate }) => {
  
  try {
    const user = await auth.getUser();
    const notification = new Notification();

    notification.from = user.username;
    notification.to = (await theme.user().fetch()).username;
    notification.themeId = theme.id;
    notification.payload = rate;

    // TODO add login to if user rated few times

    await notification.save();
  } catch (e) {
    console.error("error ! ",e.message);
  }
});
