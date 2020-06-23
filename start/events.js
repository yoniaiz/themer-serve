const Event = use("Event");

Event.on("new::user", async (user) => {
  console.log("listener fired");
});
