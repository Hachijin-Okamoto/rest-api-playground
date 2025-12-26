"use strict";

import {
  findUserById,
  createUser,
  deleteUser,
  updateUser,
} from "./database.js";

/**
 * ユーザの新規作成をする関数
 * @param {string} user_id
 * @param {string} password
 * @returns 作成したユーザ情報
 */
export const registerUser = async (user_id, password) => {
  const existingUser = findUserById(user_id);
  if (existingUser) {
    return { error: true, cause: "Already same user_id is used" };
  }

  const newUser = {
    user_id,
    password,
    nickname: user_id,
  };
  createUser(newUser);

  return {
    error: false,
    user: { user_id: newUser.user_id, nickname: newUser.nickname },
  };
};

/**
 * 指定したIDのユーザ情報を取得する関数
 * @param {string} user_id
 * @returns 取得したユーザ情報（存在しない場合はundefined）
 */
export const getUserById = async (user_id) => {
  return findUserById(user_id);
};

/**
 * 指定したIDのユーザ情報を更新する関数
 * @param {string} user_id
 * @param {{ nickname?: string, comment?: string }} inputData
 * @returns 更新後のユーザ情報
 */
export const editUser = async (user_id, inputData) => {
  const targetUser = findUserById(user_id);
  if (!targetUser) {
    return { error: true, message: "No user found" };
  }

  const { nickname, comment } = inputData;
  const updatedData = {};

  // 空文字を指定すると初期値（ユーザIDに戻る）
  if (nickname !== undefined) {
    updatedData.nickname = nickname === "" ? user_id : nickname;
  }
  // 空文字を指定するとクリアされる
  if (comment !== undefined) {
    updatedData.comment = comment === "" ? "" : comment;
  }

  const updatedUser = updateUser(user_id, updatedData);

  return {
    error: false,
    user: {
      user_id: updatedUser.user_id,
      nickname: updatedUser.nickname,
      comment: updatedUser.comment,
    },
  };
};

/**
 * 指定したIDのユーザを削除する関数
 * @param {string} user_id
 * @returns {boolean} 削除に成功したかどうか
 */
export const removeUser = async (user_id) => {
  return deleteUser(user_id);
};
