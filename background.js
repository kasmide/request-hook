let filtersPromise = browser.storage.local.get("filters");

function intercept(requestDetails) {
  filtersPromise.then((result) => {
    if (result.filters && result.filters.length > 0) {
      result.filters.forEach((filter) => {
        if (requestDetails.url.match(RegExp(filter.url, "i"))) {
          console.log(`Hooking into: ${requestDetails.url}`);
          const stream = browser.webRequest.filterResponseData(requestDetails.requestId);
          const decoder = new TextDecoder("utf-8");
          const encoder = new TextEncoder();
          let data = "";
          stream.ondata = (event) => {
            data += decoder.decode(event.data, { stream: true });
          };
          stream.onstop = () => {
            console.log("Response data received:", data);
            data = eval(filter.filter).responseHook(data, requestDetails);
            stream.write(encoder.encode(data));
            stream.close();
          };
        }
      });
    }
  });
}

browser.webRequest.onBeforeRequest.addListener(intercept, {
  urls: ["<all_urls>"]
}, ["blocking"]);

browser.storage.local.set({
  filters: [
    {
      url: "ifconfig.io",
      filter: `responseHook = (data, requestDetails) => {
          return data.replace(/\\d/g, "9");
        }
        return { responseHook };`
    }
  ]
});