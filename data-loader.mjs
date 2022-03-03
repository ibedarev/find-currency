import fetch from "node-fetch";

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
  pragma: "no-cache",
  "cache-control": "no-cache",
  Referer: "https://www.tinkoff.ru/",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

const currencySymbol = {
  USD: "💵",
  EUR: "💶",
  RUB: "🪵",
};

export const load = async () => {
  return fetch("https://api.tinkoff.ru/geo/withdraw/clusters", {
    headers,
    body: JSON.stringify({
      bounds: {
        bottomLeft: { lat: 55.604629, lng: 37.436644 },
        topRight: { lat: 55.903412, lng: 37.814848 },
      },
      filters: {
        banks: ["tcs"],
        showUnavailable: true,
      },
      zoom: 14,
    }),
    method: "POST",
  })
    .then((res) => {
      if (res.ok) return res.json();
      throw "Error";
    })
    .then((data) => data?.payload?.clusters)
    .catch((err) => {
      debugger;
      console.log(err);
    });
};

/**
 *
 * @param {*} clusters
 * @param {string[]} adresses
 * @param {string[]} currency
 * @returns
 */
export const findAdresses = (clusters, adresses, currency) => {
  const messages = [];
  if (clusters && adresses?.length && currency?.length) {
    for (const cluster of clusters) {
      for (const point of cluster.points) {
        if (adresses.includes(point.address)) {
          const limits = point.limits.filter((l) =>
            currency.includes(l.currency)
          );

          if (limits.length) {
            const limitsStr = limits
              .map(
                (limit) => `${currencySymbol[limit.currency]} ${limit.amount}`
              )
              .join("\n");

            const mapLink = `https://yandex.ru/maps/213/moscow/?text=${point.location.lat},+${point.location.lng}`;
            const message = `[${point.address}](${mapLink})\n${limitsStr}`;
            messages.push(message);
          }
        }
      }
    }
  }

  return messages.join("\n\n");
};
