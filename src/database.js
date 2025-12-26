export let users = [
  {
    user_id: "TaroYamada",
    password: "PaSSwd4TY",
    nickname: "たろー",
    comment: "僕は元気です",
  },
];

export const findUserById = (id) => users.find((u) => u.user_id === id);

export const createUser = (user) => {
  users.push(user);
};

export const updateUser = (user_id, newData) => {
  const index = users.findIndex((u) => u.user_id === user_id);
  if (index !== -1) {
    users[index] = { ...users[index], ...newData };
    return users[index];
  }
  return null;
};

export const deleteUser = (user_id) => {
  const initialLength = users.length;
  users = users.filter((u) => u.user_id !== user_id);
  return users.length !== initialLength;
};
