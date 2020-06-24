"use strict";
const Notification = use("App/Models/Notification");

class NotificationController {
  async markAsOpened({ auth, request, response }) {
    try {
      const { notifications } = request.only(["notifications"]);
      const user = await auth.getUser();

      notifications.forEach(async ({ id }) => {
        try {
          const notification = await Notification.find(id);
          if (notification.to === user.username) {
            notification.opened = true;
            await notification.save();
          }
        } catch (e) {
          console.error(e);
        }
      });

      return response.ok();
    } catch (e) {
      console.error(e);
      return response.initialServerError({ error: e.message });
    }
  }
}

module.exports = NotificationController;
