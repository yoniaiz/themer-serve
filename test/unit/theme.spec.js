"use strict";

const { test, trait, after, before } = use("Test/Suite")("Theme");
const Theme = use("App/Models/Theme");
const User = use("App/Models/User");
const superagent = require("superagent");

trait("Test/ApiClient");

const color = "#ffffff";
const obj = {
  themeName: "Adonis 102",
  mainColor: "red",
  secondaryColor: color,
  username: color,
  fontColor: color,
  backgroundColor: color,
};

const user = {
  username: "user1",
  email: "user1@gmail.com",
  password: "newPassword1",
};

let token;

before(async () => {
  const req = superagent.post("http://127.0.0.1:4000/users/register");
  req.set("Content-Type", "application/json");
  req.set("Accept", "application/json");
  req.query({
    ...user,
  });

  const response = await req;
  const { access_token } = response.body;

  token = `${access_token.type} ${access_token.token}`;
});

after(async () => {
  const theme = await Theme.findBy("themeName", obj.themeName);
  if (theme) await theme.delete();

  const us = await User.findBy("username", user.username);
  if (us) await us.delete();
});

test("theme route authorized access", async ({ client }) => {
  let response = await client.get("/theme").end();

  response.assertStatus(401);

  response = await client.get("/theme").header("authorization", token).end();
  response.assertStatus(200);
});

test("theme creation process", async ({ client, assert }) => {
  let responseToGetAll = await client
    .get("/theme")
    .header("authorization", token)
    .end();

  responseToGetAll.assertStatus(200);
  const currentLength = responseToGetAll.body.length;

  let responseToCreate = await client
    .post("/theme")
    .header("authorization", token)
    .send({
      ...obj,
    })
    .end();

  responseToCreate.assertJSONSubset({
    error: "mainColor is not in hex format",
  });
  responseToCreate.assertStatus(400);

  responseToCreate = await client
    .post("/theme")
    .header("authorization", token)
    .send({
      ...obj,
      mainColor: color,
    })
    .end();

  responseToCreate.assertStatus(201);

  responseToGetAll = await client
    .get("/theme")
    .header("authorization", token)
    .end();

  assert.equal(currentLength + 1, responseToGetAll.body.length);
});
