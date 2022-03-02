import fetch from "node-fetch";
import atms from "./data.mjs";
import { exec } from "child_process";

const headers = {
  accept: "*/*",
  "accept-language": "en-RU,en;q=0.9,ru-RU;q=0.8,ru;q=0.7,en-US;q=0.6",
  "content-type": "application/json",
  "sec-ch-ua":
    '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
  Referer: "https://www.tinkoff.ru/",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

const check = async () => {
  try {
    for (const atm of atms) {
      await fetch("https://api.tinkoff.ru/geo/withdraw/clusters", {
        headers,
        body: JSON.stringify(atm),
        method: "POST",
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw "Error";
        })
        .then((data) => {
          const point = data.payload?.clusters?.[0]?.points[0];
          if (point) {
            const limits = point.limits
              .map((limit) => `${limit.currency}:${limit.max}`)
              .join("\n");

            console.log(`${point.address}\n${limits}`);

            switch (process.platform) {
              case "darwin":
                exec('say "Beggi za dengami"');
              case "win32":
                exec(`rundll32 user32.dll,MessageBeep`);
            }
          }
        });
    }
  } finally {
    setTimeout(check, 15000);
  }
};

check();
