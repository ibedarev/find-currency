import "dotenv/config";
import fs from "fs";
import TelegramBot from "node-telegram-bot-api";
import { findAdresses, load } from "./data-loader.mjs";

let activeChatIds = fs.existsSync("./active-chats.json")
  ? JSON.parse(fs.readFileSync("./active-chats.json", "utf8"))
  : {};
let chatAddresses = fs.existsSync("./addresses.json")
  ? JSON.parse(fs.readFileSync("./addresses.json", "utf8"))
  : {};
let chatCurrency = fs.existsSync("./chat-currency.json")
  ? JSON.parse(fs.readFileSync("./chat-currency.json", "utf8"))
  : {};
let lastMessages = fs.existsSync("./last-messages.json")
  ? JSON.parse(fs.readFileSync("./last-messages.json", "utf8"))
  : {};

const defaultCurrency = ["USD", "EUR"];

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  saveChatId(chatId);

  showHelp(chatId);
});

bot.onText(/\/help/, (msg) => {
  showHelp(msg.chat.id);
});

bot.onText(/\/add (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  addAdress(chatId, match[1]);

  bot.sendMessage(chatId, "Added");
});

bot.onText(/\/remove (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  removeAdress(chatId, match[1]);

  bot.sendMessage(chatId, "Removed");
});

bot.onText(/\/currency (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const currency = match[1].split(",").map((c) => c.trim());

  setCurrency(chatId, currency);

  bot.sendMessage(chatId, currency.toString());
});

bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  removeChatId(chatId);

  bot.sendMessage(chatId, "Stopped");
});

bot.onText(/\/settings/, (msg) => {
  const chatId = msg.chat.id;

  const adresses = chatAddresses[chatId]?.join("\n") || "-";
  const currency = (chatCurrency[chatId] || defaultCurrency).toString();

  bot.sendMessage(chatId, `Adresses:\n${adresses}\n\nCurrency: ${currency}`);
});

const showHelp = (id) => {
  bot.sendMessage(
    id,
    `\/add address
\/remove address
\/currency RUB,USD,EUR
\/stop
\/settings`
  );
};

const saveChatId = (id) => {
  activeChatIds.push(id);
  saveData();
};

const removeChatId = (id) => {
  activeChatIds = activeChatIds.filter((i) => i !== id);
  saveData();
};

const addAdress = (id, address) => {
  if (!chatAddresses[id]) {
    chatAddresses[id] = [];
  }

  const adresses = chatAddresses[id];

  if (!adresses.includes(address)) {
    adresses.push(address);
    saveData();
  }
};

const removeAdress = (id, address) => {
  if (!chatAddresses[id]) {
    chatAddresses[id] = [];
  }

  const adresses = chatAddresses[id];

  if (adresses.includes(address)) {
    chatAddresses[id] = adresses.filter((a) => a !== address);
    saveData();
  }
};

const setCurrency = (id, currency) => {
  chatCurrency[id] = currency;
  saveData();
};

const saveData = () => {
  fs.writeFileSync("./active-chats.json", JSON.stringify(activeChatIds));
  fs.writeFileSync("./addresses.json", JSON.stringify(chatAddresses));
  fs.writeFileSync("./last-messages.json", JSON.stringify(lastMessages));
  fs.writeFileSync("./chat-currency.json", JSON.stringify(chatCurrency));
};

const tick = async () => {
  if (activeChatIds.length) {
    const clusters = await load();

    for (const chatId of activeChatIds) {
      const message = findAdresses(
        clusters,
        chatAddresses[chatId],
        chatCurrency[chatId] || defaultCurrency
      );

      if (lastMessages[chatId] !== message) {
        lastMessages[chatId] = message;
        bot.sendMessage(chatId, message || "Empty", { parse_mode: "Markdown" });
      }
    }

    saveData();
  }

  console.log(new Date().toLocaleTimeString());
  schedule();
};

const schedule = () => {
  setTimeout(tick, 1000 * 60 * 0.1);
};

tick();
