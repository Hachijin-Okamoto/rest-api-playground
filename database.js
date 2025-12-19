export let users = [
  {
    user_id: "TaroYamada",
    password: "PaSSWd4TY",
    nickname: "たろー",
    comment: "僕は元気です",
  },
];

export const findUserById = (id) => users.find((u) => u.user_id === id);
